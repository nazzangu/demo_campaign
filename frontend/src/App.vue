<template>
  <div class="app-shell">
    <!-- 캠페인 빌더: 사이드바 없이 전체 화면 -->
    <template v-if="route.name === 'campaign-builder'">
      <router-view />
    </template>

    <!-- 그 외: 좌측 사이드바 + 콘텐츠 -->
    <template v-else>
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="logo-icon">📊</span>
          <span class="logo-text">Campaign</span>
        </div>
        <nav class="sidebar-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path === item.to }"
          >
            <span class="nav-item-icon">{{ item.icon }}</span>
            <span class="nav-item-label">{{ item.label }}</span>
          </router-link>
        </nav>
      </aside>
      <main class="main-content">
        <router-view />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { to: '/', icon: '📈', label: '캠페인 운영 현황' },
  { to: '/campaigns', icon: '📋', label: '캠페인 목록' },
  { to: '/recommend', icon: '💡', label: '캠페인 추천' },
  { to: '/monitoring', icon: '🔍', label: '캠페인 모니터링' },
  { to: '/analytics', icon: '📊', label: '캠페인 성과 분석' },
  { to: '/templates', icon: '📝', label: '템플릿 관리' },
  { to: '/settings', icon: '⚙️', label: '설정 관리' },
]
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
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #111827;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  font-size: 22px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.nav-item-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.nav-item-label {
  white-space: nowrap;
}

/* Main content */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}
</style>
