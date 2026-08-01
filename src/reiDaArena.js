import { shuffle } from './utils'

// A ordem da lista define o nivel: do mais forte para o mais fraco.
// Nivel = quantidade de jogadores do lado - posicao na lista (1 = mais fraco).
export const DIREITOS_ARENA = [
  'João Ramirez',
  'Augusto',
  'Rafuxo',
  'Tiago',
  'Gui Floripa',
  'Gui'
]

export const ESQUERDOS_ARENA = [
  'João Lucas',
  'Wesley',
  'Jean',
  'Schmitt',
  'Lucas V',
  'João S'
]

export const HORA_INICIO_PADRAO = '09:30'
export const DURACAO_PADRAO = 15
export const QUADRAS_PADRAO = 2

// Candidatos de escalacao testados por rodada antes de escolher a melhor
const CANDIDATOS_POR_RODADA = 8

export const chaveDupla = ([direito, esquerdo]) => `${direito}|${esquerdo}`

export const jogadoresDoJogo = ([[d1, e1], [d2, e2]]) => [d1, e1, d2, e2]

const chaveAdversarios = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export function todasAsDuplas(direitos, esquerdos) {
  const duplas = []
  for (const direito of direitos) {
    for (const esquerdo of esquerdos) {
      duplas.push([direito, esquerdo])
    }
  }
  return duplas
}

export const nivelDoJogador = (lista, nome) => lista.length - lista.indexOf(nome)

// Forca da dupla = nivel do direito + nivel do esquerdo.
// Internamente as celulas guardam indices, que correm ao contrario do nivel:
// a escala inverte mas a diferenca entre duas duplas tem o mesmo modulo, que
// e a unica coisa que o equilibrio usa.
const forca = ([direito, esquerdo]) => direito + esquerdo

export const forcaDaDupla = (direitos, esquerdos, [direito, esquerdo]) =>
  nivelDoJogador(direitos, direito) + nivelDoJogador(esquerdos, esquerdo)

// Um jogo poe 4 jogadores em quadra: 4 pares de adversarios
function paresAdversarios([d1, e1], [d2, e2]) {
  return [
    chaveAdversarios(`D${d1}`, `D${d2}`),
    chaveAdversarios(`D${d1}`, `E${e2}`),
    chaveAdversarios(`E${e1}`, `D${d2}`),
    chaveAdversarios(`E${e1}`, `E${e2}`)
  ]
}

export function maxJogosSimultaneos(nDireitos, nEsquerdos, quadras) {
  return Math.min(quadras, Math.floor(nDireitos / 2), Math.floor(nEsquerdos / 2))
}

// Casa cada direito da rodada com um esquerdo cuja dupla ainda nao jogou
// (Kuhn). `ordemEsquerdos` vem priorizada, entao o matching tende a puxar
// quem tem mais jogos pendentes. Retorna null se nao cobrir todos os direitos.
function casarDuplasDaRodada(direitos, ordemEsquerdos, disponivel) {
  const donoDoEsquerdo = new Map()

  const buscar = (direito, visitados) => {
    for (const esquerdo of ordemEsquerdos) {
      if (!disponivel[direito][esquerdo] || visitados.has(esquerdo)) continue
      visitados.add(esquerdo)
      const atual = donoDoEsquerdo.get(esquerdo)
      if (atual === undefined || buscar(atual, visitados)) {
        donoDoEsquerdo.set(esquerdo, direito)
        return true
      }
    }
    return false
  }

  for (const direito of direitos) {
    if (!buscar(direito, new Set())) return null
  }
  return [...donoDoEsquerdo].map(([esquerdo, direito]) => [direito, esquerdo])
}

// As duplas da rodada nao compartilham jogador, entao qualquer pareamento
// vale. Enumera todos e fica com o mais equilibrado.
function melhorPareamento(duplas, adversarios) {
  // Quadratico de proposito: dois jogos com diferenca 1 valem menos que um
  // jogo perfeito somado a um massacre.
  const custo = (duplaA, duplaB) => {
    const desequilibrio = Math.abs(forca(duplaA) - forca(duplaB))
    const repeticoes = paresAdversarios(duplaA, duplaB)
      .reduce((total, chave) => total + (adversarios[chave] || 0), 0)
    return desequilibrio * desequilibrio * 20 + repeticoes * 3
  }

  let melhor = null
  const buscar = (restantes, jogos, total) => {
    if (melhor && total >= melhor.total) return
    if (restantes.length < 2) {
      melhor = { jogos: jogos.map(jogo => [...jogo]), total }
      return
    }
    const [duplaA, ...outras] = restantes
    outras.forEach((duplaB, i) => {
      jogos.push([duplaA, duplaB])
      buscar(outras.filter((_, j) => j !== i), jogos, total + custo(duplaA, duplaB))
      jogos.pop()
    })
  }

  buscar(shuffle(duplas), [], 0)
  return melhor
}

// Monta o cronograma rodada a rodada. A cada rodada entram em quadra os
// jogadores com mais duplas pendentes, o que espalha os descansos sozinho.
function tentarArena(direitos, esquerdos, quadras) {
  const nDireitos = direitos.length
  const nEsquerdos = esquerdos.length
  const jogadores = [...direitos, ...esquerdos]

  const disponivel = Array.from({ length: nDireitos }, () => new Array(nEsquerdos).fill(true))
  const pendentesDireito = new Array(nDireitos).fill(nEsquerdos)
  const pendentesEsquerdo = new Array(nEsquerdos).fill(nDireitos)
  let pendentes = nDireitos * nEsquerdos

  const teto = maxJogosSimultaneos(nDireitos, nEsquerdos, quadras)
  const adversarios = {}
  const rodadas = []

  // Embaralha antes de ordenar (sort estavel) para variar entre empatados
  const porPendentes = (indices, pendentesPor) =>
    shuffle(indices).sort((a, b) => pendentesPor[b] - pendentesPor[a])

  while (pendentes >= 2 && teto >= 1) {
    const comPendencia = (pendentesPor) =>
      pendentesPor.map((_, i) => i).filter(i => pendentesPor[i] > 0)
    const direitosLivres = comPendencia(pendentesDireito)
    const esquerdosLivres = comPendencia(pendentesEsquerdo)

    const maxDaRodada = Math.min(
      teto,
      Math.floor(pendentes / 2),
      Math.floor(direitosLivres.length / 2),
      Math.floor(esquerdosLivres.length / 2)
    )

    let melhorRodada = null
    for (let candidato = 0; candidato < CANDIDATOS_POR_RODADA; candidato++) {
      const ordemDireitos = porPendentes(direitosLivres, pendentesDireito)
      const ordemEsquerdos = porPendentes(esquerdosLivres, pendentesEsquerdo)

      for (let jogos = maxDaRodada; jogos >= 1; jogos--) {
        const celulas = casarDuplasDaRodada(
          ordemDireitos.slice(0, jogos * 2),
          ordemEsquerdos,
          disponivel
        )
        if (!celulas) continue
        const pareamento = melhorPareamento(celulas, adversarios)
        const ganhou = !melhorRodada ||
          pareamento.jogos.length > melhorRodada.jogos.length ||
          (pareamento.jogos.length === melhorRodada.jogos.length &&
            pareamento.total < melhorRodada.total)
        if (ganhou) melhorRodada = pareamento
        break
      }
    }
    if (!melhorRodada) break

    melhorRodada.jogos.forEach(([duplaA, duplaB]) => {
      paresAdversarios(duplaA, duplaB).forEach(chave => {
        adversarios[chave] = (adversarios[chave] || 0) + 1
      })
      ;[duplaA, duplaB].forEach(([direito, esquerdo]) => {
        disponivel[direito][esquerdo] = false
        pendentesDireito[direito]--
        pendentesEsquerdo[esquerdo]--
        pendentes--
      })
    })

    const jogosDaRodada = melhorRodada.jogos.map(([duplaA, duplaB]) => [
      [direitos[duplaA[0]], esquerdos[duplaA[1]]],
      [direitos[duplaB[0]], esquerdos[duplaB[1]]]
    ])
    const emQuadra = new Set(jogosDaRodada.flatMap(jogadoresDoJogo))
    rodadas.push({
      jogos: jogosDaRodada,
      descansam: jogadores.filter(jogador => !emQuadra.has(jogador))
    })
  }

  const duplasDeFora = []
  disponivel.forEach((linha, direito) => {
    linha.forEach((livre, esquerdo) => {
      if (livre) duplasDeFora.push([direitos[direito], esquerdos[esquerdo]])
    })
  })

  return { rodadas, duplasDeFora }
}

// Ordem de desempate: cobrir todas as duplas, fechar em menos rodadas, evitar
// o jogo mais desequilibrado e so entao reduzir o desequilibrio somado.
function qualidade({ rodadas, duplasDeFora }, direitos, esquerdos) {
  const diferencas = rodadas.flatMap(rodada =>
    rodada.jogos.map(([duplaA, duplaB]) => Math.abs(
      forcaDaDupla(direitos, esquerdos, duplaA) -
      forcaDaDupla(direitos, esquerdos, duplaB)
    ))
  )
  return [
    duplasDeFora.length,
    rodadas.length,
    diferencas.length > 0 ? Math.max(...diferencas) : 0,
    diferencas.reduce((total, diferenca) => total + diferenca * diferenca, 0)
  ]
}

function melhorQue(atual, referencia) {
  for (let i = 0; i < atual.length; i++) {
    if (atual[i] !== referencia[i]) return atual[i] < referencia[i]
  }
  return false
}

export function gerarArena(direitos, esquerdos, quadras = QUADRAS_PADRAO, tentativas = 150) {
  if (direitos.length < 2 || esquerdos.length < 2) {
    return { rodadas: [], duplasDeFora: todasAsDuplas(direitos, esquerdos) }
  }

  let melhor = null
  let melhorQualidade = null

  for (let i = 0; i < tentativas; i++) {
    const arena = tentarArena(direitos, esquerdos, quadras)
    const atual = qualidade(arena, direitos, esquerdos)
    if (!melhor || melhorQue(atual, melhorQualidade)) {
      melhor = arena
      melhorQualidade = atual
    }
  }
  return melhor
}

export function estatisticasArena(rodadas, direitos, esquerdos) {
  const jogadores = [...direitos, ...esquerdos]
  const jogosPorJogador = {}
  const descansosPorJogador = {}
  jogadores.forEach(jogador => {
    jogosPorJogador[jogador] = 0
    descansosPorJogador[jogador] = 0
  })

  const duplasUsadas = new Set()
  const diferencas = []

  rodadas.forEach(rodada => {
    rodada.jogos.forEach(jogo => {
      const [duplaA, duplaB] = jogo
      duplasUsadas.add(chaveDupla(duplaA))
      duplasUsadas.add(chaveDupla(duplaB))
      jogadoresDoJogo(jogo).forEach(jogador => { jogosPorJogador[jogador]++ })
      diferencas.push(Math.abs(
        forcaDaDupla(direitos, esquerdos, duplaA) -
        forcaDaDupla(direitos, esquerdos, duplaB)
      ))
    })
    rodada.descansam.forEach(jogador => { descansosPorJogador[jogador]++ })
  })

  return {
    jogosPorJogador,
    descansosPorJogador,
    duplasUsadas: duplasUsadas.size,
    duplasPossiveis: direitos.length * esquerdos.length,
    totalJogos: diferencas.length,
    jogosEquilibrados: diferencas.filter(diferenca => diferenca === 0).length,
    maiorDiferenca: diferencas.length > 0 ? Math.max(...diferencas) : 0,
    diferencaMedia: diferencas.length > 0
      ? diferencas.reduce((total, diferenca) => total + diferenca, 0) / diferencas.length
      : 0
  }
}

export function calcularHorarioArena(
  indiceRodada,
  horaInicio = HORA_INICIO_PADRAO,
  duracaoMin = DURACAO_PADRAO
) {
  const [horas, minutos] = horaInicio.split(':').map(Number)
  const total = horas * 60 + minutos + indiceRodada * duracaoMin
  const hora = Math.floor(total / 60) % 24
  const minuto = total % 60
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
}
