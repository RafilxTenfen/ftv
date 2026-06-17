export const TIMES_FIXOS = {
  1: ["Gregory", "Fernando"],
  2: ["Rafa", "Carlinhos"],
  3: ["Tiago", "Lucas"],
  4: ["Dudu", "Cavalo"]
}

export const DIREITOS = ["Gregory", "Rafa", "Tiago", "Dudu"]
export const ESQUERDOS = ["Fernando", "Carlinhos", "Lucas", "Cavalo"]

export function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getCombinations(arr, size) {
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

export function gerarPartidas(timesAtivos, numPartidas = 10) {
  if (timesAtivos.length < 2) return null

  const todosConfrontos = getCombinations(timesAtivos, 2)
  const partidas = []
  const jogosPorTime = {}
  const ultimaPartida = {}
  const jogosSeguidos = {}
  timesAtivos.forEach(t => {
    jogosPorTime[t] = 0
    ultimaPartida[t] = -3
    jogosSeguidos[t] = 0
  })
  const confrontosRealizados = {}
  todosConfrontos.forEach(c => confrontosRealizados[c.join(',')] = 0)

  for (let i = 0; i < numPartidas; i++) {
    // Times que ja jogaram as 2 ultimas partidas nao podem jogar de novo (evita 3 seguidas)
    const semTresSeguidas = todosConfrontos.filter(c =>
      c.every(t => jogosSeguidos[t] < 2)
    )

    let confrontosValidos = []
    for (const confronto of semTresSeguidas) {
      const outros = timesAtivos.filter(t => !confronto.includes(t))
      const esperaOutros = outros.map(t => i - ultimaPartida[t])
      if (esperaOutros.some(e => e >= 3)) continue
      confrontosValidos.push(confronto)
    }

    if (confrontosValidos.length === 0) {
      // Mantem a regra de evitar 3 seguidas quando possivel; so relaxa se nao houver alternativa
      const base = semTresSeguidas.length > 0 ? semTresSeguidas : todosConfrontos
      const timesEsperando = timesAtivos.filter(t => i - ultimaPartida[t] >= 3)
      const comEsperando = base.filter(c => timesEsperando.some(t => c.includes(t)))
      confrontosValidos = comEsperando.length > 0 ? comEsperando : base
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

    timesAtivos.forEach(t => {
      if (t === t1 || t === t2) jogosSeguidos[t]++
      else jogosSeguidos[t] = 0
    })
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

export function calcularHorario(indicePartida) {
  const horaInicio = 19
  const minutoInicio = 30 + indicePartida * 15
  const hora = horaInicio + Math.floor(minutoInicio / 60)
  const minuto = minutoInicio % 60
  return `${hora}:${minuto.toString().padStart(2, '0')}`
}
