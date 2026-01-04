<template>
  <div class="user-menu">
    <div v-if="loading" class="loading">...</div>

    <div v-else-if="user" class="user-info">
      <span class="user-email">{{ user.email }}</span>
      <button @click="handleLogout" class="logout-button">로그아웃</button>
    </div>

    <button v-else @click="showAuthModal = true" class="login-button">
      로그인
    </button>

    <AuthModal
      :show="showAuthModal"
      @close="showAuthModal = false"
      initialMode="login"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import AuthModal from './AuthModal.vue'

const { user, loading, logout } = useAuth()
const showAuthModal = ref(false)

async function handleLogout() {
  try {
    await logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.loading {
  color: var(--vp-c-text-2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-email {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.login-button,
.logout-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.login-button {
  background: var(--vp-c-brand);
  color: white;
}

.login-button:hover {
  background: var(--vp-c-brand-dark);
}

.logout-button {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.logout-button:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand);
}
</style>
