---
title: 커뮤니티 목록
---

<script setup>
import { ref, onMounted } from 'vue'
import { getDb } from './.vitepress/firebase.js'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

const communities = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const db = getDb()
    const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)

    communities.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    error.value = err.message
    console.error('커뮤니티 목록 로드 실패:', err)
  } finally {
    loading.value = false
  }
})
</script>

# 커뮤니티 목록

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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.community-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.community-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.community-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand);
}

.description {
  color: var(--vp-c-text-2);
  margin: 0.5rem 0;
  line-height: 1.6;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.category {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.link {
  display: inline-block;
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 500;
  margin-top: 0.5rem;
}

.link:hover {
  text-decoration: underline;
}
</style>
