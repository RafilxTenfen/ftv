import { describe, it, expect } from 'vitest'
import {
  DIREITOS_ARENA,
  ESQUERDOS_ARENA,
  todasAsDuplas,
  gerarArena,
  estatisticasArena,
  calcularHorarioArena,
  nivelDoJogador,
  forcaDaDupla,
  chaveDupla,
  jogadoresDoJogo
} from './reiDaArena'

const duplasDoCronograma = (rodadas) =>
  rodadas.flatMap(rodada => rodada.jogos.flat())

describe('niveis', () => {
  it('o topo da lista e o nivel mais alto', () => {
    expect(nivelDoJogador(DIREITOS_ARENA, 'João Ramirez')).toBe(6)
    expect(nivelDoJogador(DIREITOS_ARENA, 'Gui')).toBe(1)
    expect(nivelDoJogador(ESQUERDOS_ARENA, 'João Lucas')).toBe(6)
    expect(nivelDoJogador(ESQUERDOS_ARENA, 'João S')).toBe(1)
  })

  it('forca da dupla soma os dois niveis', () => {
    expect(forcaDaDupla(DIREITOS_ARENA, ESQUERDOS_ARENA, ['João Ramirez', 'João Lucas'])).toBe(12)
    expect(forcaDaDupla(DIREITOS_ARENA, ESQUERDOS_ARENA, ['Gui', 'João S'])).toBe(2)
  })
})

describe('todasAsDuplas', () => {
  it('cruza cada direito com cada esquerdo', () => {
    expect(todasAsDuplas(['A', 'B'], ['X', 'Y', 'Z'])).toHaveLength(6)
  })
})

describe('gerarArena', () => {
  it('gera 2 jogos com 2 direitos e 2 esquerdos', () => {
    const { rodadas, duplasDeFora } = gerarArena(['Rafa', 'Gregory'], ['Fernando', 'Carlinhos'])
    expect(duplasDeFora).toHaveLength(0)
    expect(duplasDoCronograma(rodadas)).toHaveLength(4)
  })

  it('gera 18 jogos em 9 rodadas com o grupo de 6x6', () => {
    const { rodadas, duplasDeFora } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    expect(rodadas).toHaveLength(9)
    expect(duplasDeFora).toHaveLength(0)
    rodadas.forEach(rodada => expect(rodada.jogos).toHaveLength(2))
  })

  it('usa cada dupla exatamente uma vez', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    const usadas = duplasDoCronograma(rodadas).map(chaveDupla)
    expect(new Set(usadas).size).toBe(usadas.length)
    expect(usadas).toHaveLength(DIREITOS_ARENA.length * ESQUERDOS_ARENA.length)
  })

  it('nao repete jogador dentro do mesmo jogo', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    rodadas.flatMap(rodada => rodada.jogos).forEach(jogo => {
      expect(new Set(jogadoresDoJogo(jogo)).size).toBe(4)
    })
  })

  it('nao coloca o mesmo jogador em duas quadras na mesma rodada', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    rodadas.forEach(rodada => {
      const emQuadra = rodada.jogos.flatMap(jogadoresDoJogo)
      expect(new Set(emQuadra).size).toBe(emQuadra.length)
    })
  })

  it('quem nao esta em quadra aparece como descansando', () => {
    const total = DIREITOS_ARENA.length + ESQUERDOS_ARENA.length
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    rodadas.forEach(rodada => {
      expect(rodada.jogos.flatMap(jogadoresDoJogo).length + rodada.descansam.length).toBe(total)
    })
  })

  it('deixa uma dupla de fora quando o total e impar', () => {
    const { duplasDeFora } = gerarArena(['A', 'B', 'C'], ['X', 'Y', 'Z'])
    expect(duplasDeFora).toHaveLength(1)
  })

  it('nao gera jogo com menos de 2 de um dos lados', () => {
    expect(gerarArena(['A'], ['X', 'Y']).rodadas).toHaveLength(0)
  })

  it('usa 1 quadra so quando nao ha 8 jogadores livres', () => {
    const { rodadas } = gerarArena(['A', 'B'], ['X', 'Y'], 2)
    expect(rodadas).toHaveLength(2)
    rodadas.forEach(rodada => expect(rodada.jogos).toHaveLength(1))
  })
})

// Limites medidos em 500 geracoes: pior maiorDiferenca 3 (o tipico e 2, que e
// o minimo estrutural), pior media 1.44, minimo de jogos zerados 3.
describe('equilibrio', () => {
  it('nao deixa nenhum jogo virar massacre', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    const stats = estatisticasArena(rodadas, DIREITOS_ARENA, ESQUERDOS_ARENA)
    expect(stats.maiorDiferenca).toBeLessThanOrEqual(3)
  })

  it('mantem a diferenca media de nivel baixa', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    const stats = estatisticasArena(rodadas, DIREITOS_ARENA, ESQUERDOS_ARENA)
    expect(stats.diferencaMedia).toBeLessThanOrEqual(2)
    expect(stats.jogosEquilibrados).toBeGreaterThanOrEqual(2)
  })

  it('sem niveis relevantes (2x2) ainda equilibra o possivel', () => {
    const { rodadas } = gerarArena(['A', 'B'], ['X', 'Y'], 2)
    const stats = estatisticasArena(rodadas, ['A', 'B'], ['X', 'Y'])
    expect(stats.maiorDiferenca).toBeLessThanOrEqual(2)
  })
})

describe('estatisticasArena', () => {
  it('cada jogador joga tantos jogos quanto adversarios do outro lado', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    const stats = estatisticasArena(rodadas, DIREITOS_ARENA, ESQUERDOS_ARENA)
    DIREITOS_ARENA.forEach(jogador => {
      expect(stats.jogosPorJogador[jogador]).toBe(ESQUERDOS_ARENA.length)
    })
    ESQUERDOS_ARENA.forEach(jogador => {
      expect(stats.jogosPorJogador[jogador]).toBe(DIREITOS_ARENA.length)
    })
  })

  it('cobre todas as duplas possiveis', () => {
    const { rodadas } = gerarArena(DIREITOS_ARENA, ESQUERDOS_ARENA, 2)
    const stats = estatisticasArena(rodadas, DIREITOS_ARENA, ESQUERDOS_ARENA)
    expect(stats.duplasUsadas).toBe(stats.duplasPossiveis)
  })
})

describe('calcularHorarioArena', () => {
  it('comeca as 09:30', () => {
    expect(calcularHorarioArena(0)).toBe('09:30')
  })

  it('soma 15 minutos por rodada', () => {
    expect(calcularHorarioArena(1)).toBe('09:45')
    expect(calcularHorarioArena(8)).toBe('11:30')
  })

  it('respeita inicio e duracao customizados', () => {
    expect(calcularHorarioArena(3, '19:00', 20)).toBe('20:00')
  })
})
