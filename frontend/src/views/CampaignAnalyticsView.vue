<template>
  <div class="analytics-page">
    <div class="analytics-header">
      <div>
        <h1>캠페인 성과 분석</h1>
        <p class="desc">캠페인별 매출 성과 지표를 분석하고 비교할 수 있습니다.</p>
      </div>
      <div class="header-actions">
        <div class="date-range">
          <input type="date" v-model="dateFrom" class="date-input" />
          <span class="date-sep">~</span>
          <input type="date" v-model="dateTo" class="date-input" />
        </div>
        <button class="btn btn-primary" @click="loadAnalytics">조회</button>
      </div>
    </div>

    <!-- 캠페인 선택 -->
    <div class="campaign-selector">
      <div class="selector-header">
        <span class="selector-title">분석 캠페인 선택</span>
        <div class="selector-actions">
          <button class="chip" :class="{ active: viewMode === 'single' }" @click="viewMode = 'single'">단일 캠페인</button>
          <button class="chip" :class="{ active: viewMode === 'compare' }" @click="viewMode = 'compare'">다중 비교</button>
        </div>
      </div>
      <div class="selector-body">
        <div v-if="viewMode === 'single'" class="single-select">
          <select v-model="selectedCampaignId" class="campaign-select">
            <option :value="null" disabled>캠페인을 선택하세요</option>
            <option v-for="c in analyticsCampaigns" :key="c.id" :value="c.id">
              {{ c.name }} ({{ statusLabel(c.status) }})
            </option>
          </select>
        </div>
        <div v-else class="multi-select">
          <label v-for="c in analyticsCampaigns" :key="c.id" class="multi-check" :class="{ checked: selectedIds.includes(c.id) }">
            <input type="checkbox" :value="c.id" v-model="selectedIds" :disabled="!selectedIds.includes(c.id) && selectedIds.length >= 5" />
            <span class="check-label">{{ c.name }}</span>
            <span class="status-badge" :class="c.status.toLowerCase()">{{ statusLabel(c.status) }}</span>
          </label>
          <p v-if="analyticsCampaigns.length === 0" class="empty-msg">분석 가능한 캠페인이 없습니다.</p>
          <p v-else class="helper-msg">최대 5개까지 선택 가능</p>
        </div>
      </div>
    </div>

    <!-- ========== 단일 캠페인 분석 ========== -->
    <template v-if="viewMode === 'single' && selectedCampaignId">
      <!-- KPI 요약 카드 -->
      <div class="kpi-cards">
        <div class="kpi-card kpi-revenue">
          <span class="kpi-label">총 매출</span>
          <span class="kpi-value">{{ formatCurrency(singleData.totalRevenue) }}</span>
          <span class="kpi-change" :class="singleData.revenueChange >= 0 ? 'up' : 'down'">
            {{ singleData.revenueChange >= 0 ? '+' : '' }}{{ singleData.revenueChange }}% vs 이전 기간
          </span>
        </div>
        <div class="kpi-card kpi-orders">
          <span class="kpi-label">주문 건수</span>
          <span class="kpi-value">{{ formatNumber(singleData.totalOrders) }}건</span>
          <span class="kpi-change" :class="singleData.ordersChange >= 0 ? 'up' : 'down'">
            {{ singleData.ordersChange >= 0 ? '+' : '' }}{{ singleData.ordersChange }}%
          </span>
        </div>
        <div class="kpi-card kpi-aov">
          <span class="kpi-label">객단가 (AOV)</span>
          <span class="kpi-value">{{ formatCurrency(singleData.aov) }}</span>
          <span class="kpi-change" :class="singleData.aovChange >= 0 ? 'up' : 'down'">
            {{ singleData.aovChange >= 0 ? '+' : '' }}{{ singleData.aovChange }}%
          </span>
        </div>
        <div class="kpi-card kpi-cvr">
          <span class="kpi-label">전환율 (CVR)</span>
          <span class="kpi-value">{{ singleData.cvr }}%</span>
          <span class="kpi-change" :class="singleData.cvrChange >= 0 ? 'up' : 'down'">
            {{ singleData.cvrChange >= 0 ? '+' : '' }}{{ singleData.cvrChange }}%p
          </span>
        </div>
        <div class="kpi-card kpi-roas">
          <span class="kpi-label">ROAS</span>
          <span class="kpi-value">{{ singleData.roas }}%</span>
          <span class="kpi-change" :class="singleData.roasChange >= 0 ? 'up' : 'down'">
            {{ singleData.roasChange >= 0 ? '+' : '' }}{{ singleData.roasChange }}%p
          </span>
        </div>
      </div>

      <!-- 전환 퍼널 -->
      <div class="section-card">
        <h2 class="section-title">전환 퍼널</h2>
        <div class="funnel">
          <div v-for="(step, i) in singleData.funnel" :key="i" class="funnel-step">
            <div class="funnel-bar-wrap">
              <div class="funnel-bar" :style="{ width: step.rate + '%', background: funnelColors[i] }"></div>
            </div>
            <div class="funnel-info">
              <span class="funnel-label">{{ step.label }}</span>
              <span class="funnel-count">{{ formatNumber(step.count) }}</span>
              <span class="funnel-rate" :style="{ color: funnelColors[i] }">{{ step.rate }}%</span>
            </div>
            <div v-if="i < singleData.funnel.length - 1" class="funnel-drop">
              {{ funnelDropRate(singleData.funnel[i], singleData.funnel[i + 1]) }}% 이탈
            </div>
          </div>
        </div>
      </div>

      <!-- 일별 매출 추이 -->
      <div class="section-card">
        <h2 class="section-title">일별 매출 추이</h2>
        <div class="chart-area">
          <div class="bar-chart">
            <div v-for="(d, i) in singleData.dailyRevenue" :key="i" class="bar-col">
              <div class="bar-tooltip">{{ formatCurrency(d.revenue) }}</div>
              <div
                class="bar"
                :style="{
                  height: barHeight(d.revenue, singleData.dailyRevenue) + '%',
                  background: dailyBarGradient(i, singleData.dailyRevenue.length),
                }"
              ></div>
              <span class="bar-label">{{ d.date.slice(5) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 채널별 매출 성과 -->
      <div class="section-card">
        <h2 class="section-title">채널별 매출 성과</h2>
        <!-- 채널 비중 도넛 시각화 -->
        <div class="channel-visual">
          <div class="channel-donut">
            <svg viewBox="0 0 120 120">
              <circle
                v-for="(seg, i) in channelDonutSegments"
                :key="i"
                cx="60" cy="60" r="48"
                fill="none"
                :stroke="seg.color"
                stroke-width="20"
                :stroke-dasharray="seg.dash"
                :stroke-dashoffset="seg.offset"
                :style="{ transition: 'stroke-dasharray 0.5s, stroke-dashoffset 0.5s' }"
              />
            </svg>
            <div class="donut-center">
              <span class="donut-total">{{ formatCurrency(singleData.channelPerformance.reduce((s, c) => s + c.revenue, 0)) }}</span>
              <span class="donut-label">총 채널 매출</span>
            </div>
          </div>
          <div class="channel-legend">
            <div v-for="ch in singleData.channelPerformance" :key="ch.channel" class="legend-item">
              <span class="legend-dot" :style="{ background: ch.color }"></span>
              <span class="legend-name">{{ ch.channel }}</span>
              <span class="legend-value">{{ formatCurrency(ch.revenue) }}</span>
              <span class="legend-pct">{{ channelPct(ch.revenue) }}%</span>
            </div>
          </div>
        </div>
        <table class="data-table" style="margin-top: 20px;">
          <thead>
            <tr>
              <th>채널</th>
              <th class="num">발송</th>
              <th class="num">클릭</th>
              <th class="num">전환</th>
              <th class="num">매출</th>
              <th class="num">CVR</th>
              <th class="num">CPA</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ch in singleData.channelPerformance" :key="ch.channel">
              <td><span class="channel-badge" :style="{ background: ch.color }">{{ ch.channel }}</span></td>
              <td class="num">{{ formatNumber(ch.sent) }}</td>
              <td class="num">{{ formatNumber(ch.clicked) }}</td>
              <td class="num">{{ formatNumber(ch.converted) }}</td>
              <td class="num revenue-cell">{{ formatCurrency(ch.revenue) }}</td>
              <td class="num">{{ ch.cvr }}%</td>
              <td class="num">{{ formatCurrency(ch.cpa) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 발송 회원별 상세 현황 ===== -->
      <div class="section-card">
        <div class="section-header-row">
          <h2 class="section-title" style="margin-bottom: 0;">발송 회원별 상세 현황</h2>
          <div class="member-controls">
            <input v-model="memberSearch" class="member-search" placeholder="회원 ID / 이름 검색..." />
            <select v-model="memberStatusFilter" class="member-filter-select">
              <option value="ALL">전체 상태</option>
              <option value="CONVERTED">전환 완료</option>
              <option value="CLICKED">클릭</option>
              <option value="OPENED">오픈</option>
              <option value="DELIVERED">수신</option>
              <option value="SENT">발송</option>
              <option value="FAILED">실패</option>
            </select>
            <select v-model="memberChannelFilter" class="member-filter-select">
              <option value="ALL">전체 채널</option>
              <option v-for="ch in singleData.channelPerformance" :key="ch.channel" :value="ch.channel">{{ ch.channel }}</option>
            </select>
          </div>
        </div>

        <!-- 회원 요약 카드 -->
        <div class="member-summary-cards">
          <div class="member-summary-card" style="border-left: 3px solid #6366f1;">
            <span class="ms-count">{{ formatNumber(singleData.members.length) }}</span>
            <span class="ms-label">총 발송 회원</span>
          </div>
          <div class="member-summary-card" style="border-left: 3px solid #10b981;">
            <span class="ms-count">{{ formatNumber(singleData.members.filter(m => m.status === 'CONVERTED').length) }}</span>
            <span class="ms-label">전환 완료</span>
          </div>
          <div class="member-summary-card" style="border-left: 3px solid #f59e0b;">
            <span class="ms-count">{{ formatNumber(singleData.members.filter(m => m.status === 'CLICKED').length) }}</span>
            <span class="ms-label">클릭</span>
          </div>
          <div class="member-summary-card" style="border-left: 3px solid #ef4444;">
            <span class="ms-count">{{ formatNumber(singleData.members.filter(m => m.status === 'FAILED').length) }}</span>
            <span class="ms-label">실패</span>
          </div>
        </div>

        <!-- 회원 상태 분포 바 -->
        <div class="member-dist-bar">
          <div
            v-for="seg in memberDistSegments"
            :key="seg.status"
            class="dist-seg"
            :style="{ width: seg.pct + '%', background: seg.color }"
            :title="seg.label + ': ' + seg.count + '명 (' + seg.pct + '%)'"
          ></div>
        </div>
        <div class="member-dist-legend">
          <span v-for="seg in memberDistSegments" :key="seg.status" class="dist-legend-item">
            <span class="dist-legend-dot" :style="{ background: seg.color }"></span>
            {{ seg.label }} {{ seg.pct }}%
          </span>
        </div>

        <!-- 회원 상세 테이블 -->
        <table class="data-table member-table">
          <thead>
            <tr>
              <th>회원 ID</th>
              <th>이름</th>
              <th>채널</th>
              <th>발송 상태</th>
              <th>발송 시각</th>
              <th>오픈 시각</th>
              <th>클릭 시각</th>
              <th class="num">주문 금액</th>
              <th class="num">주문 건수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in paginatedMembers" :key="m.memberId">
              <td><code class="member-id">{{ m.memberId }}</code></td>
              <td class="member-name">{{ m.name }}</td>
              <td><span class="channel-badge-sm" :style="{ background: m.channelColor }">{{ m.channel }}</span></td>
              <td>
                <span class="member-status-badge" :class="'ms-' + m.status.toLowerCase()">{{ memberStatusLabel(m.status) }}</span>
              </td>
              <td class="date-cell">{{ m.sentAt }}</td>
              <td class="date-cell">{{ m.openedAt || '-' }}</td>
              <td class="date-cell">{{ m.clickedAt || '-' }}</td>
              <td class="num" :class="{ 'revenue-cell': m.orderAmount > 0 }">{{ m.orderAmount > 0 ? formatCurrency(m.orderAmount) : '-' }}</td>
              <td class="num">{{ m.orderCount > 0 ? m.orderCount + '건' : '-' }}</td>
            </tr>
            <tr v-if="filteredMembers.length === 0">
              <td colspan="9" class="empty">조건에 맞는 회원이 없습니다.</td>
            </tr>
          </tbody>
        </table>

        <!-- 페이지네이션 -->
        <div v-if="totalMemberPages > 1" class="pagination">
          <button class="page-btn" :disabled="memberPage === 1" @click="memberPage = 1">&laquo;</button>
          <button class="page-btn" :disabled="memberPage === 1" @click="memberPage--">&lsaquo;</button>
          <span class="page-info">{{ memberPage }} / {{ totalMemberPages }}</span>
          <button class="page-btn" :disabled="memberPage === totalMemberPages" @click="memberPage++">&#8250;</button>
          <button class="page-btn" :disabled="memberPage === totalMemberPages" @click="memberPage = totalMemberPages">&raquo;</button>
          <span class="page-total">총 {{ formatNumber(filteredMembers.length) }}명</span>
        </div>
      </div>
    </template>

    <!-- ========== 다중 캠페인 비교 ========== -->
    <template v-if="viewMode === 'compare' && selectedIds.length > 0">
      <div class="section-card">
        <h2 class="section-title">캠페인 성과 비교</h2>
        <table class="data-table compare-table">
          <thead>
            <tr>
              <th>캠페인</th>
              <th class="num">총 매출</th>
              <th class="num">주문수</th>
              <th class="num">객단가</th>
              <th class="num">CVR</th>
              <th class="num">ROAS</th>
              <th class="num">발송수</th>
              <th class="num">클릭수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in compareData" :key="row.id">
              <td>
                <div class="compare-name">
                  <span class="color-dot" :style="{ background: row.color }"></span>
                  {{ row.name }}
                </div>
              </td>
              <td class="num revenue-cell">{{ formatCurrency(row.totalRevenue) }}</td>
              <td class="num">{{ formatNumber(row.totalOrders) }}</td>
              <td class="num">{{ formatCurrency(row.aov) }}</td>
              <td class="num">{{ row.cvr }}%</td>
              <td class="num">{{ row.roas }}%</td>
              <td class="num">{{ formatNumber(row.sent) }}</td>
              <td class="num">{{ formatNumber(row.clicked) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-card">
        <h2 class="section-title">매출 비교 차트</h2>
        <div class="compare-bars">
          <div v-for="row in compareData" :key="row.id" class="compare-bar-row">
            <span class="compare-bar-label">
              <span class="color-dot" :style="{ background: row.color }"></span>
              {{ row.name }}
            </span>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" :style="{ width: compareBarWidth(row.totalRevenue) + '%', background: `linear-gradient(90deg, ${row.color}, ${row.colorLight})` }"></div>
            </div>
            <span class="compare-bar-value">{{ formatCurrency(row.totalRevenue) }}</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">전환율(CVR) 비교</h2>
        <div class="compare-bars">
          <div v-for="row in compareData" :key="row.id" class="compare-bar-row">
            <span class="compare-bar-label">
              <span class="color-dot" :style="{ background: row.color }"></span>
              {{ row.name }}
            </span>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" :style="{ width: (row.cvr / maxCvr * 100) + '%', background: `linear-gradient(90deg, ${row.color}, ${row.colorLight})` }"></div>
            </div>
            <span class="compare-bar-value">{{ row.cvr }}%</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">ROAS 비교</h2>
        <div class="compare-bars">
          <div v-for="row in compareData" :key="row.id" class="compare-bar-row">
            <span class="compare-bar-label">
              <span class="color-dot" :style="{ background: row.color }"></span>
              {{ row.name }}
            </span>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" :style="{ width: (row.roas / maxRoas * 100) + '%', background: `linear-gradient(90deg, ${row.color}, ${row.colorLight})` }"></div>
            </div>
            <span class="compare-bar-value">{{ row.roas }}%</span>
          </div>
        </div>
      </div>

      <!-- ===== 캠페인별 회원 상태 분포 비교 ===== -->
      <div class="section-card">
        <h2 class="section-title">캠페인별 회원 상태 분포</h2>
        <div class="stacked-chart">
          <div v-for="row in compareMembers" :key="row.id" class="stacked-row">
            <span class="stacked-label">
              <span class="color-dot" :style="{ background: row.color }"></span>
              {{ row.name }}
            </span>
            <div class="stacked-bar-track">
              <div
                v-for="seg in row.segments"
                :key="seg.status"
                class="stacked-seg"
                :style="{ width: seg.pct + '%', background: seg.color }"
                :title="`${seg.label}: ${seg.count}명 (${seg.pct}%)`"
              ></div>
            </div>
            <span class="stacked-total">{{ formatNumber(row.totalMembers) }}명</span>
          </div>
        </div>
        <div class="stacked-legend">
          <span v-for="s in statusOrder" :key="s" class="dist-legend-item">
            <span class="dist-legend-dot" :style="{ background: memberStatusColors[s] }"></span>
            {{ statusLabelsKo[s] }}
          </span>
        </div>
        <!-- 캠페인별 상태 수치 비교 테이블 -->
        <table class="data-table" style="margin-top: 16px;">
          <thead>
            <tr>
              <th>캠페인</th>
              <th class="num">전환</th>
              <th class="num">클릭</th>
              <th class="num">오픈</th>
              <th class="num">수신</th>
              <th class="num">발송</th>
              <th class="num">실패</th>
              <th class="num">전환율</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in compareMembers" :key="row.id">
              <td>
                <div class="compare-name">
                  <span class="color-dot" :style="{ background: row.color }"></span>
                  {{ row.name }}
                </div>
              </td>
              <td class="num" style="color: #10b981; font-weight: 700;">{{ row.statusCounts.CONVERTED }}</td>
              <td class="num">{{ row.statusCounts.CLICKED }}</td>
              <td class="num">{{ row.statusCounts.OPENED }}</td>
              <td class="num">{{ row.statusCounts.DELIVERED }}</td>
              <td class="num">{{ row.statusCounts.SENT }}</td>
              <td class="num" style="color: #ef4444;">{{ row.statusCounts.FAILED }}</td>
              <td class="num" style="font-weight: 700;">{{ row.conversionRate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 중복 수신 회원 분석 ===== -->
      <div class="section-card">
        <h2 class="section-title">중복 수신 회원 분석</h2>
        <div class="overlap-summary-cards">
          <div class="overlap-card" style="border-top: 3px solid #6366f1;">
            <span class="overlap-value">{{ formatNumber(overlapAnalysis.totalUnique) }}명</span>
            <span class="overlap-label">전체 고유 회원</span>
          </div>
          <div class="overlap-card" style="border-top: 3px solid #f59e0b;">
            <span class="overlap-value">{{ formatNumber(overlapAnalysis.duplicateCount) }}명</span>
            <span class="overlap-label">중복 수신 회원 (2개+)</span>
          </div>
          <div class="overlap-card" style="border-top: 3px solid #10b981;">
            <span class="overlap-value">{{ overlapAnalysis.duplicateCvr }}%</span>
            <span class="overlap-label">중복 회원 전환율</span>
          </div>
          <div class="overlap-card" style="border-top: 3px solid #3b82f6;">
            <span class="overlap-value">{{ overlapAnalysis.singleCvr }}%</span>
            <span class="overlap-label">단일 수신 전환율</span>
          </div>
        </div>
        <!-- 전환율 비교 바 -->
        <div class="overlap-compare">
          <div class="overlap-compare-row">
            <span class="overlap-compare-label">중복 수신 회원</span>
            <div class="overlap-compare-track">
              <div class="overlap-compare-fill" :style="{ width: overlapAnalysis.duplicateCvr / Math.max(overlapAnalysis.duplicateCvr, overlapAnalysis.singleCvr, 1) * 100 + '%', background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }"></div>
            </div>
            <span class="overlap-compare-val">{{ overlapAnalysis.duplicateCvr }}%</span>
          </div>
          <div class="overlap-compare-row">
            <span class="overlap-compare-label">단일 수신 회원</span>
            <div class="overlap-compare-track">
              <div class="overlap-compare-fill" :style="{ width: overlapAnalysis.singleCvr / Math.max(overlapAnalysis.duplicateCvr, overlapAnalysis.singleCvr, 1) * 100 + '%', background: 'linear-gradient(90deg, #3b82f6, #93c5fd)' }"></div>
            </div>
            <span class="overlap-compare-val">{{ overlapAnalysis.singleCvr }}%</span>
          </div>
        </div>
        <!-- 캠페인 간 중복 매트릭스 -->
        <h3 class="sub-section-title">캠페인 간 중복 회원 수</h3>
        <table class="data-table overlap-matrix">
          <thead>
            <tr>
              <th></th>
              <th v-for="row in compareMembers" :key="row.id" class="num matrix-header">{{ row.shortName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rowA, i) in compareMembers" :key="rowA.id">
              <td class="matrix-row-label">
                <span class="color-dot" :style="{ background: rowA.color }"></span>
                {{ rowA.shortName }}
              </td>
              <td v-for="(rowB, j) in compareMembers" :key="rowB.id" class="num" :class="{ 'matrix-diag': i === j, 'matrix-overlap': i !== j }">
                {{ i === j ? formatNumber(rowA.totalMembers) : overlapMatrix[i][j] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 캠페인별 회원 통합 상세 테이블 ===== -->
      <div class="section-card">
        <div class="section-header-row">
          <h2 class="section-title" style="margin-bottom: 0;">회원 통합 상세 현황</h2>
          <div class="member-controls">
            <input v-model="cmpMemberSearch" class="member-search" placeholder="회원 ID / 이름 검색..." />
            <select v-model="cmpMemberStatusFilter" class="member-filter-select">
              <option value="ALL">전체 상태</option>
              <option value="CONVERTED">전환 완료</option>
              <option value="CLICKED">클릭</option>
              <option value="OPENED">오픈</option>
              <option value="DELIVERED">수신</option>
              <option value="SENT">발송</option>
              <option value="FAILED">실패</option>
            </select>
            <select v-model="cmpCampaignFilter" class="member-filter-select">
              <option value="ALL">전체 캠페인</option>
              <option v-for="row in compareMembers" :key="row.id" :value="row.id">{{ row.name }}</option>
            </select>
            <label class="overlap-only-check">
              <input type="checkbox" v-model="cmpOverlapOnly" />
              <span>중복 수신만</span>
            </label>
          </div>
        </div>

        <table class="data-table member-table">
          <thead>
            <tr>
              <th>회원 ID</th>
              <th>이름</th>
              <th>캠페인</th>
              <th>채널</th>
              <th>발송 상태</th>
              <th>발송 시각</th>
              <th class="num">주문 금액</th>
              <th class="num">주문 건수</th>
              <th class="num">수신 캠페인 수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in cmpPaginatedMembers" :key="m.memberId + '-' + m.campaignId">
              <td>
                <code class="member-id">{{ m.memberId }}</code>
                <span v-if="m.isOverlap" class="overlap-tag">중복</span>
              </td>
              <td class="member-name">{{ m.name }}</td>
              <td>
                <span class="campaign-tag" :style="{ background: m.campaignColor + '18', color: m.campaignColor, borderColor: m.campaignColor }">{{ m.campaignName }}</span>
              </td>
              <td><span class="channel-badge-sm" :style="{ background: m.channelColor }">{{ m.channel }}</span></td>
              <td>
                <span class="member-status-badge" :class="'ms-' + m.status.toLowerCase()">{{ memberStatusLabel(m.status) }}</span>
              </td>
              <td class="date-cell">{{ m.sentAt }}</td>
              <td class="num" :class="{ 'revenue-cell': m.orderAmount > 0 }">{{ m.orderAmount > 0 ? formatCurrency(m.orderAmount) : '-' }}</td>
              <td class="num">{{ m.orderCount > 0 ? m.orderCount + '건' : '-' }}</td>
              <td class="num">
                <span :class="{ 'overlap-count-highlight': m.overlapCount > 1 }">{{ m.overlapCount }}</span>
              </td>
            </tr>
            <tr v-if="cmpFilteredMembers.length === 0">
              <td colspan="9" class="empty">조건에 맞는 회원이 없습니다.</td>
            </tr>
          </tbody>
        </table>

        <div v-if="cmpTotalPages > 1" class="pagination">
          <button class="page-btn" :disabled="cmpMemberPage === 1" @click="cmpMemberPage = 1">&laquo;</button>
          <button class="page-btn" :disabled="cmpMemberPage === 1" @click="cmpMemberPage--">&lsaquo;</button>
          <span class="page-info">{{ cmpMemberPage }} / {{ cmpTotalPages }}</span>
          <button class="page-btn" :disabled="cmpMemberPage === cmpTotalPages" @click="cmpMemberPage++">&#8250;</button>
          <button class="page-btn" :disabled="cmpMemberPage === cmpTotalPages" @click="cmpMemberPage = cmpTotalPages">&raquo;</button>
          <span class="page-total">총 {{ formatNumber(cmpFilteredMembers.length) }}건</span>
        </div>
      </div>
    </template>

    <!-- 안내 메시지 -->
    <div v-if="showPlaceholder" class="placeholder">
      <span class="placeholder-icon">📊</span>
      <p>분석할 캠페인을 선택하세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { campaignApi } from '@/api/campaignApi'
import type { Campaign, CampaignStatus } from '@/types/campaign'

// ---- 색상 팔레트 ----
const funnelColors = ['#6366f1', '#3b82f6', '#0ea5e9', '#f59e0b', '#10b981']
const channelColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
const compareColorPairs = [
  { color: '#6366f1', colorLight: '#a5b4fc' },
  { color: '#10b981', colorLight: '#6ee7b7' },
  { color: '#f59e0b', colorLight: '#fcd34d' },
  { color: '#ef4444', colorLight: '#fca5a5' },
  { color: '#8b5cf6', colorLight: '#c4b5fd' },
]
const memberStatusColors: Record<string, string> = {
  CONVERTED: '#10b981',
  CLICKED: '#3b82f6',
  OPENED: '#8b5cf6',
  DELIVERED: '#6b7280',
  SENT: '#d1d5db',
  FAILED: '#ef4444',
}

const campaigns = ref<Campaign[]>([])
const viewMode = ref<'single' | 'compare'>('single')
const selectedCampaignId = ref<number | null>(null)
const selectedIds = ref<number[]>([])

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
const dateFrom = ref(thirtyDaysAgo.toISOString().slice(0, 10))
const dateTo = ref(today.toISOString().slice(0, 10))

// 회원 필터/페이지
const memberSearch = ref('')
const memberStatusFilter = ref('ALL')
const memberChannelFilter = ref('ALL')
const memberPage = ref(1)
const memberPageSize = 20

watch([memberSearch, memberStatusFilter, memberChannelFilter], () => { memberPage.value = 1 })

onMounted(loadCampaigns)

async function loadCampaigns() {
  try {
    const res = await campaignApi.list()
    campaigns.value = res.data.data
  } catch {
    campaigns.value = generateDemoCampaigns()
  }
  // 단일 모드에서 첫 번째 캠페인 자동 선택
  const available = campaigns.value.filter((c) => c.status !== 'DRAFT')
  if (!selectedCampaignId.value && available.length > 0) {
    selectedCampaignId.value = available[0].id
  }
}

function loadAnalytics() { /* 조회 버튼 - 데모용 */ }

const analyticsCampaigns = computed(() => campaigns.value.filter((c) => c.status !== 'DRAFT'))

const showPlaceholder = computed(() => {
  if (viewMode.value === 'single') return !selectedCampaignId.value
  return selectedIds.value.length === 0
})

function statusLabel(status: CampaignStatus) {
  const labels: Record<CampaignStatus, string> = { DRAFT: '초안', ACTIVE: '운영', PAUSED: '일시정지', COMPLETED: '완료', ARCHIVED: '폐기' }
  return labels[status]
}

// ---- 데모 캠페인 ----
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
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

interface MemberRow {
  memberId: string
  name: string
  channel: string
  channelColor: string
  status: string
  sentAt: string
  openedAt: string | null
  clickedAt: string | null
  orderAmount: number
  orderCount: number
}

const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍']
const lastNames = ['민준', '서윤', '도윤', '서연', '하준', '지우', '시우', '하은', '주원', '지민', '지호', '수아', '예준', '지아', '건우', '다은', '현우', '은서', '준서', '채원']

function generateSingleData(campaignId: number) {
  const rand = seededRandom(campaignId * 137)
  const totalRevenue = Math.round(rand() * 800000000 + 200000000)
  const totalOrders = Math.round(rand() * 8000 + 2000)
  const aov = Math.round(totalRevenue / totalOrders)
  const cvr = +(rand() * 6 + 2).toFixed(1)
  const roas = Math.round(rand() * 800 + 200)
  const sent = Math.round(rand() * 500000 + 100000)

  const funnel = [
    { label: '발송', count: sent, rate: 100 },
    { label: '수신', count: Math.round(sent * (0.92 + rand() * 0.06)), rate: +(92 + rand() * 6).toFixed(1) },
    { label: '오픈', count: Math.round(sent * (0.3 + rand() * 0.2)), rate: +(30 + rand() * 20).toFixed(1) },
    { label: '클릭', count: Math.round(sent * (0.08 + rand() * 0.1)), rate: +(8 + rand() * 10).toFixed(1) },
    { label: '전환', count: totalOrders, rate: +cvr.toFixed(1) },
  ]

  const dailyRevenue: { date: string; revenue: number }[] = []
  const from = new Date(dateFrom.value)
  const to = new Date(dateTo.value)
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000))
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    dailyRevenue.push({ date: d.toISOString().slice(0, 10), revenue: Math.round(totalRevenue / days * (0.6 + rand() * 0.8)) })
  }

  const channels = [
    { channel: '앱푸시', color: channelColors[0] },
    { channel: '카카오톡', color: channelColors[1] },
    { channel: 'SMS', color: channelColors[2] },
    { channel: '웹훅', color: channelColors[3] },
  ]
  const channelPerformance = channels.map((ch) => {
    const chSent = Math.round(sent * (0.15 + rand() * 0.3))
    const clicked = Math.round(chSent * (0.05 + rand() * 0.15))
    const converted = Math.round(clicked * (0.1 + rand() * 0.3))
    const chRevenue = Math.round(converted * aov * (0.8 + rand() * 0.4))
    return {
      ...ch,
      sent: chSent, clicked, converted, revenue: chRevenue,
      cvr: converted > 0 ? +((converted / chSent) * 100).toFixed(1) : 0,
      cpa: converted > 0 ? Math.round(chRevenue / converted * 0.15) : 0,
    }
  })

  // 회원 상세 데이터 생성 (100명)
  // 공유 회원 풀(0~149)에서 뽑아 캠페인 간 30~40% 중복 발생
  const memberRand = seededRandom(campaignId * 293)
  const statuses = ['CONVERTED', 'CLICKED', 'OPENED', 'DELIVERED', 'SENT', 'FAILED']
  const statusWeights = [0.12, 0.18, 0.25, 0.25, 0.15, 0.05]
  const SHARED_POOL_SIZE = 150

  // 이 캠페인이 발송할 회원 인덱스를 공유 풀에서 선택 (중복 없이 100명)
  const pickedIndices = new Set<number>()
  while (pickedIndices.size < 100) {
    pickedIndices.add(Math.floor(memberRand() * SHARED_POOL_SIZE))
  }

  const members: MemberRow[] = []
  for (const idx of pickedIndices) {
    // 회원 속성은 회원 고유 시드로 결정 (이름 등 캠페인 무관)
    const nameRand = seededRandom(idx * 31)
    const memberName = firstNames[Math.floor(nameRand() * firstNames.length)] + lastNames[Math.floor(nameRand() * lastNames.length)]

    // 발송 결과는 캠페인+회원 조합 시드로 결정
    const r = memberRand()
    let cumWeight = 0
    let status = 'SENT'
    for (let j = 0; j < statuses.length; j++) {
      cumWeight += statusWeights[j]
      if (r < cumWeight) { status = statuses[j]; break }
    }
    const ch = channels[Math.floor(memberRand() * channels.length)]
    const baseDate = new Date(dateFrom.value)
    baseDate.setDate(baseDate.getDate() + Math.floor(memberRand() * Math.min(days, 30)))
    const hrs = Math.floor(memberRand() * 24)
    const mins = Math.floor(memberRand() * 60)
    const sentTime = `${baseDate.toISOString().slice(0, 10)} ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

    const hasOpen = ['CONVERTED', 'CLICKED', 'OPENED'].includes(status)
    const hasClick = ['CONVERTED', 'CLICKED'].includes(status)
    const openOffset = Math.floor(memberRand() * 120) + 1
    const clickOffset = openOffset + Math.floor(memberRand() * 60) + 1

    const openTime = hasOpen ? `${baseDate.toISOString().slice(0, 10)} ${String(Math.min(hrs + Math.floor(openOffset / 60), 23)).padStart(2, '0')}:${String((mins + openOffset) % 60).padStart(2, '0')}` : null
    const clickTime = hasClick ? `${baseDate.toISOString().slice(0, 10)} ${String(Math.min(hrs + Math.floor(clickOffset / 60), 23)).padStart(2, '0')}:${String((mins + clickOffset) % 60).padStart(2, '0')}` : null

    const orderAmt = status === 'CONVERTED' ? Math.round((memberRand() * 300000 + 10000) / 100) * 100 : 0
    const orderCnt = status === 'CONVERTED' ? Math.floor(memberRand() * 3) + 1 : 0

    members.push({
      memberId: `USR-${String(idx).padStart(7, '0')}`,
      name: memberName,
      channel: ch.channel,
      channelColor: ch.color,
      status,
      sentAt: sentTime,
      openedAt: openTime,
      clickedAt: clickTime,
      orderAmount: orderAmt,
      orderCount: orderCnt,
    })
  }

  return {
    totalRevenue, revenueChange: +(rand() * 40 - 10).toFixed(1),
    totalOrders, ordersChange: +(rand() * 30 - 8).toFixed(1),
    aov, aovChange: +(rand() * 15 - 5).toFixed(1),
    cvr, cvrChange: +(rand() * 4 - 1).toFixed(1),
    roas, roasChange: +(rand() * 100 - 30).toFixed(0),
    funnel, dailyRevenue, channelPerformance, members,
  }
}

const singleData = computed(() => {
  if (!selectedCampaignId.value) return generateSingleData(0)
  return generateSingleData(selectedCampaignId.value)
})

// 채널 도넛
const channelDonutSegments = computed(() => {
  const total = singleData.value.channelPerformance.reduce((s, c) => s + c.revenue, 0)
  if (total === 0) return []
  const circumference = 2 * Math.PI * 48
  let offset = 0
  return singleData.value.channelPerformance.map((ch) => {
    const pct = ch.revenue / total
    const dash = `${pct * circumference} ${circumference}`
    const seg = { color: ch.color, dash, offset: -offset }
    offset += pct * circumference
    return seg
  })
})

function channelPct(revenue: number) {
  const total = singleData.value.channelPerformance.reduce((s, c) => s + c.revenue, 0)
  return total > 0 ? ((revenue / total) * 100).toFixed(1) : '0'
}

// 회원 필터/페이지네이션
const filteredMembers = computed(() => {
  let list = singleData.value.members
  if (memberStatusFilter.value !== 'ALL') list = list.filter((m) => m.status === memberStatusFilter.value)
  if (memberChannelFilter.value !== 'ALL') list = list.filter((m) => m.channel === memberChannelFilter.value)
  if (memberSearch.value) {
    const q = memberSearch.value.toLowerCase()
    list = list.filter((m) => m.memberId.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
  }
  return list
})

const totalMemberPages = computed(() => Math.max(1, Math.ceil(filteredMembers.value.length / memberPageSize)))
const paginatedMembers = computed(() => {
  const start = (memberPage.value - 1) * memberPageSize
  return filteredMembers.value.slice(start, start + memberPageSize)
})

// 회원 상태 분포
const memberDistSegments = computed(() => {
  const all = singleData.value.members
  const total = all.length || 1
  const order = ['CONVERTED', 'CLICKED', 'OPENED', 'DELIVERED', 'SENT', 'FAILED']
  const labels: Record<string, string> = { CONVERTED: '전환', CLICKED: '클릭', OPENED: '오픈', DELIVERED: '수신', SENT: '발송', FAILED: '실패' }
  return order.map((s) => {
    const count = all.filter((m) => m.status === s).length
    return { status: s, label: labels[s], count, pct: +((count / total) * 100).toFixed(1), color: memberStatusColors[s] }
  }).filter((s) => s.count > 0)
})

function memberStatusLabel(status: string) {
  const labels: Record<string, string> = { CONVERTED: '전환 완료', CLICKED: '클릭', OPENED: '오픈', DELIVERED: '수신', SENT: '발송', FAILED: '실패' }
  return labels[status] ?? status
}

// 다중 비교
const compareData = computed(() => {
  return selectedIds.value.map((id, i) => {
    const c = campaigns.value.find((x) => x.id === id)
    const d = generateSingleData(id)
    const cp = compareColorPairs[i % compareColorPairs.length]
    return {
      id, name: c?.name ?? `캠페인 ${id}`,
      color: cp.color, colorLight: cp.colorLight,
      totalRevenue: d.totalRevenue, totalOrders: d.totalOrders, aov: d.aov, cvr: d.cvr, roas: d.roas,
      sent: d.funnel[0].count, clicked: d.funnel[3].count,
    }
  })
})

const maxCompareRevenue = computed(() => Math.max(...compareData.value.map((d) => d.totalRevenue), 1))
const maxCvr = computed(() => Math.max(...compareData.value.map((d) => d.cvr), 1))
const maxRoas = computed(() => Math.max(...compareData.value.map((d) => d.roas), 1))
function compareBarWidth(value: number) { return (value / maxCompareRevenue.value) * 100 }

// ---- 다중 비교: 회원 상태 분포 ----
const statusOrder = ['CONVERTED', 'CLICKED', 'OPENED', 'DELIVERED', 'SENT', 'FAILED'] as const
const statusLabelsKo: Record<string, string> = { CONVERTED: '전환', CLICKED: '클릭', OPENED: '오픈', DELIVERED: '수신', SENT: '발송', FAILED: '실패' }

const compareMembers = computed(() => {
  return selectedIds.value.map((id, i) => {
    const c = campaigns.value.find((x) => x.id === id)
    const d = generateSingleData(id)
    const cp = compareColorPairs[i % compareColorPairs.length]
    const total = d.members.length || 1
    const statusCounts: Record<string, number> = {}
    for (const s of statusOrder) statusCounts[s] = d.members.filter((m) => m.status === s).length
    const segments = statusOrder.map((s) => ({
      status: s, label: statusLabelsKo[s], count: statusCounts[s],
      pct: +((statusCounts[s] / total) * 100).toFixed(1), color: memberStatusColors[s],
    })).filter((s) => s.count > 0)
    const name = c?.name ?? `캠페인 ${id}`
    return {
      id, name, shortName: name.length > 10 ? name.slice(0, 10) + '...' : name,
      color: cp.color, colorLight: cp.colorLight,
      totalMembers: d.members.length, members: d.members, statusCounts, segments,
      conversionRate: +((statusCounts.CONVERTED / total) * 100).toFixed(1),
    }
  })
})

// ---- 다중 비교: 중복 수신 분석 ----
const allCompareMembers = computed(() => {
  const rows: (MemberRow & { campaignId: number; campaignName: string; campaignColor: string })[] = []
  for (const cm of compareMembers.value) {
    for (const m of cm.members) {
      rows.push({ ...m, campaignId: cm.id, campaignName: cm.name, campaignColor: cm.color })
    }
  }
  return rows
})

const memberOverlapMap = computed(() => {
  const map = new Map<string, number[]>()
  for (const cm of compareMembers.value) {
    for (const m of cm.members) {
      if (!map.has(m.memberId)) map.set(m.memberId, [])
      map.get(m.memberId)!.push(cm.id)
    }
  }
  return map
})

const overlapAnalysis = computed(() => {
  const map = memberOverlapMap.value
  const totalUnique = map.size
  const duplicates = [...map.entries()].filter(([, ids]) => ids.length > 1)
  const singles = [...map.entries()].filter(([, ids]) => ids.length === 1)
  const duplicateCount = duplicates.length
  const singleCount = singles.length

  // 중복 회원 중 전환 회원 수
  const allMemRows = allCompareMembers.value
  const dupIds = new Set(duplicates.map(([id]) => id))
  const sinIds = new Set(singles.map(([id]) => id))
  const dupConverted = new Set([...allMemRows.filter((m) => dupIds.has(m.memberId) && m.status === 'CONVERTED').map((m) => m.memberId)]).size
  const sinConverted = new Set([...allMemRows.filter((m) => sinIds.has(m.memberId) && m.status === 'CONVERTED').map((m) => m.memberId)]).size

  return {
    totalUnique,
    duplicateCount,
    singleCount,
    duplicateCvr: duplicateCount > 0 ? +((dupConverted / duplicateCount) * 100).toFixed(1) : 0,
    singleCvr: singleCount > 0 ? +((sinConverted / singleCount) * 100).toFixed(1) : 0,
  }
})

// 캠페인 간 중복 매트릭스
const overlapMatrix = computed(() => {
  const cms = compareMembers.value
  const matrix: number[][] = Array.from({ length: cms.length }, () => Array(cms.length).fill(0))
  // 캠페인별 회원 ID 셋
  const sets = cms.map((cm) => new Set(cm.members.map((m) => m.memberId)))
  for (let i = 0; i < cms.length; i++) {
    for (let j = 0; j < cms.length; j++) {
      if (i === j) continue
      let count = 0
      for (const id of sets[i]) { if (sets[j].has(id)) count++ }
      matrix[i][j] = count
    }
  }
  return matrix
})

// ---- 다중 비교: 통합 회원 테이블 ----
const cmpMemberSearch = ref('')
const cmpMemberStatusFilter = ref('ALL')
const cmpCampaignFilter = ref<number | 'ALL'>('ALL')
const cmpOverlapOnly = ref(false)
const cmpMemberPage = ref(1)
const cmpPageSize = 20

watch([cmpMemberSearch, cmpMemberStatusFilter, cmpCampaignFilter, cmpOverlapOnly], () => { cmpMemberPage.value = 1 })

const cmpMembersWithOverlap = computed(() => {
  const map = memberOverlapMap.value
  return allCompareMembers.value.map((m) => ({
    ...m,
    overlapCount: map.get(m.memberId)?.length ?? 1,
    isOverlap: (map.get(m.memberId)?.length ?? 1) > 1,
  }))
})

const cmpFilteredMembers = computed(() => {
  let list = cmpMembersWithOverlap.value
  if (cmpMemberStatusFilter.value !== 'ALL') list = list.filter((m) => m.status === cmpMemberStatusFilter.value)
  if (cmpCampaignFilter.value !== 'ALL') list = list.filter((m) => m.campaignId === cmpCampaignFilter.value)
  if (cmpOverlapOnly.value) list = list.filter((m) => m.isOverlap)
  if (cmpMemberSearch.value) {
    const q = cmpMemberSearch.value.toLowerCase()
    list = list.filter((m) => m.memberId.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
  }
  return list
})

const cmpTotalPages = computed(() => Math.max(1, Math.ceil(cmpFilteredMembers.value.length / cmpPageSize)))
const cmpPaginatedMembers = computed(() => {
  const start = (cmpMemberPage.value - 1) * cmpPageSize
  return cmpFilteredMembers.value.slice(start, start + cmpPageSize)
})

// ---- 포맷 유틸 ----
function formatCurrency(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억원'
  if (n >= 10000) return (n / 10000).toFixed(0) + '만원'
  return n.toLocaleString('ko-KR') + '원'
}
function formatNumber(n: number) { return n.toLocaleString('ko-KR') }
function funnelDropRate(curr: { count: number }, next: { count: number }) {
  if (curr.count === 0) return 0
  return (((curr.count - next.count) / curr.count) * 100).toFixed(1)
}
function barHeight(value: number, data: { revenue: number }[]) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  return (value / max) * 100
}
function dailyBarGradient(index: number, total: number) {
  const hue = 230 + (index / Math.max(total - 1, 1)) * 120
  return `linear-gradient(180deg, hsl(${hue}, 70%, 58%), hsl(${hue}, 60%, 72%))`
}
</script>

<style scoped>
.analytics-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px 60px; }

.analytics-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.analytics-header h1 { font-size: 24px; font-weight: 700; color: #111827; }
.desc { font-size: 14px; color: #6b7280; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.date-range { display: flex; align-items: center; gap: 6px; }
.date-input { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }
.date-sep { color: #9ca3af; font-size: 13px; }
.btn { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #6366f1; color: #fff; }
.btn-primary:hover { background: #4f46e5; }

/* Selector */
.campaign-selector { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
.selector-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f3f4f6; }
.selector-title { font-size: 14px; font-weight: 600; color: #374151; }
.selector-actions { display: flex; gap: 6px; }
.chip { padding: 5px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; border: 1px solid #d1d5db; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.15s; }
.chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.selector-body { padding: 16px 20px; }
.campaign-select { width: 100%; max-width: 400px; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }
.multi-select { display: flex; flex-wrap: wrap; gap: 8px; }
.multi-check { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.multi-check:hover { border-color: #6366f1; }
.multi-check.checked { background: #eef2ff; border-color: #6366f1; }
.multi-check input { accent-color: #6366f1; }
.check-label { color: #374151; font-weight: 500; }
.helper-msg { font-size: 11px; color: #9ca3af; width: 100%; margin-top: 4px; }
.empty-msg { font-size: 13px; color: #9ca3af; }
.status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 8px; }
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.paused { background: #fffbeb; color: #d97706; }
.status-badge.completed { background: #eff6ff; color: #2563eb; }
.status-badge.archived { background: #f3f4f6; color: #9ca3af; }

/* KPI cards - colored top borders */
.kpi-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
.kpi-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 16px; border-top: 3px solid transparent; }
.kpi-revenue { border-top-color: #6366f1; }
.kpi-revenue .kpi-value { color: #6366f1; }
.kpi-orders { border-top-color: #3b82f6; }
.kpi-orders .kpi-value { color: #3b82f6; }
.kpi-aov { border-top-color: #10b981; }
.kpi-aov .kpi-value { color: #10b981; }
.kpi-cvr { border-top-color: #f59e0b; }
.kpi-cvr .kpi-value { color: #f59e0b; }
.kpi-roas { border-top-color: #ef4444; }
.kpi-roas .kpi-value { color: #ef4444; }
.kpi-label { display: block; font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 6px; }
.kpi-value { display: block; font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 4px; }
.kpi-change { font-size: 11px; font-weight: 600; }
.kpi-change.up { color: #059669; }
.kpi-change.down { color: #dc2626; }

/* Section */
.section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 20px; }
.section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }

/* Funnel */
.funnel { display: flex; flex-direction: column; gap: 8px; }
.funnel-step { display: flex; align-items: center; gap: 14px; }
.funnel-bar-wrap { flex: 1; height: 32px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.funnel-bar { height: 100%; border-radius: 6px; transition: width 0.5s ease; min-width: 2px; }
.funnel-info { display: flex; align-items: center; gap: 10px; min-width: 220px; }
.funnel-label { font-size: 13px; font-weight: 600; color: #374151; min-width: 40px; }
.funnel-count { font-size: 13px; color: #6b7280; min-width: 70px; text-align: right; }
.funnel-rate { font-size: 12px; font-weight: 700; min-width: 50px; text-align: right; }
.funnel-drop { font-size: 10px; color: #ef4444; font-weight: 500; min-width: 70px; text-align: right; }

/* Bar chart */
.chart-area { overflow-x: auto; }
.bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; padding: 0 4px; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 24px; position: relative; height: 100%; justify-content: flex-end; }
.bar { border-radius: 4px 4px 0 0; width: 100%; max-width: 36px; transition: height 0.4s ease; min-height: 2px; }
.bar-label { font-size: 9px; color: #9ca3af; margin-top: 6px; white-space: nowrap; }
.bar-tooltip { position: absolute; top: -4px; font-size: 9px; color: #6b7280; white-space: nowrap; opacity: 0; transition: opacity 0.2s; }
.bar-col:hover .bar-tooltip { opacity: 1; }
.bar-col:hover .bar { filter: brightness(0.9); }

/* Channel donut */
.channel-visual { display: flex; align-items: center; gap: 32px; }
.channel-donut { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
.channel-donut svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.donut-total { display: block; font-size: 14px; font-weight: 800; color: #111827; }
.donut-label { display: block; font-size: 10px; color: #9ca3af; }
.channel-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name { color: #374151; min-width: 60px; font-weight: 500; }
.legend-value { color: #111827; font-weight: 700; min-width: 80px; text-align: right; }
.legend-pct { color: #6b7280; font-size: 12px; min-width: 50px; text-align: right; }

/* Data table */
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead { background: #f9fafb; }
.data-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
.data-table td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
.data-table tr:last-child td { border-bottom: none; }
.data-table .num { text-align: right; }
.data-table th.num { text-align: right; }
.revenue-cell { font-weight: 700; color: #6366f1; }
.channel-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #fff; }

/* Member section */
.member-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.member-search { padding: 7px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; width: 200px; }
.member-search:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.member-filter-select { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; }

.member-summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.member-summary-card { background: #f9fafb; border-radius: 8px; padding: 12px 14px; }
.ms-count { display: block; font-size: 20px; font-weight: 800; color: #111827; }
.ms-label { font-size: 11px; color: #6b7280; font-weight: 500; }

/* Member distribution bar */
.member-dist-bar { display: flex; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 8px; }
.dist-seg { height: 100%; transition: width 0.4s ease; min-width: 1px; }
.member-dist-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
.dist-legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #6b7280; }
.dist-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

/* Member table */
.member-table .member-id { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #6b7280; }
.member-name { font-weight: 500; }
.channel-badge-sm { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #fff; }
.date-cell { font-size: 12px; color: #9ca3af; white-space: nowrap; }

.member-status-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 10px; }
.ms-converted { background: #ecfdf5; color: #059669; }
.ms-clicked { background: #eff6ff; color: #3b82f6; }
.ms-opened { background: #f5f3ff; color: #8b5cf6; }
.ms-delivered { background: #f3f4f6; color: #6b7280; }
.ms-sent { background: #f9fafb; color: #9ca3af; }
.ms-failed { background: #fef2f2; color: #ef4444; }

.empty { text-align: center; color: #9ca3af; padding: 40px 0 !important; }

/* Pagination */
.pagination { display: flex; align-items: center; gap: 8px; margin-top: 16px; justify-content: center; }
.page-btn { padding: 5px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 13px; cursor: pointer; transition: all 0.15s; color: #374151; }
.page-btn:hover:not(:disabled) { background: #f3f4f6; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 13px; color: #374151; font-weight: 600; min-width: 60px; text-align: center; }
.page-total { font-size: 12px; color: #9ca3af; margin-left: 8px; }

/* Compare bars */
.compare-bars { display: flex; flex-direction: column; gap: 14px; }
.compare-bar-row { display: flex; align-items: center; gap: 14px; }
.compare-bar-label { font-size: 13px; font-weight: 500; color: #374151; min-width: 160px; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.compare-bar-track { flex: 1; height: 28px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.compare-bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; min-width: 2px; }
.compare-bar-value { font-size: 13px; font-weight: 700; color: #374151; min-width: 90px; text-align: right; }
.color-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.compare-table .compare-name { display: flex; align-items: center; gap: 8px; font-weight: 500; }

/* Placeholder */
.placeholder { text-align: center; padding: 80px 20px; color: #9ca3af; }
.placeholder-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.placeholder p { font-size: 14px; }

/* Stacked bar chart */
.stacked-chart { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.stacked-row { display: flex; align-items: center; gap: 12px; }
.stacked-label { font-size: 13px; font-weight: 500; color: #374151; min-width: 150px; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stacked-bar-track { flex: 1; height: 26px; display: flex; border-radius: 6px; overflow: hidden; background: #f3f4f6; }
.stacked-seg { height: 100%; transition: width 0.4s ease; min-width: 1px; }
.stacked-total { font-size: 12px; color: #6b7280; min-width: 60px; text-align: right; }
.stacked-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 4px; }
.sub-section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 20px 0 12px; }

/* Overlap analysis */
.overlap-summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.overlap-card { background: #f9fafb; border-radius: 10px; padding: 16px; text-align: center; }
.overlap-value { display: block; font-size: 22px; font-weight: 800; color: #111827; }
.overlap-label { font-size: 11px; color: #6b7280; font-weight: 500; }

.overlap-compare { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.overlap-compare-row { display: flex; align-items: center; gap: 12px; }
.overlap-compare-label { font-size: 13px; font-weight: 500; color: #374151; min-width: 120px; }
.overlap-compare-track { flex: 1; height: 24px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.overlap-compare-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; min-width: 2px; }
.overlap-compare-val { font-size: 13px; font-weight: 700; color: #374151; min-width: 50px; text-align: right; }

/* Overlap matrix */
.overlap-matrix th, .overlap-matrix td { text-align: center !important; padding: 10px 8px !important; }
.matrix-header { font-size: 10px !important; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.matrix-row-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; white-space: nowrap; }
.matrix-diag { background: #f3f4f6; font-weight: 700; color: #374151; }
.matrix-overlap { color: #6366f1; font-weight: 600; }

/* Campaign tag in unified table */
.campaign-tag { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid; }
.overlap-tag { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #fef3c7; color: #d97706; }
.overlap-count-highlight { color: #f59e0b; font-weight: 700; }
.overlap-only-check { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; cursor: pointer; white-space: nowrap; }
.overlap-only-check input { accent-color: #f59e0b; }

@media (max-width: 900px) {
  .kpi-cards { grid-template-columns: repeat(2, 1fr); }
  .member-summary-cards { grid-template-columns: repeat(2, 1fr); }
  .overlap-summary-cards { grid-template-columns: repeat(2, 1fr); }
  .channel-visual { flex-direction: column; }
}
</style>
