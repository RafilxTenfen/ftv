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
  it('primeira partida deve comecar as 19:00', () => {
    expect(calcularHorario(0)).toBe('19:00')
  })

  it('segunda partida deve comecar as 19:15', () => {
    expect(calcularHorario(1)).toBe('19:15')
  })

  it('quinta partida deve comecar as 20:00', () => {
    expect(calcularHorario(4)).toBe('20:00')
  })

  it('decima partida deve comecar as 21:15', () => {
    expect(calcularHorario(9)).toBe('21:15')
  })

  it('minutos devem ter zero a esquerda quando necessario', () => {
    expect(calcularHorario(0)).toBe('19:00')
    expect(calcularHorario(4)).toBe('20:00')
  })
})
