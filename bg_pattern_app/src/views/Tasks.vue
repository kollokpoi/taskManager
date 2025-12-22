<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Учет времени задач сотрудников</h1>
    <div class="flex w-full justify-between mb-4">
      <div class="inputs flex items-center h-10">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          @change="onDatesChange"
        />
        <Dropdown
          v-model="selectedEmployee"
          :options="employeeOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Все сотрудники"
          class="mr-4 w-64"
          @change="onEmployeeChange"
          :disabled="loading || !startDate || !endDate"
        />
      </div>
      <ExcelCreate     
        :excelData="excelData"
        fileName="Отчет_по_задачам.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"
        :disabled="!filteredTasks.length"/>
    </div>

    <!-- Статус загрузки -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="mt-3 text-gray-600">Загрузка задач...</p>
    </div>

    <!-- Таблица с данными -->
    <div v-else-if="filteredTasks && filteredTasks.length > 0"
      class="overflow-x-auto mt-3">
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
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} задач"
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

    <!-- Сообщения об отсутствии данных -->
    <div v-else-if="!filteredTasks.length" class="text-center py-8 text-gray-500">
      <i class="pi text-4xl mb-4" 
        :class="{
          'pi-calendar': !startDate || !endDate,
          'pi-inbox': startDate && endDate && (!tasks.length || filteredTasks.message?.includes('задач')),
          'pi-user': selectedEmployee && !filteredTasks.length && tasks.length > 0
        }"></i>
      
      <template v-if="!startDate || !endDate">
        <p>Выберите период для отображения данных</p>
        <p class="text-sm mt-2">Укажите начальную и конечную дату</p>
      </template>
      <template v-else-if="loading">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p class="mt-3 text-gray-600">Загрузка задач...</p>
      </template>
      <template v-else-if="selectedEmployee && !filteredTasks.length && tasks.length > 0">
        <p>У выбранного сотрудника нет задач в указанный период</p>
        <p class="text-sm mt-2">Попробуйте выбрать другого сотрудника или изменить период</p>
      </template>
      <template v-else>
        <p>Нет задач для отображения в выбранном периоде</p>
        <p class="text-sm mt-2">Попробуйте изменить фильтры или выбрать другой период</p>
      </template>
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

  const loading = ref(false);
  const tasks = ref([]);
  const selectedEmployee = ref(null);
  const startDate = ref();
  const endDate = ref();

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
        ? await taskService.getDealTasks(dealId.value,startDate.value,endDate.value)
        : await taskService.getTasks(startDate.value,endDate.value);
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

  watch([startDate, endDate], async () => {
    if(startDate.value && endDate.value)
      await loadTasks()
  }, { deep: true });
  
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
  onMounted(()=>{
    startDate.value = globalDates.dates.start
    endDate.value = globalDates.dates.end
  })
</script>
