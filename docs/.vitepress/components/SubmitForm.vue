<script setup>
import { ref } from 'vue'
import { getDb, getStorage } from '../firebase.js'
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
  imageUrl: '',
  memberCount: 0
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
      memberCount: parseInt(formData.value.memberCount) || 0,
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
      imageUrl: '',
      memberCount: 0
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
    <div v-if="authLoading" class="state">
      로딩 중...
    </div>

    <div v-else-if="!user" class="auth-required">
      <div class="auth-card">
        <h3>로그인이 필요합니다</h3>
        <p>커뮤니티 등록은 인증된 사용자만 가능합니다.</p>
        <button @click="showAuthModal = true" class="login-button">
          로그인 / 회원가입
        </button>
      </div>
    </div>

    <div v-else class="submit-form">
      <div class="submit-layout">
        <div class="form-panel">
          <div class="form-row">
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
              <label for="category">카테고리 *</label>
              <select id="category" v-model="formData.category">
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
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

          <div class="form-row">
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
              <label for="memberCount">현재 인원</label>
              <input
                id="memberCount"
                v-model.number="formData.memberCount"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
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
              <button type="button" @click="removeImage" class="remove-image">X</button>
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

        <aside class="side-panel">
          <div class="side-card">
            <h3>등록 팁</h3>
            <ul class="guide-list">
              <li>설명에는 활동 주제와 분위기를 알려주세요.</li>
              <li>태그는 2~4개 정도가 가장 효과적입니다.</li>
              <li>홍보 이미지는 커뮤니티 대표 분위기를 담아주세요.</li>
            </ul>
          </div>
          <div class="side-card">
            <h3>승인 기준</h3>
            <p>정보가 불명확하거나 중복된 커뮤니티는 승인 보류될 수 있습니다.</p>
          </div>
        </aside>
      </div>
    </div>

    <AuthModal
      :show="showAuthModal"
      @close="showAuthModal = false"
      initialMode="login"
    />
  </div>
</template>

<style scoped>
.state {
  text-align: center;
  padding: 2.3rem;
  color: var(--vp-c-text-2);
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
}

.auth-required {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.auth-card {
  text-align: center;
  padding: 2rem;
  background: var(--ui-surface);
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  box-shadow: var(--ui-shadow-sm);
  max-width: 420px;
}

.auth-card p {
  margin-bottom: 1.5rem;
  color: var(--vp-c-text-2);
}

.login-button {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.75rem 1.4rem;
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--ui-shadow-sm);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--ui-shadow-md);
}

.submit-form {
  max-width: 1100px;
  margin: 0 auto;
}

.submit-layout {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.form-panel {
  padding: 2rem;
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-md);
}

.form-row {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-md);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.form-group textarea {
  resize: vertical;
  min-height: 140px;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-button {
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-sm);
  background: var(--ui-surface-muted);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  font-weight: 600;
}

.tag-button:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
}

.tag-button.selected {
  background: var(--vp-c-brand);
  color: white;
  border-color: transparent;
}

.file-input {
  padding: 0.5rem 0 !important;
}

.image-preview {
  position: relative;
  margin-top: 1rem;
  max-width: 320px;
}

.image-preview img {
  width: 100%;
  border-radius: var(--ui-radius-md);
  border: 1px solid var(--ui-border);
  box-shadow: var(--ui-shadow-sm);
}

.remove-image {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.9);
}

.message {
  padding: 0.85rem 1rem;
  border-radius: var(--ui-radius-md);
  margin-bottom: 1rem;
  border: 1px solid transparent;
}

.message.success {
  background: rgba(37, 99, 235, 0.12);
  color: var(--vp-c-brand-dark);
  border-color: rgba(37, 99, 235, 0.24);
}

.message.error {
  background: rgba(224, 86, 77, 0.16);
  color: var(--vp-c-danger);
  border-color: rgba(224, 86, 77, 0.3);
}

.submit-button {
  width: 100%;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
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

.notice {
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  margin-top: 1rem;
}

.side-panel {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.side-card {
  padding: 1.5rem;
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
}

.guide-list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .submit-layout {
    grid-template-columns: 1fr;
  }
}
</style>



