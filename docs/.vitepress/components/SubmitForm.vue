<script setup>
import { ref, onMounted } from 'vue'
import { getDb, getAuth, getStorage } from '../firebase.js'
import { useAuth } from '../composables/useAuth.js'
import AuthModal from './AuthModal.vue'
import { CATEGORIES, AVAILABLE_TAGS } from '../constants.js'

const { user, loading: authLoading } = useAuth()
const showAuthModal = ref(false)

const formData = ref({
  name: '',
  description: '',
  category: CATEGORIES[0],
  link: '',
  tags: [],
  imageUrl: ''
})

const imagePreview = ref(null)
const imageFile = ref(null)
const message = ref('')
const messageType = ref('')
const submitting = ref(false)

function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      message.value = '이미지 크기는 5MB 이하여야 합니다.'
      messageType.value = 'error'
      return
    }

    if (!file.type.startsWith('image/')) {
      message.value = '이미지 파일만 업로드 가능합니다.'
      messageType.value = 'error'
      return
    }

    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  const fileInput = document.getElementById('image')
  if (fileInput) fileInput.value = ''
}

function toggleTag(tag) {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  } else {
    formData.value.tags.push(tag)
  }
}

async function uploadImage(file) {
  const storage = await getStorage()
  const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage')

  const timestamp = Date.now()
  const fileName = `communities/${timestamp}_${file.name}`
  const fileRef = storageRef(storage, fileName)

  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  return url
}

async function submitCommunity() {
  if (!formData.value.name || !formData.value.description) {
    message.value = '필수 항목을 모두 입력해주세요.'
    messageType.value = 'error'
    return
  }

  if (formData.value.tags.length === 0) {
    message.value = '최소 1개의 태그를 선택해주세요.'
    messageType.value = 'error'
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const db = await getDb()
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

    let imageUrl = null
    if (imageFile.value) {
      imageUrl = await uploadImage(imageFile.value)
    }

    const communityData = {
      name: formData.value.name,
      description: formData.value.description,
      category: formData.value.category,
      link: formData.value.link || null,
      tags: formData.value.tags,
      imageUrl: imageUrl,
      status: 'pending',
      createdAt: serverTimestamp(),
      createdBy: user.value.uid,
      createdByEmail: user.value.email,
      likes: [],
      dislikes: [],
      order: 0
    }

    await addDoc(collection(db, 'communities'), communityData)

    message.value = '커뮤니티 등록 신청이 완료되었습니다. 관리자 승인 후 목록에 표시됩니다.'
    messageType.value = 'success'

    formData.value = {
      name: '',
      description: '',
      category: CATEGORIES[0],
      link: '',
      tags: [],
      imageUrl: ''
    }
    removeImage()
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
          placeholder="커뮤니티에 대한 설명을 입력하세요 (링크 포함 가능)"
          rows="6"
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="category">카테고리 *</label>
        <select id="category" v-model="formData.category">
          <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
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
        <label>태그 선택 * (최소 1개)</label>
        <div class="tag-selector">
          <button
            v-for="tag in AVAILABLE_TAGS"
            :key="tag"
            type="button"
            :class="['tag-button', { selected: formData.tags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="image">홍보 이미지 (선택, 최대 5MB)</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          @change="handleImageChange"
          class="file-input"
        />
        <div v-if="imagePreview" class="image-preview">
          <img :src="imagePreview" alt="미리보기" />
          <button type="button" @click="removeImage" class="remove-image">✕</button>
        </div>
      </div>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <button
        @click="submitCommunity"
        :disabled="submitting"
        class="submit-button"
      >
        {{ submitting ? '등록 중...' : '커뮤니티 등록 신청' }}
      </button>

      <p class="notice">
        등록 신청 후 관리자 승인이 필요합니다.
      </p>
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
  min-height: 120px;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.tag-button:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.tag-button.selected {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.file-input {
  padding: 0.5rem 0 !important;
}

.image-preview {
  position: relative;
  margin-top: 1rem;
  max-width: 300px;
}

.image-preview img {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.9);
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

.notice {
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  margin-top: 1rem;
}
</style>
