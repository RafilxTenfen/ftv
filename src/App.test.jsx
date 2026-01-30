import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App, { codificarParaURL, decodificarDaURL } from './App'

describe('codificarParaURL / decodificarDaURL', () => {
  it('deve fazer roundtrip encode/decode', () => {
    const dados = {
      j: { direitos: ['Gregory', 'Rafa', 'Tiago', 'Dudu'], esquerdos: ['Fernando', 'Carlinhos', 'Lucas', 'Cavalo'] },
      h: [],
      i: 0,
      c: 0
    }
    const encoded = codificarParaURL(dados)
    const decoded = decodificarDaURL(encoded)
    expect(decoded).toEqual(dados)
  })

  it('deve decodificar um payload hardcoded sem regressao', () => {
    const hardcoded = 'JTdCJTIyaiUyMiUzQSU3QiUyMmRpcmVpdG9zJTIyJTNBJTVCJTIyR3JlZ29yeSUyMiUyQyUyMlJhZmElMjIlMkMlMjJUaWFnbyUyMiUyQyUyMkR1ZHUlMjIlNUQlMkMlMjJlc3F1ZXJkb3MlMjIlM0ElNUIlMjJGZXJuYW5kbyUyMiUyQyUyMkNhcmxpbmhvcyUyMiUyQyUyMkx1Y2FzJTIyJTJDJTIyQ2F2YWxvJTIyJTVEJTdEJTJDJTIyaCUyMiUzQSU1QiU1RCUyQyUyMmklMjIlM0EwJTJDJTIyYyUyMiUzQTMlN0Q='
    const decoded = decodificarDaURL(hardcoded)
    expect(decoded).toEqual({
      j: { direitos: ['Gregory', 'Rafa', 'Tiago', 'Dudu'], esquerdos: ['Fernando', 'Carlinhos', 'Lucas', 'Cavalo'] },
      h: [],
      i: 0,
      c: 3
    })
  })

  it('deve gerar o mesmo encoding para um payload conhecido', () => {
    const dados = {
      j: { direitos: ['Gregory', 'Rafa', 'Tiago', 'Dudu'], esquerdos: ['Fernando', 'Carlinhos', 'Lucas', 'Cavalo'] },
      h: [],
      i: 0,
      c: 3
    }
    const expected = 'JTdCJTIyaiUyMiUzQSU3QiUyMmRpcmVpdG9zJTIyJTNBJTVCJTIyR3JlZ29yeSUyMiUyQyUyMlJhZmElMjIlMkMlMjJUaWFnbyUyMiUyQyUyMkR1ZHUlMjIlNUQlMkMlMjJlc3F1ZXJkb3MlMjIlM0ElNUIlMjJGZXJuYW5kbyUyMiUyQyUyMkNhcmxpbmhvcyUyMiUyQyUyMkx1Y2FzJTIyJTJDJTIyQ2F2YWxvJTIyJTVEJTdEJTJDJTIyaCUyMiUzQSU1QiU1RCUyQyUyMmklMjIlM0EwJTJDJTIyYyUyMiUzQTMlN0Q='
    expect(codificarParaURL(dados)).toBe(expected)
  })

  it('deve decodificar a URL real compartilhada com historico', () => {
    const realPayload = 'JTdCJTIyaiUyMiUzQSU3QiUyMmRpcmVpdG9zJTIyJTNBJTVCJTIyR3JlZ29yeSUyMiUyQyUyMlJhZmElMjIlMkMlMjJUaWFnbyUyMiUyQyUyMkR1ZHUlMjIlNUQlMkMlMjJlc3F1ZXJkb3MlMjIlM0ElNUIlMjJGZXJuYW5kbyUyMiUyQyUyMkNhcmxpbmhvcyUyMiUyQyUyMkx1Y2FzJTIyJTJDJTIyQ2F2YWxvJTIyJTVEJTdEJTJDJTIyaCUyMiUzQSU1QiU3QiUyMm51bWVybyUyMiUzQTIlMkMlMjJ0aW1lcyUyMiUzQSU3QiUyMjElMjIlM0ElNUIlMjJEdWR1JTIyJTJDJTIyRmVybmFuZG8lMjIlNUQlMkMlMjIyJTIyJTNBJTVCJTIyUmFmYSUyMiUyQyUyMkx1Y2FzJTIyJTVEJTJDJTIyMyUyMiUzQSU1QiUyMlRpYWdvJTIyJTJDJTIyQ2F2YWxvJTIyJTVEJTJDJTIyNCUyMiUzQSU1QiUyMkdyZWdvcnklMjIlMkMlMjJDYXJsaW5ob3MlMjIlNUQlN0QlMkMlMjJtaXN0dXJhZG8lMjIlM0F0cnVlJTJDJTIycGFydGlkYXMlMjIlM0ElNUIlNUIzJTJDNCU1RCUyQyU1QjElMkMyJTVEJTJDJTVCMSUyQzMlNUQlMkMlNUIyJTJDNCU1RCUyQyU1QjIlMkMzJTVEJTJDJTVCMSUyQzQlNUQlMkMlNUIxJTJDNCU1RCUyQyU1QjIlMkMzJTVEJTJDJTVCMSUyQzMlNUQlMkMlNUIyJTJDNCU1RCU1RCUyQyUyMmpvZ29zUG9yVGltZSUyMiUzQSU3QiUyMjElMjIlM0E1JTJDJTIyMiUyMiUzQTUlMkMlMjIzJTIyJTNBNSUyQyUyMjQlMjIlM0E1JTdEJTJDJTIyY29uZnJvbnRvc1JlYWxpemFkb3MlMjIlM0ElN0IlMjIxJTJDMiUyMiUzQTElMkMlMjIxJTJDMyUyMiUzQTIlMkMlMjIxJTJDNCUyMiUzQTIlMkMlMjIyJTJDMyUyMiUzQTIlMkMlMjIyJTJDNCUyMiUzQTIlMkMlMjIzJTJDNCUyMiUzQTElN0QlMkMlMjJtYXhFc3BlcmElMjIlM0ElN0IlMjIxJTIyJTNBMiUyQyUyMjIlMjIlM0EyJTJDJTIyMyUyMiUzQTIlMkMlMjI0JTIyJTNBMiU3RCUyQyUyMnRpbWVzQXRpdm9zJTIyJTNBJTVCMSUyQzIlMkMzJTJDNCU1RCU3RCUyQyU3QiUyMm51bWVybyUyMiUzQTElMkMlMjJ0aW1lcyUyMiUzQSU3QiUyMjElMjIlM0ElNUIlMjJHcmVnb3J5JTIyJTJDJTIyRmVybmFuZG8lMjIlNUQlMkMlMjIyJTIyJTNBJTVCJTIyUmFmYSUyMiUyQyUyMkNhcmxpbmhvcyUyMiU1RCUyQyUyMjMlMjIlM0ElNUIlMjJUaWFnbyUyMiUyQyUyMkx1Y2FzJTIyJTVEJTJDJTIyNCUyMiUzQSU1QiUyMkR1ZHUlMjIlMkMlMjJDYXZhbG8lMjIlNUQlN0QlMkMlMjJtaXN0dXJhZG8lMjIlM0FmYWxzZSUyQyUyMnBhcnRpZGFzJTIyJTNBJTVCJTVCMSUyQzMlNUQlMkMlNUIyJTJDNCU1RCUyQyU1QjElMkMyJTVEJTJDJTVCMiUyQzMlNUQlMkMlNUIxJTJDNCU1RCUyQyU1QjMlMkM0JTVEJTJDJTVCMSUyQzIlNUQlMkMlNUIzJTJDNCU1RCUyQyU1QjElMkMzJTVEJTJDJTVCMiUyQzQlNUQlNUQlMkMlMjJqb2dvc1BvclRpbWUlMjIlM0ElN0IlMjIxJTIyJTNBNSUyQyUyMjIlMjIlM0E1JTJDJTIyMyUyMiUzQTUlMkMlMjI0JTIyJTNBNSU3RCUyQyUyMmNvbmZyb250b3NSZWFsaXphZG9zJTIyJTNBJTdCJTIyMSUyQzIlMjIlM0EyJTJDJTIyMSUyQzMlMjIlM0EyJTJDJTIyMSUyQzQlMjIlM0ExJTJDJTIyMiUyQzMlMjIlM0ExJTJDJTIyMiUyQzQlMjIlM0EyJTJDJTIyMyUyQzQlMjIlM0EyJTdEJTJDJTIybWF4RXNwZXJhJTIyJTNBJTdCJTIyMSUyMiUzQTElMkMlMjIyJTIyJTNBMiUyQyUyMjMlMjIlM0EyJTJDJTIyNCUyMiUzQTIlN0QlMkMlMjJ0aW1lc0F0aXZvcyUyMiUzQSU1QjElMkMyJTJDMyUyQzQlNUQlN0QlNUQlMkMlMjJpJTIyJTNBMCUyQyUyMmMlMjIlM0EyJTdE'
    const decoded = decodificarDaURL(realPayload)
    expect(decoded.j.direitos).toEqual(['Gregory', 'Rafa', 'Tiago', 'Dudu'])
    expect(decoded.j.esquerdos).toEqual(['Fernando', 'Carlinhos', 'Lucas', 'Cavalo'])
    expect(decoded.h).toHaveLength(2)
    expect(decoded.h[0].numero).toBe(2)
    expect(decoded.h[0].misturado).toBe(true)
    expect(decoded.h[0].times['1']).toEqual(['Dudu', 'Fernando'])
    expect(decoded.h[1].numero).toBe(1)
    expect(decoded.h[1].misturado).toBe(false)
    expect(decoded.h[1].times['1']).toEqual(['Gregory', 'Fernando'])
    expect(decoded.i).toBe(0)
    expect(decoded.c).toBe(2)
  })

  it('deve retornar null para codigo invalido', () => {
    expect(decodificarDaURL('invalido!!!')).toBeNull()
  })
})

describe('App', () => {
  beforeEach(() => {
    render(<App />)
  })

  describe('Renderizacao inicial', () => {
    it('deve renderizar o titulo', () => {
      expect(screen.getByText('Futevôlei Cidade Alta')).toBeInTheDocument()
    })

    it('deve renderizar o subtitulo', () => {
      expect(screen.getByText('Quarta-feira - 19h às 21h')).toBeInTheDocument()
    })

    it('deve renderizar 4 times', () => {
      expect(screen.getByText('Gregory')).toBeInTheDocument()
      expect(screen.getByText('Fernando')).toBeInTheDocument()
      expect(screen.getByText('Rafa')).toBeInTheDocument()
      expect(screen.getByText('Carlinhos')).toBeInTheDocument()
      expect(screen.getByText('Tiago')).toBeInTheDocument()
      expect(screen.getByText('Lucas')).toBeInTheDocument()
      expect(screen.getByText('Dudu')).toBeInTheDocument()
      expect(screen.getByText('Cavalo')).toBeInTheDocument()
    })

    it('deve renderizar botao Times Fixos', () => {
      expect(screen.getByText('Times Fixos')).toBeInTheDocument()
    })

    it('deve renderizar botao Times Misturados', () => {
      expect(screen.getByText('Times Misturados')).toBeInTheDocument()
    })

    it('deve renderizar botao Gerar Partidas', () => {
      expect(screen.getByText('Gerar Partidas')).toBeInTheDocument()
    })

    it('deve renderizar secao Cronograma', () => {
      expect(screen.getByText('Cronograma')).toBeInTheDocument()
    })

    it('deve renderizar secao Estatisticas', () => {
      expect(screen.getByText('Estatísticas')).toBeInTheDocument()
    })
  })

  describe('Geracao de partidas', () => {
    it('deve gerar partidas ao carregar', async () => {
      await waitFor(() => {
        expect(screen.getByText('19:00')).toBeInTheDocument()
      })
    })

    it('deve mostrar 10 partidas', async () => {
      await waitFor(() => {
        for (let i = 1; i <= 10; i++) {
          const partidas = screen.getAllByText(i.toString())
          expect(partidas.length).toBeGreaterThan(0)
        }
      })
    })

    it('deve mostrar horarios das partidas', async () => {
      await waitFor(() => {
        expect(screen.getByText('19:00')).toBeInTheDocument()
        expect(screen.getByText('19:15')).toBeInTheDocument()
        expect(screen.getByText('19:30')).toBeInTheDocument()
      })
    })

    it('deve incrementar numero da geracao ao clicar Gerar Partidas', async () => {
      const btnGerar = screen.getByText('Gerar Partidas')

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      fireEvent.click(btnGerar)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
  })

  describe('Historico de geracoes', () => {
    it('deve mostrar botao de geracao', async () => {
      await waitFor(() => {
        expect(screen.getByText('Geração:')).toBeInTheDocument()
      })
    })

    it('deve manter maximo de 3 geracoes no historico', async () => {
      const btnGerar = screen.getByText('Gerar Partidas')

      for (let i = 0; i < 5; i++) {
        fireEvent.click(btnGerar)
      }

      await waitFor(() => {
        const btnsHistorico = screen.getAllByRole('button').filter(btn =>
          btn.classList.contains('btn-historico')
        )
        expect(btnsHistorico).toHaveLength(3)
      })
    })
  })

  describe('Selecao de times', () => {
    it('todos os times devem estar selecionados inicialmente', async () => {
      await waitFor(() => {
        const checkboxes = document.querySelectorAll('.time-checkbox.checked')
        expect(checkboxes).toHaveLength(4)
      })
    })

    it('deve permitir deselecionar time clicando nele', async () => {
      await waitFor(() => {
        const timeItems = document.querySelectorAll('.time-item')
        expect(timeItems.length).toBe(4)
      })

      const timeItems = document.querySelectorAll('.time-item')
      fireEvent.click(timeItems[0])

      await waitFor(() => {
        const checkboxes = document.querySelectorAll('.time-checkbox.checked')
        expect(checkboxes).toHaveLength(3)
      })
    })

    it('nao deve permitir menos de 2 times selecionados', async () => {
      await waitFor(() => {
        const timeItems = document.querySelectorAll('.time-item')
        expect(timeItems.length).toBe(4)
      })

      const timeItems = document.querySelectorAll('.time-item')

      fireEvent.click(timeItems[0])
      fireEvent.click(timeItems[1])

      await waitFor(() => {
        const checkboxes = document.querySelectorAll('.time-checkbox.checked')
        expect(checkboxes.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('Times Fixos vs Misturados', () => {
    it('Times Fixos deve estar ativo inicialmente', async () => {
      await waitFor(() => {
        const btnFixos = screen.getByText('Times Fixos')
        expect(btnFixos.classList.contains('btn-active')).toBe(true)
      })
    })

    it('deve trocar para Times Misturados ao clicar', async () => {
      const btnMisturados = screen.getByText('Times Misturados')
      fireEvent.click(btnMisturados)

      await waitFor(() => {
        expect(btnMisturados.classList.contains('btn-active')).toBe(true)
      })
    })

    it('deve mostrar badge Misturados quando times estao misturados', async () => {
      const btnMisturados = screen.getByText('Times Misturados')
      fireEvent.click(btnMisturados)

      await waitFor(() => {
        expect(screen.getByText('Misturados')).toBeInTheDocument()
      })
    })

    it('deve voltar para Times Fixos ao clicar no botao', async () => {
      const btnMisturados = screen.getByText('Times Misturados')
      fireEvent.click(btnMisturados)

      await waitFor(() => {
        expect(screen.getByText('Misturados')).toBeInTheDocument()
      })

      const btnFixos = screen.getByText('Times Fixos')
      fireEvent.click(btnFixos)

      await waitFor(() => {
        expect(btnFixos.classList.contains('btn-active')).toBe(true)
        expect(screen.queryByText('Misturados')).not.toBeInTheDocument()
      })
    })
  })

  describe('Estatisticas', () => {
    it('deve mostrar Jogos por Time', async () => {
      await waitFor(() => {
        expect(screen.getByText('Jogos por Time')).toBeInTheDocument()
      })
    })

    it('deve mostrar Confrontos', async () => {
      await waitFor(() => {
        expect(screen.getByText('Confrontos')).toBeInTheDocument()
      })
    })

    it('deve mostrar Espera Maxima com 4 times', async () => {
      await waitFor(() => {
        expect(screen.getByText('Espera Máxima')).toBeInTheDocument()
      })
    })

    it('cada time deve ter 5 jogos', async () => {
      await waitFor(() => {
        const valores5 = screen.getAllByText('5')
        expect(valores5.length).toBeGreaterThanOrEqual(4)
      })
    })
  })
})
