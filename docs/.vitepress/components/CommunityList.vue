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
  <div>
    <div v-if="loading" class="loading">
      로딩 중...
    </div>

    <div v-else-if="error" class="error">
      오류가 발생했습니다: {{ error }}
    </div>

    <div v-else>
      <div class="filters">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="커뮤니티 검색 (이름, 설명, 태그)"
          class="search-input"
        />

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
        <div v-for="community in filteredCommunities" :key="community.id" class="community-card">
          <div v-if="community.imageUrl" class="community-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="community-content">
            <h3>{{ community.name }}</h3>
            <p class="description">{{ community.description }}</p>

            <div class="meta">
              <span class="category">{{ community.category }}</span>
              <span v-if="community.tags && community.tags.length > 0" class="tags">
                <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
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
.loading, .error {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.error {
  color: var(--vp-c-danger);
}

.filters {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.category-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.category-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.empty {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-2);
}

.community-list {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.community-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  transition: transform 0.2s, box-shadow 0.2s;
}

.community-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.community-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.community-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-content {
  padding: 1.5rem;
}

.community-card h3 {
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-brand);
  font-size: 1.25rem;
}

.description {
  color: var(--vp-c-text-2);
  margin: 0 0 1rem 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.reactions {
  display: flex;
  gap: 0.5rem;
}

.reaction-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.reaction-btn:hover {
  border-color: var(--vp-c-brand);
  transform: scale(1.05);
}

.reaction-btn.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.link {
  display: inline-block;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-brand);
}

.link:hover {
  background: var(--vp-c-brand);
  color: white;
}
</style>
