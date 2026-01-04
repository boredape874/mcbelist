import { ref, onMounted } from 'vue'
import { getAuth } from '../firebase.js'

const user = ref(null)
const loading = ref(true)

export function useAuth() {
  onMounted(async () => {
    const auth = await getAuth()
    if (!auth) {
      loading.value = false
      return
    }

    const { onAuthStateChanged } = await import('firebase/auth')
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      loading.value = false
    })
  })

  async function logout() {
    const auth = await getAuth()
    if (!auth) return

    try {
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
      user.value = null
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    logout
  }
}
