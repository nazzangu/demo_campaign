<template>
  <div class="list-page">
    <div class="list-header">
      <h1>캠페인 관리</h1>
      <div class="header-buttons">
        <button class="btn-ops" @click="$router.push('/ops')">운영 현황</button>
        <button class="btn-settings" @click="$router.push('/settings')">설정 관리</button>
        <button class="btn-create" @click="createCampaign">+ 새 캠페인</button>
      </div>
    </div>

    <div class="campaign-list">
      <div v-if="campaigns.length === 0" class="empty-state">
        캠페인이 없습니다. 새 캠페인을 만들어보세요.
      </div>
      <div
        v-for="c in campaigns"
        :key="c.id"
        class="campaign-card"
        @click="openBuilder(c.id)"
      >
        <div class="card-header">
          <span class="card-key">{{ c.campaignKey }}</span>
          <span class="card-status" :class="c.status.toLowerCase()">{{ statusLabel(c.status) }}</span>
        </div>
        <h3 class="card-name">{{ c.name }}</h3>
        <p class="card-desc">{{ c.description || '설명 없음' }}</p>
        <div class="card-meta">
          <span>{{ formatDate(c.updatedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { campaignApi } from '@/api/campaignApi'
import type { Campaign, CampaignStatus } from '@/types/campaign'

const router = useRouter()
const campaigns = ref<Campaign[]>([])

onMounted(async () => {
  try {
    const res = await campaignApi.list()
    campaigns.value = res.data.data
  } catch (e) {
    console.error('Failed to load campaigns:', e)
  }
})

async function createCampaign() {
  try {
    const res = await campaignApi.create({ name: '새 캠페인' })
    const campaign = res.data.data
    router.push({ name: 'campaign-builder', params: { id: campaign.id } })
  } catch (e) {
    console.error('Failed to create campaign:', e)
  }
}

function openBuilder(id: number) {
  router.push({ name: 'campaign-builder', params: { id } })
}

function statusLabel(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    DRAFT: '초안',
    ACTIVE: '운영',
    PAUSED: '일시정지',
    COMPLETED: '완료',
    ARCHIVED: '폐기',
  }
  return labels[status]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
</script>

<style scoped>
.list-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.list-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.btn-ops {
  padding: 10px 20px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-ops:hover {
  background: #1f2937;
}

.btn-settings {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-settings:hover {
  background: #e5e7eb;
}

.btn-create {
  padding: 10px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-create:hover {
  background: #1d4ed8;
}

.campaign-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: #9ca3af;
  padding: 60px 0;
  font-size: 15px;
}

.campaign-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.15s;
}

.campaign-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-key {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-status.draft { background: #f3f4f6; color: #6b7280; }
.card-status.active { background: #ecfdf5; color: #059669; }
.card-status.paused { background: #fffbeb; color: #d97706; }
.card-status.completed { background: #eff6ff; color: #2563eb; }
.card-status.archived { background: #f3f4f6; color: #9ca3af; }

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px;
}

.card-meta {
  font-size: 12px;
  color: #9ca3af;
}
</style>
