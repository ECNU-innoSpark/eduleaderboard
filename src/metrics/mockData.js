const MODEL_NAMES = ["LLM-A", "LLM-B", "LLM-C", "LLM-D", "LLM-E"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

export function buildParamsOption() {
  const params = MODEL_NAMES.map(() => randomInt(70, 500)); // 单位：B 参数

  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "6%",
      right: "4%",
      bottom: "10%",
      top: "18%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: MODEL_NAMES,
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#64748b" } },
    },
    yAxis: {
      type: "value",
      name: "参数量 (B)",
      axisLabel: { color: "#cbd5f5" },
      splitLine: {
        lineStyle: { color: "rgba(148, 163, 184, 0.35)", type: "dashed" },
      },
    },
    series: [
      {
        name: "参数量",
        type: "bar",
        data: params,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#4f46e5" },
              { offset: 1, color: "#06b6d4" },
            ],
          },
        },
      },
    ],
  };
}

export function buildLatencyOption() {
  const latency = MODEL_NAMES.map(() => randomInt(30, 300));

  return {
    tooltip: { trigger: "axis" },
    grid: {
      left: "6%",
      right: "4%",
      bottom: "10%",
      top: "18%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: MODEL_NAMES,
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#64748b" } },
    },
    yAxis: {
      type: "value",
      name: "延迟 (ms)",
      axisLabel: { color: "#cbd5f5" },
      splitLine: {
        lineStyle: { color: "rgba(148, 163, 184, 0.35)", type: "dashed" },
      },
    },
    series: [
      {
        name: "P95 延迟",
        type: "line",
        smooth: true,
        data: latency,
        lineStyle: { color: "#22c55e", width: 2 },
        areaStyle: {
          color: "rgba(34, 197, 94, 0.12)",
        },
        symbolSize: 7,
      },
    ],
  };
}

export function buildThroughputGpuOption() {
  const throughput = MODEL_NAMES.map(() => randomInt(30, 220));
  const gpu = MODEL_NAMES.map(() => randomInt(30, 98));

  return {
    tooltip: { trigger: "axis" },
    legend: {
      data: ["吞吐量 (req/s)", "GPU 利用率 (%)"],
      textStyle: { color: "#e5e7eb", fontSize: 11 },
    },
    grid: {
      left: "6%",
      right: "6%",
      bottom: "14%",
      top: "18%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        data: MODEL_NAMES,
        axisLabel: { color: "#cbd5f5" },
        axisLine: { lineStyle: { color: "#64748b" } },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "吞吐量 (req/s)",
        axisLabel: { color: "#cbd5f5" },
        splitLine: {
          lineStyle: { color: "rgba(148, 163, 184, 0.35)", type: "dashed" },
        },
      },
      {
        type: "value",
        name: "GPU 利用率 (%)",
        axisLabel: { color: "#cbd5f5" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "吞吐量 (req/s)",
        type: "bar",
        data: throughput,
        yAxisIndex: 0,
        itemStyle: {
          borderRadius: 8,
          color: "#f97316",
        },
      },
      {
        name: "GPU 利用率 (%)",
        type: "line",
        data: gpu,
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { color: "#38bdf8", width: 2 },
        symbolSize: 7,
      },
    ],
  };
}

export function buildTimelineOption() {
  const points = 12;
  const now = Date.now();
  const labels = [];
  const values = [];

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60 * 1000);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    labels.push(`${hh}:${mm}`);
    values.push(randomInt(40, 260));
  }

  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "6%",
      right: "4%",
      bottom: "10%",
      top: "18%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      axisLabel: { color: "#cbd5f5" },
      axisLine: { lineStyle: { color: "#64748b" } },
    },
    yAxis: {
      type: "value",
      name: "平均延迟 (ms)",
      axisLabel: { color: "#cbd5f5" },
      splitLine: {
        lineStyle: { color: "rgba(148, 163, 184, 0.35)", type: "dashed" },
      },
    },
    series: [
      {
        name: "平均延迟",
        type: "line",
        smooth: true,
        data: values,
        lineStyle: { color: "#a855f7", width: 2 },
        areaStyle: {
          color: "rgba(168, 85, 247, 0.16)",
        },
        symbolSize: 6,
      },
    ],
  };
}

export function generateSummaryMetrics() {
  const totalParamsB = randomInt(500, 2000);
  const avgLatency = randomFloat(60, 220);
  const avgThroughput = randomInt(120, 800);
  const avgGpu = randomInt(45, 96);

  return [
    {
      key: "totalParams",
      label: "总参数量",
      value: `${totalParamsB} B`,
      unit: "",
      desc: "所有模型参数总和（模拟值）",
    },
    {
      key: "avgLatency",
      label: "平均延迟",
      value: avgLatency,
      unit: "ms",
      desc: "请求整体平均响应时间",
    },
    {
      key: "avgThroughput",
      label: "平均吞吐量",
      value: avgThroughput,
      unit: "req/s",
      desc: "所有模型平均每秒请求数",
    },
    {
      key: "avgGpu",
      label: "平均 GPU 利用率",
      value: `${avgGpu}%`,
      unit: "",
      desc: "GPU 资源整体利用情况",
    },
  ];
}

