import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DIREITOS, ESQUERDOS } from './utils'

const STORAGE_KEY = 'ftv-jogadores'

function carregarDoLocalStorage() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  if (salvo) {
    try {
      return JSON.parse(salvo)
    } catch {
      return null
    }
  }
  return null
}

function salvarNoLocalStorage(jogadores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jogadores))
}

async function carregarDoFirestore(userId) {
  try {
    const snap = await getDoc(doc(db, 'jogadores', userId))
    if (snap.exists()) return snap.data()
  } catch (err) {
    console.error('Firestore load error:', err)
  }
  return null
}

async function salvarNoFirestore(userId, jogadores) {
  try {
    await setDoc(doc(db, 'jogadores', userId), jogadores)
  } catch (err) {
    console.error('Firestore save error:', err)
  }
}

export function useJogadores(user, authLoading, dadosURL) {
  const jogadoresDefault = { direitos: [...DIREITOS], esquerdos: [...ESQUERDOS] }
  const localData = carregarDoLocalStorage()
  const initial = dadosURL?.j || localData || jogadoresDefault

  const [jogadores, setJogadores] = useState(initial)
  const firestoreLoaded = useRef(false)

  useEffect(() => {
    if (authLoading || !user || firestoreLoaded.current) return
    if (dadosURL?.j) {
      firestoreLoaded.current = true
      return
    }

    let cancelled = false
    ;(async () => {
      const fsData = await carregarDoFirestore(user.uid)
      if (cancelled) return
      firestoreLoaded.current = true

      if (fsData) {
        setJogadores(fsData)
        salvarNoLocalStorage(fsData)
      } else {
        const current = carregarDoLocalStorage() || jogadoresDefault
        await salvarNoFirestore(user.uid, current)
      }
    })()

    return () => { cancelled = true }
  }, [authLoading, user])

  const salvarJogadores = (novos) => {
    setJogadores(novos)
    salvarNoLocalStorage(novos)
    if (user) {
      salvarNoFirestore(user.uid, novos)
    }
  }

  return { jogadores, salvarJogadores }
}
