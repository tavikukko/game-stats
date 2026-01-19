import { useState } from 'react'
import { getDefaultLang, LANGUAGE_KEY, t, type Lang } from './i18n'
import type { StatRole, HalfKey, HalfStats, SessionData } from './types'

const SESSION_KEY = 'game-stats:session'

const emptyHalf = (): HalfStats => ({
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

const createSession = (role: StatRole): SessionData => ({
  role,
  first: emptyHalf(),
  second: emptyHalf(),
  createdAt: new Date().toISOString(),
})

const loadSession = (): SessionData | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

const saveSession = (session: SessionData) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
}

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

const pct = (completed: number, attempts: number) =>
  attempts > 0 ? Math.round((completed / attempts) * 100) : 0

type Screen = 'home' | 'collect' | 'export'

const App = () => {
  const [lang, setLang] = useState<Lang>(() => getDefaultLang())
  const [screen, setScreen] = useState<Screen>(() => (loadSession() ? 'collect' : 'home'))
  const [session, setSession] = useState<SessionData | null>(() => loadSession())
  const [toast, setToast] = useState<string | null>(null)

  const handleLang = (next: Lang) => {
    setLang(next)
    localStorage.setItem(LANGUAGE_KEY, next)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const handleStartSession = (role: StatRole) => {
    const newSession = createSession(role)
    setSession(newSession)
    saveSession(newSession)
    setScreen('collect')
  }

  const handleUpdateSession = (updated: SessionData) => {
    setSession(updated)
    saveSession(updated)
  }

  const handleFinish = () => {
    setScreen('export')
  }

  const handleNewSession = () => {
    if (globalThis.confirm(t(lang, 'confirm.newSession'))) {
      clearSession()
      setSession(null)
      setScreen('home')
    }
  }

  const handleBack = () => {
    setScreen('collect')
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen lang={lang} onLangChange={handleLang} onStart={handleStartSession} />
      )}
      {screen === 'collect' && session && (
        <CollectScreen
          lang={lang}
          session={session}
          onUpdate={handleUpdateSession}
          onFinish={handleFinish}
          onNew={handleNewSession}
        />
      )}
      {screen === 'export' && session && (
        <ExportScreen
          lang={lang}
          session={session}
          onBack={handleBack}
          onNew={handleNewSession}
          showToast={showToast}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

const LangToggle = ({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) => (
  <div className="lang-toggle">
    <button type="button" className={lang === 'fi' ? 'active' : ''} onClick={() => onChange('fi')}>
      FI
    </button>
    <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => onChange('en')}>
      EN
    </button>
  </div>
)

const HomeScreen = ({
  lang,
  onLangChange,
  onStart,
}: {
  lang: Lang
  onLangChange: (lang: Lang) => void
  onStart: (role: StatRole) => void
}) => {
  const roles: { role: StatRole; emoji: string }[] = [
    { role: 'passing', emoji: '⚽' },
    { role: 'attackThird', emoji: '🎯' },
    { role: 'boxEntry', emoji: '📦' },
    { role: 'shots', emoji: '🥅' },
  ]

  return (
    <>
      <header className="topbar">
        <h1>{t(lang, 'app.title')}</h1>
        <LangToggle lang={lang} onChange={onLangChange} />
      </header>
      <div className="container home-container">
        <p className="subtitle">{t(lang, 'home.selectStat')}</p>
        <div className="role-grid">
          {roles.map(({ role, emoji }) => (
            <button
              key={role}
              type="button"
              className="role-btn"
              onClick={() => onStart(role)}
            >
              <span className="role-emoji">{emoji}</span>
              <span className="role-label">{t(lang, `role.${role}` as const)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

const CollectScreen = ({
  lang,
  session,
  onUpdate,
  onFinish,
  onNew,
}: {
  lang: Lang
  session: SessionData
  onUpdate: (s: SessionData) => void
  onFinish: () => void
  onNew: () => void
}) => {
  const [half, setHalf] = useState<HalfKey>('first')
  const stats = session[half]
  const role = session.role

  const update = (path: string, delta: number) => {
    const clone = JSON.parse(JSON.stringify(session)) as SessionData
    const parts = path.split('.')
    let obj: Record<string, unknown> = clone[half] as unknown as Record<string, unknown>
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]] as Record<string, unknown>
    }
    const key = parts[parts.length - 1]
    const current = obj[key] as number
    obj[key] = Math.max(0, current + delta)
    onUpdate(clone)
  }

  const resetCurrent = () => {
    if (!globalThis.confirm(t(lang, 'confirm.resetHalf'))) return
    const clone = JSON.parse(JSON.stringify(session)) as SessionData
    clone[half] = emptyHalf()
    onUpdate(clone)
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1>{t(lang, `role.${role}` as const)}</h1>
        </div>
        <div className="half-toggle">
          <button
            type="button"
            className={half === 'first' ? 'active' : ''}
            onClick={() => setHalf('first')}
          >
            {t(lang, 'match.firstHalf')}
          </button>
          <button
            type="button"
            className={half === 'second' ? 'active' : ''}
            onClick={() => setHalf('second')}
          >
            {t(lang, 'match.secondHalf')}
          </button>
        </div>
      </header>
      <div className="container collect-container">
        {role === 'passing' && (
          <>
            <div className="stat-section">
              <h3>{t(lang, 'label.ownHalf')}</h3>
              <div className="stat-row">
                <StatCounter
                  label={t(lang, 'label.attempts')}
                  value={stats.passing.ownHalf.attempts}
                  onIncrement={() => update('passing.ownHalf.attempts', 1)}
                  onDecrement={() => update('passing.ownHalf.attempts', -1)}
                />
                <StatCounter
                  label={t(lang, 'label.completed')}
                  value={stats.passing.ownHalf.completed}
                  onIncrement={() => update('passing.ownHalf.completed', 1)}
                  onDecrement={() => update('passing.ownHalf.completed', -1)}
                />
              </div>
              <div className="stat-pct">
                {pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)}%
              </div>
            </div>
            <div className="stat-section">
              <h3>{t(lang, 'label.oppHalf')}</h3>
              <div className="stat-row">
                <StatCounter
                  label={t(lang, 'label.attempts')}
                  value={stats.passing.oppHalf.attempts}
                  onIncrement={() => update('passing.oppHalf.attempts', 1)}
                  onDecrement={() => update('passing.oppHalf.attempts', -1)}
                />
                <StatCounter
                  label={t(lang, 'label.completed')}
                  value={stats.passing.oppHalf.completed}
                  onIncrement={() => update('passing.oppHalf.completed', 1)}
                  onDecrement={() => update('passing.oppHalf.completed', -1)}
                />
              </div>
              <div className="stat-pct">
                {pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)}%
              </div>
            </div>
          </>
        )}

        {role === 'attackThird' && (
          <div className="stat-section full">
            <h3>{t(lang, 'role.attackThird')}</h3>
            <div className="stat-row">
              <StatCounter
                label={t(lang, 'label.byPass')}
                value={stats.attackThird.pass}
                onIncrement={() => update('attackThird.pass', 1)}
                onDecrement={() => update('attackThird.pass', -1)}
              />
              <StatCounter
                label={t(lang, 'label.byCarry')}
                value={stats.attackThird.carry}
                onIncrement={() => update('attackThird.carry', 1)}
                onDecrement={() => update('attackThird.carry', -1)}
              />
            </div>
            <div className="stat-total">
              {t(lang, 'label.total')}: {stats.attackThird.pass + stats.attackThird.carry}
            </div>
          </div>
        )}

        {role === 'boxEntry' && (
          <div className="stat-section full">
            <h3>{t(lang, 'role.boxEntry')}</h3>
            <div className="stat-row">
              <StatCounter
                label={t(lang, 'label.byPass')}
                value={stats.boxEntry.pass}
                onIncrement={() => update('boxEntry.pass', 1)}
                onDecrement={() => update('boxEntry.pass', -1)}
              />
              <StatCounter
                label={t(lang, 'label.byCarry')}
                value={stats.boxEntry.carry}
                onIncrement={() => update('boxEntry.carry', 1)}
                onDecrement={() => update('boxEntry.carry', -1)}
              />
            </div>
            <div className="stat-total">
              {t(lang, 'label.total')}: {stats.boxEntry.pass + stats.boxEntry.carry}
            </div>
          </div>
        )}

        {role === 'shots' && (
          <>
            <div className="stat-section">
              <h3>{t(lang, 'label.us')}</h3>
              <div className="stat-row">
                <StatCounter
                  label={t(lang, 'label.onTarget')}
                  value={stats.shots.us.on}
                  onIncrement={() => update('shots.us.on', 1)}
                  onDecrement={() => update('shots.us.on', -1)}
                />
                <StatCounter
                  label={t(lang, 'label.offTarget')}
                  value={stats.shots.us.off}
                  onIncrement={() => update('shots.us.off', 1)}
                  onDecrement={() => update('shots.us.off', -1)}
                />
              </div>
              <div className="stat-total">
                {t(lang, 'label.total')}: {stats.shots.us.on + stats.shots.us.off}
              </div>
            </div>
            <div className="stat-section">
              <h3>{t(lang, 'label.opp')}</h3>
              <div className="stat-row">
                <StatCounter
                  label={t(lang, 'label.onTarget')}
                  value={stats.shots.opp.on}
                  onIncrement={() => update('shots.opp.on', 1)}
                  onDecrement={() => update('shots.opp.on', -1)}
                />
                <StatCounter
                  label={t(lang, 'label.offTarget')}
                  value={stats.shots.opp.off}
                  onIncrement={() => update('shots.opp.off', 1)}
                  onDecrement={() => update('shots.opp.off', -1)}
                />
              </div>
              <div className="stat-total">
                {t(lang, 'label.total')}: {stats.shots.opp.on + stats.shots.opp.off}
              </div>
            </div>
          </>
        )}

        <div className="action-bar">
          <button type="button" className="btn ghost small" onClick={resetCurrent}>
            🗑️
          </button>
          <button type="button" className="btn secondary" onClick={onNew}>
            {t(lang, 'action.newSession')}
          </button>
          <button type="button" className="btn primary" onClick={onFinish}>
            {t(lang, 'action.done')}
          </button>
        </div>
      </div>
    </>
  )
}

const StatCounter = ({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string
  value: number
  onIncrement: () => void
  onDecrement: () => void
}) => (
  <div className="stat-counter">
    <div className="stat-label">{label}</div>
    <div className="stat-controls">
      <button type="button" className="counter-btn minus" onClick={onDecrement} aria-label={`${label} -`}>
        −
      </button>
      <div className="stat-value">{value}</div>
      <button type="button" className="counter-btn plus" onClick={onIncrement} aria-label={`${label} +`}>
        +
      </button>
    </div>
  </div>
)

const ExportScreen = ({
  lang,
  session,
  onBack,
  onNew,
  showToast,
}: {
  lang: Lang
  session: SessionData
  onBack: () => void
  onNew: () => void
  showToast: (msg: string) => void
}) => {
  const total = sumHalfStats(session.first, session.second)
  const role = session.role

  const buildText = () => {
    const lines: string[] = []
    lines.push(`📊 ${t(lang, `role.${role}` as const)}`)
    lines.push('')

    const formatHalf = (label: string, stats: HalfStats) => {
      lines.push(`${label}:`)
      if (role === 'passing') {
        const ownPct = pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)
        const oppPct = pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)
        lines.push(`  ${t(lang, 'label.ownHalf')}: ${stats.passing.ownHalf.completed}/${stats.passing.ownHalf.attempts} (${ownPct}%)`)
        lines.push(`  ${t(lang, 'label.oppHalf')}: ${stats.passing.oppHalf.completed}/${stats.passing.oppHalf.attempts} (${oppPct}%)`)
      } else if (role === 'attackThird') {
        lines.push(`  ${t(lang, 'label.byPass')}: ${stats.attackThird.pass}`)
        lines.push(`  ${t(lang, 'label.byCarry')}: ${stats.attackThird.carry}`)
        lines.push(`  ${t(lang, 'label.total')}: ${stats.attackThird.pass + stats.attackThird.carry}`)
      } else if (role === 'boxEntry') {
        lines.push(`  ${t(lang, 'label.byPass')}: ${stats.boxEntry.pass}`)
        lines.push(`  ${t(lang, 'label.byCarry')}: ${stats.boxEntry.carry}`)
        lines.push(`  ${t(lang, 'label.total')}: ${stats.boxEntry.pass + stats.boxEntry.carry}`)
      } else if (role === 'shots') {
        lines.push(`  ${t(lang, 'label.us')}: ${stats.shots.us.on} ${t(lang, 'label.onTarget')}, ${stats.shots.us.off} ${t(lang, 'label.offTarget')}`)
        lines.push(`  ${t(lang, 'label.opp')}: ${stats.shots.opp.on} ${t(lang, 'label.onTarget')}, ${stats.shots.opp.off} ${t(lang, 'label.offTarget')}`)
      }
    }

    formatHalf(t(lang, 'match.firstHalf'), session.first)
    lines.push('')
    formatHalf(t(lang, 'match.secondHalf'), session.second)
    lines.push('')
    formatHalf(t(lang, 'summary.total'), total)

    return lines.join('\n')
  }

  const text = buildText()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(t(lang, 'toast.copied'))
    } catch {
      showToast(t(lang, 'toast.copyFailed'))
    }
  }

  const handleShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ text })
        showToast(t(lang, 'toast.shared'))
        return
      } catch {
        // fall back to copy
      }
    }
    await handleCopy()
  }

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stats-${session.role}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t(lang, 'toast.downloaded'))
  }

  const handleDownloadCsv = () => {
    const lines: string[] = []
    lines.push('half,category,subcategory,value')
    
    const addStats = (halfLabel: string, stats: HalfStats) => {
      if (role === 'passing') {
        lines.push(`${halfLabel},passing,ownHalf_attempts,${stats.passing.ownHalf.attempts}`)
        lines.push(`${halfLabel},passing,ownHalf_completed,${stats.passing.ownHalf.completed}`)
        lines.push(`${halfLabel},passing,oppHalf_attempts,${stats.passing.oppHalf.attempts}`)
        lines.push(`${halfLabel},passing,oppHalf_completed,${stats.passing.oppHalf.completed}`)
      } else if (role === 'attackThird') {
        lines.push(`${halfLabel},attackThird,pass,${stats.attackThird.pass}`)
        lines.push(`${halfLabel},attackThird,carry,${stats.attackThird.carry}`)
      } else if (role === 'boxEntry') {
        lines.push(`${halfLabel},boxEntry,pass,${stats.boxEntry.pass}`)
        lines.push(`${halfLabel},boxEntry,carry,${stats.boxEntry.carry}`)
      } else if (role === 'shots') {
        lines.push(`${halfLabel},shots,us_on,${stats.shots.us.on}`)
        lines.push(`${halfLabel},shots,us_off,${stats.shots.us.off}`)
        lines.push(`${halfLabel},shots,opp_on,${stats.shots.opp.on}`)
        lines.push(`${halfLabel},shots,opp_off,${stats.shots.opp.off}`)
      }
    }

    addStats('first', session.first)
    addStats('second', session.second)
    addStats('total', total)

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stats-${session.role}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t(lang, 'toast.downloaded'))
  }

  return (
    <>
      <header className="topbar">
        <h1>{t(lang, 'export.title')}</h1>
        <button type="button" className="btn ghost" onClick={onBack}>
          {t(lang, 'action.back')}
        </button>
      </header>
      <div className="container export-container">
        <div className="summary-card">
          <h2>{t(lang, `role.${role}` as const)}</h2>
          <SummaryBlock label={t(lang, 'match.firstHalf')} stats={session.first} role={role} lang={lang} />
          <SummaryBlock label={t(lang, 'match.secondHalf')} stats={session.second} role={role} lang={lang} />
          <SummaryBlock label={t(lang, 'summary.total')} stats={total} role={role} lang={lang} highlight />
        </div>

        <div className="export-actions">
          <button type="button" className="btn primary block" onClick={handleCopy}>
            📋 {t(lang, 'export.copy')}
          </button>
          <button type="button" className="btn secondary block" onClick={handleShare}>
            📤 {t(lang, 'export.share')}
          </button>
          <button type="button" className="btn ghost block" onClick={handleDownloadJson}>
            💾 {t(lang, 'export.downloadJson')}
          </button>
          <button type="button" className="btn ghost block" onClick={handleDownloadCsv}>
            📊 {t(lang, 'export.downloadCsv')}
          </button>
        </div>

        <button type="button" className="btn danger block" onClick={onNew}>
          🔄 {t(lang, 'action.newSession')}
        </button>
      </div>
    </>
  )
}

const SummaryBlock = ({
  label,
  stats,
  role,
  lang,
  highlight,
}: {
  label: string
  stats: HalfStats
  role: StatRole
  lang: Lang
  highlight?: boolean
}) => {
  const ownPct = pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)
  const oppPct = pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)

  return (
    <div className={`summary-block ${highlight ? 'highlight' : ''}`}>
      <h3>{label}</h3>
      {role === 'passing' && (
        <>
          <div className="summary-line">
            <span>{t(lang, 'label.ownHalf')}</span>
            <strong>{stats.passing.ownHalf.completed}/{stats.passing.ownHalf.attempts} ({ownPct}%)</strong>
          </div>
          <div className="summary-line">
            <span>{t(lang, 'label.oppHalf')}</span>
            <strong>{stats.passing.oppHalf.completed}/{stats.passing.oppHalf.attempts} ({oppPct}%)</strong>
          </div>
        </>
      )}
      {role === 'attackThird' && (
        <>
          <div className="summary-line">
            <span>{t(lang, 'label.byPass')}</span>
            <strong>{stats.attackThird.pass}</strong>
          </div>
          <div className="summary-line">
            <span>{t(lang, 'label.byCarry')}</span>
            <strong>{stats.attackThird.carry}</strong>
          </div>
          <div className="summary-line total">
            <span>{t(lang, 'label.total')}</span>
            <strong>{stats.attackThird.pass + stats.attackThird.carry}</strong>
          </div>
        </>
      )}
      {role === 'boxEntry' && (
        <>
          <div className="summary-line">
            <span>{t(lang, 'label.byPass')}</span>
            <strong>{stats.boxEntry.pass}</strong>
          </div>
          <div className="summary-line">
            <span>{t(lang, 'label.byCarry')}</span>
            <strong>{stats.boxEntry.carry}</strong>
          </div>
          <div className="summary-line total">
            <span>{t(lang, 'label.total')}</span>
            <strong>{stats.boxEntry.pass + stats.boxEntry.carry}</strong>
          </div>
        </>
      )}
      {role === 'shots' && (
        <>
          <div className="summary-line">
            <span>{t(lang, 'label.us')}</span>
            <strong>{stats.shots.us.on + stats.shots.us.off} ({stats.shots.us.on} {t(lang, 'label.onTarget')})</strong>
          </div>
          <div className="summary-line">
            <span>{t(lang, 'label.opp')}</span>
            <strong>{stats.shots.opp.on + stats.shots.opp.off} ({stats.shots.opp.on} {t(lang, 'label.onTarget')})</strong>
          </div>
        </>
      )}
    </div>
  )
}

export default App
