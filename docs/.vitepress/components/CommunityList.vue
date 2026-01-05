<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDb } from '../firebase.js'
import { useAuth } from '../composables/useAuth.js'
import { CATEGORIES } from '../constants.js'

const { user } = useAuth()
const communities = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('전체')

onMounted(async () => {
  try {
    const db = await getDb()
    if (!db) {
      loading.value = false
      return
    }

    const { collection, query, where, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore')
    const q = query(
      collection(db, 'communities'),
      where('status', '==', 'approved'),
      firestoreOrderBy('order', 'desc'),
      firestoreOrderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)

    communities.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error fetching communities:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
})

const filteredCommunities = computed(() => {
  let result = communities.value

  if (selectedCategory.value !== '전체') {
    result = result.filter(c => c.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  return result
})

const likeCount = (community) => {
  return community.likes ? community.likes.length : 0
}

const dislikeCount = (community) => {
  return community.dislikes ? community.dislikes.length : 0
}

const hasLiked = (community) => {
  if (!user.value) return false
  return community.likes && community.likes.includes(user.value.uid)
}

const hasDisliked = (community) => {
  if (!user.value) return false
  return community.dislikes && community.dislikes.includes(user.value.uid)
}

async function toggleLike(community) {
  if (!user.value) {
    alert('로그인이 필요합니다.')
    return
  }

  const db = await getDb()
  const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore')
  const communityRef = doc(db, 'communities', community.id)

  try {
    if (hasLiked(community)) {
      await updateDoc(communityRef, {
        likes: arrayRemove(user.value.uid)
      })
      community.likes = community.likes.filter(uid => uid !== user.value.uid)
    } else {
      await updateDoc(communityRef, {
        likes: arrayUnion(user.value.uid),
        dislikes: arrayRemove(user.value.uid)
      })
      if (!community.likes) community.likes = []
      community.likes.push(user.value.uid)
      if (community.dislikes) {
        community.dislikes = community.dislikes.filter(uid => uid !== user.value.uid)
      }
    }
  } catch (err) {
    console.error('Error toggling like:', err)
    alert('오류가 발생했습니다.')
  }
}

async function toggleDislike(community) {
  if (!user.value) {
    alert('로그인이 필요합니다.')
    return
  }

  const db = await getDb()
  const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore')
  const communityRef = doc(db, 'communities', community.id)

  try {
    if (hasDisliked(community)) {
      await updateDoc(communityRef, {
        dislikes: arrayRemove(user.value.uid)
      })
      community.dislikes = community.dislikes.filter(uid => uid !== user.value.uid)
    } else {
      await updateDoc(communityRef, {
        dislikes: arrayUnion(user.value.uid),
        likes: arrayRemove(user.value.uid)
      })
      if (!community.dislikes) community.dislikes = []
      community.dislikes.push(user.value.uid)
      if (community.likes) {
        community.likes = community.likes.filter(uid => uid !== user.value.uid)
      }
    }
  } catch (err) {
    console.error('Error toggling dislike:', err)
    alert('오류가 발생했습니다.')
  }
}
</script>

<template>
  <div class="community-browser">
    <div v-if="loading" class="state state--loading">
      로딩 중...
    </div>

    <div v-else-if="error" class="state state--error">
      오류가 발생했습니다: {{ error }}
    </div>

    <div v-else>
      <div class="filters">
        <div class="filters__row">
          <div class="search-field">
            <span class="search-label">검색</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="커뮤니티 검색 (이름, 설명, 태그)"
              class="search-input"
            />
          </div>

          <div class="result-summary">
            <span class="result-count">총 {{ filteredCommunities.length }}개</span>
            <span class="result-hint">승인된 커뮤니티만 표시됩니다</span>
          </div>
        </div>

        <div class="category-filter">
          <button
            :class="['category-btn', { active: selectedCategory === '전체' }]"
            @click="selectedCategory = '전체'"
          >
            전체
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            :class="['category-btn', { active: selectedCategory === cat }]"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div v-if="filteredCommunities.length === 0" class="empty">
        <p v-if="searchQuery || selectedCategory !== '전체'">
          검색 결과가 없습니다.
        </p>
        <p v-else>
          아직 승인된 커뮤니티가 없습니다.
        </p>
      </div>

      <div v-else class="community-list">
        <div
          v-for="(community, index) in filteredCommunities"
          :key="community.id"
          class="community-card"
          :style="{ '--stagger': index }"
        >
          <div v-if="community.imageUrl" class="community-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="community-content">
            <div class="community-header">
              <h3 class="community-title">{{ community.name }}</h3>
              <span class="category">{{ community.category }}</span>
            </div>

            <p class="description">{{ community.description }}</p>

            <div v-if="community.tags && community.tags.length > 0" class="tags">
              <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>

            <div class="metrics">
              <span
                v-if="community.memberCount !== undefined && community.memberCount !== null"
                class="metric"
              >
                현재 인원 {{ community.memberCount }}명
              </span>
            </div>

            <div class="actions">
              <div class="reactions">
                <button
                  :class="['reaction-btn', 'like', { active: hasLiked(community) }]"
                  @click="toggleLike(community)"
                  :title="user ? '좋아요' : '로그인이 필요합니다'"
                >
                  좋아요 {{ likeCount(community) }}
                </button>
                <button
                  :class="['reaction-btn', 'dislike', { active: hasDisliked(community) }]"
                  @click="toggleDislike(community)"
                  :title="user ? '싫어요' : '로그인이 필요합니다'"
                >
                  싫어요 {{ dislikeCount(community) }}
                </button>
              </div>

              <a v-if="community.link" :href="community.link" target="_blank" class="link">
                방문하기 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.community-browser {
  display: grid;
  gap: 2rem;
}

.state {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: var(--vp-c-text-2);
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface-strong);
  box-shadow: var(--ui-shadow-sm);
}

.state--error {
  color: var(--vp-c-danger);
}

.filters {
  padding: 1.5rem;
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
}

.filters__row {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 220px;
}

.search-label {
  display: block;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
}

.search-input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.result-summary {
  display: grid;
  gap: 0.25rem;
  text-align: right;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.result-count {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.category-btn {
  padding: 0.45rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-surface-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  font-weight: 600;
}

.category-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.category-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: transparent;
  box-shadow: var(--ui-shadow-sm);
}

.empty {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-2);
  border-radius: var(--ui-radius-lg);
  border: 1px dashed var(--ui-border);
}

.community-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.community-card {
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  overflow: hidden;
  background: var(--ui-surface-strong);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  animation: rise-in 0.6s ease both;
  animation-delay: calc(var(--stagger, 0) * 80ms);
}

.community-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ui-shadow-md);
}

.community-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.community-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-content {
  padding: 1.4rem;
  display: grid;
  gap: 0.75rem;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.community-title {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 1.2rem;
}

.description {
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.category {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  background: rgba(63, 143, 92, 0.16);
  color: var(--vp-c-brand-dark);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  padding: 0.25rem 0.6rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

.metrics {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.metric {
  display: inline-flex;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(90, 169, 180, 0.14);
  color: var(--vp-c-text-2);
  font-size: 0.72rem;
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.3rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--ui-border);
  gap: 0.75rem;
  flex-wrap: wrap;
}

.reactions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-surface-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.8rem;
  font-weight: 600;
}

.reaction-btn:hover {
  border-color: var(--vp-c-brand);
  transform: translateY(-1px);
}

.reaction-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand-dark);
}

.link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-brand-dark);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-brand);
  background: transparent;
}

.link:hover {
  background: var(--vp-c-brand);
  color: white;
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .filters__row {
    flex-direction: column;
    align-items: stretch;
  }

  .result-summary {
    text-align: left;
  }
}
</style>
