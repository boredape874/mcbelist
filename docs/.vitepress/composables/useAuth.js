import { ref, onMounted } from 'vue'
import { getAuth } from '../firebase.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'

const user = ref(null)
const loading = ref(true)

export function useAuth() {
  onMounted(() => {
    const auth = getAuth()

    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      loading.value = false
    })
  })

  async function logout() {
    const auth = getAuth()
    try {
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
