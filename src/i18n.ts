export type Lang = 'fi' | 'en'

export type I18nKey =
  | 'app.title'
  | 'home.newMatch'
  | 'home.open'
  | 'home.summary'
  | 'home.delete'
  | 'home.updated'
  | 'home.noMatches'
  | 'home.collector'
  | 'settings.title'
  | 'settings.exportAll'
  | 'settings.importJson'
  | 'settings.close'
  | 'match.newTitle'
  | 'match.dateTime'
  | 'match.location'
  | 'match.homeTeam'
  | 'match.awayTeam'
  | 'match.notes'
  | 'match.create'
  | 'match.selectGame'
  | 'match.availableGames'
  | 'match.noGames'
  | 'match.selectRole'
  | 'match.notFound'
  | 'match.back'
  | 'match.backToList'
  | 'match.summary'
  | 'match.firstHalf'
  | 'match.secondHalf'
  | 'summary.title'
  | 'summary.shareText'
  | 'summary.copy'
  | 'summary.share'
  | 'summary.downloadJson'
  | 'summary.downloadCsv'
  | 'summary.total'
  | 'toast.saved'
  | 'toast.created'
  | 'toast.copied'
  | 'toast.shared'
  | 'toast.importInvalid'
  | 'toast.importDone'
  | 'toast.importFailed'
  | 'confirm.delete'
  | 'confirm.replaceAll'
  | 'confirm.resetSection'
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
  | 'label.passPct'
  | 'label.attackTotal'
  | 'label.boxTotal'
  | 'label.shotsTotal'
  | 'role.passing'
  | 'role.attackThird'
  | 'role.boxEntry'
  | 'role.shots'
  | 'label.collectorRole'
  | 'action.reset'
  | 'action.trashReset'
  | 'label.exportImport'
  | 'label.date'
  | 'label.location'
  | 'label.notes'
  | 'share.half1'
  | 'share.half2'
  | 'share.total'
  | 'share.passingOwn'
  | 'share.passingOpp'
  | 'share.attackThird'
  | 'share.boxEntry'
  | 'share.shotsUs'
  | 'share.shotsOpp'

export const LANGUAGE_KEY = 'match-tracker:lang'

export const getDefaultLang = (): Lang => {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'fi' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('fi') ? 'fi' : 'en'
}

const translations: Record<Lang, Record<I18nKey, string>> = {
  fi: {
    'app.title': 'Otteluseuranta',
    'home.newMatch': 'Uusi ottelu',
    'home.open': 'Avaa',
    'home.summary': 'Yhteenveto',
    'home.delete': 'Poista',
    'home.updated': 'Päivitetty',
    'home.noMatches': 'Ei tallennettuja otteluita vielä.',
    'home.collector': 'Kerääjä',
    'settings.title': 'Export / Import',
    'settings.exportAll': 'Vie kaikki ottelut JSON',
    'settings.importJson': 'Tuo JSON',
    'settings.close': 'Sulje',
    'match.newTitle': 'Uusi ottelu',
    'match.dateTime': 'Päivä ja aika',
    'match.location': 'Paikka',
    'match.homeTeam': 'Kotijoukkue',
    'match.awayTeam': 'Vierasjoukkue',
    'match.notes': 'Lisämuistiinpano',
    'match.create': 'Luo ottelu',
    'match.selectGame': 'Valitse ottelu',
    'match.availableGames': 'Valitse peli listasta. Uudet pelit lisätään dataan JSON-tiedostossa.',
    'match.noGames': 'Ei valittavia pelejä. Lisää pelejä dataan JSON-tiedostossa.',
    'match.selectRole': 'Kerättävä tilasto',
    'match.notFound': 'Ottelua ei löytynyt.',
    'match.back': 'Takaisin',
    'match.backToList': 'Takaisin listaan',
    'match.summary': 'Yhteenveto & jako',
    'match.firstHalf': '1PA',
    'match.secondHalf': '2PA',
    'summary.title': 'Yhteenveto',
    'summary.shareText': 'Jaa tekstinä',
    'summary.copy': 'Kopioi leikepöydälle',
    'summary.share': 'Jaa…',
    'summary.downloadJson': 'Lataa JSON',
    'summary.downloadCsv': 'Lataa CSV',
    'summary.total': 'Yhteensä',
    'toast.saved': 'Tallennettu',
    'toast.created': 'Ottelu luotu',
    'toast.copied': 'Kopioitu leikepöydälle',
    'toast.shared': 'Jaettu',
    'toast.importInvalid': 'Virheellinen JSON-tiedosto',
    'toast.importDone': 'Tuonti valmis',
    'toast.importFailed': 'Tuonti epäonnistui',
    'confirm.delete': 'Poistetaanko ottelu {home} – {away}?',
    'confirm.replaceAll': 'Korvataanko kaikki nykyiset ottelut?',
    'confirm.resetSection': 'Nollataanko osio "{title}"?',
    'label.ownHalf': 'Oma puolisko',
    'label.oppHalf': 'Vastustajan puolisko',
    'label.attempts': 'Yritykset',
    'label.completed': 'Onnistuneet',
    'label.byPass': 'Syöttämällä',
    'label.byCarry': 'Kuljettamalla',
    'label.us': 'Me',
    'label.opp': 'Vastustaja',
    'label.onTarget': 'Kohti',
    'label.offTarget': 'Ohi',
    'label.passPct': 'Syöttö% (oma / vast)',
    'label.attackTotal': 'Hyökkäyskolmannes yhteensä',
    'label.boxTotal': 'Boxiin yhteensä',
    'label.shotsTotal': 'Laukaukset yhteensä (me / vast)',
    'role.passing': 'Syöttöpeli',
    'role.attackThird': 'Hyökkäyskolmannekselle pääsy',
    'role.boxEntry': 'Boxiin pääsy',
    'role.shots': 'Laukaukset',
    'label.collectorRole': 'Kerättävä tilasto',
    'action.reset': 'Nollaa',
    'action.trashReset': '🗑️ Nollaa',
    'label.exportImport': 'Export / Import',
    'label.date': 'Päivä ja aika',
    'label.location': 'Paikka',
    'label.notes': 'Lisämuistiinpano',
    'share.half1': '1PA',
    'share.half2': '2PA',
    'share.total': 'Yhteensä',
    'share.passingOwn': 'Syöttöpeli oma',
    'share.passingOpp': 'Syöttöpeli vast',
    'share.attackThird': 'Hyökkäyskolmannes',
    'share.boxEntry': 'Boxiin',
    'share.shotsUs': 'Laukaukset me',
    'share.shotsOpp': 'Laukaukset vast',
  },
  en: {
    'app.title': 'Match Tracker',
    'home.newMatch': 'New match',
    'home.open': 'Open',
    'home.summary': 'Summary',
    'home.delete': 'Delete',
    'home.updated': 'Updated',
    'home.noMatches': 'No saved matches yet.',
    'home.collector': 'Collector',
    'settings.title': 'Export / Import',
    'settings.exportAll': 'Export all matches (JSON)',
    'settings.importJson': 'Import JSON',
    'settings.close': 'Close',
    'match.newTitle': 'New match',
    'match.dateTime': 'Date & time',
    'match.location': 'Location',
    'match.homeTeam': 'Home team',
    'match.awayTeam': 'Away team',
    'match.notes': 'Notes',
    'match.create': 'Create match',
    'match.selectGame': 'Select match',
    'match.availableGames': 'Pick a match from the list. Add new matches via the JSON data file.',
    'match.noGames': 'No matches available. Add matches in the JSON data file.',
    'match.selectRole': 'Stat to collect',
    'match.notFound': 'Match not found.',
    'match.back': 'Back',
    'match.backToList': 'Back to list',
    'match.summary': 'Summary & share',
    'match.firstHalf': '1H',
    'match.secondHalf': '2H',
    'summary.title': 'Summary',
    'summary.shareText': 'Share as text',
    'summary.copy': 'Copy to clipboard',
    'summary.share': 'Share…',
    'summary.downloadJson': 'Download JSON',
    'summary.downloadCsv': 'Download CSV',
    'summary.total': 'Total',
    'toast.saved': 'Saved',
    'toast.created': 'Match created',
    'toast.copied': 'Copied to clipboard',
    'toast.shared': 'Shared',
    'toast.importInvalid': 'Invalid JSON file',
    'toast.importDone': 'Import complete',
    'toast.importFailed': 'Import failed',
    'confirm.delete': 'Delete match {home} – {away}?',
    'confirm.replaceAll': 'Replace all existing matches?',
    'confirm.resetSection': 'Reset section "{title}"?',
    'label.ownHalf': 'Own half',
    'label.oppHalf': 'Opposition half',
    'label.attempts': 'Attempts',
    'label.completed': 'Completed',
    'label.byPass': 'By passing',
    'label.byCarry': 'By carrying',
    'label.us': 'Us',
    'label.opp': 'Opponent',
    'label.onTarget': 'On target',
    'label.offTarget': 'Off target',
    'label.passPct': 'Pass % (own / opp)',
    'label.attackTotal': 'Final third total',
    'label.boxTotal': 'Box entries total',
    'label.shotsTotal': 'Shots total (us / opp)',
    'role.passing': 'Passing',
    'role.attackThird': 'Final third entries',
    'role.boxEntry': 'Box entries',
    'role.shots': 'Shots',
    'label.collectorRole': 'Stat to collect',
    'action.reset': 'Reset',
    'action.trashReset': '🗑️ Reset',
    'label.exportImport': 'Export / Import',
    'label.date': 'Date & time',
    'label.location': 'Location',
    'label.notes': 'Notes',
    'share.half1': '1H',
    'share.half2': '2H',
    'share.total': 'Total',
    'share.passingOwn': 'Passing own',
    'share.passingOpp': 'Passing opp',
    'share.attackThird': 'Final third',
    'share.boxEntry': 'Box entries',
    'share.shotsUs': 'Shots us',
    'share.shotsOpp': 'Shots opp',
  },
}

export const t = (lang: Lang, key: I18nKey, params?: Record<string, string>) => {
  const template = translations[lang][key] ?? key
  if (!params) return template
  return Object.entries(params).reduce(
    (acc, [param, value]) => acc.replaceAll(`{${param}}`, value),
    template,
  )
}
