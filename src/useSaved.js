import { useState, useEffect } from 'react'
import { collection, doc, getDocs, setDoc, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export function useSaved() {
  const [savedList, setSavedList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSaved = async () => {
    try {
      const q = query(collection(db, 'saved'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setSavedList(list)
    } catch (err) {
      console.error('Error fetching saved entries:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const saveEntry = async (dateString, { jogadores, resultado }, user) => {
    const docRef = doc(db, 'saved', dateString)
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email
    }

    const existing = savedList.find(s => s.id === dateString)
    const data = {
      date: dateString,
      jogadores,
      resultado,
      updatedBy: userData,
      updatedAt: serverTimestamp()
    }

    if (!existing) {
      data.createdBy = userData
      data.createdAt = serverTimestamp()
    }

    await setDoc(docRef, data, { merge: true })
    await fetchSaved()
  }

  return { savedList, loading, saveEntry }
}
