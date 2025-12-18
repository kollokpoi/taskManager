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
      </div>
      <ExcelCreate     
        :excelData="excelData"
        fileName="Отчет_по_задачам.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"/>
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
                getTaskResultColorClasses(data)
              ]">

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
            <span          
              :class="[
                'font-medium',
                getTaskResultColorClasses(data)
              ]">
              {{ data.status }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
    <div v-if="loading" class="overflow-x-auto mt-3">
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
  import { useRoute } from "vue-router";
  import { taskService } from "../services/tasksService.js";
  import { formatHoursToHHMM, formatDate } from "../utils/formatters.js";
  import DateRangePicker from "../components/DateRangePicker.vue";
  import ExcelCreate from "../components/ExcelCreate.vue";
  import { useGlobalDates } from '../utils/globalDates.js';
  import { getTaskResultColorClasses } from "../utils/classGetters.js";
  const globalDates = useGlobalDates();

  const route = useRoute();

  const loading = ref(true);
  const tasks = ref([]);
  const selectedEmployee = ref(null);
  const startDate = ref(globalDates.startDate);
  const endDate = ref(globalDates.endDate);
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
  
  const excelData = computed(() => {
    const title = "Учет времени задач сотрудников";
    const filters = [
      `Период: ${formatDate(startDate.value)} - ${formatDate(endDate.value)}`,
      selectedEmployee.value 
        ? `Сотрудник: ${employeeOptions.value.find(emp => emp.id === selectedEmployee.value)?.name || 'Все'}`
        : 'Сотрудник: Все сотрудники'
    ];
    
    const columns = [
      { title: "Задача", values: [] },
      { title: "Исполнитель", values: [] },
      { title: "Планируемое время", values: [] },
      { title: "Фактическое время", values: [] },
      { title: "Итого", values: [] },
      { title: "Дедлайн", values: [] },
      { title: "Статус", values: [] },
    ];
    
    if(filteredTasks.value && filteredTasks.value.length > 0){
      filteredTasks.value.forEach(task => {
        columns[0].values.push(task.title || '');
        columns[1].values.push(task.responsibleName || '');
        columns[2].values.push(formatHoursToHHMM(task.timeEstimate));
        columns[3].values.push(formatHoursToHHMM(task.timeSpent));
        columns[4].values.push(formatHoursToHHMM(task.resultTime));
        columns[5].values.push(formatDate(task.deadline));
        columns[6].values.push(task.status || '');
      });
      
      return { title, filters, columns };
    } else {
      return [];
    }
  });

  const handleExportSuccess = (eventData) => {
    console.log('✅ Экспорт отчета по задачам успешен:', eventData);
    // Можно добавить уведомление для пользователя
  };

  const handleExportError = (errorData) => {
    console.error('❌ Ошибка экспорта отчета по задачам:', errorData);
    // Можно добавить уведомление об ошибке
  };
  onMounted(async () => {
    await loadTasks();
  });
</script>
