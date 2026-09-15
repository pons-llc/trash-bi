"""
日本ゴミ処理ダッシュボード API サーバー。

backend/waste.db (etl.py が生成する SQLite) を読み取り専用で参照し、
地図・ランキング・推移グラフ向けの集計 JSON を返す。

起動:
  venv/bin/uvicorn backend.app:app --reload --port 8000
"""
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "waste.db"
GEO_DIR = BASE_DIR / "geo"

app = FastAPI(title="日本ゴミ処理ダッシュボード API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.mount("/geo", StaticFiles(directory=GEO_DIR), name="geo")


def get_conn():
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail="waste.db が見つかりません。先に backend/etl.py を実行してください。")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


Category = Literal["total", "household", "business"]
Level = Literal["pref", "city"]

CATEGORY_COLUMNS = {
    "total": {"waste_t": "total_waste_t", "per_capita_g": "per_capita_total_g"},
    "household": {"waste_t": "household_waste_t", "per_capita_g": "per_capita_household_g"},
    "business": {"waste_t": "business_waste_t", "per_capita_g": "per_capita_business_g"},
}

MUNI_METRICS = {
    "total_waste_t",
    "household_waste_t",
    "business_waste_t",
    "treated_amount_t",
    "final_disposal_t",
    "per_capita_total_g",
    "per_capita_household_g",
    "per_capita_business_g",
    "reduction_rate_pct",
    "recycling_rate_r_pct",
    "recycling_rate_r2_pct",
    "population",
}

PREF_METRICS = {
    "total_waste_t",
    "household_waste_t",
    "business_waste_t",
    "treated_amount_t",
    "final_disposal_t",
    "per_capita_total_g",
    "per_capita_household_g",
    "per_capita_business_g",
    "recycling_rate_r_pct",
    "final_disposal_rate_pct",
    "population",
    "cost_per_ton_yen",
    "waste_expenditure_thousand_yen",
}


def _validate_year(conn, year: str):
    row = conn.execute("SELECT 1 FROM fiscal_years WHERE fiscal_year = ?", (year,)).fetchone()
    if not row:
        raise HTTPException(status_code=400, detail=f"不正な年度: {year}")


@app.get("/api/meta")
def meta():
    conn = get_conn()
    try:
        years = [dict(r) for r in conn.execute("SELECT fiscal_year, label, sort_order FROM fiscal_years ORDER BY sort_order")]
        prefs = [
            dict(r)
            for r in conn.execute(
                "SELECT DISTINCT pref_code, pref_name FROM pref_stats ORDER BY pref_code"
            )
        ]
        return {"fiscal_years": years, "prefectures": prefs}
    finally:
        conn.close()


@app.get("/api/prefectures")
def prefectures(year: str = Query("R6"), category: Category = Query("total")):
    conn = get_conn()
    try:
        _validate_year(conn, year)
        cols = CATEGORY_COLUMNS[category]
        rows = conn.execute(
            f"""
            SELECT pref_code, pref_name, population,
                   {cols['waste_t']} AS waste_t,
                   {cols['per_capita_g']} AS per_capita_g,
                   total_waste_t, household_waste_t, business_waste_t,
                   treated_amount_t, final_disposal_t,
                   recycling_rate_r_pct, final_disposal_rate_pct,
                   cost_per_ton_yen, waste_expenditure_thousand_yen
            FROM pref_stats
            WHERE fiscal_year = ?
            ORDER BY pref_code
            """,
            (year,),
        ).fetchall()
        return {"year": year, "category": category, "items": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.get("/api/municipalities")
def municipalities(
    year: str = Query("R6"),
    category: Category = Query("total"),
    pref_code: str | None = Query(None),
):
    conn = get_conn()
    try:
        _validate_year(conn, year)
        cols = CATEGORY_COLUMNS[category]
        sql = f"""
            SELECT w.city_code, w.pref_code, w.pref_name, w.city_name, w.population,
                   w.{cols['waste_t']} AS waste_t,
                   w.{cols['per_capita_g']} AS per_capita_g,
                   w.total_waste_t, w.household_waste_t, w.business_waste_t,
                   w.treated_amount_t, w.final_disposal_t,
                   w.reduction_rate_pct, w.recycling_rate_r_pct, w.recycling_rate_r2_pct,
                   m.lat, m.lng
            FROM waste_stats w
            LEFT JOIN municipality_latlng m ON m.city_code = w.city_code
            WHERE w.fiscal_year = ? AND w.is_aggregate = 0
        """
        params: list = [year]
        if pref_code:
            sql += " AND w.pref_code = ?"
            params.append(pref_code)
        sql += " ORDER BY w.pref_code, w.city_code"
        rows = conn.execute(sql, params).fetchall()
        return {"year": year, "category": category, "pref_code": pref_code, "items": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.get("/api/rankings")
def rankings(
    level: Level = Query("pref"),
    year: str = Query("R6"),
    metric: str = Query("recycling_rate_r_pct"),
    order: Literal["asc", "desc"] = Query("desc"),
    pref_code: str | None = Query(None),
    limit: int = Query(50, ge=1, le=2000),
):
    conn = get_conn()
    try:
        _validate_year(conn, year)
        valid_metrics = PREF_METRICS if level == "pref" else MUNI_METRICS
        if metric not in valid_metrics:
            raise HTTPException(status_code=400, detail=f"不正な metric: {metric}")
        direction = "ASC" if order == "asc" else "DESC"

        if level == "pref":
            sql = f"""
                SELECT pref_code, pref_name, {metric} AS value, population, total_waste_t,
                       treated_amount_t, recycling_rate_r_pct, per_capita_total_g
                FROM pref_stats
                WHERE fiscal_year = ? AND {metric} IS NOT NULL
                ORDER BY value {direction}
                LIMIT ?
            """
            rows = conn.execute(sql, (year, limit)).fetchall()
        else:
            sql = f"""
                SELECT city_code, pref_code, pref_name, city_name, {metric} AS value, population,
                       total_waste_t, treated_amount_t, recycling_rate_r_pct, per_capita_total_g
                FROM waste_stats
                WHERE fiscal_year = ? AND is_aggregate = 0 AND {metric} IS NOT NULL
            """
            params: list = [year]
            if pref_code:
                sql += " AND pref_code = ?"
                params.append(pref_code)
            sql += f" ORDER BY value {direction} LIMIT ?"
            params.append(limit)
            rows = conn.execute(sql, params).fetchall()

        items = [dict(r) for r in rows]
        for i, item in enumerate(items):
            item["rank"] = i + 1
        return {"level": level, "year": year, "metric": metric, "order": order, "pref_code": pref_code, "items": items}
    finally:
        conn.close()


@app.get("/api/trend")
def trend(level: Level = Query("pref"), code: str = Query(...)):
    conn = get_conn()
    try:
        if level == "pref":
            sql = """
                SELECT fiscal_year, population, total_waste_t, household_waste_t, business_waste_t,
                       treated_amount_t, final_disposal_t, per_capita_total_g, per_capita_household_g,
                       per_capita_business_g, recycling_rate_r_pct, final_disposal_rate_pct,
                       cost_per_ton_yen, waste_expenditure_thousand_yen
                FROM pref_stats
                WHERE pref_code = ? AND fiscal_year != 'ALL'
                ORDER BY fiscal_year
            """
        else:
            sql = """
                SELECT fiscal_year, population, total_waste_t, household_waste_t, business_waste_t,
                       treated_amount_t, final_disposal_t, per_capita_total_g, per_capita_household_g,
                       per_capita_business_g, reduction_rate_pct, recycling_rate_r_pct, recycling_rate_r2_pct
                FROM waste_stats
                WHERE city_code = ? AND fiscal_year != 'ALL'
                ORDER BY fiscal_year
            """
        rows = conn.execute(sql, (code,)).fetchall()
        if not rows:
            raise HTTPException(status_code=404, detail="データが見つかりません")

        name_sql = (
            "SELECT pref_name FROM pref_stats WHERE pref_code = ? LIMIT 1"
            if level == "pref"
            else "SELECT pref_name, city_name FROM waste_stats WHERE city_code = ? LIMIT 1"
        )
        name_row = conn.execute(name_sql, (code,)).fetchone()
        name = (
            name_row["pref_name"]
            if level == "pref"
            else f"{name_row['pref_name']} {name_row['city_name']}"
        )
        return {"level": level, "code": code, "name": name, "series": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.get("/api/detail")
def detail(level: Level = Query("pref"), code: str = Query(...), year: str = Query("R6")):
    conn = get_conn()
    try:
        _validate_year(conn, year)
        table = "pref_stats" if level == "pref" else "waste_stats"
        key = "pref_code" if level == "pref" else "city_code"
        row = conn.execute(
            f"SELECT * FROM {table} WHERE {key} = ? AND fiscal_year = ?", (code, year)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="データが見つかりません")
        return dict(row)
    finally:
        conn.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "db_exists": DB_PATH.exists()}
