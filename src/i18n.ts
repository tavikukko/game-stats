export type Lang = 'fi' | 'en'

export type I18nKey =
  | 'app.title'
  | 'home.selectStat'
  | 'match.firstHalf'
  | 'match.secondHalf'
  | 'label.ownHalf'
  | 'label.oppHalf'
  | 'label.attempts'
  | 'label.completed'
  | 'label.byPass'
  | 'label.byCarry'
  | 'label.us'
  | 'label.opp'
  | 'label.onTarget'
  | 'label.offTarget'
  | 'label.total'
  | 'role.passing'
  | 'role.attackThird'
  | 'role.boxEntry'
  | 'role.shots'
  | 'action.done'
  | 'action.newSession'
  | 'action.back'
  | 'export.title'
  | 'export.copy'
  | 'export.share'
  | 'export.downloadJson'
  | 'export.downloadCsv'
  | 'summary.total'
  | 'toast.copied'
  | 'toast.copyFailed'
  | 'toast.shared'
  | 'toast.downloaded'
  | 'confirm.newSession'
  | 'confirm.resetHalf'

export const LANGUAGE_KEY = 'game-stats:lang'

export const getDefaultLang = (): Lang => {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'fi' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('fi') ? 'fi' : 'en'
}

const translations: Record<Lang, Record<I18nKey, string>> = {
  fi: {
    'app.title': 'Tilastokeräin',
    'home.selectStat': 'Valitse kerättävä tilasto',
    'match.firstHalf': '1. puoliaika',
    'match.secondHalf': '2. puoliaika',
    'label.ownHalf': 'Oma puolisko',
    'label.oppHalf': 'Vast. puolisko',
    'label.attempts': 'Yritykset',
    'label.completed': 'Onnistuneet',
    'label.byPass': 'Syöttö',
    'label.byCarry': 'Kuljetus',
    'label.us': 'Me',
    'label.opp': 'Vastustaja',
    'label.onTarget': 'Maalia kohti',
    'label.offTarget': 'Ohi',
    'label.total': 'Yhteensä',
    'role.passing': 'Syöttöpeli',
    'role.attackThird': 'Hyökkäyskolmannes',
    'role.boxEntry': 'Boksiin tulo',
    'role.shots': 'Laukaukset',
    'action.done': 'Valmis',
    'action.newSession': 'Uusi sessio',
    'action.back': 'Takaisin',
    'export.title': 'Tilastot',
    'export.copy': 'Kopioi',
    'export.share': 'Jaa',
    'export.downloadJson': 'JSON',
    'export.downloadCsv': 'CSV',
    'summary.total': 'Yhteensä',
    'toast.copied': 'Kopioitu!',
    'toast.copyFailed': 'Kopiointi epäonnistui',
    'toast.shared': 'Jaettu!',
    'toast.downloaded': 'Ladattu!',
    'confirm.newSession': 'Aloitetaanko uusi sessio? Nykyiset tilastot hävitetään.',
    'confirm.resetHalf': 'Nollaataanko puoliajan tilastot?',
  },
  en: {
    'app.title': 'Stats Collector',
    'home.selectStat': 'Select stat to collect',
    'match.firstHalf': '1st half',
    'match.secondHalf': '2nd half',
    'label.ownHalf': 'Own half',
    'label.oppHalf': 'Opp. half',
    'label.attempts': 'Attempts',
    'label.completed': 'Completed',
    'label.byPass': 'By pass',
    'label.byCarry': 'By carry',
    'label.us': 'Us',
    'label.opp': 'Opponent',
    'label.onTarget': 'On target',
    'label.offTarget': 'Off target',
    'label.total': 'Total',
    'role.passing': 'Passing',
    'role.attackThird': 'Final third entry',
    'role.boxEntry': 'Box entry',
    'role.shots': 'Shots',
    'action.done': 'Done',
    'action.newSession': 'New session',
    'action.back': 'Back',
    'export.title': 'Statistics',
    'export.copy': 'Copy',
    'export.share': 'Share',
    'export.downloadJson': 'JSON',
    'export.downloadCsv': 'CSV',
    'summary.total': 'Total',
    'toast.copied': 'Copied!',
    'toast.copyFailed': 'Copy failed',
    'toast.shared': 'Shared!',
    'toast.downloaded': 'Downloaded!',
    'confirm.newSession': 'Start new session? Current stats will be lost.',
    'confirm.resetHalf': 'Reset this half stats?',
  },
}

export const t = (lang: Lang, key: I18nKey): string => {
  return translations[lang][key] ?? key
}
