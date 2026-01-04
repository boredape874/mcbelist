<script setup>
import { ref, onMounted } from 'vue'
import { getDb } from '../firebase.js'

const communities = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const db = await getDb()
    if (!db) {
      loading.value = false
      return
    }

    const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
    const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'))
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
</script>

<template>
  <div>
    <div v-if="loading" class="loading">
      로딩 중...
    </div>

    <div v-else-if="error" class="error">
      오류가 발생했습니다: {{ error }}
    </div>

    <div v-else-if="communities.length === 0" class="empty">
      아직 등록된 커뮤니티가 없습니다. 첫 번째 커뮤니티를 등록해보세요!
    </div>

    <div v-else class="community-list">
      <div v-for="community in communities" :key="community.id" class="community-card">
        <h3>{{ community.name }}</h3>
        <p class="description">{{ community.description }}</p>
        <div class="meta">
          <span class="category">{{ community.category }}</span>
          <span v-if="community.tags" class="tags">
            <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
          </span>
        </div>
        <a v-if="community.link" :href="community.link" target="_blank" class="link">
          방문하기 →
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.error {
  color: var(--vp-c-danger);
}

.community-list {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.community-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  transition: transform 0.2s, box-shadow 0.2s;
}

.community-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.community-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand);
}

.description {
  color: var(--vp-c-text-2);
  margin: 0.5rem 0 1rem 0;
  line-height: 1.6;
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

.link {
  display: inline-block;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.link:hover {
  color: var(--vp-c-brand-dark);
}
</style>
