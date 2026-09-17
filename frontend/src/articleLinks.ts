// ダッシュボードで自治体・都道府県を選んだときに、関連する「読み物」記事へ
// 誘導するための対応表。/articles/ 配下の記事が対象にしている自治体コード・
// 都道府県コードをキーにしている。

export interface ArticleLink {
  slug: string
  title: string
  hook: string
}

export const CITY_ARTICLES: Record<string, ArticleLink> = {
  '11242': {
    slug: 'hidaka-recycling-rate-99',
    title: '埼玉県日高市のリサイクル率はなぜ99.8%なのか？',
    hook: 'この自治体はリサイクル率「R」と「R\'」の差が全国トップクラスです。',
  },
  '14382': {
    slug: 'hakone-waste-per-capita',
    title: '箱根町の1人1日ごみ排出量はなぜ全国トップクラスなのか？',
    hook: '観光地特有の「隠れ人口」問題を、事業系ごみの比率から読み解きます。',
  },
  '40402': {
    slug: 'fukuoka-recycling-rate-gap-cluster',
    title: '福岡県のある地域だけリサイクル率が「R94%→R\'5%」になる理由',
    hook: '隣接する3つの町で6年間安定して続く、日高市を上回るR-R\'ギャップ。',
  },
  '40226': {
    slug: 'fukuoka-recycling-rate-gap-cluster',
    title: '福岡県のある地域だけリサイクル率が「R94%→R\'5%」になる理由',
    hook: '隣接する3つの町で6年間安定して続く、日高市を上回るR-R\'ギャップ。',
  },
  '40401': {
    slug: 'fukuoka-recycling-rate-gap-cluster',
    title: '福岡県のある地域だけリサイクル率が「R94%→R\'5%」になる理由',
    hook: '隣接する3つの町で6年間安定して続く、日高市を上回るR-R\'ギャップ。',
  },
  '40349': {
    slug: 'fukuoka-recycling-rate-gap-cluster',
    title: '福岡県のある地域だけリサイクル率が「R94%→R\'5%」になる理由',
    hook: '隣の3町とは規模が違いますが、同じ構造のR-R\'ギャップが見られます。',
  },
  '25443': {
    slug: 'shiga-inukami-recycling-collapse',
    title: '滋賀県犬上郡の高リサイクル率はなぜ忽然と消えたのか',
    hook: 'かつて90%台だったリサイクル率が、年によって大きく変動しています。',
  },
  '25425': {
    slug: 'shiga-inukami-recycling-collapse',
    title: '滋賀県犬上郡の高リサイクル率はなぜ忽然と消えたのか',
    hook: 'かつて90%台だったリサイクル率が、年によって大きく変動しています。',
  },
  '25441': {
    slug: 'shiga-inukami-recycling-collapse',
    title: '滋賀県犬上郡の高リサイクル率はなぜ忽然と消えたのか',
    hook: 'かつて90%台だったリサイクル率が、年によって大きく変動しています。',
  },
  '07546': {
    slug: 'fukushima-return-zone-waste',
    title: '人口はあるのに、ごみがほとんど出ない町——双葉町・大熊町のデータが語る歩み',
    hook: '震災・原発事故からの復興が、ごみ排出量の推移にも表れています。',
  },
  '07545': {
    slug: 'fukushima-return-zone-waste',
    title: '人口はあるのに、ごみがほとんど出ない町——双葉町・大熊町のデータが語る歩み',
    hook: '震災・原発事故からの復興が、ごみ排出量の推移にも表れています。',
  },
  '27213': {
    slug: 'izumisano-airport-waste',
    title: '人口10万人の泉佐野市が「観光地型」のごみ排出パターンを持つ理由',
    hook: 'コロナ禍でも変わらなかった高い事業系ごみ比率の謎を検証します。',
  },
  '01209': {
    slug: 'depopulation-high-waste-towns',
    title: '過疎地なのにごみが多い3つの町、理由は三者三様だった',
    hook: '人口減少と反比例するように、事業系ごみの比率が上昇しています。',
  },
  '01223': {
    slug: 'depopulation-high-waste-towns',
    title: '過疎地なのにごみが多い3つの町、理由は三者三様だった',
    hook: '水産加工業由来とみられる、安定して高い事業系ごみ比率が特徴です。',
  },
  '42411': {
    slug: 'depopulation-high-waste-towns',
    title: '過疎地なのにごみが多い3つの町、理由は三者三様だった',
    hook: '離島特有の事情から、生活系ごみが主体の高い排出量が続いています。',
  },
  '07213': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '避難区域に隣接する自治体の一つ。近年は排出量の「正常化」傾向も見られます。',
  },
  '07301': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '避難区域に隣接する自治体の一つ。近年は排出量の「正常化」傾向も見られます。',
  },
  '07303': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '避難区域に隣接する自治体の一つ。6年間ほとんど排出量が変わっていません。',
  },
  '07308': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '町内の山木屋地区がかつて避難指示区域だった町です。',
  },
  '07212': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '市域の一部が避難区域指定を受けた自治体の一つです。',
  },
  '07203': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '避難区域から離れた大都市でも、排出量は県内トップクラスです。',
  },
}

export const PREF_ARTICLES: Record<string, ArticleLink> = {
  '35': {
    slug: 'yamaguchi-recycling-rate-drop',
    title: '山口県のリサイクル率はなぜ1年で10ポイント消えたのか',
    hook: '県内のほぼ全市町で同時に起きたリサイクル率急落の謎を追います。',
  },
  '29': {
    slug: 'waste-cost-per-ton-nara-tokyo',
    title: 'ごみ処理費、東京は高くて当然？奈良・島根がトップという逆転現象',
    hook: '全国で最もごみ処理原価が高いのは、実はこの県です。',
  },
  '32': {
    slug: 'waste-cost-per-ton-nara-tokyo',
    title: 'ごみ処理費、東京は高くて当然？奈良・島根がトップという逆転現象',
    hook: '奈良県に次いで全国2位の処理原価の高さを記録しています。',
  },
  '13': {
    slug: 'waste-cost-per-ton-nara-tokyo',
    title: 'ごみ処理費、東京は高くて当然？奈良・島根がトップという逆転現象',
    hook: '大都市ゆえに高コストと思いきや、それを上回る県が存在します。',
  },
  '16': {
    slug: 'waste-cost-per-ton-nara-tokyo',
    title: 'ごみ処理費、東京は高くて当然？奈良・島根がトップという逆転現象',
    hook: '実は全国で最もごみ処理原価が安いのが、この県です。',
  },
  '31': {
    slug: 'recycling-rate-final-disposal-myth',
    title: 'リサイクル率が高い県ほどごみが減るとは限らない、というデータの話',
    hook: 'リサイクル率・最終処分率がともに全国トップクラスの優等生県です。',
  },
  '01': {
    slug: 'recycling-rate-final-disposal-myth',
    title: 'リサイクル率が高い県ほどごみが減るとは限らない、というデータの話',
    hook: 'リサイクル率は平均以上でも、最終処分率は全国最悪という例外です。',
  },
  '07': {
    slug: 'fukushima-prefecture-highest-waste',
    title: 'なぜ福島県のごみ排出量は全国一位なのか——避難区域の「隣」に見える構図',
    hook: '1人1日排出量が全国1位。ただし2位の富山県とは僅差です。',
  },
}

// 特定の自治体に紐づかない、全国動向を扱った記事。選択がない・一致しない
// ときのデフォルト表示に使う。
export const GENERAL_ARTICLES: ArticleLink[] = [
  {
    slug: 'covid-household-business-waste',
    title: 'コロナは家庭ごみを増やし、事業系ごみを減らした——全国データで見る5年間',
    hook: '年度を切り替えて、令和2年度だけ数字が崩れる様子を見てみましょう。',
  },
  {
    slug: 'final-disposal-declining-trend',
    title: '全国の最終処分量はこの6年で2割減った——静かに進む「埋立ゼロ」への道',
    hook: '指標を「最終処分量」に切り替えると、この変化を確認できます。',
  },
  {
    slug: 'recycling-rate-final-disposal-myth',
    title: 'リサイクル率が高い県ほどごみが減るとは限らない、というデータの話',
    hook: 'リサイクル率と最終処分率、両方のランキングを見比べてみてください。',
  },
]

export function getArticleForSelection(level: 'pref' | 'city' | null, code: string | null | undefined): ArticleLink | null {
  if (!level || !code) return null
  if (level === 'city') return CITY_ARTICLES[code] ?? null
  return PREF_ARTICLES[code] ?? null
}
