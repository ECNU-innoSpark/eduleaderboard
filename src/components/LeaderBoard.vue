<template>
  <div class="leaderboard">
    <div class="leaderboard-header">
      <h2>LLM 排行榜</h2>
      <p class="subtitle">基于多维度评测的模型排名</p>
    </div>

    <div class="dimension-tabs">
      <button
        v-for="dim in dimensions"
        :key="dim.key"
        :class="['tab', { active: currentDimension === dim.key }]"
        @click="currentDimension = dim.key"
      >
        {{ dim.label }}
      </button>
    </div>

    <div class="table-container">
      <table class="ranking-table">
        <thead>
          <tr>
            <th class="rank-col">排名</th>
            <th class="model-col">模型</th>
            <th class="score-col">评分</th>
            <th class="trend-col">趋势</th>
            <th class="params-col">参数量</th>
            <th class="org-col">组织</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(model, index) in sortedModels"
            :key="model.id"
            :class="['model-row', { highlight: index < 3 }]"
          >
            <td class="rank-col">
              <div class="rank-badge" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
            </td>
            <td class="model-col">
              <div class="model-info">
                <span class="model-name">{{ model.name }}</span>
                <span class="model-version">{{ model.version }}</span>
              </div>
            </td>
            <td class="score-col">
              <div class="score-display">
                <span class="score-value">{{ model.scores[currentDimension].toFixed(1) }}</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :style="{ width: `${(model.scores[currentDimension] / 100) * 100}%` }"
                  ></div>
                </div>
              </div>
            </td>
            <td class="trend-col">
              <span class="trend" :class="model.trend > 0 ? 'up' : model.trend < 0 ? 'down' : 'same'">
                <span v-if="model.trend > 0">↑ {{ model.trend }}</span>
                <span v-else-if="model.trend < 0">↓ {{ Math.abs(model.trend) }}</span>
                <span v-else>—</span>
              </span>
            </td>
            <td class="params-col">{{ model.params }}</td>
            <td class="org-col">{{ model.organization }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const dimensions = [
  { key: "overall", label: "综合评分" },
  { key: "coding", label: "编程能力" },
  { key: "math", label: "数学推理" },
  { key: "creative", label: "创意写作" },
  { key: "reasoning", label: "逻辑推理" },
  { key: "knowledge", label: "知识问答" },
];

const currentDimension = ref("overall");

const models = ref([
  {
    id: 1,
    name: "GPT-4 Turbo",
    version: "gpt-4-turbo-2024-04",
    organization: "OpenAI",
    params: "1.76T",
    trend: 2,
    scores: {
      overall: 89.5,
      coding: 92.3,
      math: 88.7,
      creative: 91.2,
      reasoning: 90.1,
      knowledge: 87.8,
    },
  },
  {
    id: 2,
    name: "Claude 3.5 Sonnet",
    version: "claude-3-5-sonnet",
    organization: "Anthropic",
    params: "Unknown",
    trend: 5,
    scores: {
      overall: 91.2,
      coding: 94.5,
      math: 90.3,
      creative: 89.8,
      reasoning: 92.1,
      knowledge: 88.5,
    },
  },
  {
    id: 3,
    name: "Gemini 1.5 Pro",
    version: "gemini-1.5-pro",
    organization: "Google",
    params: "Unknown",
    trend: -1,
    scores: {
      overall: 87.8,
      coding: 89.2,
      math: 91.5,
      creative: 85.3,
      reasoning: 88.7,
      knowledge: 90.2,
    },
  },
  {
    id: 4,
    name: "Llama 3.1 405B",
    version: "llama-3.1-405b",
    organization: "Meta",
    params: "405B",
    trend: 3,
    scores: {
      overall: 85.6,
      coding: 87.8,
      math: 86.4,
      creative: 83.9,
      reasoning: 86.2,
      knowledge: 85.1,
    },
  },
  {
    id: 5,
    name: "Mistral Large 2",
    version: "mistral-large-2",
    organization: "Mistral AI",
    params: "123B",
    trend: 0,
    scores: {
      overall: 83.4,
      coding: 85.6,
      math: 84.2,
      creative: 81.7,
      reasoning: 84.9,
      knowledge: 83.8,
    },
  },
  {
    id: 6,
    name: "Command R+",
    version: "command-r-plus",
    organization: "Cohere",
    params: "104B",
    trend: -2,
    scores: {
      overall: 81.2,
      coding: 82.4,
      math: 80.8,
      creative: 83.5,
      reasoning: 81.7,
      knowledge: 82.9,
    },
  },
  {
    id: 7,
    name: "Qwen 2.5 72B",
    version: "qwen-2.5-72b",
    organization: "Alibaba",
    params: "72B",
    trend: 4,
    scores: {
      overall: 79.8,
      coding: 81.2,
      math: 82.5,
      creative: 77.3,
      reasoning: 80.1,
      knowledge: 81.7,
    },
  },
  {
    id: 8,
    name: "DeepSeek V2.5",
    version: "deepseek-v2.5",
    organization: "DeepSeek",
    params: "236B",
    trend: 1,
    scores: {
      overall: 78.5,
      coding: 83.7,
      math: 79.2,
      creative: 75.8,
      reasoning: 78.9,
      knowledge: 77.4,
    },
  },
]);

const sortedModels = computed(() => {
  return [...models.value].sort((a, b) => {
    return b.scores[currentDimension.value] - a.scores[currentDimension.value];
  });
});
</script>

<style scoped>
.leaderboard {
  background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.95));
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.leaderboard-header {
  margin-bottom: 20px;
}

.leaderboard-header h2 {
  font-size: 24px;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: #9ca3af;
}

.dimension-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.5);
}

.tab.active {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-color: transparent;
  color: #f9fafb;
  font-weight: 500;
}

.table-container {
  overflow-x: auto;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
}

.ranking-table th {
  text-align: left;
  padding: 12px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.ranking-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.model-row {
  transition: background 0.2s;
}

.model-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

.model-row.highlight {
  background: rgba(79, 70, 229, 0.1);
}

.rank-col {
  width: 60px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  background: rgba(51, 65, 85, 0.6);
  color: #cbd5e1;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1e293b;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  color: #1e293b;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #fb923c, #ea580c);
  color: #1e293b;
}

.model-col {
  min-width: 200px;
}

.model-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-weight: 500;
  font-size: 14px;
  color: #e5e7eb;
}

.model-version {
  font-size: 11px;
  color: #94a3b8;
}

.score-col {
  min-width: 150px;
}

.score-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-value {
  font-weight: 600;
  font-size: 16px;
  color: #22c55e;
}

.score-bar {
  width: 100%;
  height: 4px;
  background: rgba(51, 65, 85, 0.6);
  border-radius: 2px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  transition: width 0.3s ease;
}

.trend-col {
  width: 80px;
}

.trend {
  font-size: 13px;
  font-weight: 500;
}

.trend.up {
  color: #22c55e;
}

.trend.down {
  color: #ef4444;
}

.trend.same {
  color: #94a3b8;
}

.params-col {
  width: 100px;
  color: #cbd5e1;
  font-size: 13px;
}

.org-col {
  min-width: 120px;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 768px) {
  .leaderboard {
    padding: 16px;
  }

  .dimension-tabs {
    gap: 6px;
  }

  .tab {
    padding: 6px 12px;
    font-size: 12px;
  }

  .ranking-table th,
  .ranking-table td {
    padding: 10px 8px;
    font-size: 12px;
  }

  .params-col,
  .org-col {
    display: none;
  }
}
</style>
