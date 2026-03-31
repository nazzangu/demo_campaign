<template>
  <div class="app-shell">
    <nav class="global-nav" v-if="showNav">
      <button class="nav-home" @click="$router.push('/')">
        <span class="nav-icon">🏠</span>
        <span>홈으로</span>
      </button>
      <span class="nav-title">{{ pageTitle }}</span>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showNav = computed(() => route.path !== '/')

const pageTitle = computed(() => {
  if (route.name === 'campaign-builder') return '캠페인 빌더'
  if (route.name === 'campaign-ops') return '운영 현황'
  if (route.name === 'settings') return '설정 관리'
  return ''
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8f9fa;
  color: #333;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.global-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  background: #111827;
  flex-shrink: 0;
}

.nav-home {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.nav-home:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-icon {
  font-size: 14px;
}

.nav-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
