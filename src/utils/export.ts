import type { HalfStats, Match } from '../types'
import type { Lang } from '../i18n'
import { t } from '../i18n'

// Percentage helper
const pct = (completed: number, attempts: number) =>
  attempts > 0 ? Math.round((completed / attempts) * 100) : 0

const sumHalfStats = (a: HalfStats, b: HalfStats): HalfStats => ({
  passing: {
    ownHalf: {
      attempts: a.passing.ownHalf.attempts + b.passing.ownHalf.attempts,
      completed: a.passing.ownHalf.completed + b.passing.ownHalf.completed,
    },
    oppHalf: {
      attempts: a.passing.oppHalf.attempts + b.passing.oppHalf.attempts,
      completed: a.passing.oppHalf.completed + b.passing.oppHalf.completed,
    },
  },
  attackThird: {
    pass: a.attackThird.pass + b.attackThird.pass,
    carry: a.attackThird.carry + b.attackThird.carry,
  },
  boxEntry: {
    pass: a.boxEntry.pass + b.boxEntry.pass,
    carry: a.boxEntry.carry + b.boxEntry.carry,
  },
  shots: {
    us: {
      on: a.shots.us.on + b.shots.us.on,
      off: a.shots.us.off + b.shots.us.off,
    },
    opp: {
      on: a.shots.opp.on + b.shots.opp.on,
      off: a.shots.opp.off + b.shots.opp.off,
    },
  },
})

// WhatsApp-friendly share text
export const buildShareText = (match: Match, lang: Lang) => {
  const total = sumHalfStats(match.stats.first, match.stats.second)
  const header = `${match.meta.homeTeam} – ${match.meta.awayTeam}`
  const meta = `${match.meta.dateTime} • ${match.meta.location}`
  const role = match.meta.collectorRole ?? 'passing'

  const halfBlock = (label: string, stats: HalfStats) => {
    const ownPct = pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)
    const oppPct = pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)
    const attackTotal = stats.attackThird.pass + stats.attackThird.carry
    const boxTotal = stats.boxEntry.pass + stats.boxEntry.carry
    const shotsUsTotal = stats.shots.us.on + stats.shots.us.off
    const shotsOppTotal = stats.shots.opp.on + stats.shots.opp.off

    const lines = [label]

    if (role === 'passing') {
      lines.push(
        `${t(lang, 'share.passingOwn')}: ${stats.passing.ownHalf.completed}/${stats.passing.ownHalf.attempts} (${ownPct}%)`,
        `${t(lang, 'share.passingOpp')}: ${stats.passing.oppHalf.completed}/${stats.passing.oppHalf.attempts} (${oppPct}%)`,
      )
    }

    if (role === 'attackThird') {
      lines.push(
        `${t(lang, 'share.attackThird')}: ${t(lang, 'label.byPass').toLowerCase()} ${stats.attackThird.pass}, ${t(lang, 'label.byCarry').toLowerCase()} ${stats.attackThird.carry}, ${t(lang, 'summary.total').toLowerCase()} ${attackTotal}`,
      )
    }

    if (role === 'boxEntry') {
      lines.push(
        `${t(lang, 'share.boxEntry')}: ${t(lang, 'label.byPass').toLowerCase()} ${stats.boxEntry.pass}, ${t(lang, 'label.byCarry').toLowerCase()} ${stats.boxEntry.carry}, ${t(lang, 'summary.total').toLowerCase()} ${boxTotal}`,
      )
    }

    if (role === 'shots') {
      lines.push(
        `${t(lang, 'share.shotsUs')}: ${t(lang, 'label.onTarget').toLowerCase()} ${stats.shots.us.on}, ${t(lang, 'label.offTarget').toLowerCase()} ${stats.shots.us.off}, ${t(lang, 'summary.total').toLowerCase()} ${shotsUsTotal}`,
        `${t(lang, 'share.shotsOpp')}: ${t(lang, 'label.onTarget').toLowerCase()} ${stats.shots.opp.on}, ${t(lang, 'label.offTarget').toLowerCase()} ${stats.shots.opp.off}, ${t(lang, 'summary.total').toLowerCase()} ${shotsOppTotal}`,
      )
    }

    return lines.join('\n')
  }

  const blocks = [
    header,
    meta,
    match.meta.notes ? `Muistiinpanot: ${match.meta.notes}` : '',
    '',
    halfBlock(t(lang, 'share.half1'), match.stats.first),
    '',
    halfBlock(t(lang, 'share.half2'), match.stats.second),
    '',
    halfBlock(t(lang, 'share.total'), total),
  ].filter(Boolean)

  return blocks.join('\n')
}

// CSV export for a single match
export const buildMatchCsv = (match: Match) => {
  const total = sumHalfStats(match.stats.first, match.stats.second)
  const header = [
    'half',
    'passing_own_attempts',
    'passing_own_completed',
    'passing_own_pct',
    'passing_opp_attempts',
    'passing_opp_completed',
    'passing_opp_pct',
    'attack_third_pass',
    'attack_third_carry',
    'attack_third_total',
    'box_pass',
    'box_carry',
    'box_total',
    'shots_us_on',
    'shots_us_off',
    'shots_us_total',
    'shots_opp_on',
    'shots_opp_off',
    'shots_opp_total',
  ].join(',')

  const row = (label: string, stats: HalfStats) => {
    const attackTotal = stats.attackThird.pass + stats.attackThird.carry
    const boxTotal = stats.boxEntry.pass + stats.boxEntry.carry
    const shotsUsTotal = stats.shots.us.on + stats.shots.us.off
    const shotsOppTotal = stats.shots.opp.on + stats.shots.opp.off
    return [
      label,
      stats.passing.ownHalf.attempts,
      stats.passing.ownHalf.completed,
      pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts),
      stats.passing.oppHalf.attempts,
      stats.passing.oppHalf.completed,
      pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts),
      stats.attackThird.pass,
      stats.attackThird.carry,
      attackTotal,
      stats.boxEntry.pass,
      stats.boxEntry.carry,
      boxTotal,
      stats.shots.us.on,
      stats.shots.us.off,
      shotsUsTotal,
      stats.shots.opp.on,
      stats.shots.opp.off,
      shotsOppTotal,
    ].join(',')
  }

  return [header, row('1PA', match.stats.first), row('2PA', match.stats.second), row('TOTAL', total)].join('\n')
}

// Trigger a file download in the browser
export const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const isNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value)

const isHalfStats = (value: unknown): value is HalfStats => {
  const stats = value as HalfStats | null | undefined
  return Boolean(
    stats?.passing &&
      stats?.attackThird &&
      stats?.boxEntry &&
      stats?.shots &&
      isNumber(stats?.passing?.ownHalf?.attempts) &&
      isNumber(stats?.passing?.ownHalf?.completed) &&
      isNumber(stats?.passing?.oppHalf?.attempts) &&
      isNumber(stats?.passing?.oppHalf?.completed) &&
      isNumber(stats?.attackThird?.pass) &&
      isNumber(stats?.attackThird?.carry) &&
      isNumber(stats?.boxEntry?.pass) &&
      isNumber(stats?.boxEntry?.carry) &&
      isNumber(stats?.shots?.us?.on) &&
      isNumber(stats?.shots?.us?.off) &&
      isNumber(stats?.shots?.opp?.on) &&
      isNumber(stats?.shots?.opp?.off),
  )
}

// Validate JSON import (array of matches)
export const validateImportedMatches = (data: unknown): Match[] | null => {
  if (!Array.isArray(data)) return null
  const matches: Match[] = []

  for (const item of data) {
    if (!item || typeof item !== 'object') return null
    const match = item as Match
    if (
      typeof match.id !== 'string' ||
      typeof match.createdAt !== 'string' ||
      typeof match.updatedAt !== 'string' ||
      typeof match.meta?.dateTime !== 'string' ||
      typeof match.meta?.location !== 'string' ||
      typeof match.meta?.homeTeam !== 'string' ||
      typeof match.meta?.awayTeam !== 'string' ||
      typeof match.meta?.notes !== 'string'
    ) {
      return null
    }
    if (!match.stats || !isHalfStats(match.stats.first) || !isHalfStats(match.stats.second)) {
      return null
    }
    if (!match.meta.collectorRole) {
      match.meta.collectorRole = 'passing'
    }
    matches.push(match)
  }

  return matches
}
