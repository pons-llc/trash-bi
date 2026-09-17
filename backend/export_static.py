"""
backend/waste.db を、フロントエンドが直接 fetch できる静的 JSON 群に書き出す。

サーバーレスで Cloudflare Pages 等に置くための書き出しスクリプト。
backend/app.py の各エンドポイントが行っていた SQL を、リクエスト時ではなく
ビルド時に一度だけ実行して frontend/public/data/ 以下に固定ファイルとして
書き出す。category（合計/生活系/事業系）や pref_code 絞り込みはただのフィールド
選択・フィルタなので、生成軸は年度(fiscal_year)と level(pref/city)のみ。
フロント側（frontend/src/api.ts, rankings.ts, metrics.ts の applyCategory）が
残りをクライアントで行う。

実行（etl.py の後に実行する）:
  venv/bin/python backend/etl.py
  venv/bin/python backend/export_static.py
"""
from __future__ import annotations

import json
import shutil
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "waste.db"
GEO_SRC = BASE_DIR / "geo" / "japan_prefectures.topojson"

FRONTEND_PUBLIC = BASE_DIR.parent / "frontend" / "public"
DATA_OUT = FRONTEND_PUBLIC / "data"
GEO_OUT = FRONTEND_PUBLIC / "geo"

FISCAL_YEARS = ["R1", "R2", "R3", "R4", "R5", "R6", "ALL"]

PREF_COLUMNS = """
    pref_code, pref_name, population,
    total_waste_t, household_waste_t, business_waste_t,
    treated_amount_t, final_disposal_t,
    per_capita_total_g, per_capita_household_g, per_capita_business_g,
    recycling_rate_r_pct, final_disposal_rate_pct,
    cost_per_ton_yen, waste_expenditure_thousand_yen,
    construction_cost_per_ton_yen, operating_cost_per_ton_yen
"""

CITY_COLUMNS = """
    w.city_code, w.pref_code, w.pref_name, w.city_name, w.population,
    w.total_waste_t, w.household_waste_t, w.business_waste_t,
    w.treated_amount_t, w.final_disposal_t,
    w.per_capita_total_g, w.per_capita_household_g, w.per_capita_business_g,
    w.reduction_rate_pct, w.recycling_rate_r_pct, w.recycling_rate_r2_pct,
    m.lat, m.lng
"""

PREF_TREND_COLUMNS = """
    fiscal_year, population, total_waste_t, household_waste_t, business_waste_t,
    treated_amount_t, final_disposal_t, per_capita_total_g, per_capita_household_g,
    per_capita_business_g, recycling_rate_r_pct, final_disposal_rate_pct,
    cost_per_ton_yen, waste_expenditure_thousand_yen,
    construction_cost_per_ton_yen, operating_cost_per_ton_yen
"""

CITY_TREND_COLUMNS = """
    fiscal_year, population, total_waste_t, household_waste_t, business_waste_t,
    treated_amount_t, final_disposal_t, per_capita_total_g, per_capita_household_g,
    per_capita_business_g, reduction_rate_pct, recycling_rate_r_pct, recycling_rate_r2_pct
"""


def dump(path: Path, obj) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def main():
    if not DB_PATH.exists():
        raise SystemExit(f"{DB_PATH} が見つかりません。先に backend/etl.py を実行してください。")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    if DATA_OUT.exists():
        shutil.rmtree(DATA_OUT)
    DATA_OUT.mkdir(parents=True)

    total_bytes = 0
    file_count = 0

    # meta.json
    years = [dict(r) for r in conn.execute("SELECT fiscal_year, label, sort_order FROM fiscal_years ORDER BY sort_order")]
    prefs = [dict(r) for r in conn.execute("SELECT DISTINCT pref_code, pref_name FROM pref_stats ORDER BY pref_code")]
    total_bytes += dump(DATA_OUT / "meta.json", {"fiscal_years": years, "prefectures": prefs})
    file_count += 1
    print(f"[export] meta.json ({len(years)} years, {len(prefs)} prefs)")

    # pref/{year}.json, city/{year}.json
    for year in FISCAL_YEARS:
        pref_rows = [
            dict(r)
            for r in conn.execute(f"SELECT {PREF_COLUMNS} FROM pref_stats WHERE fiscal_year = ? ORDER BY pref_code", (year,))
        ]
        n = dump(DATA_OUT / "pref" / f"{year}.json", {"year": year, "items": pref_rows})
        total_bytes += n
        file_count += 1

        city_rows = [
            dict(r)
            for r in conn.execute(
                f"""
                SELECT {CITY_COLUMNS}
                FROM waste_stats w
                LEFT JOIN municipality_latlng m ON m.city_code = w.city_code
                WHERE w.fiscal_year = ? AND w.is_aggregate = 0
                ORDER BY w.pref_code, w.city_code
                """,
                (year,),
            )
        ]
        n = dump(DATA_OUT / "city" / f"{year}.json", {"year": year, "items": city_rows})
        total_bytes += n
        file_count += 1
        print(f"[export] {year}: pref={len(pref_rows)} city={len(city_rows)}")

    # trend/pref/{pref_code}.json
    pref_codes = [r[0] for r in conn.execute("SELECT DISTINCT pref_code FROM pref_stats ORDER BY pref_code")]
    for code in pref_codes:
        rows = [
            dict(r)
            for r in conn.execute(
                f"SELECT {PREF_TREND_COLUMNS} FROM pref_stats WHERE pref_code = ? AND fiscal_year != 'ALL' ORDER BY fiscal_year",
                (code,),
            )
        ]
        if not rows:
            continue
        name_row = conn.execute("SELECT pref_name FROM pref_stats WHERE pref_code = ? LIMIT 1", (code,)).fetchone()
        total_bytes += dump(
            DATA_OUT / "trend" / "pref" / f"{code}.json",
            {"level": "pref", "code": code, "name": name_row["pref_name"], "series": rows},
        )
        file_count += 1
    print(f"[export] trend/pref: {len(pref_codes)} files")

    # trend/city/{city_code}.json
    city_codes = [r[0] for r in conn.execute("SELECT DISTINCT city_code FROM waste_stats WHERE is_aggregate = 0 ORDER BY city_code")]
    for code in city_codes:
        rows = [
            dict(r)
            for r in conn.execute(
                f"SELECT {CITY_TREND_COLUMNS} FROM waste_stats WHERE city_code = ? AND fiscal_year != 'ALL' ORDER BY fiscal_year",
                (code,),
            )
        ]
        if not rows:
            continue
        name_row = conn.execute("SELECT pref_name, city_name FROM waste_stats WHERE city_code = ? LIMIT 1", (code,)).fetchone()
        name = f"{name_row['pref_name']} {name_row['city_name']}"
        total_bytes += dump(
            DATA_OUT / "trend" / "city" / f"{code}.json",
            {"level": "city", "code": code, "name": name, "series": rows},
        )
        file_count += 1
    print(f"[export] trend/city: {len(city_codes)} files")

    conn.close()

    # geo assets (topojson) — copy verbatim, same relative path the frontend already fetches
    GEO_OUT.mkdir(parents=True, exist_ok=True)
    shutil.copy(GEO_SRC, GEO_OUT / GEO_SRC.name)
    file_count += 1
    print(f"[export] geo/{GEO_SRC.name} copied")

    print(f"[export] done: {file_count} files, {total_bytes / 1024:.0f} KB (JSON only, excl. geo) -> {DATA_OUT}")


if __name__ == "__main__":
    main()
