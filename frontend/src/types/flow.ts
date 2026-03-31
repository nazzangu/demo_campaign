export type NodeType =
  | 'ENTRY_CONDITION'
  | 'EXIT_CONDITION'
  | 'CHANNEL_PUSH'
  | 'CHANNEL_KAKAO'
  | 'CHANNEL_BRAND_FREE'
  | 'CHANNEL_BRAND_TEMPLATE'
  | 'CHANNEL_SMS'
  | 'CHANNEL_WEBHOOK'
  | 'BRANCH_USER'
  | 'BRANCH_EVENT'
  | 'WAIT'
  | 'RESULT_SUCCESS'
  | 'RESULT_FAILURE'

export interface FlowPosition {
  x: number
  y: number
}

export interface EntryConditionConfig {
  audienceType: 'ALL_USERS' | 'SEGMENT'
  events: string[]
  period: { start: string | null; end: string | null }
  endCondition: 'NONE' | 'DATE' | 'EVENT'
}

export interface ChannelConfig {
  channelType: string
  templateId?: string
  title?: string
  body?: string
  url?: string
  configured: boolean
}

export interface PropertyFilter {
  property: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains'
  value: string
}

export interface RuleCondition {
  eventType: string
  periodType: 'SPECIFIC' | 'RELATIVE'
  specificStart: string
  specificEnd: string
  relativeDays: number
  aggregateType: 'COUNT' | 'SUM'
  aggregateOperator: '>=' | '<=' | '=' | '>' | '<'
  aggregateValue: number
  filters: PropertyFilter[]
}

export interface CohortRule {
  conditions: RuleCondition[]
  conditionOperator: 'AND' | 'OR'
}

export interface EventFilter {
  property: string
  operator: 'IN' | 'NOT_IN' | '=' | '!=' | '>' | '<' | '>=' | '<='
  value: string
}

export interface EventBranchCondition {
  eventName: string
  filters: EventFilter[]
}

export interface BranchCondition {
  index: number
  label: string
  condition: Record<string, any>
  rules?: CohortRule[]
  rulesOperator?: 'AND' | 'OR'
  eventCondition?: EventBranchCondition
  isDefault?: boolean
}

export interface BranchConfig {
  branchType: 'USER' | 'EVENT'
  waitDuration?: { value: number; unit: 'MINUTE' | 'HOUR' | 'DAY' }
  branches: BranchCondition[]
}

export interface WaitConfig {
  duration: { value: number; unit: 'MINUTE' | 'HOUR' | 'DAY' }
}

export type NodeConfig = EntryConditionConfig | ChannelConfig | BranchConfig | WaitConfig | Record<string, never>

export interface FlowNodeData {
  label: string
  config: NodeConfig
  [key: string]: any
}

export interface SidebarNodeItem {
  type: NodeType
  label: string
  icon: string
  color: string
  group: 'channel' | 'branch' | 'other'
}
