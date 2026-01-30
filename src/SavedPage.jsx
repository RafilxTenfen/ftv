import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import './App.css'
import './SavedPage.css'
import { decodificarDaURL } from './App'
import { calcularHorario } from './utils'
import { useAuth } from './useAuth'
import { useAdmin } from './useAdmin'
import { useSaved } from './useSaved'

function SavedPage() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const { isAdmin } = useAdmin(user)
  const { savedList, loading: savedLoading, saveEntry } = useSaved()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const dadosParam = searchParams.get('d')
  const dados = dadosParam ? decodificarDaURL(dadosParam) : null
  const showSaveForm = isAdmin && dados

  const handleSave = async () => {
    if (!user || !dados || !selectedDate) return
    setSaving(true)
    try {
      await saveEntry(selectedDate, {
        jogadores: dados.j,
        resultado: dados.r
      }, user)
      setSaved(true)
      setSearchParams({})
    } catch (err) {
      console.error('Save error:', err)
    }
    setSaving(false)
  }

  const nomeTime = (times, num) => {
    return `${times[num][0]}/${times[num][1]}`
  }

  return (
    <div className="container">
      <h1>Jogos Salvos</h1>
      <p className="subtitle">Futevôlei Cidade Alta</p>

      <div className="auth-bar">
        {user ? (
          <>
            {user.photoURL && <img className="auth-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
            <span className="auth-name">{user.displayName}</span>
            <button className="btn-auth" onClick={logout}>Sair</button>
          </>
        ) : (
          !authLoading && <button className="btn-auth btn-login" onClick={login}>Entrar com Google</button>
        )}
      </div>

      <div className="nav-bar">
        <Link to="/" className="nav-link">Voltar ao Gerador</Link>
      </div>

      {showSaveForm && (
        <div className="section">
          <h2>Salvar Jogo</h2>
          {saved ? (
            <div className="save-success">Jogo salvo com sucesso!</div>
          ) : (
            <div className="save-form-content">
              <div className="save-date-input">
                <label>Data:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="save-preview">
                <h4>Times</h4>
                <div className="save-preview-times">
                  {dados.r.timesAtivos.map(num => (
                    <div key={num} className="save-preview-time">
                      Time {num}: <strong>{nomeTime(dados.r.times, num)}</strong>
                    </div>
                  ))}
                </div>
                <div className="save-preview-partidas">
                  {dados.r.partidas.length} partidas &middot;{' '}
                  {dados.r.misturado ? 'Misturados' : 'Times Fixos'}
                </div>
              </div>

              <button
                className="btn-confirmar-salvar"
                onClick={handleSave}
                disabled={saving || !selectedDate}
              >
                {saving ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="section">
        <h2>Historico</h2>
        {savedLoading ? (
          <div className="saved-empty">Carregando...</div>
        ) : savedList.length === 0 ? (
          <div className="saved-empty">Nenhum jogo salvo ainda.</div>
        ) : (
          <div className="saved-list">
            {savedList.map(entry => {
              const isExpanded = expandedId === entry.id
              const resultado = entry.resultado
              const times = resultado?.times
              const timesAtivos = resultado?.timesAtivos || []

              return (
                <div key={entry.id} className="saved-entry">
                  <div
                    className="saved-entry-header"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div>
                      <span className="saved-entry-date">{entry.date}</span>
                      <span className="saved-entry-meta">
                        {' '}&middot; {resultado?.partidas?.length || 0} partidas
                        {resultado?.misturado ? ' · Misturados' : ''}
                      </span>
                    </div>
                    <span className={`saved-entry-toggle ${isExpanded ? 'open' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {isExpanded && resultado && times && (
                    <div className="saved-entry-detail">
                      <h4>Times</h4>
                      <div className="saved-times-grid">
                        {timesAtivos.map(num => (
                          <div key={num} className="saved-time-item">
                            <span className="saved-time-number">{num}</span>
                            <span className="saved-time-players">
                              {nomeTime(times, num)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <h4>Cronograma</h4>
                      {resultado.partidas.map((partida, i) => {
                        const [t1, t2] = partida
                        const descansando = timesAtivos.filter(t => !partida.includes(t))
                        const horario = calcularHorario(i)
                        return (
                          <div key={i} className="partida">
                            <span className="partida-numero">{i + 1}</span>
                            <span className="partida-horario">{horario}</span>
                            <div className="partida-info">
                              <div className="partida-times">
                                {nomeTime(times, t1)} <span className="vs">vs</span> {nomeTime(times, t2)}
                              </div>
                              {descansando.length > 0 && (
                                <div className="partida-descansam">
                                  Descansam: {descansando.map(t => nomeTime(times, t)).join(' e ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      <h4>Jogos por Time</h4>
                      <div className="stats-grid">
                        {timesAtivos.map(t => (
                          <div key={t} className="stat-card">
                            <div className="stat-value">{resultado.jogosPorTime[t]}</div>
                            <div className="stat-label">{nomeTime(times, t)}</div>
                          </div>
                        ))}
                      </div>

                      <h4>Confrontos</h4>
                      <div className="confrontos-grid">
                        {Object.entries(resultado.confrontosRealizados).map(([key, count]) => {
                          const [t1, t2] = key.split(',').map(Number)
                          return (
                            <div key={key} className="confronto-item">
                              <span>{nomeTime(times, t1)} vs {nomeTime(times, t2)}</span>
                              <span className="confronto-count">{count}x</span>
                            </div>
                          )
                        })}
                      </div>

                      {timesAtivos.length > 2 && (
                        <>
                          <h4>Espera Maxima</h4>
                          <div className="confrontos-grid">
                            {timesAtivos.map(t => (
                              <div key={t} className="confronto-item">
                                <span>{nomeTime(times, t)}</span>
                                <span className="check-ok">
                                  {resultado.maxEspera[t]} partidas {resultado.maxEspera[t] <= 2 ? '✓' : '✗'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {entry.updatedBy && (
                        <div className="saved-entry-meta" style={{ marginTop: '15px' }}>
                          Salvo por {entry.updatedBy.displayName || entry.updatedBy.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedPage
