import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Counter from './components/Counter'
import SectionCard from './components/SectionCard'
import { useStore } from './store'
import type { HalfKey, HalfStats, Match, MatchMeta } from './types'
import { buildMatchCsv, buildShareText, downloadFile, validateImportedMatches } from './utils/export'

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
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/new" element={<NewMatchScreen />} />
        <Route path="/match/:id" element={<MatchScreen />} />
        <Route path="/summary/:id" element={<SummaryScreen />} />
      </Routes>
      {toast && <div className="toast">{toast.message}</div>}
    </div>
  )
}

const HomeScreen = () => {
  const { state, deleteMatch } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const matches = useMemo(
    () =>
      [...state.matches].sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
      ),
    [state.matches],
  )

  const handleDelete = (match: Match) => {
    const ok = globalThis.confirm(
      `Poistetaanko ottelu ${match.meta.homeTeam} – ${match.meta.awayTeam}?`,
    )
    if (ok) {
      deleteMatch(match.id)
    }
  }

  return (
    <>
      <header className="topbar">
        <h1>Otteluseuranta</h1>
        <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}>
          ⚙️
        </button>
      </header>
      <div className="container">
        <Link className="btn block" to="/new">
          Uusi ottelu
        </Link>
        <div className="match-list">
          {matches.length === 0 ? (
            <div className="card">
              <div className="helper">Ei tallennettuja otteluita vielä.</div>
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
                <div className="match-meta">Päivitetty: {formatDate(match.updatedAt)}</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link className="btn secondary" to={`/match/${match.id}`}>
                    Avaa
                  </Link>
                  <Link className="btn ghost" to={`/summary/${match.id}`}>
                    Yhteenveto
                  </Link>
                  <button type="button" className="btn danger" onClick={() => handleDelete(match)}>
                    Poista
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

const SettingsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { state, importMatches, showToast } = useStore()
  const [isImporting, setIsImporting] = useState(false)

  if (!open) return null

  const handleExportAll = () => {
    const payload = JSON.stringify(state.matches, null, 2)
    downloadFile('ottelut.json', payload, 'application/json')
    showToast('Kaikki ottelut ladattu', 'success')
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const matches = validateImportedMatches(parsed)
      if (!matches) {
        showToast('Virheellinen JSON-tiedosto')
        return
      }
      const replace = globalThis.confirm('Korvataanko kaikki nykyiset ottelut?')
      importMatches(matches, replace ? 'replace' : 'merge')
      showToast('Tuonti valmis', 'success')
      onClose()
    } catch {
      showToast('Tuonti epäonnistui')
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
        <h2>Export / Import</h2>
        <button type="button" className="btn block" onClick={handleExportAll}>
          Vie kaikki ottelut JSON
        </button>
        <label className="btn secondary block" style={{ cursor: 'pointer' }}>
          <span>Tuo JSON</span>
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
          Sulje
        </button>
      </div>
    </dialog>
  )
}

const NewMatchScreen = () => {
  const { createMatch, showToast } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState<MatchMeta>({
    dateTime: '',
    location: '',
    homeTeam: '',
    awayTeam: '',
    notes: '',
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
    showToast('Ottelu luotu', 'success')
    navigate(`/match/${id}`)
  }

  return (
    <>
      <header className="topbar">
        <h1>Uusi ottelu</h1>
        <Link className="btn ghost" to="/">
          Sulje
        </Link>
      </header>
      <form className="container" onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-grid">
            <label>
              <span>Päivä ja aika</span>
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={(event) => updateField('dateTime', event.target.value)}
              />
            </label>
            <label>
              <span>Paikka</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Kenttä"
                required
              />
            </label>
            <label>
              <span>Kotijoukkue</span>
              <input
                type="text"
                value={form.homeTeam}
                onChange={(event) => updateField('homeTeam', event.target.value)}
                placeholder="Kotijoukkue"
                required
              />
            </label>
            <label>
              <span>Vierasjoukkue</span>
              <input
                type="text"
                value={form.awayTeam}
                onChange={(event) => updateField('awayTeam', event.target.value)}
                placeholder="Vierasjoukkue"
                required
              />
            </label>
            <label>
              <span>Lisämuistiinpano</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Lisätiedot"
              />
            </label>
          </div>
        </div>
        <button type="submit" className="btn block">
          Luo ottelu
        </button>
      </form>
    </>
  )
}

const MatchScreen = () => {
  const { id } = useParams()
  const { state, updateCounter, resetSection } = useStore()
  const [half, setHalf] = useState<HalfKey>('first')
  const match = state.matches.find((item) => item.id === id)

  if (!match) {
    return (
      <div className="container">
        <div className="card">Ottelua ei löytynyt.</div>
        <Link className="btn" to="/">
          Takaisin
        </Link>
      </div>
    )
  }

  const stats = match.stats[half]
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
            1PA
          </button>
          <button
            type="button"
            className={half === 'second' ? 'active' : ''}
            onClick={() => setHalf('second')}
          >
            2PA
          </button>
        </div>
      </header>
      <div className="container">
        <SectionCard title="Syöttöpeli" onReset={() => resetSection(match.id, half, 'passing')}>
          <div className="subsection">
            <h3>Oma puolisko</h3>
            <Counter
              label="Yritykset"
              value={stats.passing.ownHalf.attempts}
              onIncrement={() => updateCounter(match.id, half, 'passing.ownHalf.attempts', 1)}
              onDecrement={() => updateCounter(match.id, half, 'passing.ownHalf.attempts', -1)}
            />
            <Counter
              label="Onnistuneet"
              value={stats.passing.ownHalf.completed}
              onIncrement={() => updateCounter(match.id, half, 'passing.ownHalf.completed', 1)}
              onDecrement={() => updateCounter(match.id, half, 'passing.ownHalf.completed', -1)}
            />
          </div>
          <div className="subsection">
            <h3>Vastustajan puolisko</h3>
            <Counter
              label="Yritykset"
              value={stats.passing.oppHalf.attempts}
              onIncrement={() => updateCounter(match.id, half, 'passing.oppHalf.attempts', 1)}
              onDecrement={() => updateCounter(match.id, half, 'passing.oppHalf.attempts', -1)}
            />
            <Counter
              label="Onnistuneet"
              value={stats.passing.oppHalf.completed}
              onIncrement={() => updateCounter(match.id, half, 'passing.oppHalf.completed', 1)}
              onDecrement={() => updateCounter(match.id, half, 'passing.oppHalf.completed', -1)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Hyökkäyskolmannekselle pääsy"
          onReset={() => resetSection(match.id, half, 'attackThird')}
        >
          <Counter
            label="Syöttämällä"
            value={stats.attackThird.pass}
            onIncrement={() => updateCounter(match.id, half, 'attackThird.pass', 1)}
            onDecrement={() => updateCounter(match.id, half, 'attackThird.pass', -1)}
          />
          <Counter
            label="Kuljettamalla"
            value={stats.attackThird.carry}
            onIncrement={() => updateCounter(match.id, half, 'attackThird.carry', 1)}
            onDecrement={() => updateCounter(match.id, half, 'attackThird.carry', -1)}
          />
        </SectionCard>

        <SectionCard title="Boxiin pääsy" onReset={() => resetSection(match.id, half, 'boxEntry')}>
          <Counter
            label="Syöttämällä"
            value={stats.boxEntry.pass}
            onIncrement={() => updateCounter(match.id, half, 'boxEntry.pass', 1)}
            onDecrement={() => updateCounter(match.id, half, 'boxEntry.pass', -1)}
          />
          <Counter
            label="Kuljettamalla"
            value={stats.boxEntry.carry}
            onIncrement={() => updateCounter(match.id, half, 'boxEntry.carry', 1)}
            onDecrement={() => updateCounter(match.id, half, 'boxEntry.carry', -1)}
          />
        </SectionCard>

        <SectionCard title="Laukaukset" onReset={() => resetSection(match.id, half, 'shots')}>
          <div className="subsection">
            <h3>Me</h3>
            <Counter
              label="Kohti"
              value={stats.shots.us.on}
              onIncrement={() => updateCounter(match.id, half, 'shots.us.on', 1)}
              onDecrement={() => updateCounter(match.id, half, 'shots.us.on', -1)}
            />
            <Counter
              label="Ohi"
              value={stats.shots.us.off}
              onIncrement={() => updateCounter(match.id, half, 'shots.us.off', 1)}
              onDecrement={() => updateCounter(match.id, half, 'shots.us.off', -1)}
            />
          </div>
          <div className="subsection">
            <h3>Vastustaja</h3>
            <Counter
              label="Kohti"
              value={stats.shots.opp.on}
              onIncrement={() => updateCounter(match.id, half, 'shots.opp.on', 1)}
              onDecrement={() => updateCounter(match.id, half, 'shots.opp.on', -1)}
            />
            <Counter
              label="Ohi"
              value={stats.shots.opp.off}
              onIncrement={() => updateCounter(match.id, half, 'shots.opp.off', 1)}
              onDecrement={() => updateCounter(match.id, half, 'shots.opp.off', -1)}
            />
          </div>
        </SectionCard>

        <div className="card">
          <div className="summary-grid">
            <div className="summary-row">
              <span className="summary-label">Syöttö% (oma / vast)</span>
              <strong>
                {ownPct}% / {oppPct}%
              </strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Hyökkäyskolmannes yhteensä</span>
              <strong>{attackTotal}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Boxiin yhteensä</span>
              <strong>{boxTotal}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Laukaukset yhteensä (me / vast)</span>
              <strong>
                {shotsUsTotal} / {shotsOppTotal}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link className="btn secondary" to="/">
            Takaisin listaan
          </Link>
          <Link className="btn" to={`/summary/${match.id}`}>
            Yhteenveto & jako
          </Link>
        </div>
      </div>
    </>
  )
}

const SummaryScreen = () => {
  const { id } = useParams()
  const { state, showToast } = useStore()
  const match = state.matches.find((item) => item.id === id)

  if (!match) {
    return (
      <div className="container">
        <div className="card">Ottelua ei löytynyt.</div>
        <Link className="btn" to="/">
          Takaisin
        </Link>
      </div>
    )
  }

  const total = sumHalfStats(match.stats.first, match.stats.second)
  const shareText = buildShareText(match)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      showToast('Kopioitu leikepöydälle', 'success')
    } catch {
      showToast('Kopiointi epäonnistui')
    }
  }

  const handleShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ text: shareText })
        showToast('Jaettu', 'success')
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
        <h1>Yhteenveto</h1>
        <Link className="btn ghost" to={`/match/${match.id}`}>
          Takaisin
        </Link>
      </header>
      <div className="container">
        <SummaryBlock label="1. puoliaika" stats={match.stats.first} />
        <SummaryBlock label="2. puoliaika" stats={match.stats.second} />
        <SummaryBlock label="Yhteensä" stats={total} />

        <div className="card">
          <div className="summary-row">
            <span className="summary-label">Jaa tekstinä</span>
          </div>
          <textarea value={shareText} readOnly />
          <button type="button" className="btn block" onClick={handleCopy}>
            Kopioi leikepöydälle
          </button>
          <button type="button" className="btn secondary block" onClick={handleShare}>
            Jaa…
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
            Lataa JSON
          </button>
          <button
            type="button"
            className="btn secondary block"
            onClick={() =>
              downloadFile(`ottelu-${match.id}.csv`, buildMatchCsv(match), 'text/csv')
            }
          >
            Lataa CSV
          </button>
        </div>
      </div>
    </>
  )
}

const SummaryBlock = ({ label, stats }: { label: string; stats: HalfStats }) => {
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
        <div className="summary-row">
          <span className="summary-label">Syöttöpeli oma</span>
          <strong>
            {stats.passing.ownHalf.completed}/{stats.passing.ownHalf.attempts} ({ownPct}%)
          </strong>
        </div>
        <div className="summary-row">
          <span className="summary-label">Syöttöpeli vast</span>
          <strong>
            {stats.passing.oppHalf.completed}/{stats.passing.oppHalf.attempts} ({oppPct}%)
          </strong>
        </div>
        <div className="summary-row">
          <span className="summary-label">Hyökkäyskolmannes</span>
          <strong>
            Syöttö {stats.attackThird.pass}, kuljetus {stats.attackThird.carry}, yht {attackTotal}
          </strong>
        </div>
        <div className="summary-row">
          <span className="summary-label">Boxiin</span>
          <strong>
            Syöttö {stats.boxEntry.pass}, kuljetus {stats.boxEntry.carry}, yht {boxTotal}
          </strong>
        </div>
        <div className="summary-row">
          <span className="summary-label">Laukaukset me</span>
          <strong>
            Kohti {stats.shots.us.on}, ohi {stats.shots.us.off}, yht {shotsUsTotal}
          </strong>
        </div>
        <div className="summary-row">
          <span className="summary-label">Laukaukset vast</span>
          <strong>
            Kohti {stats.shots.opp.on}, ohi {stats.shots.opp.off}, yht {shotsOppTotal}
          </strong>
        </div>
      </div>
    </div>
  )
}

export default App
