import { useState, useEffect } from 'react'
import './App.css'

const TIMES_FIXOS = {
  1: ["Gregory", "Fernando"],
  2: ["Rafa", "Carlinhos"],
  3: ["Tiago", "Lucas"],
  4: ["Dudu", "Cavalo"]
}

const DIREITOS = ["Gregory", "Rafa", "Tiago", "Dudu"]
const ESQUERDOS = ["Fernando", "Carlinhos", "Lucas", "Cavalo"]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getCombinations(arr, size) {
  const result = []
  function combine(start, combo) {
    if (combo.length === size) {
      result.push([...combo])
      return
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }
  combine(0, [])
  return result
}

function gerarPartidas(timesAtivos, numPartidas = 10) {
  if (timesAtivos.length < 2) return null

  const todosConfrontos = getCombinations(timesAtivos, 2)
  const partidas = []
  const jogosPorTime = {}
  const ultimaPartida = {}
  timesAtivos.forEach(t => {
    jogosPorTime[t] = 0
    ultimaPartida[t] = -3
  })
  const confrontosRealizados = {}
  todosConfrontos.forEach(c => confrontosRealizados[c.join(',')] = 0)

  for (let i = 0; i < numPartidas; i++) {
    let confrontosValidos = []

    for (const confronto of todosConfrontos) {
      const outros = timesAtivos.filter(t => !confronto.includes(t))
      const esperaOutros = outros.map(t => i - ultimaPartida[t])
      if (esperaOutros.some(e => e >= 3)) continue
      confrontosValidos.push(confronto)
    }

    if (confrontosValidos.length === 0) {
      const timesEsperando = timesAtivos.filter(t => i - ultimaPartida[t] >= 3)
      if (timesEsperando.length > 0) {
        confrontosValidos = todosConfrontos.filter(c =>
          timesEsperando.some(t => c.includes(t))
        )
      } else {
        confrontosValidos = [...todosConfrontos]
      }
    }

    confrontosValidos.sort((a, b) => {
      const scoreA = confrontosRealizados[a.join(',')] * 10 +
        jogosPorTime[a[0]] + jogosPorTime[a[1]] +
        Math.random() * 2
      const scoreB = confrontosRealizados[b.join(',')] * 10 +
        jogosPorTime[b[0]] + jogosPorTime[b[1]] +
        Math.random() * 2
      return scoreA - scoreB
    })

    const confrontoEscolhido = confrontosValidos[0]
    partidas.push(confrontoEscolhido)

    const [t1, t2] = confrontoEscolhido
    jogosPorTime[t1]++
    jogosPorTime[t2]++
    ultimaPartida[t1] = i
    ultimaPartida[t2] = i
    confrontosRealizados[confrontoEscolhido.join(',')]++
  }

  const maxEspera = {}
  const ultima = {}
  timesAtivos.forEach(t => {
    maxEspera[t] = 0
    ultima[t] = -1
  })

  partidas.forEach((partida, i) => {
    const [t1, t2] = partida
    timesAtivos.forEach(t => {
      if (t === t1 || t === t2) {
        if (ultima[t] >= 0) {
          const espera = i - ultima[t] - 1
          maxEspera[t] = Math.max(maxEspera[t], espera)
        }
        ultima[t] = i
      }
    })
  })

  return { partidas, jogosPorTime, confrontosRealizados, maxEspera, timesAtivos }
}

const MAX_HISTORICO = 3

function App() {
  const [times, setTimes] = useState(TIMES_FIXOS)
  const [misturado, setMisturado] = useState(false)
  const [historico, setHistorico] = useState([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [contador, setContador] = useState(0)
  const [timesSelecionados, setTimesSelecionados] = useState([1, 2, 3, 4])

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
  }

  const handleGerar = () => {
    gerarComTimes(times, misturado)
  }

  const handleMisturar = () => {
    const direitosShuffled = shuffle(DIREITOS)
    const esquerdosShuffled = shuffle(ESQUERDOS)
    const novosTimes = {
      1: [direitosShuffled[0], esquerdosShuffled[0]],
      2: [direitosShuffled[1], esquerdosShuffled[1]],
      3: [direitosShuffled[2], esquerdosShuffled[2]],
      4: [direitosShuffled[3], esquerdosShuffled[3]]
    }
    setTimes(novosTimes)
    setMisturado(true)
    gerarComTimes(novosTimes, true)
  }

  const handleTimesFixos = () => {
    setTimes(TIMES_FIXOS)
    setMisturado(false)
    gerarComTimes(TIMES_FIXOS, false)
  }

  useEffect(() => {
    handleGerar()
  }, [])

  useEffect(() => {
    if (resultadoAtual) {
      setTimesSelecionados(resultadoAtual.timesAtivos)
      setTimes(resultadoAtual.times)
      setMisturado(resultadoAtual.misturado)
    }
  }, [indiceAtual])

  const timesDoResultado = resultadoAtual?.times || times
  const timesAtivosExibidos = resultadoAtual?.timesAtivos || timesSelecionados

  const nomeTimeResultado = (num) => {
    return `${timesDoResultado[num][0]}/${timesDoResultado[num][1]}`
  }

  return (
    <div className="container">
      <h1>Futevôlei Cidade Alta</h1>
      <p className="subtitle">Quarta-feira - 19h às 21h</p>

      <div className="section">
        <h2>Times {resultadoAtual?.misturado && <span className="badge-misturado">Misturados</span>}</h2>
        <div className="times-grid">
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className={`time-item ${timesAtivosExibidos.includes(num) ? 'selected' : 'disabled'}`}
              onClick={() => toggleTime(num)}
            >
              <span className={`time-checkbox ${timesAtivosExibidos.includes(num) ? 'checked' : ''}`}>
                {timesAtivosExibidos.includes(num) ? '✓' : ''}
              </span>
              <span className="time-number">{num}</span>
              <span className="time-players">
                <strong>{timesDoResultado[num][0]}</strong> <span className="pos">(D)</span> /{' '}
                <strong>{timesDoResultado[num][1]}</strong> <span className="pos">(E)</span>
              </span>
            </div>
          ))}
        </div>
        <div className="btn-group">
          <button
            className={`btn-secondary ${!resultadoAtual?.misturado ? 'btn-active' : 'btn-outline'}`}
            onClick={handleTimesFixos}
          >
            Times Fixos
          </button>
          <button
            className={`btn-secondary ${resultadoAtual?.misturado ? 'btn-active' : 'btn-outline'}`}
            onClick={handleMisturar}
          >
            Times Misturados
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
              onClick={() => setIndiceAtual(historico.length - 1 - i)}
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
              const descansando = timesAtivosExibidos.filter(t => !partida.includes(t))
              const horaInicio = 19
              const minutoInicio = i * 15
              const hora = horaInicio + Math.floor(minutoInicio / 60)
              const minuto = minutoInicio % 60
              const horario = `${hora}:${minuto.toString().padStart(2, '0')}`
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
              {timesAtivosExibidos.map(t => (
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

            {timesAtivosExibidos.length > 2 && (
              <>
                <h3>Espera Máxima</h3>
                <div className="confrontos-grid">
                  {timesAtivosExibidos.map(t => (
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
