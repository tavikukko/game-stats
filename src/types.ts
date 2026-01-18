export type HalfKey = 'first' | 'second'

export interface PassStats {
  attempts: number
  completed: number
}

export interface PassingStats {
  ownHalf: PassStats
  oppHalf: PassStats
}

export interface AttackThirdStats {
  pass: number
  carry: number
}

export interface BoxEntryStats {
  pass: number
  carry: number
}

export interface ShotSideStats {
  on: number
  off: number
}

export interface ShotStats {
  us: ShotSideStats
  opp: ShotSideStats
}

export interface HalfStats {
  passing: PassingStats
  attackThird: AttackThirdStats
  boxEntry: BoxEntryStats
  shots: ShotStats
}

export interface MatchStats {
  first: HalfStats
  second: HalfStats
}

export interface MatchMeta {
  dateTime: string
  location: string
  homeTeam: string
  awayTeam: string
  notes: string
}

export interface Match {
  id: string
  createdAt: string
  updatedAt: string
  meta: MatchMeta
  stats: MatchStats
}

export interface AppState {
  matches: Match[]
}
