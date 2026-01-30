import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBX1BgAMaIumkJJUoSywGqY_sOjMjb-wF0",
  authDomain: "futevolei-cidade-alta.firebaseapp.com",
  projectId: "futevolei-cidade-alta",
  storageBucket: "futevolei-cidade-alta.firebasestorage.app",
  messagingSenderId: "608810413498",
  appId: "1:608810413498:web:d84c7f0f2eb22456b46a17"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
