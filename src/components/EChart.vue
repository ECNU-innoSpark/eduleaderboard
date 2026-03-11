<template>
  <div ref="chartRef" class="chart-root"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
});

const chartRef = ref(null);
let chartInstance;

const resizeHandler = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, "dark");
    chartInstance.setOption(props.option);
    window.addEventListener("resize", resizeHandler);
  }
});

watch(
  () => props.option,
  (newOption) => {
    if (chartInstance && newOption) {
      chartInstance.setOption(newOption, true);
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) {
    window.removeEventListener("resize", resizeHandler);
    chartInstance.dispose();
  }
});
</script>

<style scoped>
.chart-root {
  width: 100%;
  height: 260px;
}
</style>

