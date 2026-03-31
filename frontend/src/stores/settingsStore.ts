import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// ── Types ──
export interface EventItem {
  id: string
  name: string
  label: string
}

export interface PropertyItem {
  id: string
  name: string
  label: string
}

export interface PushAppItem {
  id: string
  appKey: string
  label: string
  platform: 'ANDROID' | 'IOS' | 'ALL'
}

export interface PersonalizationVar {
  id: string
  name: string
  label: string
  sampleValue: string
}

export interface ChannelItem {
  id: string
  type: string
  label: string
  icon: string
  color: string
  enabled: boolean
}

export interface TemplateItem {
  id: string
  channelType: string
  name: string
  title: string
  body: string
  channelConfig?: Record<string, any>
}

export interface RewardItem {
  id: string
  type: 'COUPON' | 'POINT'
  name: string
  description: string
  value: string
  enabled: boolean
}

export interface RewardTypeItem {
  id: string
  type: string
  label: string
  icon: string
  color: string
  enabled: boolean
}

// ── Defaults ──
const DEFAULT_EVENTS: EventItem[] = [
  { id: 'e1', name: 'sign_up', label: '회원 가입' },
  { id: 'e2', name: 'login', label: '로그인' },
  { id: 'e3', name: 'order_complete', label: '구매' },
  { id: 'e4', name: 'add_to_cart', label: '장바구니 추가' },
  { id: 'e5', name: 'view_product', label: '상품 조회' },
  { id: 'e6', name: 'app_open', label: '앱 실행' },
  { id: 'e7', name: 'push_click', label: '푸시 클릭' },
  { id: 'e8', name: 'download_coupon', label: '쿠폰 다운로드' },
  { id: 'e9', name: 'page_view', label: '페이지 조회' },
]

const DEFAULT_PROPERTIES: PropertyItem[] = [
  { id: 'p1', name: 'category_id', label: '카테고리 ID' },
  { id: 'p2', name: 'category_name', label: '카테고리명' },
  { id: 'p3', name: 'product_id', label: '상품 ID' },
  { id: 'p4', name: 'product_name', label: '상품명' },
  { id: 'p5', name: 'price', label: '가격' },
  { id: 'p6', name: 'quantity', label: '수량' },
  { id: 'p7', name: 'coupon_id', label: '쿠폰 ID' },
  { id: 'p8', name: 'device_type', label: '기기 유형' },
  { id: 'p9', name: 'os', label: 'OS' },
  { id: 'p10', name: 'channel', label: '채널' },
]

const DEFAULT_PUSH_APPS: PushAppItem[] = [
  { id: 'pa1', appKey: 'app_main', label: '메인 앱', platform: 'ALL' },
  { id: 'pa2', appKey: 'app_sub', label: '서브 앱', platform: 'ALL' },
]

const DEFAULT_PERSONALIZATION_VARS: PersonalizationVar[] = [
  { id: 'pv1', name: 'user_name', label: '사용자 이름', sampleValue: '홍길동' },
  { id: 'pv2', name: 'user_id', label: '사용자 ID', sampleValue: 'user_001' },
  { id: 'pv3', name: 'product_name', label: '상품명', sampleValue: '스마트워치' },
  { id: 'pv4', name: 'coupon_code', label: '쿠폰 코드', sampleValue: 'WELCOME10' },
  { id: 'pv5', name: 'order_amount', label: '주문 금액', sampleValue: '59,000원' },
]

const DEFAULT_CHANNELS: ChannelItem[] = [
  { id: 'ch1', type: 'CHANNEL_PUSH', label: '푸시 메시지', icon: '📱', color: '#4A90D9', enabled: true },
  { id: 'ch2', type: 'CHANNEL_KAKAO', label: '알림톡 메시지', icon: '💬', color: '#F5A623', enabled: true },
  { id: 'ch3', type: 'CHANNEL_BRAND_FREE', label: '브랜드 메시지 (자유형)', icon: '✉️', color: '#9B59B6', enabled: true },
  { id: 'ch4', type: 'CHANNEL_BRAND_TEMPLATE', label: '브랜드 메시지 (기본형)', icon: '📋', color: '#9B59B6', enabled: true },
  { id: 'ch5', type: 'CHANNEL_SMS', label: '문자메시지', icon: '📩', color: '#27AE60', enabled: true },
  { id: 'ch6', type: 'CHANNEL_WEBHOOK', label: '웹훅', icon: '🔗', color: '#7F8C8D', enabled: true },
]

const DEFAULT_REWARD_TYPES: RewardTypeItem[] = [
  { id: 'rt1', type: 'REWARD_COUPON', label: '쿠폰', icon: '🎟️', color: '#E67E22', enabled: true },
  { id: 'rt2', type: 'REWARD_POINT', label: '포인트', icon: '💰', color: '#E67E22', enabled: true },
]

const DEFAULT_REWARDS: RewardItem[] = [
  { id: 'rw1', type: 'COUPON', name: '신규 가입 쿠폰', description: '신규 회원 가입 시 지급되는 할인 쿠폰', value: '10% 할인', enabled: true },
  { id: 'rw2', type: 'COUPON', name: '첫 구매 쿠폰', description: '첫 구매 시 사용 가능한 할인 쿠폰', value: '5,000원 할인', enabled: true },
  { id: 'rw3', type: 'COUPON', name: '생일 축하 쿠폰', description: '생일 달에 지급되는 특별 쿠폰', value: '15% 할인', enabled: true },
  { id: 'rw4', type: 'POINT', name: '리뷰 작성 포인트', description: '상품 리뷰 작성 시 적립 포인트', value: '500P', enabled: true },
  { id: 'rw5', type: 'POINT', name: '출석 체크 포인트', description: '일일 출석 체크 시 적립 포인트', value: '100P', enabled: true },
  { id: 'rw6', type: 'POINT', name: '추천인 포인트', description: '친구 추천 성공 시 적립 포인트', value: '2,000P', enabled: false },
]

const DEFAULT_TEMPLATES: TemplateItem[] = [
  { id: 'tpl1', channelType: 'CHANNEL_PUSH', name: '환영 푸시', title: '환영합니다!', body: '가입을 축하드립니다. 지금 바로 첫 혜택을 확인해보세요.' },
  { id: 'tpl2', channelType: 'CHANNEL_PUSH', name: '장바구니 리마인드', title: '장바구니에 담긴 상품이 있어요', body: '잊지 마세요! 장바구니에 담아둔 상품을 지금 구매하세요.' },
  { id: 'tpl3', channelType: 'CHANNEL_KAKAO', name: '주문 완료 알림톡', title: '주문 완료', body: '주문이 정상적으로 완료되었습니다. 주문번호: {{order_id}}' },
]

// ── Storage ──
const KEYS = {
  events: 'campaign-settings-events',
  properties: 'campaign-settings-properties',
  pushApps: 'campaign-settings-push-apps',
  vars: 'campaign-settings-personalization-vars',
  channels: 'campaign-settings-channels',
  templates: 'campaign-settings-templates',
  rewards: 'campaign-settings-rewards',
  rewardTypes: 'campaign-settings-reward-types',
} as const

function load<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(defaults))
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

let idSeq = Date.now()
function nextId() {
  return `item-${++idSeq}`
}

// ── Helper: generic CRUD factory (no auto-save) ──
function createCrud<T extends { id: string }>(
  list: ReturnType<typeof ref<T[]>>,
) {
  return {
    add(item: Omit<T, 'id'>) {
      list.value.push({ id: nextId(), ...item } as T)
    },
    update(id: string, patch: Partial<T>) {
      const found = list.value.find((i) => i.id === id)
      if (found) Object.assign(found, patch)
    },
    remove(id: string) {
      list.value = list.value.filter((i) => i.id !== id)
    },
  }
}

// ── Store ──
export const useSettingsStore = defineStore('settings', () => {
  const events = ref<EventItem[]>(load(KEYS.events, DEFAULT_EVENTS))
  const properties = ref<PropertyItem[]>(load(KEYS.properties, DEFAULT_PROPERTIES))
  const pushApps = ref<PushAppItem[]>(load(KEYS.pushApps, DEFAULT_PUSH_APPS))
  const personalizationVars = ref<PersonalizationVar[]>(load(KEYS.vars, DEFAULT_PERSONALIZATION_VARS))
  const channels = ref<ChannelItem[]>(load(KEYS.channels, DEFAULT_CHANNELS))
  const templates = ref<TemplateItem[]>(load(KEYS.templates, DEFAULT_TEMPLATES))
  const rewards = ref<RewardItem[]>(load(KEYS.rewards, DEFAULT_REWARDS))
  const rewardTypes = ref<RewardTypeItem[]>(load(KEYS.rewardTypes, DEFAULT_REWARD_TYPES))

  const eventsCrud = createCrud(events)
  const propertiesCrud = createCrud(properties)
  const pushAppsCrud = createCrud(pushApps)
  const varsCrud = createCrud(personalizationVars)
  const channelsCrud = createCrud(channels)
  const templatesCrud = createCrud(templates)
  const rewardsCrud = createCrud(rewards)
  const rewardTypesCrud = createCrud(rewardTypes)

  // ── Dirty tracking ──
  const isDirty = ref(false)
  let snapshot = takeSnapshot()

  function takeSnapshot() {
    return JSON.stringify({
      events: events.value,
      properties: properties.value,
      pushApps: pushApps.value,
      personalizationVars: personalizationVars.value,
      channels: channels.value,
      templates: templates.value,
      rewards: rewards.value,
      rewardTypes: rewardTypes.value,
    })
  }

  watch([events, properties, pushApps, personalizationVars, channels, templates, rewards, rewardTypes], () => {
    isDirty.value = JSON.stringify({
      events: events.value,
      properties: properties.value,
      pushApps: pushApps.value,
      personalizationVars: personalizationVars.value,
      channels: channels.value,
      templates: templates.value,
      rewards: rewards.value,
      rewardTypes: rewardTypes.value,
    }) !== snapshot
  }, { deep: true })

  function saveAll() {
    save(KEYS.events, events.value)
    save(KEYS.properties, properties.value)
    save(KEYS.pushApps, pushApps.value)
    save(KEYS.vars, personalizationVars.value)
    save(KEYS.channels, channels.value)
    save(KEYS.templates, templates.value)
    save(KEYS.rewards, rewards.value)
    save(KEYS.rewardTypes, rewardTypes.value)
    snapshot = takeSnapshot()
    isDirty.value = false
  }

  function discardAll() {
    events.value = load(KEYS.events, DEFAULT_EVENTS)
    properties.value = load(KEYS.properties, DEFAULT_PROPERTIES)
    pushApps.value = load(KEYS.pushApps, DEFAULT_PUSH_APPS)
    personalizationVars.value = load(KEYS.vars, DEFAULT_PERSONALIZATION_VARS)
    channels.value = load(KEYS.channels, DEFAULT_CHANNELS)
    templates.value = load(KEYS.templates, DEFAULT_TEMPLATES)
    rewards.value = load(KEYS.rewards, DEFAULT_REWARDS)
    rewardTypes.value = load(KEYS.rewardTypes, DEFAULT_REWARD_TYPES)
    snapshot = takeSnapshot()
    isDirty.value = false
  }

  // backward-compat aliases
  function addEvent(name: string, label: string) { eventsCrud.add({ name, label } as any) }
  function updateEvent(id: string, name: string, label: string) { eventsCrud.update(id, { name, label } as any) }
  function removeEvent(id: string) { eventsCrud.remove(id) }
  function addProperty(name: string, label: string) { propertiesCrud.add({ name, label } as any) }
  function updateProperty(id: string, name: string, label: string) { propertiesCrud.update(id, { name, label } as any) }
  function removeProperty(id: string) { propertiesCrud.remove(id) }

  function resetToDefaults() {
    events.value = JSON.parse(JSON.stringify(DEFAULT_EVENTS))
    properties.value = JSON.parse(JSON.stringify(DEFAULT_PROPERTIES))
    pushApps.value = JSON.parse(JSON.stringify(DEFAULT_PUSH_APPS))
    personalizationVars.value = JSON.parse(JSON.stringify(DEFAULT_PERSONALIZATION_VARS))
    channels.value = JSON.parse(JSON.stringify(DEFAULT_CHANNELS))
    templates.value = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES))
    rewards.value = JSON.parse(JSON.stringify(DEFAULT_REWARDS))
    rewardTypes.value = JSON.parse(JSON.stringify(DEFAULT_REWARD_TYPES))
    saveAll()
  }

  return {
    events, properties, pushApps, personalizationVars, channels, templates, rewards, rewardTypes,
    isDirty, saveAll, discardAll,
    // events
    addEvent, updateEvent, removeEvent,
    // properties
    addProperty, updateProperty, removeProperty,
    // push apps
    addPushApp: pushAppsCrud.add, updatePushApp: pushAppsCrud.update, removePushApp: pushAppsCrud.remove,
    // personalization vars
    addVar: varsCrud.add, updateVar: varsCrud.update, removeVar: varsCrud.remove,
    // channels
    updateChannel: channelsCrud.update,
    // templates
    addTemplate: templatesCrud.add, updateTemplate: templatesCrud.update, removeTemplate: templatesCrud.remove,
    // rewards
    addReward: rewardsCrud.add, updateReward: rewardsCrud.update, removeReward: rewardsCrud.remove,
    // reward types
    updateRewardType: rewardTypesCrud.update,
    // reset
    resetToDefaults,
  }
})
