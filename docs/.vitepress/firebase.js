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
let storage

export async function initFirebase() {
  if (typeof window === 'undefined') {
    return { app: null, analytics: null, db: null, auth: null, storage: null }
  }

  if (!app) {
    const { initializeApp } = await import('firebase/app')
    const { getAnalytics } = await import('firebase/analytics')
    const { getFirestore } = await import('firebase/firestore')
    const { getAuth } = await import('firebase/auth')
    const { getStorage } = await import('firebase/storage')

    app = initializeApp(firebaseConfig)
    analytics = getAnalytics(app)
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
  }
  return { app, analytics, db, auth, storage }
}

export async function getDb() {
  if (typeof window === 'undefined') {
    return null
  }
  if (!db) {
    await initFirebase()
  }
  return db
}

export async function getAuth() {
  if (typeof window === 'undefined') {
    return null
  }
  if (!auth) {
    await initFirebase()
  }
  return auth
}

export async function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }
  if (!storage) {
    await initFirebase()
  }
  return storage
}
