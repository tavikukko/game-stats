import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { AppState, HalfKey, Match, MatchMeta } from './types'

// localStorage key for all saved matches
const STORAGE_KEY = 'match-tracker:v1'

type CounterPath =
  | 'passing.ownHalf.attempts'
  | 'passing.ownHalf.completed'
  | 'passing.oppHalf.attempts'
  | 'passing.oppHalf.completed'
  | 'attackThird.pass'
  | 'attackThird.carry'
  | 'boxEntry.pass'
  | 'boxEntry.carry'
  | 'shots.us.on'
  | 'shots.us.off'
  | 'shots.opp.on'
  | 'shots.opp.off'

type ResetSection = 'passing' | 'attackThird' | 'boxEntry' | 'shots'

type ToastKind = 'info' | 'success'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface StoreContextValue {
  state: AppState
  createMatch: (meta: MatchMeta) => string
  deleteMatch: (id: string) => void
  updateMeta: (id: string, patch: Partial<MatchMeta>) => void
  updateCounter: (id: string, half: HalfKey, path: CounterPath, delta: number) => void
  resetSection: (id: string, half: HalfKey, section: ResetSection) => void
  importMatches: (matches: Match[], mode: 'merge' | 'replace') => void
  toast: Toast | null
  showToast: (message: string, kind?: ToastKind) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const emptyState: AppState = { matches: [] }

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `match_${Date.now()}_${Math.random().toString(16).slice(2)}`

const createEmptyMatch = (meta: MatchMeta): Match => {
  const baseHalf = () => ({
    passing: {
      ownHalf: { attempts: 0, completed: 0 },
      oppHalf: { attempts: 0, completed: 0 },
    },
    attackThird: { pass: 0, carry: 0 },
    boxEntry: { pass: 0, carry: 0 },
    shots: {
      us: { on: 0, off: 0 },
      opp: { on: 0, off: 0 },
    },
  })

  const now = new Date().toISOString()
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    meta,
    stats: { first: baseHalf(), second: baseHalf() },
  }
}

const cloneMatch = (match: Match): Match => ({
  ...match,
  meta: { ...match.meta },
  stats: {
    first: {
      passing: {
        ownHalf: { ...match.stats.first.passing.ownHalf },
        oppHalf: { ...match.stats.first.passing.oppHalf },
      },
      attackThird: { ...match.stats.first.attackThird },
      boxEntry: { ...match.stats.first.boxEntry },
      shots: {
        us: { ...match.stats.first.shots.us },
        opp: { ...match.stats.first.shots.opp },
      },
    },
    second: {
      passing: {
        ownHalf: { ...match.stats.second.passing.ownHalf },
        oppHalf: { ...match.stats.second.passing.oppHalf },
      },
      attackThird: { ...match.stats.second.attackThird },
      boxEntry: { ...match.stats.second.boxEntry },
      shots: {
        us: { ...match.stats.second.shots.us },
        opp: { ...match.stats.second.shots.opp },
      },
    },
  },
})

// Load matches from localStorage (best-effort)
const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.matches)) return emptyState
    return { matches: parsed.matches }
  } catch {
    return emptyState
  }
}

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(() => loadState())
  const [toast, setToast] = useState<Toast | null>(null)
  const saveTimer = useRef<number | null>(null)
  const hasLoaded = useRef(false)
  const lastSaveToast = useRef(0)

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now()
    setToast({ id, message, kind })
    globalThis.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev))
    }, 1800)
  }, [])

  // Debounced persistence on every change
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      return
    }

    if (saveTimer.current) {
      globalThis.clearTimeout(saveTimer.current)
    }

    saveTimer.current = globalThis.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      if (Date.now() - lastSaveToast.current > 2000) {
        showToast('Tallennettu')
        lastSaveToast.current = Date.now()
      }
    }, 200)

    return () => {
      if (saveTimer.current) {
        globalThis.clearTimeout(saveTimer.current)
      }
    }
  }, [state, showToast])

  const updateMatch = useCallback(
    (id: string, updater: (match: Match) => void) => {
      setState((prev) => {
        const matches = prev.matches.map((match) => {
          if (match.id !== id) return match
          const next = cloneMatch(match)
          updater(next)
          next.updatedAt = new Date().toISOString()
          return next
        })
        return { matches }
      })
    },
    [],
  )

  const createMatch = useCallback((meta: MatchMeta) => {
    const newMatch = createEmptyMatch(meta)
    setState((prev) => ({ matches: [newMatch, ...prev.matches] }))
    return newMatch.id
  }, [])

  const deleteMatch = useCallback((id: string) => {
    setState((prev) => ({ matches: prev.matches.filter((m) => m.id !== id) }))
  }, [])

  const updateMeta = useCallback(
    (id: string, patch: Partial<MatchMeta>) => {
      updateMatch(id, (match) => {
        match.meta = { ...match.meta, ...patch }
      })
    },
    [updateMatch],
  )

  const updateCounter = useCallback(
    (id: string, half: HalfKey, path: CounterPath, delta: number) => {
      updateMatch(id, (match) => {
        const parts = path.split('.')
        let target: Record<string, unknown> = match.stats[half] as unknown as Record<
          string,
          unknown
        >
        for (let i = 0; i < parts.length - 1; i += 1) {
          target = target[parts[i]] as Record<string, unknown>
        }
        const key = parts.at(-1) ?? ''
        const currentValue = Number(target[key] ?? 0)
        const nextValue = Math.max(0, currentValue + delta)
        target[key] = nextValue
      })
    },
    [updateMatch],
  )

  const resetSection = useCallback(
    (id: string, half: HalfKey, section: ResetSection) => {
      updateMatch(id, (match) => {
        const stats = match.stats[half]
        if (section === 'passing') {
          stats.passing.ownHalf = { attempts: 0, completed: 0 }
          stats.passing.oppHalf = { attempts: 0, completed: 0 }
        }
        if (section === 'attackThird') {
          stats.attackThird = { pass: 0, carry: 0 }
        }
        if (section === 'boxEntry') {
          stats.boxEntry = { pass: 0, carry: 0 }
        }
        if (section === 'shots') {
          stats.shots.us = { on: 0, off: 0 }
          stats.shots.opp = { on: 0, off: 0 }
        }
      })
    },
    [updateMatch],
  )

  const importMatches = useCallback(
    (matches: Match[], mode: 'merge' | 'replace') => {
      if (mode === 'replace') {
        setState({ matches })
        return
      }
      setState((prev) => {
        const map = new Map(prev.matches.map((match) => [match.id, match]))
        matches.forEach((match) => {
          map.set(match.id, match)
        })
        return { matches: Array.from(map.values()) }
      })
    },
    [],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      createMatch,
      deleteMatch,
      updateMeta,
      updateCounter,
      resetSection,
      importMatches,
      toast,
      showToast,
    }),
    [
      state,
      createMatch,
      deleteMatch,
      updateMeta,
      updateCounter,
      resetSection,
      importMatches,
      toast,
      showToast,
    ],
  )

  return React.createElement(StoreContext.Provider, { value }, children)
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error('StoreProvider is missing')
  }
  return ctx
}
