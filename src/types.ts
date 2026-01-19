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

export type StatRole = 'passing' | 'attackThird' | 'boxEntry' | 'shots'

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

export interface SessionData {
  role: StatRole
  first: HalfStats
  second: HalfStats
  createdAt: string
}
