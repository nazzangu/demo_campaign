<template>
  <div class="recommend-page">
    <div class="recommend-header">
      <div>
        <h1>캠페인 추천</h1>
        <p class="desc">과거 캠페인 이력을 기반으로 최적의 캠페인을 제안합니다.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="refreshRecommendations">새로고침</button>
      </div>
    </div>

    <!-- 과거 캠페인 성과 요약 -->
    <div class="section-card insight-card">
      <h2 class="section-title">과거 캠페인 성과 인사이트</h2>
      <div class="insight-grid">
        <div class="insight-item">
          <span class="insight-icon">📊</span>
          <div class="insight-body">
            <span class="insight-label">총 실행 캠페인</span>
            <span class="insight-value">{{ pastInsight.totalCampaigns }}개</span>
          </div>
        </div>
        <div class="insight-item">
          <span class="insight-icon">🏆</span>
          <div class="insight-body">
            <span class="insight-label">최고 전환율 채널</span>
            <span class="insight-value">{{ pastInsight.bestChannel }}</span>
          </div>
        </div>
        <div class="insight-item">
          <span class="insight-icon">🎯</span>
          <div class="insight-body">
            <span class="insight-label">평균 전환율</span>
            <span class="insight-value">{{ pastInsight.avgCvr }}%</span>
          </div>
        </div>
        <div class="insight-item">
          <span class="insight-icon">📈</span>
          <div class="insight-body">
            <span class="insight-label">최고 성과 캠페인</span>
            <span class="insight-value">{{ pastInsight.bestCampaign }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 추천 캠페인 목록 -->
    <h2 class="list-title">추천 캠페인</h2>

    <div class="recommend-list">
      <div
        v-for="rec in recommendations"
        :key="rec.id"
        class="rec-card"
        :class="{ creating: creatingId === rec.id }"
      >
        <div class="rec-badge-row">
          <span class="rec-type-badge" :style="{ background: rec.typeColor }">{{ rec.typeLabel }}</span>
          <span class="rec-confidence">신뢰도 {{ rec.confidence }}%</span>
        </div>

        <h3 class="rec-name">{{ rec.name }}</h3>
        <p class="rec-reason">{{ rec.reason }}</p>

        <!-- 예상 성과 -->
        <div class="rec-metrics">
          <div class="rec-metric">
            <span class="metric-label">예상 대상</span>
            <span class="metric-value">{{ formatNumber(rec.expectedTarget) }}명</span>
          </div>
          <div class="rec-metric">
            <span class="metric-label">예상 전환율</span>
            <span class="metric-value cvr">{{ rec.expectedCvr }}%</span>
          </div>
          <div class="rec-metric">
            <span class="metric-label">예상 매출</span>
            <span class="metric-value revenue">{{ formatCurrency(rec.expectedRevenue) }}</span>
          </div>
        </div>

        <!-- 플로우 미리보기 -->
        <div class="rec-flow-preview">
          <span class="flow-label">플로우 구성:</span>
          <div class="flow-steps">
            <span
              v-for="(step, i) in rec.flowSteps"
              :key="i"
              class="flow-step"
              :style="{ borderColor: step.color }"
            >
              <span class="step-icon">{{ step.icon }}</span>
              <span class="step-label">{{ step.label }}</span>
            </span>
            <span v-if="i < rec.flowSteps.length - 1" class="flow-arrow" v-for="(_, i) in rec.flowSteps.slice(0, -1)" :key="'a' + i">→</span>
          </div>
        </div>

        <!-- 근거 태그 -->
        <div class="rec-tags">
          <span v-for="tag in rec.tags" :key="tag" class="rec-tag">{{ tag }}</span>
        </div>

        <div class="rec-actions">
          <button
            class="btn btn-primary"
            :disabled="creatingId === rec.id"
            @click="createFromRecommendation(rec)"
          >
            <template v-if="creatingId === rec.id">생성 중...</template>
            <template v-else>캠페인 생성</template>
          </button>
          <button class="btn btn-ghost" @click="toggleDetail(rec.id)">
            {{ expandedId === rec.id ? '접기' : '상세 보기' }}
          </button>
        </div>

        <!-- 상세 근거 펼침 -->
        <div v-if="expandedId === rec.id" class="rec-detail">
          <h4>추천 근거</h4>
          <ul>
            <li v-for="(r, i) in rec.detailReasons" :key="i">{{ r }}</li>
          </ul>
          <h4>참고 캠페인</h4>
          <div class="ref-campaigns">
            <div v-for="ref in rec.refCampaigns" :key="ref.name" class="ref-item">
              <span class="ref-name">{{ ref.name }}</span>
              <span class="ref-cvr">전환율 {{ ref.cvr }}%</span>
              <span class="ref-status" :class="ref.status.toLowerCase()">{{ statusLabel(ref.status) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 토스트 -->
    <Teleport to="body">
      <div v-if="toast" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { campaignApi } from '@/api/campaignApi'
import type { CampaignStatus } from '@/types/campaign'

const router = useRouter()
const creatingId = ref<number | null>(null)
const expandedId = ref<number | null>(null)
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)

interface FlowStep {
  icon: string
  label: string
  color: string
}

interface RefCampaign {
  name: string
  cvr: number
  status: CampaignStatus
}

interface Recommendation {
  id: number
  name: string
  typeLabel: string
  typeColor: string
  confidence: number
  reason: string
  expectedTarget: number
  expectedCvr: number
  expectedRevenue: number
  flowSteps: FlowStep[]
  tags: string[]
  detailReasons: string[]
  refCampaigns: RefCampaign[]
  flowGraph: object
}

const pastInsight = ref({
  totalCampaigns: 12,
  bestChannel: '앱푸시',
  avgCvr: 4.8,
  bestCampaign: '봄맞이 할인 프로모션',
})

const recommendations = ref<Recommendation[]>([])

onMounted(refreshRecommendations)

function refreshRecommendations() {
  recommendations.value = generateRecommendations()
}

function toggleDetail(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

async function createFromRecommendation(rec: Recommendation) {
  creatingId.value = rec.id
  try {
    const res = await campaignApi.create({
      name: rec.name,
      description: rec.reason,
      tags: rec.tags,
    })
    const campaign = res.data.data
    await campaignApi.saveFlow(campaign.id, JSON.stringify(rec.flowGraph))
    showToast(`"${rec.name}" 캠페인이 생성되었습니다.`, 'success')
    setTimeout(() => {
      router.push({ name: 'campaign-builder', params: { id: campaign.id } })
    }, 800)
  } catch {
    // 데모: API 실패 시에도 빌더로 이동
    showToast(`"${rec.name}" 캠페인이 생성되었습니다. (데모)`, 'success')
    setTimeout(() => {
      router.push({ name: 'campaign-builder', params: { id: 999 } })
    }, 800)
  } finally {
    creatingId.value = null
  }
}

function showToast(message: string, type: 'success' | 'error') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function statusLabel(status: CampaignStatus) {
  const labels: Record<CampaignStatus, string> = {
    DRAFT: '초안', ACTIVE: '운영', PAUSED: '일시정지', COMPLETED: '완료', ARCHIVED: '폐기',
  }
  return labels[status]
}

function formatNumber(n: number) {
  return n.toLocaleString('ko-KR')
}

function formatCurrency(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억원'
  if (n >= 10000) return (n / 10000).toFixed(0) + '만원'
  return n.toLocaleString('ko-KR') + '원'
}

// ---- 추천 데이터 생성 ----

function generateRecommendations(): Recommendation[] {
  return [
    {
      id: 1,
      name: '휴면 고객 재활성화 캠페인',
      typeLabel: '재활성화',
      typeColor: '#ef4444',
      confidence: 92,
      reason: '최근 60일 이상 미접속 고객이 28,400명으로 증가 추세입니다. 과거 유사 캠페인에서 평균 6.2% 전환율을 기록했습니다.',
      expectedTarget: 28400,
      expectedCvr: 6.2,
      expectedRevenue: 156000000,
      flowSteps: [
        { icon: '🎯', label: '휴면 세그먼트', color: '#2C3E50' },
        { icon: '👤', label: '등급별 분기', color: '#8E44AD' },
        { icon: '🎟️', label: '쿠폰 지급', color: '#E67E22' },
        { icon: '📱', label: '앱푸시', color: '#4A90D9' },
        { icon: '⏱️', label: '3일 대기', color: '#F39C12' },
        { icon: '💬', label: '알림톡', color: '#F5A623' },
        { icon: '✅', label: '성공', color: '#27AE60' },
      ],
      tags: ['휴면고객', '재활성화', '쿠폰', '멀티채널'],
      detailReasons: [
        '60일 이상 미접속 고객 28,400명 (전월 대비 +12%)',
        '과거 "VIP 고객 전용 혜택" 캠페인에서 휴면 고객 대상 전환율 6.8% 달성',
        '앱푸시 → 알림톡 순차 발송 시 단일 채널 대비 반응률 2.3배 향상',
        '쿠폰 포함 캠페인이 미포함 대비 전환율 1.8배 높음',
      ],
      refCampaigns: [
        { name: 'VIP 고객 전용 혜택', cvr: 6.8, status: 'COMPLETED' },
        { name: '재구매 유도 캠페인', cvr: 5.1, status: 'PAUSED' },
      ],
      flowGraph: buildFlowGraph('dormant'),
    },
    {
      id: 2,
      name: '장바구니 이탈 고객 리타겟팅',
      typeLabel: '리타겟팅',
      typeColor: '#f59e0b',
      confidence: 88,
      reason: '장바구니에 상품을 담고 24시간 내 미구매한 고객이 일 평균 3,200명 발생합니다. 과거 리마인더 캠페인에서 8.5% 전환율을 기록했습니다.',
      expectedTarget: 3200,
      expectedCvr: 8.5,
      expectedRevenue: 42000000,
      flowSteps: [
        { icon: '🎯', label: '장바구니 이탈', color: '#2C3E50' },
        { icon: '⏱️', label: '2시간 대기', color: '#F39C12' },
        { icon: '📱', label: '앱푸시', color: '#4A90D9' },
        { icon: '⚡', label: '구매 확인', color: '#8E44AD' },
        { icon: '📩', label: 'SMS 리마인드', color: '#27AE60' },
        { icon: '✅', label: '성공', color: '#27AE60' },
      ],
      tags: ['장바구니이탈', '리타겟팅', '자동화', '이벤트기반'],
      detailReasons: [
        '일 평균 장바구니 이탈 고객 3,200명 (구매 전환 가능 고객)',
        '"장바구니 리마인더" 캠페인에서 전환율 8.5% 달성 (전체 평균 4.8% 대비 +77%)',
        '이탈 후 2시간 내 리타겟팅 시 24시간 후 대비 전환율 3.1배',
        '앱푸시 미반응 시 SMS 2차 발송으로 추가 2.4% 전환 확보',
      ],
      refCampaigns: [
        { name: '장바구니 리마인더', cvr: 8.5, status: 'ACTIVE' },
        { name: '봄맞이 할인 프로모션', cvr: 5.3, status: 'COMPLETED' },
      ],
      flowGraph: buildFlowGraph('cart'),
    },
    {
      id: 3,
      name: '첫 구매 유도 웰컴 시리즈',
      typeLabel: '웰컴',
      typeColor: '#10b981',
      confidence: 85,
      reason: '최근 가입 후 7일 내 미구매 고객 비율이 72%입니다. 웰컴 쿠폰 + 단계별 메시지 발송으로 첫 구매 전환율을 높일 수 있습니다.',
      expectedTarget: 15600,
      expectedCvr: 5.4,
      expectedRevenue: 89000000,
      flowSteps: [
        { icon: '🎯', label: '신규 가입', color: '#2C3E50' },
        { icon: '💬', label: '웰컴 알림톡', color: '#F5A623' },
        { icon: '🎟️', label: '쿠폰 지급', color: '#E67E22' },
        { icon: '⏱️', label: '3일 대기', color: '#F39C12' },
        { icon: '⚡', label: '구매 확인', color: '#8E44AD' },
        { icon: '📱', label: '리마인드 푸시', color: '#4A90D9' },
        { icon: '✅', label: '성공', color: '#27AE60' },
      ],
      tags: ['신규고객', '웰컴시리즈', '첫구매유도', '쿠폰'],
      detailReasons: [
        '최근 30일 신규 가입 고객 15,600명 중 72%가 7일 내 미구매',
        '"신규 회원 웰컴 쿠폰" 캠페인에서 웰컴 쿠폰 사용률 18.2%',
        '가입 직후 알림톡 발송 시 오픈율 62% (일반 캠페인 대비 +89%)',
        '3일 간격 단계별 메시지 발송이 일괄 발송 대비 전환율 2.1배',
      ],
      refCampaigns: [
        { name: '신규 회원 웰컴 쿠폰', cvr: 5.8, status: 'ACTIVE' },
        { name: 'VIP 고객 전용 혜택', cvr: 6.8, status: 'COMPLETED' },
      ],
      flowGraph: buildFlowGraph('welcome'),
    },
    {
      id: 4,
      name: '구매 주기 기반 재구매 유도',
      typeLabel: '재구매',
      typeColor: '#6366f1',
      confidence: 81,
      reason: '평균 재구매 주기(28일) 도래 고객이 8,900명입니다. 개인화 추천과 포인트 적립을 결합하면 재구매율을 높일 수 있습니다.',
      expectedTarget: 8900,
      expectedCvr: 7.1,
      expectedRevenue: 198000000,
      flowSteps: [
        { icon: '🎯', label: '재구매 주기 도래', color: '#2C3E50' },
        { icon: '👤', label: '구매 이력 분기', color: '#8E44AD' },
        { icon: '💰', label: '포인트 적립', color: '#E67E22' },
        { icon: '📱', label: '개인화 푸시', color: '#4A90D9' },
        { icon: '⏱️', label: '5일 대기', color: '#F39C12' },
        { icon: '💬', label: '알림톡', color: '#F5A623' },
        { icon: '✅', label: '성공', color: '#27AE60' },
      ],
      tags: ['재구매', '구매주기', '포인트', '개인화'],
      detailReasons: [
        '평균 재구매 주기 28일 기준 도래 고객 8,900명',
        '"재구매 유도 캠페인"에서 포인트 적립 안내 포함 시 전환율 7.3%',
        '개인화 메시지(최근 구매 상품 기반)가 일반 메시지 대비 클릭율 2.5배',
        '푸시 → 5일 후 알림톡 순차 발송으로 미반응 고객 추가 전환 3.8%',
      ],
      refCampaigns: [
        { name: '재구매 유도 캠페인', cvr: 7.3, status: 'PAUSED' },
        { name: '봄맞이 할인 프로모션', cvr: 5.3, status: 'COMPLETED' },
      ],
      flowGraph: buildFlowGraph('repurchase'),
    },
    {
      id: 5,
      name: '등급 업그레이드 촉진 캠페인',
      typeLabel: '로열티',
      typeColor: '#8b5cf6',
      confidence: 77,
      reason: '현재 실버 등급 중 골드 승급 기준 80% 이상 달성 고객이 4,200명입니다. 소액 추가 구매로 등급 업그레이드가 가능합니다.',
      expectedTarget: 4200,
      expectedCvr: 9.3,
      expectedRevenue: 67000000,
      flowSteps: [
        { icon: '🎯', label: '승급 임박 고객', color: '#2C3E50' },
        { icon: '💬', label: '승급 안내 알림톡', color: '#F5A623' },
        { icon: '⏱️', label: '2일 대기', color: '#F39C12' },
        { icon: '📱', label: '혜택 안내 푸시', color: '#4A90D9' },
        { icon: '✅', label: '성공', color: '#27AE60' },
      ],
      tags: ['등급업', '로열티', 'VIP', '타겟마케팅'],
      detailReasons: [
        '실버 등급 중 골드 승급 기준 80% 이상 달성 고객 4,200명',
        '등급 업그레이드 안내 캠페인은 평균 전환율 9.3% (최고 성과 유형)',
        '승급 혜택 명시 시 오픈율 58%, 미명시 대비 +42%',
        '알림톡 → 2일 후 푸시 조합이 해당 유형에서 최적 성과',
      ],
      refCampaigns: [
        { name: 'VIP 고객 전용 혜택', cvr: 6.8, status: 'COMPLETED' },
        { name: '신규 회원 웰컴 쿠폰', cvr: 5.8, status: 'ACTIVE' },
      ],
      flowGraph: buildFlowGraph('upgrade'),
    },
  ]
}

function buildFlowGraph(type: string): object {
  const graphs: Record<string, object> = {
    dormant: {
      nodes: [
        { id: 'entry', type: 'ENTRY_CONDITION', position: { x: 0, y: 0 }, data: { label: '휴면 고객 세그먼트', config: { audienceType: 'SEGMENT', events: ['login'], period: { start: null, end: null }, endCondition: 'NONE' } } },
        { id: 'branch1', type: 'BRANCH_USER', position: { x: 0, y: 160 }, data: { label: '등급별 분기', config: { branchType: 'USER', branches: [{ index: 1, label: 'VIP 고객', condition: {} }, { index: 2, label: '일반 고객', condition: {}, isDefault: true }] } } },
        { id: 'reward1', type: 'REWARD_COUPON', position: { x: -160, y: 320 }, data: { label: 'VIP 쿠폰 지급', config: { rewardType: 'COUPON', rewardId: '', rewardName: 'VIP 복귀 쿠폰', value: '20%', configured: true } } },
        { id: 'push1', type: 'CHANNEL_PUSH', position: { x: -160, y: 480 }, data: { label: '앱푸시 발송', config: { channelType: 'PUSH', title: '고객님, 돌아오세요!', body: '특별 혜택이 기다리고 있어요', configured: true } } },
        { id: 'wait1', type: 'WAIT', position: { x: -160, y: 640 }, data: { label: '3일 대기', config: { duration: { value: 3, unit: 'DAY' } } } },
        { id: 'kakao1', type: 'CHANNEL_KAKAO', position: { x: -160, y: 800 }, data: { label: '알림톡 발송', config: { channelType: 'KAKAO', title: '복귀 혜택 안내', configured: true } } },
        { id: 'result1', type: 'RESULT_SUCCESS', position: { x: 0, y: 960 }, data: { label: '발송 성공', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'entry', target: 'branch1' },
        { id: 'e2', source: 'branch1', target: 'reward1', sourceHandle: 'branch-0' },
        { id: 'e3', source: 'branch1', target: 'push1', sourceHandle: 'branch-1' },
        { id: 'e4', source: 'reward1', target: 'push1' },
        { id: 'e5', source: 'push1', target: 'wait1' },
        { id: 'e6', source: 'wait1', target: 'kakao1' },
        { id: 'e7', source: 'kakao1', target: 'result1' },
      ],
    },
    cart: {
      nodes: [
        { id: 'entry', type: 'ENTRY_CONDITION', position: { x: 0, y: 0 }, data: { label: '장바구니 이탈 고객', config: { audienceType: 'SEGMENT', events: ['add_to_cart'], period: { start: null, end: null }, endCondition: 'EVENT' } } },
        { id: 'wait1', type: 'WAIT', position: { x: 0, y: 160 }, data: { label: '2시간 대기', config: { duration: { value: 2, unit: 'HOUR' } } } },
        { id: 'push1', type: 'CHANNEL_PUSH', position: { x: 0, y: 320 }, data: { label: '장바구니 리마인드 푸시', config: { channelType: 'PUSH', title: '장바구니에 담은 상품이 기다려요!', body: '지금 구매하면 무료 배송', configured: true } } },
        { id: 'branch1', type: 'BRANCH_EVENT', position: { x: 0, y: 480 }, data: { label: '구매 여부 확인', config: { branchType: 'EVENT', waitDuration: { value: 1, unit: 'DAY' }, branches: [{ index: 1, label: '구매 완료', condition: {} }, { index: 2, label: '미구매', condition: {}, isDefault: true }] } } },
        { id: 'sms1', type: 'CHANNEL_SMS', position: { x: 160, y: 640 }, data: { label: 'SMS 리마인드', config: { channelType: 'SMS', title: '장바구니 상품 할인 안내', configured: true } } },
        { id: 'result1', type: 'RESULT_SUCCESS', position: { x: 0, y: 800 }, data: { label: '발송 성공', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'entry', target: 'wait1' },
        { id: 'e2', source: 'wait1', target: 'push1' },
        { id: 'e3', source: 'push1', target: 'branch1' },
        { id: 'e4', source: 'branch1', target: 'result1', sourceHandle: 'branch-0' },
        { id: 'e5', source: 'branch1', target: 'sms1', sourceHandle: 'branch-1' },
        { id: 'e6', source: 'sms1', target: 'result1' },
      ],
    },
    welcome: {
      nodes: [
        { id: 'entry', type: 'ENTRY_CONDITION', position: { x: 0, y: 0 }, data: { label: '신규 가입 고객', config: { audienceType: 'SEGMENT', events: ['sign_up'], period: { start: null, end: null }, endCondition: 'NONE' } } },
        { id: 'kakao1', type: 'CHANNEL_KAKAO', position: { x: 0, y: 160 }, data: { label: '웰컴 알림톡', config: { channelType: 'KAKAO', title: '가입을 환영합니다!', configured: true } } },
        { id: 'reward1', type: 'REWARD_COUPON', position: { x: 0, y: 320 }, data: { label: '웰컴 쿠폰 지급', config: { rewardType: 'COUPON', rewardId: '', rewardName: '신규 가입 쿠폰', value: '15%', configured: true } } },
        { id: 'wait1', type: 'WAIT', position: { x: 0, y: 480 }, data: { label: '3일 대기', config: { duration: { value: 3, unit: 'DAY' } } } },
        { id: 'branch1', type: 'BRANCH_EVENT', position: { x: 0, y: 640 }, data: { label: '구매 여부 확인', config: { branchType: 'EVENT', waitDuration: { value: 4, unit: 'DAY' }, branches: [{ index: 1, label: '구매 완료', condition: {} }, { index: 2, label: '미구매', condition: {}, isDefault: true }] } } },
        { id: 'push1', type: 'CHANNEL_PUSH', position: { x: 160, y: 800 }, data: { label: '리마인드 푸시', config: { channelType: 'PUSH', title: '쿠폰이 곧 만료돼요!', body: '지금 사용하고 혜택 받으세요', configured: true } } },
        { id: 'result1', type: 'RESULT_SUCCESS', position: { x: 0, y: 960 }, data: { label: '발송 성공', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'entry', target: 'kakao1' },
        { id: 'e2', source: 'kakao1', target: 'reward1' },
        { id: 'e3', source: 'reward1', target: 'wait1' },
        { id: 'e4', source: 'wait1', target: 'branch1' },
        { id: 'e5', source: 'branch1', target: 'result1', sourceHandle: 'branch-0' },
        { id: 'e6', source: 'branch1', target: 'push1', sourceHandle: 'branch-1' },
        { id: 'e7', source: 'push1', target: 'result1' },
      ],
    },
    repurchase: {
      nodes: [
        { id: 'entry', type: 'ENTRY_CONDITION', position: { x: 0, y: 0 }, data: { label: '재구매 주기 도래', config: { audienceType: 'SEGMENT', events: ['purchase'], period: { start: null, end: null }, endCondition: 'NONE' } } },
        { id: 'branch1', type: 'BRANCH_USER', position: { x: 0, y: 160 }, data: { label: '구매 이력 분기', config: { branchType: 'USER', branches: [{ index: 1, label: '3회 이상 구매', condition: {} }, { index: 2, label: '그 외', condition: {}, isDefault: true }] } } },
        { id: 'reward1', type: 'REWARD_POINT', position: { x: -160, y: 320 }, data: { label: '포인트 적립', config: { rewardType: 'POINT', rewardId: '', rewardName: '재구매 감사 포인트', value: '3000', configured: true } } },
        { id: 'push1', type: 'CHANNEL_PUSH', position: { x: 0, y: 480 }, data: { label: '개인화 푸시', config: { channelType: 'PUSH', title: '고객님이 좋아할 상품 추천', body: '지난번 구매하신 상품과 어울려요', configured: true } } },
        { id: 'wait1', type: 'WAIT', position: { x: 0, y: 640 }, data: { label: '5일 대기', config: { duration: { value: 5, unit: 'DAY' } } } },
        { id: 'kakao1', type: 'CHANNEL_KAKAO', position: { x: 0, y: 800 }, data: { label: '알림톡 발송', config: { channelType: 'KAKAO', title: '재구매 혜택 안내', configured: true } } },
        { id: 'result1', type: 'RESULT_SUCCESS', position: { x: 0, y: 960 }, data: { label: '발송 성공', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'entry', target: 'branch1' },
        { id: 'e2', source: 'branch1', target: 'reward1', sourceHandle: 'branch-0' },
        { id: 'e3', source: 'branch1', target: 'push1', sourceHandle: 'branch-1' },
        { id: 'e4', source: 'reward1', target: 'push1' },
        { id: 'e5', source: 'push1', target: 'wait1' },
        { id: 'e6', source: 'wait1', target: 'kakao1' },
        { id: 'e7', source: 'kakao1', target: 'result1' },
      ],
    },
    upgrade: {
      nodes: [
        { id: 'entry', type: 'ENTRY_CONDITION', position: { x: 0, y: 0 }, data: { label: '승급 임박 고객', config: { audienceType: 'SEGMENT', events: ['purchase'], period: { start: null, end: null }, endCondition: 'DATE' } } },
        { id: 'kakao1', type: 'CHANNEL_KAKAO', position: { x: 0, y: 160 }, data: { label: '승급 안내 알림톡', config: { channelType: 'KAKAO', title: '골드 등급까지 얼마 남지 않았어요!', configured: true } } },
        { id: 'wait1', type: 'WAIT', position: { x: 0, y: 320 }, data: { label: '2일 대기', config: { duration: { value: 2, unit: 'DAY' } } } },
        { id: 'push1', type: 'CHANNEL_PUSH', position: { x: 0, y: 480 }, data: { label: '혜택 안내 푸시', config: { channelType: 'PUSH', title: '골드 등급 혜택 미리보기', body: '승급 시 받으실 혜택을 확인하세요', configured: true } } },
        { id: 'result1', type: 'RESULT_SUCCESS', position: { x: 0, y: 640 }, data: { label: '발송 성공', config: {} } },
      ],
      edges: [
        { id: 'e1', source: 'entry', target: 'kakao1' },
        { id: 'e2', source: 'kakao1', target: 'wait1' },
        { id: 'e3', source: 'wait1', target: 'push1' },
        { id: 'e4', source: 'push1', target: 'result1' },
      ],
    },
  }
  return graphs[type] ?? graphs.dormant
}
</script>

<style scoped>
.recommend-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px 60px; }

.recommend-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.recommend-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-secondary { background: #fff; border: 1px solid #d1d5db; color: #374151; }
.btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }
.btn-primary { background: #6366f1; color: #fff; }
.btn-primary:hover { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #6b7280; border: 1px solid #e5e7eb; }
.btn-ghost:hover { background: #f9fafb; color: #374151; }

/* Section card */
.section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 20px; }

/* Insight */
.insight-card { background: linear-gradient(135deg, #eef2ff, #faf5ff); border-color: #c7d2fe; }
.insight-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.insight-item { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.7); border-radius: 10px; padding: 14px 16px; }
.insight-icon { font-size: 24px; }
.insight-body { display: flex; flex-direction: column; gap: 2px; }
.insight-label { font-size: 11px; color: #6b7280; font-weight: 500; }
.insight-value { font-size: 15px; font-weight: 700; color: #111827; }

/* List title */
.list-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px; }

/* Recommendation card */
.recommend-list { display: flex; flex-direction: column; gap: 16px; }
.rec-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px; transition: all 0.2s; }
.rec-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08); }
.rec-card.creating { opacity: 0.7; pointer-events: none; }

.rec-badge-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rec-type-badge { display: inline-block; padding: 3px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #fff; }
.rec-confidence { font-size: 12px; font-weight: 600; color: #6366f1; background: #eef2ff; padding: 3px 10px; border-radius: 10px; }

.rec-name { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px; }
.rec-reason { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 16px; }

/* Metrics */
.rec-metrics { display: flex; gap: 20px; margin-bottom: 16px; }
.rec-metric { display: flex; flex-direction: column; gap: 2px; }
.metric-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
.metric-value { font-size: 16px; font-weight: 800; color: #111827; }
.metric-value.cvr { color: #059669; }
.metric-value.revenue { color: #6366f1; }

/* Flow preview */
.rec-flow-preview { margin-bottom: 14px; }
.flow-label { font-size: 11px; color: #9ca3af; font-weight: 500; display: block; margin-bottom: 8px; }
.flow-steps { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.flow-step { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; }
.step-icon { font-size: 13px; }
.flow-arrow { color: #d1d5db; font-size: 12px; }

/* Tags */
.rec-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.rec-tag { font-size: 11px; color: #6366f1; background: #eef2ff; padding: 2px 10px; border-radius: 8px; font-weight: 500; }

/* Actions */
.rec-actions { display: flex; gap: 8px; }

/* Detail */
.rec-detail { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
.rec-detail h4 { font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 10px; }
.rec-detail ul { margin: 0 0 16px; padding-left: 18px; }
.rec-detail li { font-size: 13px; color: #6b7280; line-height: 1.7; }
.ref-campaigns { display: flex; flex-direction: column; gap: 6px; }
.ref-item { display: flex; align-items: center; gap: 12px; padding: 8px 14px; background: #f9fafb; border-radius: 8px; font-size: 13px; }
.ref-name { font-weight: 600; color: #374151; }
.ref-cvr { color: #059669; font-weight: 600; }
.ref-status { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 8px; }
.ref-status.active { background: #ecfdf5; color: #059669; }
.ref-status.paused { background: #fffbeb; color: #d97706; }
.ref-status.completed { background: #eff6ff; color: #2563eb; }

/* Toast */
.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #fff; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: toast-in 0.3s ease; }
.toast.success { background: #059669; }
.toast.error { background: #ef4444; }
@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* Responsive */
@media (max-width: 900px) {
  .insight-grid { grid-template-columns: repeat(2, 1fr); }
  .rec-metrics { flex-wrap: wrap; }
}
</style>
