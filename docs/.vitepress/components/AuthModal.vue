<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <button class="close-button" @click="closeModal">×</button>

      <h2>{{ isLogin ? '로그인' : '회원가입' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">이메일</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="email@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="6자 이상"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-button">
          {{ loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입') }}
        </button>
      </form>

      <div class="toggle-mode">
        <button @click="toggleMode" class="toggle-button">
          {{ isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth } from '../firebase.js'

const props = defineProps({
  show: Boolean,
  initialMode: {
    type: String,
    default: 'login'
  }
})

const emit = defineEmits(['close', 'success'])

const isLogin = ref(props.initialMode === 'login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
}

function closeModal() {
  emit('close')
  error.value = ''
  email.value = ''
  password.value = ''
}

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    const auth = await getAuth()
    if (!auth) {
      error.value = '인증 서비스를 사용할 수 없습니다.'
      return
    }

    const {
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword
    } = await import('firebase/auth')

    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }

    emit('success')
    closeModal()
  } catch (err) {
    console.error('Auth error:', err)

    switch (err.code) {
      case 'auth/invalid-email':
        error.value = '유효하지 않은 이메일 주소입니다.'
        break
      case 'auth/user-disabled':
        error.value = '비활성화된 계정입니다.'
        break
      case 'auth/user-not-found':
        error.value = '존재하지 않는 계정입니다.'
        break
      case 'auth/wrong-password':
        error.value = '비밀번호가 올바르지 않습니다.'
        break
      case 'auth/email-already-in-use':
        error.value = '이미 사용 중인 이메일입니다.'
        break
      case 'auth/weak-password':
        error.value = '비밀번호는 최소 6자 이상이어야 합니다.'
        break
      default:
        error.value = err.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--vp-c-bg);
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--vp-c-text-2);
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-button:hover {
  color: var(--vp-c-text-1);
}

h2 {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 1rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.error-message {
  padding: 0.75rem;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-button:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  margin-top: 1rem;
}

.toggle-button {
  background: none;
  border: none;
  color: var(--vp-c-brand);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem;
}

.toggle-button:hover {
  text-decoration: underline;
}
</style>
