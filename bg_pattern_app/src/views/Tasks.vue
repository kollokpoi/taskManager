<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Учет времени задач сотрудников</h1>
    <div class="flex w-full justify-between">
      <div class="inputs flex items-center h-10">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
        />
        <Dropdown
          v-model="selectedEmployee"
          :options="employeeOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Все сотрудники"
          class="mr-4 w-64"
          @change="onEmployeeChange"
        />
        <Dropdown placeholder="Фильтр" />
      </div>
      <ExcelCreate
        :dataItems="tasks"
        title="Учет времени задач/занятости/трудозатрат сотрудников"
      />
    </div>
    <div v-if="!loading && tasks.length > 0" class="overflow-x-auto mt-3">
      <DataTable
        :value="filteredTasks"
        responsiveLayout="scroll"
        class="p-datatable-sm"
        :rowClass="rowClassFunction"
        stripedRows
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        @row-click="onRowClick"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел"
      >
        <Column field="title" header="Задача" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.title }}</span>
          </template>
        </Column>
        <Column field="responsibleName" header="Исполнитель" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.responsibleName }}</span>
          </template>
        </Column>
        <Column field="pseudoTime" header="Планируемое время">
          <template #body="{ data }">
            <span class="font-medium">{{
              formatHoursToHHMM(data.timeEstimate)
            }}</span>
          </template>
        </Column>
        <Column field="realTime" header="Фактическое время" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{
              formatHoursToHHMM(data.timeSpent)
            }}</span>
          </template>
        </Column>
        <Column field="resultTime" header="Итого" sortable>
          <template #body="{ data }">
            <span
              :class="[
                'font-medium',
                data.resultTime < 0 ? 'text-red-600' : 'text-green-600',
              ]"
            >
              {{ formatHoursToHHMM(data.resultTime) }}
            </span>
          </template>
        </Column>
        <Column field="lastDate" header="Дедлайн" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ formatDate(data.deadline) }}</span>
          </template>
        </Column>
        <Column field="status" header="Статус" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.status }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
    <div v-if="!loading && tasks.length === 0" class="overflow-x-auto mt-3">
      <DataTable
        :value="skeletonData"
        class="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <Column field="tasks" header="Задачи">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="executor" header="Исполнитель">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="pseudoTime" header="Планируемое время">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="realTime" header="Фактическое время">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="result" header="Итого">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="lastDate" header="Дедлайн">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="status" header="Статус">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeMount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { taskService } from "../services/tasksService.js";
import { formatHoursToHHMM, formatDate } from "../utils/formatters.js";
import DateRangePicker from "../components/DateRangePicker.vue";
import { useGlobalDates } from '../utils/globalDates.js';
const globalDates = useGlobalDates();

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const tasks = ref([]);
const selectedEmployee = ref(null);
const startDate = ref(globalDates.startDate);
const endDate = ref(globalDates.endDate);
const filter = ref([]);
const skeletonData = Array(5).fill({});

const dealId = ref();

onBeforeMount(() => {
  if (route.query.dealId) {
    dealId.value = route.query.dealId;
    console.log("Фильтр по сделке:", dealId.value);
  }
});

const loadTasks = async () => {
  try {
    loading.value = true;
    tasks.value = dealId.value
      ? await taskService.getDealTasks(dealId.value)
      : await taskService.getTasks();
    console.log("Загружено задач:", tasks.value.length);
  } catch (error) {
    console.error("Ошибка загрузки задач:", error);
  } finally {
    loading.value = false;
  }
};

const employeeOptions = computed(() => {
  const employeesMap = new Map();

  tasks.value.forEach((task) => {
    if (task.responsibleId && task.responsibleName) {
      if (!employeesMap.has(task.responsibleId)) {
        employeesMap.set(task.responsibleId, {
          id: task.responsibleId,
          name: task.responsibleName,
        });
      }
    }
  });

  const employees = Array.from(employeesMap.values());
  employees.sort((a, b) => a.name.localeCompare(b.name));

  return [{ id: null, name: "Все сотрудники" }, ...employees];
});

const filteredTasks = computed(() => {
  console.log("tasks", tasks.value);
  return tasks.value
    .filter(
      (task) =>
        !selectedEmployee.value || task.responsibleId == selectedEmployee.value
    )
    .filter((task) => task.isInDateRange(startDate.value, endDate.value))
    .map((task) => task.toTableRow(startDate.value, endDate.value));
});

const onEmployeeChange = (event) => {
  console.log("Выбран сотрудник:", {
    id: event.value,
    name: employeeOptions.value.find((emp) => emp.id === event.value)?.name,
  });
};

const rowClassFunction = () => {
  return "cursor-pointer hover:bg-blue-50";
};

const onRowClick = (event) => {};
watch(
  () => globalDates.dates.start,
  (newVal) => {
    if (newVal !== startDate.value) {
      startDate.value = newVal;
    }
  }
);

watch(
  () => globalDates.dates.end,
  (newVal) => {
    if (newVal !== endDate.value) {
      endDate.value = newVal;
    }
  }
);

onMounted(async () => {
  await loadTasks();
});
</script>
