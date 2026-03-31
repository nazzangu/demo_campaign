<template>
  <div class="config-panel" v-if="node" :style="{ width: panelWidth + 'px' }">
    <div class="resize-handle" @mousedown="startResize"></div>
    <div class="panel-header">
      <h3>{{ node.data?.label }} 설정</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="panel-body">
      <EntryConditionForm
        v-if="node.type === 'ENTRY_CONDITION'"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <PushConfigForm
        v-else-if="node.type === 'CHANNEL_PUSH'"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <SmsConfigForm
        v-else-if="node.type === 'CHANNEL_SMS'"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <KakaoConfigForm
        v-else-if="node.type === 'CHANNEL_KAKAO'"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <ChannelConfigForm
        v-else-if="node.type?.startsWith('CHANNEL_')"
        :config="node.data?.config"
        :channel-type="node.type"
        @update="onUpdate"
      />
      <BranchConfigForm
        v-else-if="node.type?.startsWith('BRANCH_')"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <RewardConfigForm
        v-else-if="node.type?.startsWith('REWARD_')"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <WaitConfigForm
        v-else-if="node.type === 'WAIT'"
        :config="node.data?.config"
        @update="onUpdate"
      />
      <div v-else class="no-config">
        이 노드는 추가 설정이 없습니다.
      </div>
    </div>
    <div class="panel-footer" v-if="node.type !== 'ENTRY_CONDITION'">
      <button class="delete-btn" @click="$emit('delete')">🗑️ 노드 삭제</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import EntryConditionForm from './EntryConditionForm.vue'
import PushConfigForm from './PushConfigForm.vue'
import SmsConfigForm from './SmsConfigForm.vue'
import KakaoConfigForm from './KakaoConfigForm.vue'
import ChannelConfigForm from './ChannelConfigForm.vue'
import BranchConfigForm from './BranchConfigForm.vue'
import RewardConfigForm from './RewardConfigForm.vue'
import WaitConfigForm from './WaitConfigForm.vue'

defineProps<{
  node: any
}>()

const emit = defineEmits<{
  close: []
  updateConfig: [config: any]
  delete: []
}>()

function onUpdate(config: any) {
  emit('updateConfig', config)
}

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const panelWidth = ref(420)

function startResize(e: MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMouseMove(ev: MouseEvent) {
    const delta = startX - ev.clientX
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
    panelWidth.value = newWidth
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(() => {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})
</script>

<style scoped>
.config-panel {
  position: relative;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

.resize-handle:hover,
.resize-handle:active {
  background: rgba(99, 102, 241, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
}

.panel-body {
  padding: 16px;
  flex: 1;
}

.no-config {
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.delete-btn {
  width: 100%;
  padding: 10px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #fee2e2;
}
</style>
