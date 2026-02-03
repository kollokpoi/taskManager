<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'Распределение времени по исполнителям'
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const defaultColors = [
  { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
  { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
  { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
  { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
  { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' },
  { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' },
];

const createChart = () => {
  if (!chartCanvas.value) return;

  // Очищаем предыдущий график
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = Object.keys(props.data);
  const dataValues = Object.values(props.data);

  // Генерируем цвета для всех элементов
  const colors = labels.map((_, index) => ({
    backgroundColor: defaultColors[index % defaultColors.length].bg,
    borderColor: defaultColors[index % defaultColors.length].border
  }));

  chartInstance = new Chart(chartCanvas.value, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Затраченное время (часы)',
          data: dataValues,
          backgroundColor: colors.map(c => c.backgroundColor),
          borderColor: colors.map(c => c.borderColor),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: props.title,
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} ч (${percentage}%)`;
            }
          }
        }
      },
    },
  });
};

// Отслеживаем изменения данных
watch(() => props.data, () => {
  createChart();
}, { deep: true });

onMounted(() => {
  createChart();
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>