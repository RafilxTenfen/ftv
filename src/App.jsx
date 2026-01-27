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

function gerarPartidas(numPartidas = 10) {
  const todosConfrontos = getCombinations([1, 2, 3, 4], 2)
  const partidas = []
  const jogosPorTime = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const ultimaPartida = { 1: -3, 2: -3, 3: -3, 4: -3 }
  const confrontosRealizados = {}
  todosConfrontos.forEach(c => confrontosRealizados[c.join(',')] = 0)

  for (let i = 0; i < numPartidas; i++) {
    let confrontosValidos = []

    for (const confronto of todosConfrontos) {
      const outros = [1, 2, 3, 4].filter(t => !confronto.includes(t))
      const esperaOutros = outros.map(t => i - ultimaPartida[t])
      if (esperaOutros.some(e => e >= 3)) continue
      confrontosValidos.push(confronto)
    }

    if (confrontosValidos.length === 0) {
      const timesEsperando = [1, 2, 3, 4].filter(t => i - ultimaPartida[t] >= 3)
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

  const maxEspera = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const ultima = { 1: -1, 2: -1, 3: -1, 4: -1 }

  partidas.forEach((partida, i) => {
    const [t1, t2] = partida
    ;[1, 2, 3, 4].forEach(t => {
      if (t === t1 || t === t2) {
        if (ultima[t] >= 0) {
          const espera = i - ultima[t] - 1
          maxEspera[t] = Math.max(maxEspera[t], espera)
        }
        ultima[t] = i
      }
    })
  })

  return { partidas, jogosPorTime, confrontosRealizados, maxEspera }
}

const MAX_HISTORICO = 3

function App() {
  const [times, setTimes] = useState(TIMES_FIXOS)
  const [misturado, setMisturado] = useState(false)
  const [historico, setHistorico] = useState([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [contador, setContador] = useState(0)

  const resultadoAtual = historico[indiceAtual] || null

  const nomeTime = (num) => {
    const t = resultadoAtual?.times || times
    return `${t[num][0]}/${t[num][1]}`
  }

  const handleGerar = () => {
    const novoNumero = contador + 1
    const novoResultado = {
      numero: novoNumero,
      times: { ...times },
      misturado,
      ...gerarPartidas(10)
    }
    setHistorico(prev => {
      const novo = [novoResultado, ...prev].slice(0, MAX_HISTORICO)
      return novo
    })
    setIndiceAtual(0)
    setContador(novoNumero)
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
  }

  const handleTimesFixos = () => {
    setTimes(TIMES_FIXOS)
    setMisturado(false)
  }

  useEffect(() => {
    handleGerar()
  }, [])

  const timesExibidos = resultadoAtual?.times || times
  const isMisturadoExibido = resultadoAtual?.misturado || false

  return (
    <div className="container">
      <h1>Futevôlei</h1>
      <p className="subtitle">Quarta-feira - 19h às 21h</p>

      <div className="section">
        <h2>Times {isMisturadoExibido && <span className="badge-misturado">Misturados</span>}</h2>
        <div className="times-grid">
          {[1, 2, 3, 4].map(num => (
            <div key={num} className="time-item">
              <span className="time-number">{num}</span>
              <span className="time-players">
                <strong>{timesExibidos[num][0]}</strong> <span className="pos">(D)</span> /{' '}
                <strong>{timesExibidos[num][1]}</strong> <span className="pos">(E)</span>
              </span>
            </div>
          ))}
        </div>
        <div className="btn-group">
          <button className="btn-secondary" onClick={handleMisturar}>
            Misturar Times
          </button>
          {misturado && (
            <button className="btn-secondary btn-outline" onClick={handleTimesFixos}>
              Times Fixos
            </button>
          )}
        </div>
      </div>

      <button className="btn-gerar" onClick={handleGerar}>
        Gerar Partidas
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
              const descansando = [1, 2, 3, 4].filter(t => !partida.includes(t))
              return (
                <div key={i} className="partida">
                  <span className="partida-numero">{i + 1}</span>
                  <div className="partida-info">
                    <div className="partida-times">
                      {nomeTime(t1)} <span className="vs">vs</span> {nomeTime(t2)}
                    </div>
                    <div className="partida-descansam">
                      Descansam: {nomeTime(descansando[0])} e {nomeTime(descansando[1])}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="section">
            <h2>Estatísticas</h2>

            <h3>Jogos por Time</h3>
            <div className="stats-grid">
              {[1, 2, 3, 4].map(t => (
                <div key={t} className="stat-card">
                  <div className="stat-value">{resultadoAtual.jogosPorTime[t]}</div>
                  <div className="stat-label">{nomeTime(t)}</div>
                </div>
              ))}
            </div>

            <h3>Confrontos</h3>
            <div className="confrontos-grid">
              {Object.entries(resultadoAtual.confrontosRealizados).map(([key, count]) => {
                const [t1, t2] = key.split(',').map(Number)
                return (
                  <div key={key} className="confronto-item">
                    <span>{nomeTime(t1)} vs {nomeTime(t2)}</span>
                    <span className="confronto-count">{count}x</span>
                  </div>
                )
              })}
            </div>

            <h3>Espera Máxima</h3>
            <div className="confrontos-grid">
              {[1, 2, 3, 4].map(t => (
                <div key={t} className="confronto-item">
                  <span>{nomeTime(t)}</span>
                  <span className="check-ok">
                    {resultadoAtual.maxEspera[t]} partidas {resultadoAtual.maxEspera[t] <= 2 ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
