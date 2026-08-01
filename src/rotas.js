export const ROTA_ARENA = '/rei-da-arena'

const semBarraFinal = (caminho) => caminho.replace(/\/+$/, '')

export const naArena = (caminho) => semBarraFinal(caminho).endsWith(ROTA_ARENA)

// Mantem o prefixo caso o app seja servido em subpasta
export const caminhoInicial = (caminho) =>
  semBarraFinal(caminho).slice(0, -ROTA_ARENA.length) || '/'

export function navegar(caminho) {
  window.history.pushState({}, '', caminho)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
