import type { SidebarNodeItem, NodeType, FlowNodeData } from '@/types/flow'

export const SIDEBAR_ITEMS: SidebarNodeItem[] = [
  // 채널
  { type: 'CHANNEL_PUSH', label: '푸시 메시지', icon: '📱', color: '#4A90D9', group: 'channel' },
  { type: 'CHANNEL_KAKAO', label: '알림톡 메시지', icon: '💬', color: '#F5A623', group: 'channel' },
  { type: 'CHANNEL_BRAND_FREE', label: '브랜드 메시지 (자유형)', icon: '✉️', color: '#9B59B6', group: 'channel' },
  { type: 'CHANNEL_BRAND_TEMPLATE', label: '브랜드 메시지 (기본형)', icon: '📋', color: '#9B59B6', group: 'channel' },
  { type: 'CHANNEL_SMS', label: '문자메시지', icon: '📩', color: '#27AE60', group: 'channel' },
  { type: 'CHANNEL_WEBHOOK', label: '웹훅', icon: '🔗', color: '#7F8C8D', group: 'channel' },
  // 세그먼트
  { type: 'BRANCH_USER', label: '사용자 기반', icon: '👤', color: '#8E44AD', group: 'branch' },
  { type: 'BRANCH_EVENT', label: '이벤트 기반', icon: '⚡', color: '#8E44AD', group: 'branch' },
  // 리워드
  { type: 'REWARD_COUPON', label: '쿠폰', icon: '🎟️', color: '#E67E22', group: 'reward' },
  { type: 'REWARD_POINT', label: '포인트', icon: '💰', color: '#E67E22', group: 'reward' },
  // 기타
  { type: 'WAIT', label: '대기 시간', icon: '⏱️', color: '#F39C12', group: 'other' },
]

export const SIDEBAR_GROUPS = [
  { key: 'channel', label: '채널' },
  { key: 'branch', label: '세그먼트' },
  { key: 'reward', label: '리워드' },
  { key: 'other', label: '기타' },
] as const

export function getDefaultNodeData(type: NodeType): FlowNodeData {
  switch (type) {
    case 'ENTRY_CONDITION':
      return {
        label: '진입 조건',
        config: {
          audienceType: 'ALL_USERS',
          events: [],
          period: { start: null, end: null },
          endCondition: 'NONE',
        },
      }
    case 'EXIT_CONDITION':
      return { label: '이탈 조건', config: {} }
    case 'CHANNEL_PUSH':
      return { label: '푸시 메시지', config: { channelType: 'PUSH', configured: false } }
    case 'CHANNEL_KAKAO':
      return { label: '알림톡 메시지', config: { channelType: 'KAKAO', configured: false } }
    case 'CHANNEL_BRAND_FREE':
      return { label: '브랜드 메시지 (자유형)', config: { channelType: 'BRAND_FREE', configured: false } }
    case 'CHANNEL_BRAND_TEMPLATE':
      return { label: '브랜드 메시지 (기본형)', config: { channelType: 'BRAND_TEMPLATE', configured: false } }
    case 'CHANNEL_SMS':
      return { label: '문자메시지', config: { channelType: 'SMS', configured: false } }
    case 'CHANNEL_WEBHOOK':
      return { label: '웹훅', config: { channelType: 'WEBHOOK', configured: false } }
    case 'BRANCH_USER':
      return {
        label: '사용자 기반',
        config: {
          branchType: 'USER',
          branches: [
            { index: 1, label: '그룹 1', condition: {} },
            { index: 2, label: '그 외 사용자', condition: {}, isDefault: true },
          ],
        },
      }
    case 'BRANCH_EVENT':
      return {
        label: '이벤트 기반',
        config: {
          branchType: 'EVENT',
          waitDuration: { value: 1, unit: 'DAY' },
          branches: [
            { index: 1, label: '구매 고객', condition: {} },
            { index: 2, label: '그 외 사용자', condition: {}, isDefault: true },
          ],
        },
      }
    case 'REWARD_COUPON':
      return {
        label: '쿠폰',
        config: {
          rewardType: 'COUPON',
          rewardId: '',
          rewardName: '',
          value: '',
          configured: false,
        },
      }
    case 'REWARD_POINT':
      return {
        label: '포인트',
        config: {
          rewardType: 'POINT',
          rewardId: '',
          rewardName: '',
          value: '',
          configured: false,
        },
      }
    case 'WAIT':
      return { label: '대기 시간', config: { duration: { value: 1, unit: 'HOUR' } } }
    case 'RESULT_SUCCESS':
      return { label: '발송 성공', config: {} }
    case 'RESULT_FAILURE':
      return { label: '발송 실패', config: {} }
  }
}

export function getNodeColor(type: NodeType): string {
  const item = SIDEBAR_ITEMS.find((i) => i.type === type)
  if (item) return item.color
  switch (type) {
    case 'ENTRY_CONDITION': return '#2C3E50'
    case 'EXIT_CONDITION': return '#2C3E50'
    case 'RESULT_SUCCESS': return '#27AE60'
    case 'RESULT_FAILURE': return '#E74C3C'
    default: return '#95A5A6'
  }
}
