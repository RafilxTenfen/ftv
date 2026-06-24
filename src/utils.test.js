import { describe, it, expect } from 'vitest'
import {
  TIMES_FIXOS,
  DIREITOS,
  ESQUERDOS,
  shuffle,
  getCombinations,
  gerarPartidas,
  calcularHorario
} from './utils'

function maxJogosSeguidos(partidas, timesAtivos) {
  let max = 0
  timesAtivos.forEach(t => {
    let atual = 0
    partidas.forEach(p => {
      atual = p.includes(t) ? atual + 1 : 0
      max = Math.max(max, atual)
    })
  })
  return max
}

// PRNG deterministico (mulberry32) para tornar os testes reproduziveis em vez de
// depender da sorte do Math.random. Seeds 0..199 cobrem amplamente o espaco de geracao.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function comSeed(seed, fn) {
  const original = Math.random
  Math.random = mulberry32(seed)
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

// Retorna a lista de confrontos que se repetem em partidas seguidas (vazia = ok)
function confrontosSeguidosRepetidos(partidas) {
  const repetidos = []
  for (let j = 1; j < partidas.length; j++) {
    const anterior = [...partidas[j - 1]].sort().join(',')
    const atual = [...partidas[j]].sort().join(',')
    if (anterior === atual) repetidos.push({ jogo: j + 1, confronto: atual })
  }
  return repetidos
}

describe('TIMES_FIXOS', () => {
  it('deve ter 4 times', () => {
    expect(Object.keys(TIMES_FIXOS)).toHaveLength(4)
  })

  it('cada time deve ter 2 jogadores (direito e esquerdo)', () => {
    Object.values(TIMES_FIXOS).forEach(time => {
      expect(time).toHaveLength(2)
    })
  })
})

describe('DIREITOS e ESQUERDOS', () => {
  it('deve ter 4 jogadores direitos', () => {
    expect(DIREITOS).toHaveLength(4)
  })

  it('deve ter 4 jogadores esquerdos', () => {
    expect(ESQUERDOS).toHaveLength(4)
  })

  it('jogadores direitos devem ser os primeiros de cada time fixo', () => {
    DIREITOS.forEach(jogador => {
      const encontrado = Object.values(TIMES_FIXOS).some(time => time[0] === jogador)
      expect(encontrado).toBe(true)
    })
  })

  it('jogadores esquerdos devem ser os segundos de cada time fixo', () => {
    ESQUERDOS.forEach(jogador => {
      const encontrado = Object.values(TIMES_FIXOS).some(time => time[1] === jogador)
      expect(encontrado).toBe(true)
    })
  })
})

describe('shuffle', () => {
  it('deve retornar array com mesmo tamanho', () => {
    const arr = [1, 2, 3, 4]
    const result = shuffle(arr)
    expect(result).toHaveLength(arr.length)
  })

  it('deve conter os mesmos elementos', () => {
    const arr = [1, 2, 3, 4]
    const result = shuffle(arr)
    expect(result.sort()).toEqual(arr.sort())
  })

  it('nao deve modificar o array original', () => {
    const arr = [1, 2, 3, 4]
    const original = [...arr]
    shuffle(arr)
    expect(arr).toEqual(original)
  })

  it('deve embaralhar (verificacao estatistica)', () => {
    const arr = [1, 2, 3, 4]
    let diferente = false
    for (let i = 0; i < 100; i++) {
      const result = shuffle(arr)
      if (result.join(',') !== arr.join(',')) {
        diferente = true
        break
      }
    }
    expect(diferente).toBe(true)
  })
})

describe('getCombinations', () => {
  it('deve retornar 6 combinacoes de 2 em 4 elementos', () => {
    const result = getCombinations([1, 2, 3, 4], 2)
    expect(result).toHaveLength(6)
  })

  it('deve retornar 3 combinacoes de 2 em 3 elementos', () => {
    const result = getCombinations([1, 2, 3], 2)
    expect(result).toHaveLength(3)
  })

  it('deve retornar 1 combinacao de 2 em 2 elementos', () => {
    const result = getCombinations([1, 2], 2)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual([1, 2])
  })

  it('combinacoes devem ser unicas', () => {
    const result = getCombinations([1, 2, 3, 4], 2)
    const strings = result.map(c => c.join(','))
    const unique = new Set(strings)
    expect(unique.size).toBe(result.length)
  })

  it('cada combinacao deve ter o tamanho correto', () => {
    const result = getCombinations([1, 2, 3, 4], 2)
    result.forEach(combo => {
      expect(combo).toHaveLength(2)
    })
  })
})

describe('gerarPartidas', () => {
  it('deve retornar null com menos de 2 times', () => {
    expect(gerarPartidas([1])).toBeNull()
    expect(gerarPartidas([])).toBeNull()
  })

  it('deve gerar 10 partidas por padrao', () => {
    const result = gerarPartidas([1, 2, 3, 4])
    expect(result.partidas).toHaveLength(10)
  })

  it('deve gerar numero especifico de partidas', () => {
    const result = gerarPartidas([1, 2, 3, 4], 5)
    expect(result.partidas).toHaveLength(5)
  })

  it('cada partida deve ter 2 times', () => {
    const result = gerarPartidas([1, 2, 3, 4])
    result.partidas.forEach(partida => {
      expect(partida).toHaveLength(2)
    })
  })

  it('times na partida devem ser diferentes', () => {
    const result = gerarPartidas([1, 2, 3, 4])
    result.partidas.forEach(partida => {
      expect(partida[0]).not.toBe(partida[1])
    })
  })

  it('soma de jogos por time deve ser 2x numero de partidas', () => {
    const result = gerarPartidas([1, 2, 3, 4], 10)
    const somaJogos = Object.values(result.jogosPorTime).reduce((a, b) => a + b, 0)
    expect(somaJogos).toBe(20)
  })

  it('todos os confrontos devem ser cobertos nos primeiros 6 jogos (4 times)', () => {
    for (let i = 0; i < 10; i++) {
      const result = gerarPartidas([1, 2, 3, 4], 10)
      const confrontosNasPrimeiras6 = new Set()
      result.partidas.slice(0, 6).forEach(partida => {
        confrontosNasPrimeiras6.add(partida.sort().join(','))
      })
      expect(confrontosNasPrimeiras6.size).toBe(6)
    }
  })

  it('nenhum time deve esperar mais de 2 partidas (4 times)', () => {
    for (let i = 0; i < 10; i++) {
      const result = gerarPartidas([1, 2, 3, 4], 10)
      Object.values(result.maxEspera).forEach(espera => {
        expect(espera).toBeLessThanOrEqual(2)
      })
    }
  })

  it('nenhum time deve jogar 3 partidas seguidas (4 times)', () => {
    for (let i = 0; i < 200; i++) {
      const result = gerarPartidas([1, 2, 3, 4], 16)
      expect(maxJogosSeguidos(result.partidas, [1, 2, 3, 4])).toBeLessThanOrEqual(2)
    }
  })

  it('nenhum time deve jogar 3 partidas seguidas (3 times)', () => {
    for (let i = 0; i < 200; i++) {
      const result = gerarPartidas([1, 2, 3], 16)
      expect(maxJogosSeguidos(result.partidas, [1, 2, 3])).toBeLessThanOrEqual(2)
    }
  })

  // Regressao do bug: jogos 6 e 7 do cronograma eram o mesmo confronto seguido
  // (2 equipes jogando 2 jogos seguidas). Deterministico via seeds: ~31% dos seeds
  // disparavam o bug no codigo antigo, entao a falha e garantida em caso de regressao.
  it('mesmo confronto nao deve se repetir em partidas seguidas (4 times, deterministico)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const result = comSeed(seed, () => gerarPartidas([1, 2, 3, 4], 16))
      const repetidos = confrontosSeguidosRepetidos(result.partidas)
      expect(repetidos, `seed ${seed}: confrontos repetidos seguidos ${JSON.stringify(repetidos)}`).toEqual([])
    }
  })

  it('mesmo confronto nao deve se repetir em partidas seguidas (3 times, deterministico)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const result = comSeed(seed, () => gerarPartidas([1, 2, 3], 16))
      const repetidos = confrontosSeguidosRepetidos(result.partidas)
      expect(repetidos, `seed ${seed}: confrontos repetidos seguidos ${JSON.stringify(repetidos)}`).toEqual([])
    }
  })

  // Com 2 times so existe 1 confronto possivel, entao a repeticao e inevitavel e esperada:
  // a regra de "nao repetir" nao deve travar a geracao nesse caso.
  it('com 2 times o unico confronto se repete em todas as partidas', () => {
    const result = comSeed(0, () => gerarPartidas([1, 2], 16))
    expect(result.partidas).toHaveLength(16)
    expect(confrontosSeguidosRepetidos(result.partidas)).toHaveLength(15)
  })

  it('deve funcionar com 3 times', () => {
    const result = gerarPartidas([1, 2, 3], 10)
    expect(result.partidas).toHaveLength(10)
    expect(Object.keys(result.jogosPorTime)).toHaveLength(3)
  })

  it('deve funcionar com 2 times', () => {
    const result = gerarPartidas([1, 2], 10)
    expect(result.partidas).toHaveLength(10)
    result.partidas.forEach(partida => {
      expect(partida.sort()).toEqual([1, 2])
    })
  })

  it('deve retornar timesAtivos correto', () => {
    const timesAtivos = [1, 3, 4]
    const result = gerarPartidas(timesAtivos)
    expect(result.timesAtivos).toEqual(timesAtivos)
  })

  it('confrontosRealizados deve somar numero de partidas', () => {
    const result = gerarPartidas([1, 2, 3, 4], 10)
    const somaConfrontos = Object.values(result.confrontosRealizados).reduce((a, b) => a + b, 0)
    expect(somaConfrontos).toBe(10)
  })
})

describe('calcularHorario', () => {
  it('primeira partida deve comecar as 19:30', () => {
    expect(calcularHorario(0)).toBe('19:30')
  })

  it('segunda partida deve comecar as 19:45', () => {
    expect(calcularHorario(1)).toBe('19:45')
  })

  it('quinta partida deve comecar as 20:30', () => {
    expect(calcularHorario(4)).toBe('20:30')
  })

  it('decima partida deve comecar as 21:45', () => {
    expect(calcularHorario(9)).toBe('21:45')
  })

  it('minutos devem ter zero a esquerda quando necessario', () => {
    expect(calcularHorario(2)).toBe('20:00')
    expect(calcularHorario(6)).toBe('21:00')
  })
})
