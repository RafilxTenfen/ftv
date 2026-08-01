import { useState } from 'react'
import './ReiDaArena.css'
import { caminhoInicial, navegar } from './rotas'
import {
  DIREITOS_ARENA,
  ESQUERDOS_ARENA,
  HORA_INICIO_PADRAO,
  DURACAO_PADRAO,
  QUADRAS_PADRAO,
  gerarArena,
  estatisticasArena,
  calcularHorarioArena,
  forcaDaDupla,
  nivelDoJogador,
  maxJogosSimultaneos
} from './reiDaArena'

const STORAGE_KEY = 'ftv-rei-da-arena'

const JOGADORES_PADRAO = {
  direitos: [...DIREITOS_ARENA],
  esquerdos: [...ESQUERDOS_ARENA]
}

const CONFIG_PADRAO = {
  horaInicio: HORA_INICIO_PADRAO,
  duracao: DURACAO_PADRAO,
  quadras: QUADRAS_PADRAO
}

function carregarDaURL() {
  const codigo = new URLSearchParams(window.location.search).get('d')
  if (!codigo) return null
  try {
    return JSON.parse(decodeURIComponent(atob(codigo)))
  } catch {
    return null
  }
}

function carregarSalvo() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

function ListaJogadores({ titulo, sigla, lado, jogadores, onChange, minimo = 2 }) {
  const [novo, setNovo] = useState('')
  const [editando, setEditando] = useState(null)
  const [rascunho, setRascunho] = useState('')

  const jaExiste = (nome) =>
    jogadores.some(jogador => jogador.toLowerCase() === nome.toLowerCase())

  const adicionar = () => {
    const nome = novo.trim()
    if (!nome || jaExiste(nome)) return
    onChange([...jogadores, nome])
    setNovo('')
  }

  const remover = (indice) => {
    if (jogadores.length <= minimo) return
    onChange(jogadores.filter((_, i) => i !== indice))
  }

  const mover = (indice, direcao) => {
    const destino = indice + direcao
    if (destino < 0 || destino >= jogadores.length) return
    const lista = [...jogadores]
    ;[lista[indice], lista[destino]] = [lista[destino], lista[indice]]
    onChange(lista)
  }

  const salvarNome = () => {
    const nome = rascunho.trim()
    if (nome && !jaExiste(nome)) {
      onChange(jogadores.map((jogador, i) => (i === editando ? nome : jogador)))
    }
    setEditando(null)
  }

  return (
    <div className={`arena-lista arena-lado-${lado}`}>
      <div className="arena-lista-titulo">
        <span className={`arena-sigla arena-sigla-${lado}`}>{sigla}</span>
        {titulo}
        <span className="arena-contagem">{jogadores.length}</span>
      </div>

      <ul className="arena-jogadores">
        {jogadores.map((jogador, indice) => (
          <li key={jogador} className="arena-jogador">
            <span className={`arena-nivel arena-nivel-${lado}`}>
              {jogadores.length - indice}
            </span>
            {editando === indice ? (
              <input
                className="arena-input-nome"
                autoFocus
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onBlur={salvarNome}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') salvarNome()
                  if (e.key === 'Escape') setEditando(null)
                }}
              />
            ) : (
              <button
                className="arena-nome"
                onClick={() => { setEditando(indice); setRascunho(jogador) }}
                title="Renomear"
              >
                {jogador}
              </button>
            )}
            <div className="arena-acoes">
              <button
                className="arena-mini"
                onClick={() => mover(indice, -1)}
                disabled={indice === 0}
                title="Subir nível"
              >
                ▲
              </button>
              <button
                className="arena-mini"
                onClick={() => mover(indice, 1)}
                disabled={indice === jogadores.length - 1}
                title="Descer nível"
              >
                ▼
              </button>
              <button
                className="arena-mini arena-mini-remover"
                onClick={() => remover(indice)}
                disabled={jogadores.length <= minimo}
                title={jogadores.length <= minimo ? `Mínimo de ${minimo}` : 'Remover'}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="arena-adicionar">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          placeholder={`Novo ${titulo.toLowerCase().slice(0, -1)}`}
        />
        <button onClick={adicionar} disabled={!novo.trim() || jaExiste(novo.trim())}>
          +
        </button>
      </div>
    </div>
  )
}

function estadoInicial() {
  const salvo = carregarDaURL() || carregarSalvo()
  const jogadores = salvo?.jogadores || JOGADORES_PADRAO
  const config = { ...CONFIG_PADRAO, ...(salvo?.config || {}) }
  return {
    jogadores,
    config,
    arena: salvo?.arena ||
      gerarArena(jogadores.direitos, jogadores.esquerdos, config.quadras)
  }
}

export default function ReiDaArena() {
  const [inicial] = useState(estadoInicial)
  const [jogadores, setJogadores] = useState(inicial.jogadores)
  const [config, setConfig] = useState(inicial.config)
  const [arena, setArena] = useState(inicial.arena)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const { direitos, esquerdos } = jogadores
  const stats = estatisticasArena(arena.rodadas, direitos, esquerdos)
  const podeGerar = direitos.length >= 2 && esquerdos.length >= 2

  const persistir = (proximoJogadores, proximoConfig, proximaArena) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      jogadores: proximoJogadores,
      config: proximoConfig,
      arena: proximaArena
    }))
  }

  const regerar = (proximoJogadores = jogadores, proximoConfig = config) => {
    const proximaArena = gerarArena(
      proximoJogadores.direitos,
      proximoJogadores.esquerdos,
      proximoConfig.quadras
    )
    setArena(proximaArena)
    persistir(proximoJogadores, proximoConfig, proximaArena)
  }

  const atualizarLado = (lado, lista) => {
    const proximo = { ...jogadores, [lado]: lista }
    setJogadores(proximo)
    persistir(proximo, config, arena)
  }

  const atualizarConfig = (campo, valor) => {
    const proximo = { ...config, [campo]: valor }
    setConfig(proximo)
    persistir(jogadores, proximo, arena)
  }

  const resetar = () => {
    setJogadores(JOGADORES_PADRAO)
    setConfig(CONFIG_PADRAO)
    regerar(JOGADORES_PADRAO, CONFIG_PADRAO)
  }

  const compartilhar = async () => {
    const codigo = btoa(encodeURIComponent(JSON.stringify({ jogadores, config, arena })))
    const url = `${window.location.origin}${window.location.pathname}?d=${codigo}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch {
      prompt('Copie o link:', url)
    }
  }

  const horarioDaRodada = (indice) =>
    calcularHorarioArena(indice, config.horaInicio, config.duracao)

  const termino = arena.rodadas.length > 0
    ? calcularHorarioArena(arena.rodadas.length, config.horaInicio, config.duracao)
    : '—'

  const nomeComNivel = (nome, lista, lado) => (
    <span className="arena-atleta">
      {nome}<span className={`arena-tag arena-tag-${lado}`}>{nivelDoJogador(lista, nome)}</span>
    </span>
  )

  const Dupla = ({ dupla }) => (
    <span className="arena-dupla">
      {nomeComNivel(dupla[0], direitos, 'direito')}
      <span className="arena-mais">+</span>
      {nomeComNivel(dupla[1], esquerdos, 'esquerdo')}
      <span className="arena-forca">{forcaDaDupla(direitos, esquerdos, dupla)}</span>
    </span>
  )

  return (
    <div className="arena-page">
      <div className="arena-container">
        <a
          className="arena-voltar"
          href={caminhoInicial(window.location.pathname)}
          onClick={(e) => { e.preventDefault(); navegar(caminhoInicial(window.location.pathname)) }}
        >
          ← Futevôlei Cidade Alta
        </a>

        <header className="arena-header">
          <h1>👑 Rei da Arena</h1>
          <p>
            Cada direito joga uma única vez com cada esquerdo — e os confrontos
            são montados para equilibrar os níveis.
          </p>
        </header>

        <div className="arena-resumo">
          <div><b>{direitos.length * esquerdos.length}</b><span>duplas</span></div>
          <div><b>{stats.totalJogos}</b><span>jogos</span></div>
          <div><b>{arena.rodadas.length}</b><span>rodadas</span></div>
          <div><b>{config.horaInicio}–{termino}</b><span>horário</span></div>
          <div><b>{esquerdos.length} / {direitos.length}</b><span>jogos por D / E</span></div>
        </div>

        <section className="arena-secao">
          <div className="arena-secao-topo">
            <h2>Jogadores</h2>
            <div className="arena-secao-acoes">
              <button className="arena-btn-sutil" onClick={compartilhar}>
                {linkCopiado ? '✓ Copiado!' : 'Compartilhar'}
              </button>
              <button className="arena-btn-sutil arena-btn-reset" onClick={resetar}>
                Reset
              </button>
            </div>
          </div>
          <p className="arena-dica">
            A ordem define o nível: quem está no topo é o mais forte. Use ▲▼ para
            reordenar e clique no nome para renomear.
          </p>
          <div className="arena-listas">
            <ListaJogadores
              titulo="Direitos"
              sigla="D"
              lado="direito"
              jogadores={direitos}
              onChange={(lista) => atualizarLado('direitos', lista)}
            />
            <ListaJogadores
              titulo="Esquerdos"
              sigla="E"
              lado="esquerdo"
              jogadores={esquerdos}
              onChange={(lista) => atualizarLado('esquerdos', lista)}
            />
          </div>
        </section>

        <section className="arena-secao">
          <h2>Configuração</h2>
          <div className="arena-config">
            <label>
              Início
              <input
                type="time"
                value={config.horaInicio}
                onChange={(e) => atualizarConfig('horaInicio', e.target.value)}
              />
            </label>
            <label>
              Duração do jogo
              <div className="arena-campo-sufixo">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={config.duracao}
                  onChange={(e) => atualizarConfig('duracao', Number(e.target.value) || 1)}
                />
                <span>min</span>
              </div>
            </label>
            <label>
              Quadras
              <input
                type="number"
                min="1"
                max="4"
                value={config.quadras}
                onChange={(e) => atualizarConfig('quadras', Number(e.target.value) || 1)}
              />
            </label>
          </div>
          {config.quadras > maxJogosSimultaneos(direitos.length, esquerdos.length, config.quadras) && (
            <p className="arena-aviso">
              Só dá para usar {maxJogosSimultaneos(direitos.length, esquerdos.length, config.quadras)} quadra(s):
              cada jogo precisa de 2 direitos e 2 esquerdos livres.
            </p>
          )}
        </section>

        <button className="arena-btn-gerar" onClick={() => regerar()} disabled={!podeGerar}>
          {podeGerar ? 'Gerar cronograma' : 'Precisa de 2 direitos e 2 esquerdos'}
        </button>

        {arena.duplasDeFora.length > 0 && (
          <p className="arena-aviso">
            Número ímpar de duplas — {arena.duplasDeFora.length} ficou de fora:{' '}
            {arena.duplasDeFora.map(dupla => dupla.join(' + ')).join(', ')}
          </p>
        )}

        {arena.rodadas.length > 0 && (
          <section className="arena-secao">
            <h2>Cronograma</h2>
            <div className="arena-rodadas">
            {arena.rodadas.map((rodada, indice) => (
              <div key={indice} className="arena-rodada">
                <div className="arena-rodada-topo">
                  <span className="arena-rodada-hora">{horarioDaRodada(indice)}</span>
                  <span className="arena-rodada-num">Rodada {indice + 1}</span>
                </div>
                {rodada.jogos.map((jogo, quadra) => (
                  <div key={quadra} className="arena-jogo">
                    <span className="arena-quadra">Q{quadra + 1}</span>
                    <div className="arena-confronto">
                      <Dupla dupla={jogo[0]} />
                      <span className="arena-vs">vs</span>
                      <Dupla dupla={jogo[1]} />
                    </div>
                  </div>
                ))}
                {rodada.descansam.length > 0 && (
                  <div className="arena-descansam">
                    Descansam: {rodada.descansam.join(', ')}
                  </div>
                )}
              </div>
            ))}
            </div>
          </section>
        )}

        {arena.rodadas.length > 0 && (
          <section className="arena-secao">
            <h2>Equilíbrio</h2>
            <div className="arena-cards">
              <div className="arena-card">
                <b>{stats.jogosEquilibrados}<small>/{stats.totalJogos}</small></b>
                <span>jogos com times de força idêntica</span>
              </div>
              <div className="arena-card">
                <b>{stats.maiorDiferenca}</b>
                <span>maior diferença de força num jogo</span>
              </div>
              <div className="arena-card">
                <b>{stats.diferencaMedia.toFixed(2)}</b>
                <span>diferença média</span>
              </div>
              <div className="arena-card">
                <b>{stats.duplasUsadas}<small>/{stats.duplasPossiveis}</small></b>
                <span>duplas formadas</span>
              </div>
            </div>

            <h3>Jogos por atleta</h3>
            <div className="arena-tabela">
              {[...direitos, ...esquerdos].map(jogador => {
                const ehDireito = direitos.includes(jogador)
                const lista = ehDireito ? direitos : esquerdos
                return (
                  <div key={jogador} className="arena-linha">
                    {nomeComNivel(jogador, lista, ehDireito ? 'direito' : 'esquerdo')}
                    <span className="arena-linha-valor">
                      {stats.jogosPorJogador[jogador]} jogos
                      <small> · {stats.descansosPorJogador[jogador]} fora</small>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
