<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getDb } from '../firebase.js'
import { useAuth } from '../composables/useAuth.js'
import { isAdmin } from '../constants.js'

const { user, loading: authLoading } = useAuth()
const pendingCommunities = ref([])
const approvedCommunities = ref([])
const loading = ref(true)
const activeTab = ref('pending')

// user가 로드되면 실행
watch([user, authLoading], async ([currentUser, isAuthLoading]) => {
  console.log('Auth 로딩 상태:', isAuthLoading)
  console.log('현재 사용자:', currentUser)
  console.log('현재 UID:', currentUser?.uid)
  console.log('관리자 여부:', currentUser ? isAdmin(currentUser.uid) : false)

  if (isAuthLoading) {
    return // 아직 로딩 중
  }

  if (!currentUser || !isAdmin(currentUser.uid)) {
    loading.value = false
    return
  }

  await loadCommunities()
}, { immediate: true })

async function loadCommunities() {
  loading.value = true
  try {
    const db = await getDb()
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore')

    // pending 커뮤니티 로드
    try {
      const pendingQuery = query(
        collection(db, 'communities'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )
      const pendingSnapshot = await getDocs(pendingQuery)
      pendingCommunities.value = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Pending 커뮤니티 (인덱스 사용):', pendingCommunities.value.length)
    } catch (pendingErr) {
      console.error('Error loading pending communities:', pendingErr)
      // 인덱스가 없을 경우 대체 쿼리
      const allQuery = query(collection(db, 'communities'))
      const allSnapshot = await getDocs(allQuery)
      const allCommunities = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('전체 커뮤니티 수:', allCommunities.length)
      console.log('전체 커뮤니티:', allCommunities)
      pendingCommunities.value = allCommunities
        .filter(c => c.status === 'pending')
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      console.log('Pending 커뮤니티 (필터링 후):', pendingCommunities.value.length)
      console.log('Pending 커뮤니티 목록:', pendingCommunities.value)
    }

    // approved 커뮤니티 로드
    try {
      const approvedQuery = query(
        collection(db, 'communities'),
        where('status', '==', 'approved'),
        orderBy('order', 'desc'),
        orderBy('createdAt', 'desc')
      )
      const approvedSnapshot = await getDocs(approvedQuery)
      approvedCommunities.value = approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (approvedErr) {
      console.error('Error loading approved communities:', approvedErr)
      // 인덱스가 없을 경우 대체 쿼리
      const allQuery = query(collection(db, 'communities'))
      const allSnapshot = await getDocs(allQuery)
      approvedCommunities.value = allSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.status === 'approved')
        .sort((a, b) => {
          const orderDiff = (b.order || 0) - (a.order || 0)
          if (orderDiff !== 0) return orderDiff
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        })
    }
  } catch (err) {
    console.error('Error loading communities:', err)
    alert('커뮤니티 목록을 불러오는데 실패했습니다: ' + err.message)
  } finally {
    loading.value = false
  }
}

async function approveCommunity(communityId) {
  if (!confirm('이 커뮤니티를 승인하시겠습니까?')) return

  try {
    const db = await getDb()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'communities', communityId), {
      status: 'approved'
    })

    await loadCommunities()
    alert('승인되었습니다.')
  } catch (err) {
    console.error('Error approving community:', err)
    alert('승인 처리에 실패했습니다.')
  }
}

async function rejectCommunity(communityId) {
  if (!confirm('이 커뮤니티를 거절하시겠습니까?')) return

  try {
    const db = await getDb()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'communities', communityId), {
      status: 'rejected'
    })

    await loadCommunities()
    alert('거절되었습니다.')
  } catch (err) {
    console.error('Error rejecting community:', err)
    alert('거절 처리에 실패했습니다.')
  }
}

async function deleteCommunity(communityId) {
  if (!confirm('정말로 이 커뮤니티를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

  try {
    const db = await getDb()
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'communities', communityId))

    await loadCommunities()
    alert('삭제되었습니다.')
  } catch (err) {
    console.error('Error deleting community:', err)
    alert('삭제에 실패했습니다.')
  }
}

async function changeOrder(communityId, newOrder) {
  try {
    const db = await getDb()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'communities', communityId), {
      order: parseInt(newOrder)
    })

    await loadCommunities()
  } catch (err) {
    console.error('Error updating order:', err)
    alert('순위 변경에 실패했습니다.')
  }
}

const isUserAdmin = computed(() => {
  return user.value && isAdmin(user.value.uid)
})
</script>

<template>
  <div>
    <div v-if="!user" class="not-logged-in">
      <p>관리자 페이지는 로그인이 필요합니다.</p>
    </div>

    <div v-else-if="!isUserAdmin" class="not-admin">
      <p>관리자 권한이 없습니다.</p>
    </div>

    <div v-else class="admin-panel">
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'pending' }]"
          @click="activeTab = 'pending'"
        >
          승인 대기 ({{ pendingCommunities.length }})
        </button>
        <button
          :class="['tab', { active: activeTab === 'approved' }]"
          @click="activeTab = 'approved'"
        >
          승인됨 ({{ approvedCommunities.length }})
        </button>
      </div>

      <div v-if="loading" class="loading">
        로딩 중...
      </div>

      <div v-else-if="activeTab === 'pending'" class="community-section">
        <div v-if="pendingCommunities.length === 0" class="empty">
          승인 대기중인 커뮤니티가 없습니다.
        </div>

        <div v-for="community in pendingCommunities" :key="community.id" class="admin-card">
          <div v-if="community.imageUrl" class="card-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="card-content">
            <h3>{{ community.name }}</h3>
            <p class="description">{{ community.description }}</p>

            <div class="meta">
              <span class="category">{{ community.category }}</span>
              <span v-if="community.tags && community.tags.length > 0" class="tags">
                <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
              </span>
            </div>

            <div v-if="community.link" class="link-info">
              링크: <a :href="community.link" target="_blank">{{ community.link }}</a>
            </div>

            <div class="member-count">
              현인원: {{ community.memberCount || 0 }}명
            </div>

            <div class="creator-info">
              등록자: {{ community.createdByEmail || community.createdBy }}
            </div>

            <div class="admin-actions">
              <button @click="approveCommunity(community.id)" class="btn btn-approve">
                승인
              </button>
              <button @click="rejectCommunity(community.id)" class="btn btn-reject">
                거절
              </button>
              <button @click="deleteCommunity(community.id)" class="btn btn-delete">
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="community-section">
        <div v-if="approvedCommunities.length === 0" class="empty">
          승인된 커뮤니티가 없습니다.
        </div>

        <div v-for="community in approvedCommunities" :key="community.id" class="admin-card">
          <div v-if="community.imageUrl" class="card-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="card-content">
            <h3>{{ community.name }}</h3>
            <p class="description">{{ community.description }}</p>

            <div class="meta">
              <span class="category">{{ community.category }}</span>
              <span v-if="community.tags && community.tags.length > 0" class="tags">
                <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
              </span>
            </div>

            <div v-if="community.link" class="link-info">
              링크: <a :href="community.link" target="_blank">{{ community.link }}</a>
            </div>

            <div class="member-count">
              현인원: {{ community.memberCount || 0 }}명
            </div>

            <div class="stats">
              좋아요 {{ community.likes?.length || 0 }} | 싫어요 {{ community.dislikes?.length || 0 }}
            </div>

            <div class="order-control">
              <label>
                순위 (높을수록 상위):
                <input
                  type="number"
                  :value="community.order || 0"
                  @change="changeOrder(community.id, $event.target.value)"
                  class="order-input"
                />
              </label>
            </div>

            <div class="admin-actions">
              <button @click="deleteCommunity(community.id)" class="btn btn-delete">
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-logged-in, .not-admin {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-2);
}

.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--vp-c-divider);
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab:hover {
  color: var(--vp-c-brand);
}

.tab.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.empty {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.community-section {
  display: grid;
  gap: 1.5rem;
}

.admin-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 1.5rem;
}

.admin-card h3 {
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

.link-info {
  margin: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.link-info a {
  color: var(--vp-c-brand);
  word-break: break-all;
}

.member-count {
  margin: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.creator-info {
  margin: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.stats {
  margin: 0.75rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.order-control {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
}

.order-control label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.order-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #f59e0b;
  color: white;
}

.btn-reject:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}
</style>
