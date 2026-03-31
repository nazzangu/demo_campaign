<template>
  <div class="monitor-page">
    <div class="monitor-header">
      <div>
        <h1>캠페인 모니터링</h1>
        <p class="desc">캠페인 진행 현황을 실시간으로 확인합니다.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadCampaigns">
          새로고침
        </button>
      </div>
    </div>

    <!-- 캠페인 선택 -->
    <div class="campaign-selector">
      <select v-model="selectedCampaignId" class="campaign-select">
        <option :value="null" disabled>캠페인을 선택하세요</option>
        <option v-for="c in activeCampaigns" :key="c.id" :value="c.id">
          {{ c.name }} ({{ statusLabel(c.status) }})
        </option>
      </select>
    </div>

    <template v-if="selectedCampaignId && monitorData">
      <!-- 진행 상태 배너 -->
      <div class="status-banner" :class="monitorData.campaignStatus.toLowerCase()">
        <div class="banner-left">
          <span class="banner-status-dot"></span>
          <span class="banner-status-text">{{ statusLabel(monitorData.campaignStatus) }}</span>
          <span class="banner-sep">|</span>
          <span class="banner-period">{{ monitorData.startDate }} ~ {{ monitorData.endDate ?? '진행 중' }}</span>
        </div>
        <div class="banner-right">
          <span class="banner-elapsed">경과: {{ monitorData.elapsedDays }}일</span>
        </div>
      </div>

      <!-- 대상 / 발송 / 반응 요약 카드 -->
      <div class="kpi-cards">
        <div class="kpi-card">
          <span class="kpi-label">캠페인 대상</span>
          <span class="kpi-value target">{{ formatNumber(monitorData.targetCount) }}명</span>
          <span class="kpi-sub">세그먼트 추출 기준</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">실제 발송</span>
          <span class="kpi-value sent">{{ formatNumber(monitorData.sentCount) }}건</span>
          <div class="kpi-progress-wrap">
            <div class="kpi-progress">
              <div class="kpi-progress-bar" :style="{ width: monitorData.sentRate + '%' }"></div>
            </div>
            <span class="kpi-rate">{{ monitorData.sentRate }}%</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">발송 성공</span>
          <span class="kpi-value success">{{ formatNumber(monitorData.deliveredCount) }}건</span>
          <div class="kpi-progress-wrap">
            <div class="kpi-progress">
              <div class="kpi-progress-bar delivered" :style="{ width: monitorData.deliveredRate + '%' }"></div>
            </div>
            <span class="kpi-rate">{{ monitorData.deliveredRate }}%</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">발송 실패</span>
          <span class="kpi-value fail">{{ formatNumber(monitorData.failedCount) }}건</span>
          <div class="kpi-progress-wrap">
            <div class="kpi-progress">
              <div class="kpi-progress-bar failed" :style="{ width: monitorData.failedRate + '%' }"></div>
            </div>
            <span class="kpi-rate">{{ monitorData.failedRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 반응률 카드 -->
      <div class="section-card">
        <h2 class="section-title">반응률 현황</h2>
        <div class="reaction-grid">
          <div class="reaction-item">
            <div class="reaction-ring-wrap">
              <svg class="reaction-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" stroke-width="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#6366f1" stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringDash(monitorData.openRate)"
                  stroke-dashoffset="0"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span class="reaction-ring-value">{{ monitorData.openRate }}%</span>
            </div>
            <span class="reaction-label">오픈율</span>
            <span class="reaction-count">{{ formatNumber(monitorData.openCount) }}건</span>
          </div>
          <div class="reaction-item">
            <div class="reaction-ring-wrap">
              <svg class="reaction-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" stroke-width="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#10b981" stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringDash(monitorData.clickRate)"
                  stroke-dashoffset="0"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span class="reaction-ring-value">{{ monitorData.clickRate }}%</span>
            </div>
            <span class="reaction-label">클릭율</span>
            <span class="reaction-count">{{ formatNumber(monitorData.clickCount) }}건</span>
          </div>
          <div class="reaction-item">
            <div class="reaction-ring-wrap">
              <svg class="reaction-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" stroke-width="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#f59e0b" stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringDash(monitorData.conversionRate)"
                  stroke-dashoffset="0"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span class="reaction-ring-value">{{ monitorData.conversionRate }}%</span>
            </div>
            <span class="reaction-label">전환율</span>
            <span class="reaction-count">{{ formatNumber(monitorData.conversionCount) }}건</span>
          </div>
          <div class="reaction-item">
            <div class="reaction-ring-wrap">
              <svg class="reaction-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" stroke-width="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#ef4444" stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringDash(monitorData.optOutRate)"
                  stroke-dashoffset="0"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span class="reaction-ring-value">{{ monitorData.optOutRate }}%</span>
            </div>
            <span class="reaction-label">수신거부율</span>
            <span class="reaction-count">{{ formatNumber(monitorData.optOutCount) }}건</span>
          </div>
        </div>
      </div>

      <!-- 채널별 발송 현황 -->
      <div class="section-card">
        <h2 class="section-title">채널별 발송 현황</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>채널</th>
              <th class="num">대상</th>
              <th class="num">발송</th>
              <th class="num">성공</th>
              <th class="num">실패</th>
              <th class="num">오픈</th>
              <th class="num">클릭</th>
              <th class="num">오픈율</th>
              <th class="num">클릭율</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ch in monitorData.channelStats" :key="ch.channel">
              <td><span class="channel-badge" :style="{ background: ch.color }">{{ ch.channel }}</span></td>
              <td class="num">{{ formatNumber(ch.target) }}</td>
              <td class="num">{{ formatNumber(ch.sent) }}</td>
              <td class="num">{{ formatNumber(ch.delivered) }}</td>
              <td class="num fail-text">{{ formatNumber(ch.failed) }}</td>
              <td class="num">{{ formatNumber(ch.opened) }}</td>
              <td class="num">{{ formatNumber(ch.clicked) }}</td>
              <td class="num">{{ ch.openRate }}%</td>
              <td class="num">{{ ch.clickRate }}%</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>합계</strong></td>
              <td class="num"><strong>{{ formatNumber(monitorData.targetCount) }}</strong></td>
              <td class="num"><strong>{{ formatNumber(monitorData.sentCount) }}</strong></td>
              <td class="num"><strong>{{ formatNumber(monitorData.deliveredCount) }}</strong></td>
              <td class="num fail-text"><strong>{{ formatNumber(monitorData.failedCount) }}</strong></td>
              <td class="num"><strong>{{ formatNumber(monitorData.openCount) }}</strong></td>
              <td class="num"><strong>{{ formatNumber(monitorData.clickCount) }}</strong></td>
              <td class="num"><strong>{{ monitorData.openRate }}%</strong></td>
              <td class="num"><strong>{{ monitorData.clickRate }}%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- 시간대별 발송 추이 -->
      <div class="section-card">
        <h2 class="section-title">일별 발송 추이</h2>
        <div class="chart-area">
          <div class="bar-chart">
            <div
              v-for="(d, i) in monitorData.dailyStats"
              :key="i"
              class="bar-col"
            >
              <div class="bar-tooltip">발송 {{ formatNumber(d.sent) }} / 오픈 {{ formatNumber(d.opened) }}</div>
              <div class="bar-stack">
                <div
                  class="bar bar-opened"
                  :style="{ height: barHeight(d.opened) + '%' }"
                ></div>
                <div
                  class="bar bar-sent"
                  :style="{ height: barHeight(d.sent - d.opened) + '%' }"
                ></div>
              </div>
              <span class="bar-label">{{ d.date.slice(5) }}</span>
            </div>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-dot sent"></span>발송</span>
            <span class="legend-item"><span class="legend-dot opened"></span>오픈</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 안내 메시지 -->
    <div v-if="!selectedCampaignId" class="placeholder">
      <span class="placeholder-icon">🔍</span>
      <p>모니터링할 캠페인을 선택하세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { campaignApi } from '@/api/campaignApi'
import type { Campaign, CampaignStatus } from '@/types/campaign'

const campaigns = ref<Campaign[]>([])
const selectedCampaignId = ref<number | null>(null)

onMounted(async () => {
  await loadCampaigns()
  if (activeCampaigns.value.length > 0) {
    selectedCampaignId.value = activeCampaigns.value[0].id
  }
})

async function loadCampaigns() {
  try {
    const res = await campaignApi.list()
    campaigns.value = res.data.data
  } catch {
    campaigns.value = generateDemoCampaigns()
  }
}

const activeCampaigns = computed(() =>
  campaigns.value.filter((c) => c.status !== 'DRAFT'),
)

function statusLabel(status: CampaignStatus | string) {
  const labels: Record<string, string> = {
    DRAFT: '초안', ACTIVE: '운영 중', PAUSED: '일시정지', COMPLETED: '완료', ARCHIVED: '폐기',
  }
  return labels[status] ?? status
}

// ---- 데모 데이터 ----

function generateDemoCampaigns(): Campaign[] {
  return [
    { id: 1, campaignKey: 'CP-2026-001', name: '봄맞이 할인 프로모션', description: null, status: 'COMPLETED', tags: [], flowGraph: null, createdAt: '2026-02-01', updatedAt: '2026-03-15', activatedAt: '2026-02-01' },
    { id: 2, campaignKey: 'CP-2026-002', name: '신규 회원 웰컴 쿠폰', description: null, status: 'ACTIVE', tags: [], flowGraph: null, createdAt: '2026-01-15', updatedAt: '2026-03-30', activatedAt: '2026-01-20' },
    { id: 3, campaignKey: 'CP-2026-003', name: '장바구니 리마인더', description: null, status: 'ACTIVE', tags: [], flowGraph: null, createdAt: '2026-03-01', updatedAt: '2026-03-30', activatedAt: '2026-03-05' },
    { id: 4, campaignKey: 'CP-2026-004', name: '재구매 유도 캠페인', description: null, status: 'PAUSED', tags: [], flowGraph: null, createdAt: '2026-02-15', updatedAt: '2026-03-20', activatedAt: '2026-02-20' },
    { id: 5, campaignKey: 'CP-2026-005', name: 'VIP 고객 전용 혜택', description: null, status: 'COMPLETED', tags: [], flowGraph: null, createdAt: '2026-01-01', updatedAt: '2026-03-01', activatedAt: '2026-01-05' },
  ]
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function generateMonitorData(campaignId: number) {
  const rand = seededRandom(campaignId * 251)
  const campaign = campaigns.value.find((c) => c.id === campaignId)

  const targetCount = Math.round(rand() * 400000 + 50000)
  const sentCount = Math.round(targetCount * (0.85 + rand() * 0.13))
  const deliveredCount = Math.round(sentCount * (0.93 + rand() * 0.05))
  const failedCount = sentCount - deliveredCount
  const openCount = Math.round(deliveredCount * (0.25 + rand() * 0.25))
  const clickCount = Math.round(openCount * (0.15 + rand() * 0.25))
  const conversionCount = Math.round(clickCount * (0.08 + rand() * 0.15))
  const optOutCount = Math.round(deliveredCount * (0.002 + rand() * 0.008))

  const startDate = campaign?.activatedAt?.slice(0, 10) ?? '2026-03-01'
  const start = new Date(startDate)
  const now = new Date()
  const elapsedDays = Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000))

  const channels = [
    { channel: '앱푸시', color: '#6366f1' },
    { channel: '카카오톡', color: '#FEE500' },
    { channel: 'SMS', color: '#10b981' },
    { channel: '웹훅', color: '#f59e0b' },
  ]

  const channelStats = channels.map((ch) => {
    const chTarget = Math.round(targetCount * (0.15 + rand() * 0.35))
    const chSent = Math.round(chTarget * (0.88 + rand() * 0.1))
    const chDelivered = Math.round(chSent * (0.93 + rand() * 0.05))
    const chFailed = chSent - chDelivered
    const chOpened = Math.round(chDelivered * (0.2 + rand() * 0.3))
    const chClicked = Math.round(chOpened * (0.12 + rand() * 0.2))
    return {
      ...ch,
      target: chTarget,
      sent: chSent,
      delivered: chDelivered,
      failed: chFailed,
      opened: chOpened,
      clicked: chClicked,
      openRate: chDelivered > 0 ? +((chOpened / chDelivered) * 100).toFixed(1) : 0,
      clickRate: chDelivered > 0 ? +((chClicked / chDelivered) * 100).toFixed(1) : 0,
    }
  })

  const dailyStats: { date: string; sent: number; opened: number }[] = []
  const days = Math.min(elapsedDays, 30)
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const daySent = Math.round((sentCount / elapsedDays) * (0.6 + rand() * 0.8))
    const dayOpened = Math.round(daySent * (0.25 + rand() * 0.25))
    dailyStats.push({
      date: d.toISOString().slice(0, 10),
      sent: daySent,
      opened: dayOpened,
    })
  }

  return {
    campaignStatus: campaign?.status ?? 'ACTIVE',
    startDate,
    endDate: campaign?.status === 'COMPLETED' ? campaign.updatedAt?.slice(0, 10) : null,
    elapsedDays,
    targetCount,
    sentCount,
    sentRate: +((sentCount / targetCount) * 100).toFixed(1),
    deliveredCount,
    deliveredRate: +((deliveredCount / sentCount) * 100).toFixed(1),
    failedCount,
    failedRate: +((failedCount / sentCount) * 100).toFixed(1),
    openCount,
    openRate: +((openCount / deliveredCount) * 100).toFixed(1),
    clickCount,
    clickRate: +((clickCount / deliveredCount) * 100).toFixed(1),
    conversionCount,
    conversionRate: +((conversionCount / deliveredCount) * 100).toFixed(1),
    optOutCount,
    optOutRate: +((optOutCount / deliveredCount) * 100).toFixed(2),
    channelStats,
    dailyStats,
  }
}

const monitorData = computed(() => {
  if (!selectedCampaignId.value) return null
  return generateMonitorData(selectedCampaignId.value)
})

// ---- 차트 유틸 ----

const maxDailySent = computed(() => {
  if (!monitorData.value) return 1
  return Math.max(...monitorData.value.dailyStats.map((d) => d.sent), 1)
})

function barHeight(value: number) {
  return (value / maxDailySent.value) * 100
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 34 // ~213.63

function ringDash(rate: number) {
  const filled = (rate / 100) * RING_CIRCUMFERENCE
  return `${filled} ${RING_CIRCUMFERENCE}`
}

function formatNumber(n: number) {
  return n.toLocaleString('ko-KR')
}
</script>

<style scoped>
.monitor-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px 60px; }

.monitor-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.monitor-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-secondary { background: #fff; border: 1px solid #d1d5db; color: #374151; }
.btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

/* Campaign selector */
.campaign-selector { margin-bottom: 20px; }
.campaign-select { width: 100%; max-width: 440px; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; background: #fff; }

/* Status banner */
.status-banner { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; font-weight: 500; }
.status-banner.active { background: #ecfdf5; color: #059669; }
.status-banner.paused { background: #fffbeb; color: #d97706; }
.status-banner.completed { background: #eff6ff; color: #2563eb; }
.status-banner.archived { background: #f3f4f6; color: #9ca3af; }
.banner-left { display: flex; align-items: center; gap: 10px; }
.banner-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.banner-status-text { font-weight: 700; }
.banner-sep { opacity: 0.4; }
.banner-period { opacity: 0.8; }
.banner-elapsed { font-weight: 600; }

/* KPI cards */
.kpi-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.kpi-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 18px; }
.kpi-label { display: block; font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
.kpi-value { display: block; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
.kpi-value.target { color: #374151; }
.kpi-value.sent { color: #6366f1; }
.kpi-value.success { color: #059669; }
.kpi-value.fail { color: #ef4444; }
.kpi-sub { font-size: 11px; color: #9ca3af; }
.kpi-progress-wrap { display: flex; align-items: center; gap: 8px; }
.kpi-progress { flex: 1; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.kpi-progress-bar { height: 100%; background: #6366f1; border-radius: 3px; transition: width 0.5s ease; }
.kpi-progress-bar.delivered { background: #059669; }
.kpi-progress-bar.failed { background: #ef4444; }
.kpi-rate { font-size: 12px; font-weight: 700; color: #374151; min-width: 42px; text-align: right; }

/* Section card */
.section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 20px; }

/* Reaction grid */
.reaction-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
.reaction-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.reaction-ring-wrap { position: relative; width: 80px; height: 80px; }
.reaction-ring { width: 80px; height: 80px; }
.reaction-ring-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 15px; font-weight: 800; color: #111827; }
.reaction-label { font-size: 13px; font-weight: 600; color: #374151; }
.reaction-count { font-size: 12px; color: #6b7280; }

/* Data table */
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead { background: #f9fafb; }
.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
.data-table td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
.data-table tr:last-child td { border-bottom: none; }
.data-table .num { text-align: right; }
.data-table th.num { text-align: right; }
.data-table tfoot { background: #f9fafb; }
.total-row td { border-top: 2px solid #e5e7eb; font-weight: 600; }
.fail-text { color: #ef4444; }
.channel-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #fff; }

/* Bar chart */
.chart-area { overflow-x: auto; }
.bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; padding: 0 4px; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 24px; position: relative; height: 100%; justify-content: flex-end; }
.bar-stack { display: flex; flex-direction: column; width: 100%; max-width: 36px; align-items: stretch; }
.bar { width: 100%; transition: height 0.4s ease; min-height: 0; }
.bar-sent { background: #c7d2fe; border-radius: 4px 4px 0 0; }
.bar-opened { background: #6366f1; border-radius: 0 0 0 0; }
.bar-stack .bar:first-child { border-radius: 4px 4px 0 0; }
.bar-label { font-size: 9px; color: #9ca3af; margin-top: 6px; white-space: nowrap; }
.bar-tooltip { position: absolute; top: -4px; font-size: 9px; color: #6b7280; white-space: nowrap; opacity: 0; transition: opacity 0.2s; z-index: 1; }
.bar-col:hover .bar-tooltip { opacity: 1; }
.chart-legend { display: flex; gap: 16px; justify-content: center; margin-top: 14px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; }
.legend-dot.sent { background: #c7d2fe; }
.legend-dot.opened { background: #6366f1; }

/* Placeholder */
.placeholder { text-align: center; padding: 80px 20px; color: #9ca3af; }
.placeholder-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.placeholder p { font-size: 14px; }

/* Responsive */
@media (max-width: 900px) {
  .kpi-cards { grid-template-columns: repeat(2, 1fr); }
  .reaction-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
