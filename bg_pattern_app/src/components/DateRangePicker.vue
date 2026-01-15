<!-- src/components/DateRangePicker.vue -->
<template>
  <div class="flex items-center h-10">
    <DatePicker
      v-model="localStartDate"
      showIcon
      fluid
      dateFormat="dd.mm.yy"
      class="mr-4 w-40"
      placeholder="Начало периода"
      @update:modelValue="emitDates"
    />
    <ArrowRightIcon class="mr-4 h-5" />
    <DatePicker
      v-model="localEndDate"
      showIcon
      fluid
      dateFormat="dd.mm.yy"
      class="mr-4 w-40"
      placeholder="Конец периода"
      @update:modelValue="emitDates"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { ArrowRightIcon } from "@heroicons/vue/24/solid";

const props = defineProps({
  startDate: {
    type: [Date, String, null],
    default: null,
  },
  endDate: {
    type: [Date, String, null],
    default: null,
  },
});

const emit = defineEmits(["update:startDate", "update:endDate", "change"]);

const localStartDate = ref(props.startDate);
const localEndDate = ref(props.endDate);

const emitDates = () => {
  emit("update:startDate", localStartDate.value);
  emit("update:endDate", localEndDate.value);
  emit("change", {
    start: localStartDate.value,
    end: localEndDate.value,
  });
};

watch(
  () => props.startDate,
  (newVal) => {
    localStartDate.value = newVal;
  }
);

watch(
  () => props.endDate,
  (newVal) => {
    localEndDate.value = newVal;
  }
);
onMounted(() => {
  emitDates();
});
</script>
