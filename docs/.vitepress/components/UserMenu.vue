<template>
  <div class="user-menu">
    <div v-if="loading" class="loading">...</div>

    <div v-else-if="user" class="user-info">
      <div class="user-details">
        <span class="user-email">{{ user.email }}</span>
        <span class="user-uid" :title="user.uid">UID: {{ user.uid.slice(0, 8) }}...</span>
      </div>
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
  gap: 0.6rem;
}

.loading {
  color: var(--vp-c-text-2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface-2);
}

.user-details {
  display: grid;
  gap: 0.15rem;
}

.user-email {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.user-uid {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  font-family: monospace;
  cursor: help;
}

.login-button,
.logout-button {
  padding: 0.35rem 0.9rem;
  border-radius: var(--ui-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--ui-border);
}

.login-button {
  background: var(--vp-c-brand);
  color: white;
  border-color: transparent;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--ui-shadow-sm);
}

.logout-button {
  background: transparent;
  color: var(--vp-c-text-2);
}

.logout-button:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand);
}
</style>


