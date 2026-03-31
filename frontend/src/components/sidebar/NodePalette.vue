<template>
  <div class="node-palette">
    <div class="palette-group">
      <h3 class="group-title">세그먼트</h3>
      <NodePaletteItem
        v-for="item in branchItems"
        :key="item.type"
        :item="item"
      />
    </div>

    <div class="palette-group">
      <h3 class="group-title">리워드</h3>
      <NodePaletteItem
        v-for="item in rewardItems"
        :key="item.type"
        :item="item"
      />
    </div>

    <div class="palette-group">
      <h3 class="group-title">채널</h3>
      <NodePaletteItem
        v-for="item in channelItems"
        :key="item.type"
        :item="item"
      />
    </div>

    <div class="palette-group">
      <h3 class="group-title">기타</h3>
      <NodePaletteItem
        v-for="item in otherItems"
        :key="item.type"
        :item="item"
      />
    </div>

    <div class="palette-actions">
      <button class="auto-arrange-btn" @click="$emit('autoArrange')">
        자동 정렬하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NodePaletteItem from './NodePaletteItem.vue'
import { SIDEBAR_ITEMS } from '@/utils/nodeDefaults'
import { useSettingsStore } from '@/stores/settingsStore'

defineEmits<{
  autoArrange: []
}>()

const settingsStore = useSettingsStore()

// 채널: store에서 활성화된 채널만 표시하고, 색상도 store 기준으로 반영
const channelItems = computed(() => {
  return SIDEBAR_ITEMS
    .filter((item) => item.group === 'channel')
    .filter((item) => {
      const ch = settingsStore.channels.find((c) => c.type === item.type)
      return ch ? ch.enabled : true
    })
    .map((item) => {
      const ch = settingsStore.channels.find((c) => c.type === item.type)
      return ch ? { ...item, color: ch.color, label: ch.label, icon: ch.icon } : item
    })
})

const branchItems = computed(() => {
  return SIDEBAR_ITEMS.filter((item) => item.group === 'branch')
})

const rewardItems = computed(() => {
  return SIDEBAR_ITEMS
    .filter((item) => item.group === 'reward')
    .filter((item) => {
      const rt = settingsStore.rewardTypes.find((r) => r.type === item.type)
      return rt ? rt.enabled : true
    })
    .map((item) => {
      const rt = settingsStore.rewardTypes.find((r) => r.type === item.type)
      return rt ? { ...item, color: rt.color, label: rt.label, icon: rt.icon } : item
    })
})

const otherItems = computed(() => {
  return SIDEBAR_ITEMS.filter((item) => item.group === 'other')
})
</script>

<style scoped>
.node-palette {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.palette-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.auto-arrange-btn {
  width: 100%;
  padding: 10px;
  background: #f0f7ff;
  color: #1a73e8;
  border: 1px solid #d2e3fc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.auto-arrange-btn:hover {
  background: #d2e3fc;
}
</style>
