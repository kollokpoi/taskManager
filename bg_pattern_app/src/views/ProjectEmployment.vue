<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Учет времени занятости сотрудников по проектам</h1>
    <div class="flex w-full justify-between mb-3">
      <InputNumber 
        placeholder="Планируемое время проекта" 
        class="mr-3 w-1/2" 
        v-model="timeElapsed"
        :min="0" 
        :step="0.5"
        :disabled="loadingProjects || loadingProjectDetails"/>
      <ExcelCreate     
        :excelData="excelData"
        fileName="Отчет_по_проектам_и_занятости.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"/>
    </div>
    <div class="flex items-center h-10">
      <Dropdown 
        v-model="selectedProjectId"
        :options="projectsOptions"
        optionLabel="name"
        optionValue="id"
        placeholder="Проект" 
        class="mr-3"
        :loading="loadingProjects"
        :disabled="loadingProjects"
        @change="onProjectChange"
        showClear>
        <template #value="slotProps">
          <div v-if="slotProps.value">
            <span>{{ getProjectName(slotProps.value) }}</span>
          </div>
          <span v-else>{{ slotProps.placeholder }}</span>
        </template>
      </Dropdown>
      
      <Dropdown 
        v-model="selectedUserId"
        :options="usersOptions"
        optionLabel="name"
        optionValue="id"
        placeholder="Все сотрудники" 
        class="mr-3"
        :disabled="!selectedProjectId || loadingProjectDetails"
        showClear>
        <template #value="slotProps">
          <div v-if="slotProps.value">
            <span>{{ getUserName(slotProps.value) }}</span>
          </div>
          <span v-else>{{ slotProps.placeholder }}</span>
        </template>
      </Dropdown>
      
      <Dropdown placeholder="Все теги" :disabled="!selectedProjectId"/>
      
      <DateRangePicker 
        v-model:startDate="startDate"
        v-model:endDate="endDate"
        :disabled="loadingProjects || loadingProjectDetails"/>
    </div>
  
    <!-- Статус загрузки -->
    <div v-if="loadingProjects" class="overflow-x-auto mt-3">
      <DataTable :value="skeletonData" class="p-datatable-sm" responsiveLayout="scroll">
        <Column field="projectName" header="Проект">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="taskName" header="Задача">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="employeeName" header="Исполнитель">
          <template #body>
            <Skeleton height="1.5rem" class="mb-2" />
          </template>
        </Column>
        <Column field="date" header="Дата постановки">
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
      </DataTable>
    </div>
  
    <!-- Загрузка деталей проекта -->
    <div v-else-if="loadingProjectDetails" class="text-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="mt-3 text-gray-600">Загрузка данных проекта...</p>
    </div>
  
    <!-- Таблица с данными -->
    <div v-else-if="filteredProjects.tasks && filteredProjects.tasks.length > 0"
      class="overflow-x-auto mt-3">
        <DataTable
          :value="filteredProjects.tasks"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел">
            
            <Column field="projectName" header="Проект" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ data.projectName }}</span>
                </template>
                <template #footer>
                  <span class="font-bold">Итого:</span>
                </template>
            </Column>
            
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
            
            <Column field="dateCreate" header="Дата постановки" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatTableDate(data.dateCreate) }}</span>
                </template>
            </Column>
            
            <Column field="planedTime" header="Планируемое время" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeEstimate)}}</span>
                </template>
                <template #footer>
                  <span class="font-bold">
                    {{ formatHoursToHHMM(filteredProjects.totals?.plannedTotal || 0) }}
                  </span>
                </template>
            </Column>
            
            <Column field="timeSpent" header="Фактическое время" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeSpent) }}</span>
                </template>
                <template #footer>
                  <span class="font-bold">
                    {{ formatHoursToHHMM(filteredProjects.totals?.actualTotal || 0) }}
                  </span>
                </template>
            </Column>
            
            <Column field="resultTime" header="Итого" sortable>
                <template #body="{ data }">
                    <span :class="['font-medium', getTaskResultColorClasses(data)]">
                      {{ formatHoursToHHMM(data.resultTime) }}
                    </span>
                </template>
                <template #footer>
                  <span :class="['font-bold', getSmallerThanNullClasses(filteredProjects.totals?.resultTotal || 0)]">
                    {{ formatHoursToHHMM(filteredProjects.totals?.resultTotal || 0) }}
                  </span>
                </template>
            </Column>
        </DataTable>
    </div>
  
    <!-- Нет данных -->
    <div v-else-if="selectedProjectId && !loadingProjectDetails" class="text-center py-8 text-gray-500">
      <i class="pi pi-inbox text-4xl mb-4"></i>
      <p>В выбранном проекте нет задач для отображения</p>
      <p class="text-sm mt-2">Попробуйте изменить фильтры или выбрать другой проект</p>
    </div>
  
    <div v-else-if="!loadingProjects" class="text-center py-8 text-gray-500">
      <i class="pi pi-filter text-4xl mb-4"></i>
      <p>Выберите проект для отображения данных</p>
    </div>
  </div>
  </template>
  
  <script setup>
    import { ref, onMounted, computed, watch } from 'vue';
    import ExcelCreate from '../components/ExcelCreate.vue';
    import { formatHoursToHHMM, formatTableDate } from '../utils/formatters.js';
    import DateRangePicker from '../components/DateRangePicker.vue';
    import { useGlobalDates } from '../utils/globalDates.js';
    import { projectService } from '../services/projectsService.js';
    import { getTaskResultColorClasses, getSmallerThanNullClasses } from '../utils/classGetters.js';
    
    const globalDates = useGlobalDates();
  
    const startDate = ref(globalDates.dates.start);
    const endDate = ref(globalDates.dates.end);
    
    // Состояния загрузки
    const loadingProjects = ref(false); // Загрузка списка проектов
    const loadingProjectDetails = ref(false); // Загрузка деталей проекта
    
    // Данные
    const projectsList = ref([]); // Только ID и названия проектов
    const currentProject = ref(null); // Полные данные выбранного проекта
    const skeletonData = Array(5).fill({});
    
    // Фильтры
    const selectedProjectId = ref(null);
    const selectedUserId = ref(null);
    const timeElapsed = ref(0);
  
    // Загружаем список проектов при монтировании
    onMounted(async () => {
      await loadProjectsList();
    });
  
    // Загружаем только список проектов (ID + название)
    const loadProjectsList = async () => {
      try {
        loadingProjects.value = true;
        projectsList.value = await projectService.getProjectsList();
        console.log('Загружено проектов:', projectsList.value.length);
      } catch (error) {
        console.error('Ошибка загрузки списка проектов:', error);
      } finally {
        loadingProjects.value = false;
      }
    };
  
    // При изменении выбранного проекта
    const onProjectChange = async () => {
      selectedUserId.value = null; // Сбрасываем выбор пользователя
      currentProject.value = null; // Сбрасываем текущий проект
      
      if (!selectedProjectId.value) {
        return;
      }
  
      try {
        loadingProjectDetails.value = true;
        // Загружаем детали проекта (участники и задачи)
        currentProject.value = await projectService.getProjectDetails(selectedProjectId.value);
        console.log('Загружен проект:', currentProject.value);
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error);
      } finally {
        loadingProjectDetails.value = false;
      }
    };
  
    // Получить имя проекта по ID
    const getProjectName = (projectId) => {
      const project = projectsList.value.find(p => p.id == projectId);
      return project?.name || 'Неизвестный проект';
    };
  
    // Получить имя пользователя по ID
    const getUserName = (userId) => {
      if (!currentProject.value || !currentProject.value.users) return '';
      const user = currentProject.value.users.find(u => u.id == userId);
      return user ? `${user.name} ${user.lastName}`.trim() : '';
    };
  
    // Опции для dropdown проектов
    const projectsOptions = computed(() => {
      const options = projectsList.value.map(project => ({
        id: project.id,
        name: project.name
      }));
      
      options.sort((a, b) => a.name.localeCompare(b.name));
      
      return [
        { id: null, name: 'Все проекты' },
        ...options
      ];
    });
  
    // Опции для dropdown пользователей
    const usersOptions = computed(() => {
      if (!currentProject.value || !currentProject.value.users || !currentProject.value.users.length) {
        return [{ id: null, name: 'Все сотрудники' }];
      }
  
      const users = currentProject.value.users.map(user => ({
        id: user.id,
        name: `${user.name} ${user.lastName}`.trim()
      }));
  
      users.sort((a, b) => a.name.localeCompare(b.name));
      
      return [
        { id: null, name: 'Все сотрудники' },
        ...users
      ];
    });
  
    // Фильтрованные задачи
    const filteredProjects = computed(() => {
      // Если нет проекта или нет задач
      if (!currentProject.value || !currentProject.value.tasks || !currentProject.value.tasks.length) {
        return { tasks: [], totals: { plannedTotal: 0, actualTotal: 0, resultTotal: 0 } };
      }
  
      // Получаем задачи проекта
      const taskRows = currentProject.value.toTableRows(
        startDate.value, 
        endDate.value, 
        timeElapsed.value
      );
  
      // Фильтруем по выбранному пользователю
      let filtered = taskRows;
      
      if (selectedUserId.value) {
        filtered = filtered.filter(task => 
          task.responsibleId == selectedUserId.value
        );
      }
  
      const plannedTotal = timeElapsed.value;
      const actualTotal = filtered.reduce((sum, task) => sum + task.timeSpent, 0);
      const resultTotal = plannedTotal - actualTotal;
  
      return {
        tasks: filtered,
        totals: {
          plannedTotal,
          actualTotal,
          resultTotal,
          taskCount: filtered.length
        }
      };
    });
  
    // Данные для экспорта в Excel
    const excelData = computed(() => {
      if (!filteredProjects.value.tasks || filteredProjects.value.tasks.length === 0) {
        return [];
      }
  
      const title = "Учет времени занятости сотрудников по проектам";
      const filters = [
        `Период: ${formatTableDate(startDate.value)} - ${formatTableDate(endDate.value)}`,
        selectedProjectId.value 
          ? `Проект: ${getProjectName(selectedProjectId.value)}`
          : 'Проект: Все проекты',
        selectedUserId.value 
          ? `Сотрудник: ${getUserName(selectedUserId.value)}`
          : 'Сотрудник: Все сотрудники',
        timeElapsed.value 
          ? `Планируемое время проекта: ${timeElapsed.value} ч`
          : 'Планируемое время проекта: не указано'
      ];
  
      const columns = [
        { title: "Проект", values: [] },
        { title: "Задача", values: [] },
        { title: "Исполнитель", values: [] },
        { title: "Дата постановки", values: [] },
        { title: "Планируемое время", values: [] },
        { title: "Фактическое время", values: [] },
        { title: "Итого", values: [] },
      ];
      
      filteredProjects.value.tasks.forEach(task => {
        columns[0].values.push(task.projectName || '');
        columns[1].values.push(task.title || '');
        columns[2].values.push(task.responsibleName || '');
        columns[3].values.push(formatTableDate(task.dateCreate));
        columns[4].values.push(formatHoursToHHMM(task.timeEstimate));
        columns[5].values.push(formatHoursToHHMM(task.timeSpent));
        columns[6].values.push(formatHoursToHHMM(task.resultTime));
      });
  
      // Добавляем итоги
      const totals = {
        plannedTotal: formatHoursToHHMM(filteredProjects.value.totals.plannedTotal),
        actualTotal: formatHoursToHHMM(filteredProjects.value.totals.actualTotal),
        resultTotal: formatHoursToHHMM(filteredProjects.value.totals.resultTotal)
      };
  
      return { title, filters, columns, totals };
    });
    
    const handleExportSuccess = (eventData) => {
      console.log('✅ Экспорт отчета по проектам успешен:', eventData);
    };
  
    const handleExportError = (errorData) => {
      console.error('❌ Ошибка экспорта отчета по проектам:', errorData);
    };
  </script>