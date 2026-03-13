<template>
  <div class="leaderboard">
    <div class="leaderboard-header">
      <h2>LLM 排行榜</h2>
      <p class="subtitle">基于多维度评测的模型排名</p>
    </div>

    <div class="dimension-tabs-wrapper">
      <button class="tab-arrow left" type="button" @click="scrollLeft">
        ‹
      </button>

      <div class="dimension-tabs" ref="dimScroll">
        <button
          v-for="dim in dimensions"
          :key="dim.key"
          :class="['tab', { active: currentDimension === dim.key }]"
          @click="currentDimension = dim.key"
        >
          <span :class="['tab-label', { 'tab-label-en': isEnglishLabel(dim.label) }]">
            {{ displayDimLabel(dim.label) }}
          </span>
        </button>
      </div>

      <button class="tab-arrow right" type="button" @click="scrollRight">
        ›
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
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="model in rankedModels"
            :key="model.id"
            :class="['model-row', { highlight: model._rank <= 3 }]"
          >
            <td class="rank-col">
              <div class="rank-badge" :class="`rank-${model._rank}`">
                {{ model._rank }}
              </div>
            </td>
            <td class="model-col">
              <div class="model-info">
                <span class="model-name">{{ model.name }}</span>
              </div>
            </td>
            <td class="score-col">
              <div class="score-display">
                <span class="score-value">{{ formatScore(model.scores[currentDimension]) }}</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :style="{ width: `${getScorePercent(model.scores[currentDimension])}%` }"
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import leaderboardCsv from "../../data/实验结果整理 - 主要模型实验对比.csv?raw";

const dimensions = ref([]);
const currentDimension = ref("");
const dimScroll = ref(null);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(field);
      field = "";
      const isEmpty = row.every((v) => String(v ?? "").trim() === "");
      if (!isEmpty) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  // last field/row
  row.push(field);
  const isEmpty = row.every((v) => String(v ?? "").trim() === "");
  if (!isEmpty) rows.push(row);

  return rows;
}

function toNumberLoose(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function makeUniqueHeaderKeys(headers) {
  const seen = new Map();
  return headers.map((h) => {
    const base = String(h ?? "").trim() || "字段";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const key = n === 1 ? base : `${base}__${n}`;
    const label = n === 1 ? base : `${base}（${n}）`;
    return { base, key, label };
  });
}

function guessScoreColumns(rows, headerMeta) {
  // 排除明显的文本/元信息列
  const excluded = new Set(["模型名", "版本号", "备注", "模型路径"]);
  const header = rows[0].map((h) => String(h ?? "").trim());
  const hasAvgHeader = header.some((h) => h.includes("平均值"));
  const candidates = [];

  for (let c = 0; c < header.length; c++) {
    const name = header[c];
    if (!name || excluded.has(name)) continue;
    if (hasAvgHeader && name.includes("平均值")) continue;

    let numericCount = 0;
    let nonEmptyCount = 0;
    const sampleValues = [];

    for (const r of rows.slice(1)) {
      const raw = r[c];
      const s = String(raw ?? "").trim();
      if (!s) continue;
      nonEmptyCount++;
      const n = toNumberLoose(s);
      if (n != null) {
        numericCount++;
        if (sampleValues.length < 20) sampleValues.push(n);
      }
    }

    if (nonEmptyCount === 0) continue;
    const numericRatio = numericCount / nonEmptyCount;
    if (numericRatio < 0.7) continue; // 大部分不是数字就不要当维度

    // 简单过滤：把很明显的“长文本型数字列”（比如路径里带数字）剔除的概率已经很低了
    // 这里不强行限定 0-5 或 0-100，交给自适应进度条处理
    const max = sampleValues.length ? Math.max(...sampleValues) : 0;
    candidates.push({
      colIndex: c,
      baseName: name,
      label: headerMeta[c]?.label ?? name,
      key: headerMeta[c]?.key ?? name,
      max,
    });
  }

  // 让“平均值”类字段靠前展示（如果存在）
  candidates.sort((a, b) => {
    const aIsAvg = a.baseName.includes("平均");
    const bIsAvg = b.baseName.includes("平均");
    if (aIsAvg !== bIsAvg) return aIsAvg ? -1 : 1;
    return a.colIndex - b.colIndex;
  });

  return candidates;
}

function buildLeaderboardFromCsv(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => String(h ?? "").trim());
  const headerMeta = makeUniqueHeaderKeys(header);
  const idx = (name) => header.findIndex((h) => h === name);

  const iName = idx("模型名");
  const iVer = idx("版本号");
  const iOrg = idx("备注");
  const iParams = idx("模型路径");

  const scoreCols = guessScoreColumns(rows, headerMeta);
  dimensions.value = scoreCols.map((c) => ({ key: c.key, label: c.label, colIndex: c.colIndex }));
  if (!currentDimension.value && dimensions.value.length) currentDimension.value = dimensions.value[0].key;

  let id = 1;
  const out = [];
  for (const r of rows.slice(1)) {
    const name = String(r[iName] ?? "").trim();
    if (!name) continue;

    const scores = {};
    let hasAnyScore = false;
    for (const c of scoreCols) {
      const n = toNumberLoose(r[c.colIndex]);
      if (n != null) hasAnyScore = true;
      // 保留 null，后面展示时用“空”表示没有数据
      scores[c.key] = n;
    }
    if (!hasAnyScore) continue;

    out.push({
      id: id++,
      name,
      version: String(r[iVer] ?? "").trim(),
      organization: String(r[iOrg] ?? "").trim(),
      params: String(r[iParams] ?? "").trim(),
      trend: 0,
      scores,
    });
  }

  return out;
}

const models = ref(buildLeaderboardFromCsv(leaderboardCsv));

const currentDimensionMax = computed(() => {
  if (!currentDimension.value) return 0;
  let max = 0;
  for (const m of models.value) {
    const raw = m.scores?.[currentDimension.value];
    if (raw == null) continue;
    const v = Number(raw);
    if (Number.isFinite(v)) max = Math.max(max, v);
  }
  return max;
});

function getScorePercent(v) {
  const max = currentDimensionMax.value;
  if (v == null) return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (n / max) * 100));
}

function formatScore(v) {
  if (v == null) return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  // 评分（0-5）和分数（0-100）都适配：整数显示 0 位，小数显示 2 位
  const decimals = Math.abs(n - Math.round(n)) < 1e-9 ? 0 : 2;
  return n.toFixed(decimals);
}

const rankedModels = computed(() => {
  const sorted = [...models.value].sort((a, b) => {
    return b.scores[currentDimension.value] - a.scores[currentDimension.value];
  });

  let lastScore = null;
  let lastRank = 0;

  return sorted.map((m, index) => {
    const score = m.scores[currentDimension.value];
    if (score !== lastScore) {
      lastRank = index + 1;
      lastScore = score;
    }
    return { ...m, _rank: lastRank };
  });
});

function scrollTabs(delta) {
  const el = dimScroll.value;
  if (!el) return;
  el.scrollBy({
    left: delta,
    behavior: "smooth",
  });
}

function scrollLeft() {
  scrollTabs(-160);
}

function scrollRight() {
  scrollTabs(160);
}

function isEnglishLabel(label) {
  if (!label) return false;
  const s = String(label).trim();
  const hasLatin = /[A-Za-z]/.test(s);
  const hasCJK = /[\u4e00-\u9fa5]/.test(s);
  return hasLatin && !hasCJK;
}

function displayDimLabel(label) {
  if (!label) return "";
  const s = String(label).trim();
  return isEnglishLabel(s) ? s.toUpperCase() : s;
}
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

.dimension-tabs-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.dimension-tabs {
  position: relative;
  display: flex;
  flex: 1;
  gap: 8px;
  overflow-x: auto;
  padding: 2px;
  scroll-behavior: smooth;
}

.dimension-tabs::-webkit-scrollbar {
  height: 0;
}

.tab-arrow {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(15, 23, 42, 0.9);
  color: #9ca3af;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.tab-arrow:hover {
  background: rgba(30, 64, 175, 0.9);
  color: #e5e7eb;
  border-color: rgba(191, 219, 254, 0.9);
}

.tab-arrow.left {
  margin-right: 2px;
}

.tab-arrow.right {
  margin-left: 2px;
}

.tab-label {
  white-space: nowrap;
}

.tab-label-en {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
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
  background: radial-gradient(circle at 30% 30%, #fef9c3, #f59e0b);
  color: #1e293b;
}

.rank-badge.rank-2 {
  background: radial-gradient(circle at 30% 30%, #e5e7eb, #6b7280);
  color: #1e293b;
}

.rank-badge.rank-3 {
  background: radial-gradient(circle at 30% 30%, #ffedd5, #f97316);
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
