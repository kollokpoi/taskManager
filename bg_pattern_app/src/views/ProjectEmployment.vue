<template>
<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Учет времени занятости сотрудников по проектам</h1>
  <div class="flex w-full justify-between mb-3">
    <InputNumber placeholder="Планируемое время проекта" class="mr-3 w-1/2" @input="updateTimeElapsed"/>
    <ExcelCreate     
      :excelData="excelData"
      fileName="Отчет_по_проектам_и_занятости.xlsx"
      @export="handleExportSuccess"
      @error="handleExportError"/>
  </div>
  <div class="flex items-center h-10">
    <Dropdown 
      v-model="selectedProject"
      :options="projectsOptions"
      optionLabel="name"
      optionValue="id"
      placeholder="Проект" 
      class="mr-3"/>
    <Dropdown 
      v-model="selectedUser"
      :options="usersOptions"
      optionLabel="name"
      optionValue="id"
      placeholder="Все сотрудники" 
      class="mr-3"/>
    <Dropdown placeholder="Все теги"/>
    <DateRangePicker 
      v-model:startDate="startDate"
      v-model:endDate="endDate"
    />
  </div>
  <div
    v-if="!loading && projects.length > 0"
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
                  <span :class="['font-medium',
                    getTaskResultColorClasses(data)]">
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
  <div
    v-if="!loading && projects.length === 0"
    class="overflow-x-auto mt-3">
    <DataTable
      :value="skeletonData"
      class="p-datatable-sm"
      responsiveLayout="scroll">
        <Column field="projectName" header="Проект">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column field="taskName" header="Задача" >
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column field="employeeName" header="Исполнитель">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column field="date" header="Дата постановки">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column field="pseudoTime" header="Планируемое время">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column field="realTime" header="Фактическое время">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
    </DataTable>
  </div>
</div>
</template>

<script setup>
  import ExcelCreate from '../components/ExcelCreate.vue';
  import { ref, onMounted, computed} from 'vue';
  import {formatHoursToHHMM, formatTableDate} from '../utils/formatters.js';
  import DateRangePicker from '../components/DateRangePicker.vue';
  import { useGlobalDates } from '../utils/globalDates.js';
  import debounce from '../utils/debounce';
  import { projectService } from '../services/projectsService.js';
  import { getTaskResultColorClasses,getSmallerThanNullClasses } from '../utils/classGetters.js';

  const globalDates = useGlobalDates();

  const startDate = ref(globalDates.dates.start);
  const endDate = ref(globalDates.dates.end);

  const loading = ref(false);
  const projects = ref([]);
  const skeletonData = Array(5).fill({});
  const selectedProject = ref(null)
  const selectedUser = ref(null)
  const timeElapsed = ref(null)

  const loadProjects = async()=>{
    try {
      loading.value = true;
      projects.value = await projectService.getProjects();
      console.log('Загружено проектов:', projects.value.length);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      loading.value = false;
    }
  }

  const projectsOptions = computed(() => {
    const projectsMap = new Map();
    projects.value.forEach(project => {
      if (project.id && project.name ) {
        projectsMap.set(project.id, {
            id: project.id,
            name: project.name,
        });
      }
    });

    const projectsArray = Array.from(projectsMap.values());
    projectsArray .sort((a, b) => a.name.localeCompare(b.name));
    
    return [
      { id: null, name: 'Все проекты' },
      ...projectsArray 
    ];
  });

  const usersOptions = computed(() => {
    const usersMap = new Map();
    if(selectedProject.value && selectedProject.value){
      const selectedProjectObj = projects.value.find(
        project => project.id == selectedProject.value
      );
      
      if (selectedProjectObj && selectedProjectObj.users) {
        selectedProjectObj.users.forEach(user => {
          if (user.id && user.name && user.lastName && !usersMap.get(user.id)) {
            usersMap.set(user.id, {
              id: user.id,
              name: `${user.name} ${user.lastName}`,
            });
          }
        });
      }
    }else{
      projects.value.forEach(project=>{
        if(project.users){
          project.users.forEach(user => {
            if(user.id && user.name && user.lastName && !usersMap.get(user.id)){
              usersMap.set(user.id, {
                id: user.id,
                name: `${user.name} ${user.lastName}`,
              });
            }
          });
        }
      })
    }

    const users = Array.from(usersMap.values());
    users.sort((a, b) => a.name.localeCompare(b.name));
    return [
      { id: null, name: 'Все сотрудники' },
      ...users
    ];
  });

  const filteredProjects = computed(() => {
    if (!projects.value.length) return [];

    const allTasks = [];

    projects.value.forEach(project => {
      const taskRows = project.toTableRows(
        startDate.value, 
        endDate.value, 
        timeElapsed.value
      );
      
      allTasks.push(...taskRows);
    });
    const filtered = allTasks.filter(task => {
      if (selectedProject.value && task.projectId !== selectedProject.value) {
        return false;
      }
      if (selectedUser.value && task.responsibleId !== selectedUser.value) {
        return false;
      }
      return true;
    });
    return {
      tasks: filtered,
      totals: {
        plannedTotal: timeElapsed.value,
        actualTotal: filtered.reduce((sum, task) => sum + task.timeSpent, 0),
        resultTotal: timeElapsed.value - filtered.reduce((sum, task) => sum + task.timeSpent, 0)
      }
    };
  });

  const updateTimeElapsed = debounce((event) => {
    timeElapsed.value = parseFloat(event.value) || 0;
  }, 500);

  const excelData = computed(() => {
    const title = "Учет времени занятости сотрудников по проектам";
    const filters = [
      `Период: ${formatTableDate(startDate.value)} - ${formatTableDate(endDate.value)}`,
      selectedProject.value 
        ? `Проект: ${projectsOptions.value.find(p => p.id === selectedProject.value)?.name || 'Все'}`
        : 'Проект: Все проекты',
      selectedUser.value 
        ? `Сотрудник: ${usersOptions.value.find(u => u.id === selectedUser.value)?.name || 'Все'}`
        : 'Сотрудник: Все сотрудники',
      timeElapsed.value 
        ? `Планируемое время проекта: ${timeElapsed.value} ч`
        : 'Планируемое время проекта: не указано'
    ];
    const totals = []

    const columns = [
      { title: "Проект", values: [] },
      { title: "Задача", values: [] },
      { title: "Исполнитель", values: [] },
      { title: "Дата постановки", values: [] },
      { title: "Планируемое время", values: [] },
      { title: "Фактическое время", values: [] },
      { title: "Итого", values: [] },
    ];
    
    if(filteredProjects.value && filteredProjects.value.tasks && filteredProjects.value.tasks.length > 0){
      filteredProjects.value.tasks.forEach(project => {
        columns[0].values.push(project.projectName || '');
        columns[1].values.push(project.title || '');
        columns[2].values.push(project.responsibleName || '');
        columns[3].values.push(formatTableDate(project.dateCreate));
        columns[4].values.push(formatHoursToHHMM(project.timeEstimate));
        columns[5].values.push(formatHoursToHHMM(project.timeSpent));
        columns[6].values.push(formatHoursToHHMM(project.resultTime));
      });
      if(filteredProjects.value && filteredProjects.value.totals){
        totals.push( formatHoursToHHMM(filteredProjects.value.totals.plannedTotal))
        totals.push( formatHoursToHHMM(filteredProjects.value.totals.actualTotal))
        totals.push( formatHoursToHHMM(filteredProjects.value.totals.resultTotal))
      }
      console.log("totals",totals)
      return { title, filters, columns, totals };
    } else {
      return [];
    }
  });

  const handleExportSuccess = (eventData) => {
    console.log('✅ Экспорт отчета по проектам успешен:', eventData);
    // Можно добавить уведомление для пользователя
  };

  const handleExportError = (errorData) => {
    console.error('❌ Ошибка экспорта отчета по проектам:', errorData);
    // Можно добавить уведомление об ошибке
  };
  onMounted(async () => {
    await loadProjects();
  });

</script>

