import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export function useAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setAdminLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'admins'))
        if (cancelled) return
        if (snap.exists()) {
          const emails = snap.data().emails || []
          setIsAdmin(emails.includes(user.email))
        } else {
          setIsAdmin(false)
        }
      } catch (err) {
        console.error('Admin check error:', err)
        if (!cancelled) setIsAdmin(false)
      }
      if (!cancelled) setAdminLoading(false)
    })()

    return () => { cancelled = true }
  }, [user])

  return { isAdmin, adminLoading }
}
