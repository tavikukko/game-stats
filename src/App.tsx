import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Counter from './components/Counter'
import SectionCard from './components/SectionCard'
import { useStore } from './store'
import type { HalfKey, HalfStats, Match, MatchMeta, StatRole } from './types'
import { buildMatchCsv, buildShareText, downloadFile, validateImportedMatches } from './utils/export'
import { getDefaultLang, LANGUAGE_KEY, t, type Lang } from './i18n'

const formatDate = (iso: string) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const pct = (completed: number, attempts: number) =>
  attempts > 0 ? Math.round((completed / attempts) * 100) : 0

const roleLabel = (lang: Lang): Record<StatRole, string> => ({
  passing: t(lang, 'role.passing'),
  attackThird: t(lang, 'role.attackThird'),
  boxEntry: t(lang, 'role.boxEntry'),
  shots: t(lang, 'role.shots'),
})

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

const App = () => {
  const { toast } = useStore()
  const [lang, setLang] = useState<Lang>(() => getDefaultLang())

  const handleLang = (next: Lang) => {
    setLang(next)
    localStorage.setItem(LANGUAGE_KEY, next)
  }

  const toastMessage = toast?.i18nKey ? t(lang, toast.i18nKey) : toast?.message
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomeScreen lang={lang} onLangChange={handleLang} />} />
        <Route path="/new" element={<NewMatchScreen lang={lang} />} />
        <Route path="/match/:id" element={<MatchScreen lang={lang} />} />
        <Route path="/summary/:id" element={<SummaryScreen lang={lang} />} />
      </Routes>
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  )
}

const LangToggle = ({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) => {
  return (
    <div className="segmented">
      <button
        type="button"
        className={lang === 'fi' ? 'active' : ''}
        onClick={() => onChange('fi')}
      >
        FI
      </button>
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        onClick={() => onChange('en')}
      >
        EN
      </button>
    </div>
  )
}

const HomeScreen = ({
  lang,
  onLangChange,
}: {
  lang: Lang
  onLangChange: (lang: Lang) => void
}) => {
  const { state, deleteMatch } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const labels = roleLabel(lang)
  const matches = useMemo(
    () =>
      [...state.matches].sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
      ),
    [state.matches],
  )

  const handleDelete = (match: Match) => {
    const ok = globalThis.confirm(
      t(lang, 'confirm.delete', { home: match.meta.homeTeam, away: match.meta.awayTeam }),
    )
    if (ok) {
      deleteMatch(match.id)
    }
  }

  return (
    <>
      <header className="topbar">
        <h1>{t(lang, 'app.title')}</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <LangToggle lang={lang} onChange={onLangChange} />
          <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}>
            ⚙️
          </button>
        </div>
      </header>
      <div className="container">
        <Link className="btn block" to="/new">
          {t(lang, 'home.newMatch')}
        </Link>
        <div className="match-list">
          {matches.length === 0 ? (
            <div className="card">
              <div className="helper">{t(lang, 'home.noMatches')}</div>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="match-item">
                <h3>
                  {match.meta.homeTeam} – {match.meta.awayTeam}
                </h3>
                <div className="match-meta">
                  {formatDate(match.meta.dateTime)} · {match.meta.location}
                </div>
                <div className="match-meta">
                  {t(lang, 'home.collector')}: {labels[match.meta.collectorRole]}
                </div>
                <div className="match-meta">
                  {t(lang, 'home.updated')}: {formatDate(match.updatedAt)}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link className="btn secondary" to={`/match/${match.id}`}>
                    {t(lang, 'home.open')}
                  </Link>
                  <Link className="btn ghost" to={`/summary/${match.id}`}>
                    {t(lang, 'home.summary')}
                  </Link>
                  <button type="button" className="btn danger" onClick={() => handleDelete(match)}>
                    {t(lang, 'home.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <SettingsModal lang={lang} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

const SettingsModal = ({
  lang,
  open,
  onClose,
}: {
  lang: Lang
  open: boolean
  onClose: () => void
}) => {
  const { state, importMatches, showToast } = useStore()
  const [isImporting, setIsImporting] = useState(false)

  if (!open) return null

  const handleExportAll = () => {
    const payload = JSON.stringify(state.matches, null, 2)
    downloadFile('ottelut.json', payload, 'application/json')
    showToast(t(lang, 'settings.exportAll'), 'success')
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const matches = validateImportedMatches(parsed)
      if (!matches) {
        showToast(t(lang, 'toast.importInvalid'))
        return
      }
      const replace = globalThis.confirm(t(lang, 'confirm.replaceAll'))
      importMatches(matches, replace ? 'replace' : 'merge')
      showToast(t(lang, 'toast.importDone'), 'success')
      onClose()
    } catch {
      showToast(t(lang, 'toast.importFailed'))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <dialog
      open
      className="modal-backdrop"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="modal">
        <h2>{t(lang, 'settings.title')}</h2>
        <button type="button" className="btn block" onClick={handleExportAll}>
          {t(lang, 'settings.exportAll')}
        </button>
        <label className="btn secondary block" style={{ cursor: 'pointer' }}>
          <span>{t(lang, 'settings.importJson')}</span>
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            disabled={isImporting}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleImport(file)
              }
              event.currentTarget.value = ''
            }}
          />
        </label>
        <button type="button" className="btn ghost block" onClick={onClose}>
          {t(lang, 'settings.close')}
        </button>
      </div>
    </dialog>
  )
}

const NewMatchScreen = ({ lang }: { lang: Lang }) => {
  const { createMatch, showToast } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState<MatchMeta>({
    dateTime: '',
    location: '',
    homeTeam: '',
    awayTeam: '',
    notes: '',
    collectorRole: 'passing',
  })

  const updateField = (key: keyof MatchMeta, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const id = createMatch({
      ...form,
      dateTime: form.dateTime || new Date().toISOString(),
    })
    showToast(t(lang, 'toast.created'), 'success')
    navigate(`/match/${id}`)
  }

  return (
    <>
      <header className="topbar">
        <h1>{t(lang, 'match.newTitle')}</h1>
        <Link className="btn ghost" to="/">
          {t(lang, 'match.back')}
        </Link>
      </header>
      <form className="container" onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-grid">
            <label>
              <span>{t(lang, 'match.dateTime')}</span>
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={(event) => updateField('dateTime', event.target.value)}
              />
            </label>
            <label>
              <span>{t(lang, 'match.location')}</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder={t(lang, 'match.location')}
                required
              />
            </label>
            <label>
              <span>{t(lang, 'match.homeTeam')}</span>
              <input
                type="text"
                value={form.homeTeam}
                onChange={(event) => updateField('homeTeam', event.target.value)}
                placeholder={t(lang, 'match.homeTeam')}
                required
              />
            </label>
            <label>
              <span>{t(lang, 'match.awayTeam')}</span>
              <input
                type="text"
                value={form.awayTeam}
                onChange={(event) => updateField('awayTeam', event.target.value)}
                placeholder={t(lang, 'match.awayTeam')}
                required
              />
            </label>
            <label>
              <span>{t(lang, 'match.notes')}</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder={t(lang, 'match.notes')}
              />
            </label>
            <label>
              <span>{t(lang, 'label.collectorRole')}</span>
              <select
                value={form.collectorRole}
                onChange={(event) =>
                  updateField('collectorRole', event.target.value as MatchMeta['collectorRole'])
                }
              >
                <option value="passing">{t(lang, 'role.passing')}</option>
                <option value="attackThird">{t(lang, 'role.attackThird')}</option>
                <option value="boxEntry">{t(lang, 'role.boxEntry')}</option>
                <option value="shots">{t(lang, 'role.shots')}</option>
              </select>
            </label>
          </div>
        </div>
        <button type="submit" className="btn block">
          {t(lang, 'match.create')}
        </button>
      </form>
    </>
  )
}

const MatchScreen = ({ lang }: { lang: Lang }) => {
  const { id } = useParams()
  const { state, updateCounter, resetSection } = useStore()
  const [half, setHalf] = useState<HalfKey>('first')
  const match = state.matches.find((item) => item.id === id)

  if (!match) {
    return (
      <div className="container">
        <div className="card">{t(lang, 'match.notFound')}</div>
        <Link className="btn" to="/">
          {t(lang, 'match.back')}
        </Link>
      </div>
    )
  }

  const stats = match.stats[half]
  const role = match.meta.collectorRole ?? 'passing'
  const ownPct = pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)
  const oppPct = pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)
  const attackTotal = stats.attackThird.pass + stats.attackThird.carry
  const boxTotal = stats.boxEntry.pass + stats.boxEntry.carry
  const shotsUsTotal = stats.shots.us.on + stats.shots.us.off
  const shotsOppTotal = stats.shots.opp.on + stats.shots.opp.off

  return (
    <>
      <header className="topbar">
        <div>
          <h1>
            {match.meta.homeTeam} – {match.meta.awayTeam}
          </h1>
          <div className="match-meta">{formatDate(match.meta.dateTime)}</div>
        </div>
        <div className="segmented">
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
      <div className="container">
        {role === 'passing' && (
          <SectionCard
            title={t(lang, 'role.passing')}
            onReset={() => resetSection(match.id, half, 'passing')}
            resetLabel={t(lang, 'action.trashReset')}
            confirmText={(title) => t(lang, 'confirm.resetSection', { title })}
          >
            <div className="subsection">
              <h3>{t(lang, 'label.ownHalf')}</h3>
              <Counter
                label={t(lang, 'label.attempts')}
                value={stats.passing.ownHalf.attempts}
                onIncrement={() => updateCounter(match.id, half, 'passing.ownHalf.attempts', 1)}
                onDecrement={() => updateCounter(match.id, half, 'passing.ownHalf.attempts', -1)}
                incrementAriaLabel={`${t(lang, 'label.attempts')} +`}
                decrementAriaLabel={`${t(lang, 'label.attempts')} -`}
              />
              <Counter
                label={t(lang, 'label.completed')}
                value={stats.passing.ownHalf.completed}
                onIncrement={() => updateCounter(match.id, half, 'passing.ownHalf.completed', 1)}
                onDecrement={() => updateCounter(match.id, half, 'passing.ownHalf.completed', -1)}
                incrementAriaLabel={`${t(lang, 'label.completed')} +`}
                decrementAriaLabel={`${t(lang, 'label.completed')} -`}
              />
            </div>
            <div className="subsection">
              <h3>{t(lang, 'label.oppHalf')}</h3>
              <Counter
                label={t(lang, 'label.attempts')}
                value={stats.passing.oppHalf.attempts}
                onIncrement={() => updateCounter(match.id, half, 'passing.oppHalf.attempts', 1)}
                onDecrement={() => updateCounter(match.id, half, 'passing.oppHalf.attempts', -1)}
                incrementAriaLabel={`${t(lang, 'label.attempts')} +`}
                decrementAriaLabel={`${t(lang, 'label.attempts')} -`}
              />
              <Counter
                label={t(lang, 'label.completed')}
                value={stats.passing.oppHalf.completed}
                onIncrement={() => updateCounter(match.id, half, 'passing.oppHalf.completed', 1)}
                onDecrement={() => updateCounter(match.id, half, 'passing.oppHalf.completed', -1)}
                incrementAriaLabel={`${t(lang, 'label.completed')} +`}
                decrementAriaLabel={`${t(lang, 'label.completed')} -`}
              />
            </div>
          </SectionCard>
        )}

        {role === 'attackThird' && (
          <SectionCard
            title={t(lang, 'role.attackThird')}
            onReset={() => resetSection(match.id, half, 'attackThird')}
            resetLabel={t(lang, 'action.trashReset')}
            confirmText={(title) => t(lang, 'confirm.resetSection', { title })}
          >
            <Counter
              label={t(lang, 'label.byPass')}
              value={stats.attackThird.pass}
              onIncrement={() => updateCounter(match.id, half, 'attackThird.pass', 1)}
              onDecrement={() => updateCounter(match.id, half, 'attackThird.pass', -1)}
              incrementAriaLabel={`${t(lang, 'label.byPass')} +`}
              decrementAriaLabel={`${t(lang, 'label.byPass')} -`}
            />
            <Counter
              label={t(lang, 'label.byCarry')}
              value={stats.attackThird.carry}
              onIncrement={() => updateCounter(match.id, half, 'attackThird.carry', 1)}
              onDecrement={() => updateCounter(match.id, half, 'attackThird.carry', -1)}
              incrementAriaLabel={`${t(lang, 'label.byCarry')} +`}
              decrementAriaLabel={`${t(lang, 'label.byCarry')} -`}
            />
          </SectionCard>
        )}

        {role === 'boxEntry' && (
          <SectionCard
            title={t(lang, 'role.boxEntry')}
            onReset={() => resetSection(match.id, half, 'boxEntry')}
            resetLabel={t(lang, 'action.trashReset')}
            confirmText={(title) => t(lang, 'confirm.resetSection', { title })}
          >
            <Counter
              label={t(lang, 'label.byPass')}
              value={stats.boxEntry.pass}
              onIncrement={() => updateCounter(match.id, half, 'boxEntry.pass', 1)}
              onDecrement={() => updateCounter(match.id, half, 'boxEntry.pass', -1)}
              incrementAriaLabel={`${t(lang, 'label.byPass')} +`}
              decrementAriaLabel={`${t(lang, 'label.byPass')} -`}
            />
            <Counter
              label={t(lang, 'label.byCarry')}
              value={stats.boxEntry.carry}
              onIncrement={() => updateCounter(match.id, half, 'boxEntry.carry', 1)}
              onDecrement={() => updateCounter(match.id, half, 'boxEntry.carry', -1)}
              incrementAriaLabel={`${t(lang, 'label.byCarry')} +`}
              decrementAriaLabel={`${t(lang, 'label.byCarry')} -`}
            />
          </SectionCard>
        )}

        {role === 'shots' && (
          <SectionCard
            title={t(lang, 'role.shots')}
            onReset={() => resetSection(match.id, half, 'shots')}
            resetLabel={t(lang, 'action.trashReset')}
            confirmText={(title) => t(lang, 'confirm.resetSection', { title })}
          >
            <div className="subsection">
              <h3>{t(lang, 'label.us')}</h3>
              <Counter
                label={t(lang, 'label.onTarget')}
                value={stats.shots.us.on}
                onIncrement={() => updateCounter(match.id, half, 'shots.us.on', 1)}
                onDecrement={() => updateCounter(match.id, half, 'shots.us.on', -1)}
                incrementAriaLabel={`${t(lang, 'label.onTarget')} +`}
                decrementAriaLabel={`${t(lang, 'label.onTarget')} -`}
              />
              <Counter
                label={t(lang, 'label.offTarget')}
                value={stats.shots.us.off}
                onIncrement={() => updateCounter(match.id, half, 'shots.us.off', 1)}
                onDecrement={() => updateCounter(match.id, half, 'shots.us.off', -1)}
                incrementAriaLabel={`${t(lang, 'label.offTarget')} +`}
                decrementAriaLabel={`${t(lang, 'label.offTarget')} -`}
              />
            </div>
            <div className="subsection">
              <h3>{t(lang, 'label.opp')}</h3>
              <Counter
                label={t(lang, 'label.onTarget')}
                value={stats.shots.opp.on}
                onIncrement={() => updateCounter(match.id, half, 'shots.opp.on', 1)}
                onDecrement={() => updateCounter(match.id, half, 'shots.opp.on', -1)}
                incrementAriaLabel={`${t(lang, 'label.onTarget')} +`}
                decrementAriaLabel={`${t(lang, 'label.onTarget')} -`}
              />
              <Counter
                label={t(lang, 'label.offTarget')}
                value={stats.shots.opp.off}
                onIncrement={() => updateCounter(match.id, half, 'shots.opp.off', 1)}
                onDecrement={() => updateCounter(match.id, half, 'shots.opp.off', -1)}
                incrementAriaLabel={`${t(lang, 'label.offTarget')} +`}
                decrementAriaLabel={`${t(lang, 'label.offTarget')} -`}
              />
            </div>
          </SectionCard>
        )}

        <div className="card">
          <div className="summary-grid">
            {role === 'passing' && (
              <div className="summary-row">
                <span className="summary-label">{t(lang, 'label.passPct')}</span>
                <strong>
                  {ownPct}% / {oppPct}%
                </strong>
              </div>
            )}
            {role === 'attackThird' && (
              <div className="summary-row">
                <span className="summary-label">{t(lang, 'label.attackTotal')}</span>
                <strong>{attackTotal}</strong>
              </div>
            )}
            {role === 'boxEntry' && (
              <div className="summary-row">
                <span className="summary-label">{t(lang, 'label.boxTotal')}</span>
                <strong>{boxTotal}</strong>
              </div>
            )}
            {role === 'shots' && (
              <div className="summary-row">
                <span className="summary-label">{t(lang, 'label.shotsTotal')}</span>
                <strong>
                  {shotsUsTotal} / {shotsOppTotal}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link className="btn secondary" to="/">
            {t(lang, 'match.backToList')}
          </Link>
          <Link className="btn" to={`/summary/${match.id}`}>
            {t(lang, 'match.summary')}
          </Link>
        </div>
      </div>
    </>
  )
}

const SummaryScreen = ({ lang }: { lang: Lang }) => {
  const { id } = useParams()
  const { state, showToast } = useStore()
  const match = state.matches.find((item) => item.id === id)

  if (!match) {
    return (
      <div className="container">
        <div className="card">{t(lang, 'match.notFound')}</div>
        <Link className="btn" to="/">
          {t(lang, 'match.back')}
        </Link>
      </div>
    )
  }

  const total = sumHalfStats(match.stats.first, match.stats.second)
  const role = match.meta.collectorRole ?? 'passing'
  const shareText = buildShareText(match, lang)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      showToast(t(lang, 'toast.copied'), 'success')
    } catch {
      showToast(t(lang, 'toast.importFailed'))
    }
  }

  const handleShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ text: shareText })
        showToast(t(lang, 'toast.shared'), 'success')
        return
      } catch {
        // fall back to copy
      }
    }
    await handleCopy()
  }

  return (
    <>
      <header className="topbar">
        <h1>{t(lang, 'summary.title')}</h1>
        <Link className="btn ghost" to={`/match/${match.id}`}>
          {t(lang, 'match.back')}
        </Link>
      </header>
      <div className="container">
        <SummaryBlock label={t(lang, 'match.firstHalf')} stats={match.stats.first} role={role} lang={lang} />
        <SummaryBlock label={t(lang, 'match.secondHalf')} stats={match.stats.second} role={role} lang={lang} />
        <SummaryBlock label={t(lang, 'summary.total')} stats={total} role={role} lang={lang} />

        <div className="card">
          <div className="summary-row">
            <span className="summary-label">{t(lang, 'summary.shareText')}</span>
          </div>
          <textarea value={shareText} readOnly />
          <button type="button" className="btn block" onClick={handleCopy}>
            {t(lang, 'summary.copy')}
          </button>
          <button type="button" className="btn secondary block" onClick={handleShare}>
            {t(lang, 'summary.share')}
          </button>
        </div>

        <div className="card">
          <button
            type="button"
            className="btn block"
            onClick={() =>
              downloadFile(
                `ottelu-${match.id}.json`,
                JSON.stringify(match, null, 2),
                'application/json',
              )
            }
          >
            {t(lang, 'summary.downloadJson')}
          </button>
          <button
            type="button"
            className="btn secondary block"
            onClick={() =>
              downloadFile(`ottelu-${match.id}.csv`, buildMatchCsv(match), 'text/csv')
            }
          >
            {t(lang, 'summary.downloadCsv')}
          </button>
        </div>
      </div>
    </>
  )
}

const SummaryBlock = ({
  label,
  stats,
  role,
  lang,
}: {
  label: string
  stats: HalfStats
  role: StatRole
  lang: Lang
}) => {
  const ownPct = pct(stats.passing.ownHalf.completed, stats.passing.ownHalf.attempts)
  const oppPct = pct(stats.passing.oppHalf.completed, stats.passing.oppHalf.attempts)
  const attackTotal = stats.attackThird.pass + stats.attackThird.carry
  const boxTotal = stats.boxEntry.pass + stats.boxEntry.carry
  const shotsUsTotal = stats.shots.us.on + stats.shots.us.off
  const shotsOppTotal = stats.shots.opp.on + stats.shots.opp.off

  return (
    <div className="card">
      <h2>{label}</h2>
      <div className="summary-grid">
        {role === 'passing' && (
          <>
            <div className="summary-row">
              <span className="summary-label">{t(lang, 'share.passingOwn')}</span>
              <strong>
                {stats.passing.ownHalf.completed}/{stats.passing.ownHalf.attempts} ({ownPct}%)
              </strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t(lang, 'share.passingOpp')}</span>
              <strong>
                {stats.passing.oppHalf.completed}/{stats.passing.oppHalf.attempts} ({oppPct}%)
              </strong>
            </div>
          </>
        )}
        {role === 'attackThird' && (
          <div className="summary-row">
            <span className="summary-label">{t(lang, 'share.attackThird')}</span>
            <strong>
              Syöttö {stats.attackThird.pass}, kuljetus {stats.attackThird.carry}, yht {attackTotal}
            </strong>
          </div>
        )}
        {role === 'boxEntry' && (
          <div className="summary-row">
            <span className="summary-label">{t(lang, 'share.boxEntry')}</span>
            <strong>
              Syöttö {stats.boxEntry.pass}, kuljetus {stats.boxEntry.carry}, yht {boxTotal}
            </strong>
          </div>
        )}
        {role === 'shots' && (
          <>
            <div className="summary-row">
              <span className="summary-label">{t(lang, 'share.shotsUs')}</span>
              <strong>
                Kohti {stats.shots.us.on}, ohi {stats.shots.us.off}, yht {shotsUsTotal}
              </strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t(lang, 'share.shotsOpp')}</span>
              <strong>
                Kohti {stats.shots.opp.on}, ohi {stats.shots.opp.off}, yht {shotsOppTotal}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
