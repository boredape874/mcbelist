---
title: 커뮤니티 등록
---

<script setup>
import { ref } from 'vue'
import { getDb } from './.vitepress/firebase.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from './.vitepress/composables/useAuth.js'
import AuthModal from './.vitepress/components/AuthModal.vue'

const { user, loading: authLoading } = useAuth()

const showAuthModal = ref(false)

const formData = ref({
  name: '',
  description: '',
  category: '서버',
  link: '',
  tags: ''
})

const submitting = ref(false)
const message = ref('')
const messageType = ref('')

const categories = ['서버', '디스코드', '카페', '커뮤니티', '기타']

function checkAuth() {
  if (!user.value) {
    showAuthModal.value = true
    return false
  }
  return true
}

async function submitCommunity() {
  if (!checkAuth()) return

  if (!formData.value.name || !formData.value.description) {
    message.value = '커뮤니티 이름과 설명을 입력해주세요.'
    messageType.value = 'error'
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const db = getDb()
    const tagsArray = formData.value.tags
      ? formData.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : []

    await addDoc(collection(db, 'communities'), {
      name: formData.value.name,
      description: formData.value.description,
      category: formData.value.category,
      link: formData.value.link,
      tags: tagsArray,
      createdAt: serverTimestamp(),
      createdBy: user.value.uid,
      createdByEmail: user.value.email
    })

    message.value = '커뮤니티가 성공적으로 등록되었습니다!'
    messageType.value = 'success'

    formData.value = {
      name: '',
      description: '',
      category: '서버',
      link: '',
      tags: ''
    }
  } catch (err) {
    message.value = '등록 중 오류가 발생했습니다: ' + err.message
    messageType.value = 'error'
    console.error('커뮤니티 등록 실패:', err)
  } finally {
    submitting.value = false
  }
}
</script>

# 커뮤니티 등록

베드락 에디션 커뮤니티를 등록하고 많은 사람들과 공유하세요!

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

<style scoped>
.submit-form {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-sizing: border-box;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
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

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.message.success {
  background: var(--vp-c-success-soft);
  color: var(--vp-c-success);
  border: 1px solid var(--vp-c-success);
}

.message.error {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
  border: 1px solid var(--vp-c-danger);
}

.loading, .auth-required {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.auth-required {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.auth-required p {
  margin-bottom: 1.5rem;
  color: var(--vp-c-text-1);
}

.login-button {
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.login-button:hover {
  background: var(--vp-c-brand-dark);
}
</style>

<AuthModal
  :show="showAuthModal"
  @close="showAuthModal = false"
  initialMode="login"
/>
