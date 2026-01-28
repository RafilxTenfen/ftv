import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  TIMES_FIXOS,
  DIREITOS,
  ESQUERDOS,
  shuffle,
  gerarPartidas,
  calcularHorario
} from './utils'

const MAX_HISTORICO = 5
const STORAGE_KEY = 'ftv-jogadores'

function carregarJogadores() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  if (salvo) {
    try {
      return JSON.parse(salvo)
    } catch {
      return null
    }
  }
  return null
}

function salvarJogadores(jogadores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jogadores))
}

function criarTimesDeJogadores(jogadores) {
  return {
    1: [jogadores.direitos[0], jogadores.esquerdos[0]],
    2: [jogadores.direitos[1], jogadores.esquerdos[1]],
    3: [jogadores.direitos[2], jogadores.esquerdos[2]],
    4: [jogadores.direitos[3], jogadores.esquerdos[3]]
  }
}

function codificarParaURL(dados) {
  const json = JSON.stringify(dados)
  return btoa(encodeURIComponent(json))
}

function decodificarDaURL(codigo) {
  try {
    const json = decodeURIComponent(atob(codigo))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function carregarDaURL() {
  const params = new URLSearchParams(window.location.search)
  const dados = params.get('d')
  if (dados) {
    return decodificarDaURL(dados)
  }
  return null
}

function App() {
  const dadosURL = carregarDaURL()
  const jogadoresIniciais = dadosURL?.j || carregarJogadores() || {
    direitos: [...DIREITOS],
    esquerdos: [...ESQUERDOS]
  }
  const historicoInicial = dadosURL?.h || []
  const indiceInicial = dadosURL?.i ?? 0
  const resultadoInicial = historicoInicial[indiceInicial]
  const [jogadores, setJogadores] = useState(jogadoresIniciais)
  const [times, setTimes] = useState(resultadoInicial?.times || criarTimesDeJogadores(jogadoresIniciais))
  const [misturado, setMisturado] = useState(resultadoInicial?.misturado ?? false)
  const [historico, setHistorico] = useState(historicoInicial)
  const [indiceAtual, setIndiceAtual] = useState(indiceInicial)
  const [contador, setContador] = useState(dadosURL?.c ?? 0)
  const [timesSelecionados, setTimesSelecionados] = useState(resultadoInicial?.timesAtivos || [1, 2, 3, 4])
  const [editando, setEditando] = useState(null)
  const [editTemp, setEditTemp] = useState({ direito: '', esquerdo: '' })
  const [preparandoNovo, setPreparandoNovo] = useState(false)
  const [animando, setAnimando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const inicializado = useRef(false)

  const resultadoAtual = historico[indiceAtual] || null

  const toggleTime = (num) => {
    setTimesSelecionados(prev => {
      if (prev.includes(num)) {
        if (prev.length <= 2) return prev
        return prev.filter(t => t !== num)
      } else {
        return [...prev, num].sort()
      }
    })
  }

  const gerarComTimes = (timesParaUsar, isMisturado) => {
    if (timesSelecionados.length < 2) return

    const novoNumero = contador + 1
    const resultado = gerarPartidas(timesSelecionados, 10)
    if (!resultado) return

    const novoResultado = {
      numero: novoNumero,
      times: { ...timesParaUsar },
      misturado: isMisturado,
      ...resultado
    }
    setHistorico(prev => {
      const novo = [novoResultado, ...prev].slice(0, MAX_HISTORICO)
      return novo
    })
    setIndiceAtual(0)
    setContador(novoNumero)
    setPreparandoNovo(false)
  }

  const handleGerar = () => {
    const timesParaGerar = preparandoNovo ? times : timesDoResultado
    const misturadoParaGerar = preparandoNovo ? misturado : (resultadoAtual?.misturado ?? misturado)
    gerarComTimes(timesParaGerar, misturadoParaGerar)
  }

  const triggerFade = () => {
    setAnimando(true)
    setTimeout(() => setAnimando(false), 300)
  }

  const handleMisturar = () => {
    const direitosShuffled = shuffle(jogadores.direitos)
    const esquerdosShuffled = shuffle(jogadores.esquerdos)
    const novosTimes = {
      1: [direitosShuffled[0], esquerdosShuffled[0]],
      2: [direitosShuffled[1], esquerdosShuffled[1]],
      3: [direitosShuffled[2], esquerdosShuffled[2]],
      4: [direitosShuffled[3], esquerdosShuffled[3]]
    }
    setTimes(novosTimes)
    setMisturado(true)
    setPreparandoNovo(true)
    triggerFade()
  }

  const handleTimesFixos = () => {
    const timesFixosAtuais = criarTimesDeJogadores(jogadores)
    setTimes(timesFixosAtuais)
    setMisturado(false)
    setPreparandoNovo(true)
    triggerFade()
  }

  const handleReset = () => {
    const jogadoresOriginais = {
      direitos: [...DIREITOS],
      esquerdos: [...ESQUERDOS]
    }
    setJogadores(jogadoresOriginais)
    salvarJogadores(jogadoresOriginais)
    setTimes(TIMES_FIXOS)
    setMisturado(false)
    setPreparandoNovo(true)
    setHistorico(prev => prev.length > 0 ? [prev[0]] : [])
    setIndiceAtual(0)
    triggerFade()
  }

  const compartilhar = async () => {
    const dados = {
      j: jogadores,
      h: historico,
      i: indiceAtual,
      c: contador
    }
    const codigo = codificarParaURL(dados)
    const url = `${window.location.origin}${window.location.pathname}?d=${codigo}`

    try {
      await navigator.clipboard.writeText(url)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch {
      prompt('Copie o link:', url)
    }
  }

  const iniciarEdicao = (num) => {
    setEditando(num)
    setEditTemp({
      direito: times[num][0],
      esquerdo: times[num][1]
    })
  }

  const cancelarEdicao = () => {
    setEditando(null)
    setEditTemp({ direito: '', esquerdo: '' })
  }

  const salvarEdicao = () => {
    if (!editando) return
    const indice = editando - 1
    const novosJogadores = {
      direitos: [...jogadores.direitos],
      esquerdos: [...jogadores.esquerdos]
    }
    novosJogadores.direitos[indice] = editTemp.direito.trim() || jogadores.direitos[indice]
    novosJogadores.esquerdos[indice] = editTemp.esquerdo.trim() || jogadores.esquerdos[indice]

    setJogadores(novosJogadores)
    salvarJogadores(novosJogadores)

    const novosTimes = { ...times }
    novosTimes[editando] = [novosJogadores.direitos[indice], novosJogadores.esquerdos[indice]]
    setTimes(novosTimes)

    setEditando(null)
    setEditTemp({ direito: '', esquerdo: '' })
  }

  useEffect(() => {
    if (!inicializado.current) {
      inicializado.current = true
      if (historico.length === 0) {
        handleGerar()
      }
    }
  }, [])

  const timesDoResultado = resultadoAtual?.times || times
  const timesAtivosDoResultado = resultadoAtual?.timesAtivos || timesSelecionados

  const timesExibidos = preparandoNovo ? times : timesDoResultado
  const misturadoExibido = preparandoNovo ? misturado : (resultadoAtual?.misturado ?? misturado)

  const nomeTimeResultado = (num) => {
    return `${timesDoResultado[num][0]}/${timesDoResultado[num][1]}`
  }

  return (
    <div className="container">
      <h1>Futevôlei Cidade Alta</h1>
      <p className="subtitle">Quarta-feira - 19h às 21h</p>

      <div className="section">
        <div className="section-header">
          <h2>Times {misturadoExibido && <span className="badge-misturado">Misturados</span>}</h2>
          <button className="btn-compartilhar" onClick={compartilhar}>
            {linkCopiado ? '✓ Copiado!' : 'Compartilhar'}
          </button>
        </div>
        <div className={`times-grid ${animando ? 'fade-flash' : ''}`}>
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className={`time-item ${timesSelecionados.includes(num) ? 'selected' : 'disabled'} ${editando === num ? 'editing' : ''}`}
            >
              <span
                className={`time-checkbox ${timesSelecionados.includes(num) ? 'checked' : ''}`}
                onClick={() => editando !== num && toggleTime(num)}
              >
                {timesSelecionados.includes(num) ? '✓' : ''}
              </span>
              <span className="time-number" onClick={() => editando !== num && toggleTime(num)}>{num}</span>
              {editando === num ? (
                <div className="time-edit-form">
                  <div className="edit-field">
                    <input
                      type="text"
                      value={editTemp.direito}
                      onChange={(e) => setEditTemp(prev => ({ ...prev, direito: e.target.value }))}
                      placeholder="Jogador (D)"
                    />
                    <span className="pos">(D)</span>
                  </div>
                  <div className="edit-field">
                    <input
                      type="text"
                      value={editTemp.esquerdo}
                      onChange={(e) => setEditTemp(prev => ({ ...prev, esquerdo: e.target.value }))}
                      placeholder="Jogador (E)"
                    />
                    <span className="pos">(E)</span>
                  </div>
                  <div className="edit-actions">
                    <button className="btn-edit-action btn-save" onClick={salvarEdicao} title="Salvar">
                      ✓
                    </button>
                    <button className="btn-edit-action btn-cancel" onClick={cancelarEdicao} title="Cancelar">
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="time-players" onClick={() => toggleTime(num)}>
                    <strong>{timesExibidos[num][0]}</strong> <span className="pos">(D)</span> /{' '}
                    <strong>{timesExibidos[num][1]}</strong> <span className="pos">(E)</span>
                  </span>
                  <button
                    className="btn-edit"
                    onClick={(e) => { e.stopPropagation(); iniciarEdicao(num); }}
                    title="Editar jogadores"
                  >
                    🖉
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="btn-group">
          <button
            className={`btn-secondary ${!misturadoExibido ? 'btn-active' : 'btn-outline'}`}
            onClick={handleTimesFixos}
          >
            Times Fixos
          </button>
          <button
            className={`btn-secondary ${misturadoExibido ? 'btn-active' : 'btn-outline'}`}
            onClick={handleMisturar}
          >
            Times Misturados
          </button>
          <button
            className="btn-secondary btn-reset"
            onClick={handleReset}
            title="Resetar para times originais"
          >
            Reset
          </button>
        </div>
      </div>

      <button
        className="btn-gerar"
        onClick={handleGerar}
        disabled={timesSelecionados.length < 2}
      >
        Gerar Partidas {timesSelecionados.length < 2 && '(mín. 2 times)'}
      </button>

      {historico.length > 0 && (
        <div className="historico-nav">
          <span className="historico-label">Geração:</span>
          {[...historico].reverse().map((item, i) => (
            <button
              key={item.numero}
              className={`btn-historico ${indiceAtual === historico.length - 1 - i ? 'active' : ''}`}
              onClick={() => { setIndiceAtual(historico.length - 1 - i); setPreparandoNovo(false); }}
            >
              {item.numero}
            </button>
          ))}
        </div>
      )}

      {resultadoAtual && (
        <>
          <div className="section">
            <h2>Cronograma</h2>
            {resultadoAtual.partidas.map((partida, i) => {
              const [t1, t2] = partida
              const descansando = timesAtivosDoResultado.filter(t => !partida.includes(t))
              const horario = calcularHorario(i)
              return (
                <div key={i} className="partida">
                  <span className="partida-numero">{i + 1}</span>
                  <span className="partida-horario">{horario}</span>
                  <div className="partida-info">
                    <div className="partida-times">
                      {nomeTimeResultado(t1)} <span className="vs">vs</span> {nomeTimeResultado(t2)}
                    </div>
                    {descansando.length > 0 && (
                      <div className="partida-descansam">
                        Descansam: {descansando.map(t => nomeTimeResultado(t)).join(' e ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="section">
            <h2>Estatísticas</h2>

            <h3>Jogos por Time</h3>
            <div className="stats-grid">
              {timesAtivosDoResultado.map(t => (
                <div key={t} className="stat-card">
                  <div className="stat-value">{resultadoAtual.jogosPorTime[t]}</div>
                  <div className="stat-label">{nomeTimeResultado(t)}</div>
                </div>
              ))}
            </div>

            <h3>Confrontos</h3>
            <div className="confrontos-grid">
              {Object.entries(resultadoAtual.confrontosRealizados).map(([key, count]) => {
                const [t1, t2] = key.split(',').map(Number)
                return (
                  <div key={key} className="confronto-item">
                    <span>{nomeTimeResultado(t1)} vs {nomeTimeResultado(t2)}</span>
                    <span className="confronto-count">{count}x</span>
                  </div>
                )
              })}
            </div>

            {timesAtivosDoResultado.length > 2 && (
              <>
                <h3>Espera Máxima</h3>
                <div className="confrontos-grid">
                  {timesAtivosDoResultado.map(t => (
                    <div key={t} className="confronto-item">
                      <span>{nomeTimeResultado(t)}</span>
                      <span className="check-ok">
                        {resultadoAtual.maxEspera[t]} partidas {resultadoAtual.maxEspera[t] <= 2 ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App
