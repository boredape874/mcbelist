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
    <div v-if="!user" class="state">
      <p>관리자 페이지는 로그인이 필요합니다.</p>
    </div>

    <div v-else-if="!isUserAdmin" class="state">
      <p>관리자 권한이 없습니다.</p>
    </div>

    <div v-else class="admin-panel">
      <div class="admin-summary">
        <div class="summary-card">
          <p class="summary-label">승인 대기</p>
          <p class="summary-value">{{ pendingCommunities.length }}</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">승인 완료</p>
          <p class="summary-value">{{ approvedCommunities.length }}</p>
        </div>
      </div>

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

        <div
          v-for="(community, index) in pendingCommunities"
          :key="community.id"
          class="admin-card"
          :style="{ '--stagger': index }"
        >
          <div v-if="community.imageUrl" class="card-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="card-content">
            <div class="card-header">
              <h3>{{ community.name }}</h3>
              <span class="category">{{ community.category }}</span>
            </div>
            <p class="description">{{ community.description }}</p>

            <div class="meta">
              <span v-if="community.tags && community.tags.length > 0" class="tags">
                <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
              </span>
            </div>

            <div v-if="community.link" class="link-info">
              링크: <a :href="community.link" target="_blank">{{ community.link }}</a>
            </div>

            <div class="member-count">
              현재 인원: {{ community.memberCount || 0 }}명
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

        <div
          v-for="(community, index) in approvedCommunities"
          :key="community.id"
          class="admin-card"
          :style="{ '--stagger': index }"
        >
          <div v-if="community.imageUrl" class="card-image">
            <img :src="community.imageUrl" :alt="community.name" />
          </div>

          <div class="card-content">
            <div class="card-header">
              <h3>{{ community.name }}</h3>
              <span class="category">{{ community.category }}</span>
            </div>
            <p class="description">{{ community.description }}</p>

            <div class="meta">
              <span v-if="community.tags && community.tags.length > 0" class="tags">
                <span v-for="tag in community.tags" :key="tag" class="tag">{{ tag }}</span>
              </span>
            </div>

            <div v-if="community.link" class="link-info">
              링크: <a :href="community.link" target="_blank">{{ community.link }}</a>
            </div>

            <div class="member-count">
              현재 인원: {{ community.memberCount || 0 }}명
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
.state {
  text-align: center;
  padding: 2.4rem 2rem;
  color: var(--vp-c-text-2);
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
}

.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 1.5rem;
}

.admin-summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.summary-card {
  padding: 1rem 1.3rem;
  border-radius: var(--ui-radius-lg);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
}

.summary-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
}

.summary-value {
  margin: 0.35rem 0 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.tabs {
  display: inline-flex;
  gap: 0.5rem;
  padding: 0.35rem;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface-2);
}

.tab {
  padding: 0.45rem 1.1rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--ui-radius-sm);
  transition: all 0.3s;
}

.tab:hover {
  color: var(--vp-c-brand);
}

.tab.active {
  background: var(--vp-c-brand);
  color: white;
  box-shadow: var(--ui-shadow-sm);
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
  border-radius: var(--ui-radius-lg);
  border: 1px dashed var(--ui-border);
}

.community-section {
  display: grid;
  gap: 1.5rem;
}

.admin-card {
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  overflow: hidden;
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
  animation: rise 0.6s ease both;
  animation-delay: calc(var(--stagger, 0) * 80ms);
}

.admin-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--ui-shadow-md);
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
  display: grid;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.admin-card h3 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 1.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description {
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category {
  display: inline-flex;
  padding: 0.3rem 0.6rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-radius: var(--ui-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  padding: 0.25rem 0.6rem;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-sm);
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

.link-info {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.link-info a {
  color: var(--vp-c-brand);
  word-break: break-all;
}

.member-count,
.creator-info,
.stats {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.order-control {
  padding: 0.75rem;
  background: var(--ui-surface-2);
  border-radius: var(--ui-radius-md);
  border: 1px solid var(--ui-border);
}

.order-control label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.order-input {
  width: 90px;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px dashed var(--ui-border);
  flex-wrap: wrap;
}

.btn {
  padding: 0.35rem 0.9rem;
  border: none;
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
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


