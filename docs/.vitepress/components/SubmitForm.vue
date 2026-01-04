<script setup>
import { ref, onMounted } from 'vue'
import { getDb, getAuth } from '../firebase.js'
import { useAuth } from '../composables/useAuth.js'
import AuthModal from './AuthModal.vue'

const { user, loading: authLoading } = useAuth()
const showAuthModal = ref(false)

const formData = ref({
  name: '',
  description: '',
  category: '서버',
  link: '',
  tags: ''
})

const categories = ['서버', '레&#xB984;', '디스코드', '커뮤니티', '기타']
const message = ref('')
const messageType = ref('')
const submitting = ref(false)

async function submitCommunity() {
  if (!formData.value.name || !formData.value.description) {
    message.value = '필수 항목을 모두 입력해주세요.'
    messageType.value = 'error'
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const db = await getDb()
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

    const communityData = {
      name: formData.value.name,
      description: formData.value.description,
      category: formData.value.category,
      link: formData.value.link || null,
      tags: formData.value.tags ? formData.value.tags.split(',').map(t => t.trim()) : [],
      createdAt: serverTimestamp(),
      createdBy: user.value.uid
    }

    await addDoc(collection(db, 'communities'), communityData)

    message.value = '커뮤니티가 성공적으로 등록되었습니다!'
    messageType.value = 'success'

    formData.value = {
      name: '',
      description: '',
      category: '서버',
      link: '',
      tags: ''
    }
  } catch (error) {
    console.error('Error adding community:', error)
    message.value = '등록 중 오류가 발생했습니다. 다시 시도해주세요.'
    messageType.value = 'error'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="authLoading" class="loading">
      로딩 중...
    </div>

    <div v-else-if="!user" class="auth-required">
      <p>커뮤니티를 등록하려면 로그인이 필요합니다.</p>
      <button @click="showAuthModal = true" class="login-button">
        로그인 / 회원가입
      </button>
    </div>

    <div v-else class="submit-form">
      <div class="form-group">
        <label for="name">커뮤니티 이름 *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          placeholder="예: 마크 베드락 서버"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">설명 *</label>
        <textarea
          id="description"
          v-model="formData.description"
          placeholder="커뮤니티에 대한 설명을 입력하세요"
          rows="4"
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="category">카테고리 *</label>
        <select id="category" v-model="formData.category">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="link">링크</label>
        <input
          id="link"
          v-model="formData.link"
          type="url"
          placeholder="https://example.com"
        />
      </div>

      <div class="form-group">
        <label for="tags">태그 (쉼표로 구분)</label>
        <input
          id="tags"
          v-model="formData.tags"
          type="text"
          placeholder="예: PvP, 생존, 미니게임"
        />
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <button
        @click="submitCommunity"
        :disabled="submitting"
        class="submit-button"
      >
        {{ submitting ? '등록 중...' : '커뮤니티 등록하기' }}
      </button>
    </div>

    <AuthModal
      :show="showAuthModal"
      @close="showAuthModal = false"
      initialMode="login"
    />
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.auth-required {
  text-align: center;
  padding: 2rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin: 2rem 0;
}

.auth-required p {
  margin-bottom: 1rem;
  color: var(--vp-c-text-2);
}

.login-button {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.login-button:hover {
  background: var(--vp-c-brand-dark);
}

.submit-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.message {
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.submit-button {
  width: 100%;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.3s;
}

.submit-button:hover:not(:disabled) {
  background: var(--vp-c-brand-dark);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
