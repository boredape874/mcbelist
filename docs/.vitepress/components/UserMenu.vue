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
  flex-wrap: nowrap;
}

.loading {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border);
  background: var(--ui-surface);
  box-shadow: var(--ui-shadow-sm);
  max-width: 260px;
}

.user-details {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.user-email {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-uid {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  cursor: help;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-button,
.logout-button {
  padding: 0.35rem 0.9rem;
  border-radius: var(--ui-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, color 0.2s, background 0.2s;
  border: 1px solid transparent;
  white-space: nowrap;
}

.login-button {
  background: var(--vp-c-brand);
  color: #fff;
  box-shadow: var(--ui-shadow-sm);
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--ui-shadow-md);
}

.logout-button {
  background: var(--ui-surface-muted);
  color: var(--vp-c-text-2);
  border-color: var(--ui-border);
}

.logout-button:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand);
}
</style>



