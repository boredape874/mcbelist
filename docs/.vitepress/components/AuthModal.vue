<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <button class="close-button" @click="closeModal">×</button>

      <div class="modal-header">
        <p class="eyebrow">MCBeList</p>
        <h2>{{ isLogin ? '로그인' : '회원가입' }}</h2>
        <p class="modal-subtitle">
          {{ isLogin ? '등록과 반응을 위해 로그인하세요.' : '간단한 정보로 새 계정을 만들어보세요.' }}
        </p>
      </div>

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

      <div class="divider"><span>또는</span></div>

      <button @click="signInWithGoogle" :disabled="loading" class="google-button">
        <span class="google-icon">G</span>
        Google로 {{ isLogin ? '로그인' : '회원가입' }}
      </button>
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

async function signInWithGoogle() {
  loading.value = true
  error.value = ''

  try {
    const auth = await getAuth()
    if (!auth) {
      error.value = '인증 서비스를 사용할 수 없습니다.'
      return
    }

    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)

    emit('success')
    closeModal()
  } catch (err) {
    console.error('Google sign-in error:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 15, 18, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
}

.modal-content {
  background: var(--ui-surface);
  padding: 2rem 1.8rem;
  border-radius: var(--ui-radius-lg);
  max-width: 420px;
  width: 92vw;
  position: relative;
  box-shadow: var(--ui-shadow-lg);
  border: 1px solid var(--ui-border);
  animation: float-up 0.4s ease;
}

.modal-header {
  margin-bottom: 1.4rem;
}

.modal-subtitle {
  margin-top: 0.4rem;
  color: var(--vp-c-text-2);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  font-size: 1.3rem;
  cursor: pointer;
  color: var(--vp-c-text-2);
  line-height: 1;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: var(--ui-radius-sm);
  display: grid;
  place-items: center;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}

.close-button:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand);
}

h2 {
  margin: 0.2rem 0 0.3rem 0;
  color: var(--vp-c-text-1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

input {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-md);
  font-size: 1rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.error-message {
  padding: 0.75rem;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
  border-radius: var(--ui-radius-md);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  border: 1px solid rgba(224, 90, 79, 0.3);
}

.submit-button {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(120deg, var(--vp-c-brand), var(--ui-accent));
  color: #fff;
  border: none;
  border-radius: var(--ui-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--ui-shadow-sm);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--ui-shadow-md);
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
  font-size: 0.85rem;
  padding: 0.5rem;
  font-weight: 600;
}

.toggle-button:hover {
  text-decoration: underline;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ui-border);
}

.google-button {
  width: 100%;
  padding: 0.8rem;
  background: var(--ui-surface-muted);
  color: var(--vp-c-text-1);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.google-icon {
  font-weight: 800;
  color: #4285f4;
}

.google-button:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand-dark);
}

.google-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>




