<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>大模型参数监控面板</h1>
        <p class="subtitle">随机模拟各类指标，支持后续接入真实数据</p>
      </div>
      <button class="refresh-btn" @click="regenerate">
        重新生成随机数据
      </button>
    </header>

    <main class="content">
      <section class="cards">
        <div class="card" v-for="metric in summaryMetrics" :key="metric.key">
          <div class="card-label">{{ metric.label }}</div>
          <div class="card-value">
            {{ metric.value }}
            <span v-if="metric.unit" class="card-unit">{{ metric.unit }}</span>
          </div>
          <div class="card-desc">{{ metric.desc }}</div>
        </div>
      </section>

      <section class="charts-grid">
        <div class="chart-card">
          <h2>不同模型参数量对比</h2>
          <EChart :option="paramsOption" />
        </div>

        <div class="chart-card">
          <h2>推理延迟分布（ms）</h2>
          <EChart :option="latencyOption" />
        </div>

        <div class="chart-card">
          <h2>吞吐量 / GPU 利用率</h2>
          <EChart :option="throughputGpuOption" />
        </div>

        <div class="chart-card">
          <h2>推理时间线（最近 10 分钟）</h2>
          <EChart :option="timelineOption" />
        </div>
      </section>

      <section class="leaderboard-section">
        <LeaderBoard />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import EChart from "./components/EChart.vue";
import LeaderBoard from "./components/LeaderBoard.vue";
import {
  buildParamsOption,
  buildLatencyOption,
  buildThroughputGpuOption,
  buildTimelineOption,
  generateSummaryMetrics,
} from "./metrics/mockData";

const paramsOption = ref(buildParamsOption());
const latencyOption = ref(buildLatencyOption());
const throughputGpuOption = ref(buildThroughputGpuOption());
const timelineOption = ref(buildTimelineOption());
const summaryMetrics = ref(generateSummaryMetrics());

function regenerate() {
  paramsOption.value = buildParamsOption();
  latencyOption.value = buildLatencyOption();
  throughputGpuOption.value = buildThroughputGpuOption();
  timelineOption.value = buildTimelineOption();
  summaryMetrics.value = generateSummaryMetrics();
}
</script>

<style scoped>
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

h1 {
  font-size: 26px;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
}

.refresh-btn {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: none;
  color: #f9fafb;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.7);
  transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s;
}

.refresh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.7);
  opacity: 0.95;
}

.refresh-btn:active {
  transform: translateY(0);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.6);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.card {
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.45), rgba(15, 23, 42, 0.95));
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.card-label {
  font-size: 12px;
  color: #e5e7eb;
  margin-bottom: 6px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-unit {
  font-size: 11px;
  margin-left: 4px;
  color: #e5e7eb;
}

.card-desc {
  font-size: 11px;
  color: #cbd5f5;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-card {
  background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.35), rgba(15, 23, 42, 0.95));
  padding: 14px 14px 10px;
  border-radius: 18px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.35);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-card h2 {
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 960px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

.leaderboard-section {
  margin-top: 18px;
}
</style>

