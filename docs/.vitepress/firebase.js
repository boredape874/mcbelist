import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDvtopV80qKWM-LamD4mQKFep3FR-NrPAM",
  authDomain: "mcbelist.firebaseapp.com",
  projectId: "mcbelist",
  storageBucket: "mcbelist.firebasestorage.app",
  messagingSenderId: "718617217848",
  appId: "1:718617217848:web:42485742e862f125078fcd",
  measurementId: "G-ELJG8BWGNL"
}

let app
let analytics
let db
let auth

export function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig)
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app)
    }
    db = getFirestore(app)
    auth = getAuth(app)
  }
  return { app, analytics, db, auth }
}

export function getDb() {
  if (!db) {
    initFirebase()
  }
  return db
}

export function getAuth() {
  if (!auth) {
    initFirebase()
  }
  return auth
}
