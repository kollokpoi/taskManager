<template>
<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Учет времени занятости сотрудников по проектам</h1>
  <div class="flex w-full justify-between mb-3">
    <ExcelCreate :dataItems="cases" title="Учет времени задач/занятости/трудозатрат сотрудников"/>
  </div>
  <div class="flex items-center h-10 mb-3 w-1/2" >
    <InputNumber placeholder="Планируемое время проекта" class="mr-3 w-1/2" v-model="timeElapsed"/>
  </div>
  <div class="flex items-center h-10">
    <Dropdown 
      v-model="selectedProject"
      :options="projectsOptions"
      placeholder="Проект" 
      class="mr-3"/>
    <Dropdown 
    v-model="selectedUser"
    :options="usersOptions"
    placeholder="Все сотрудники" 
    class="mr-3"/>
    <Dropdown placeholder="Все теги"/>
    <DateRangePicker 
      v-model:startDate="startDate"
      v-model:endDate="endDate"
    />
  </div>
  <div
    v-if="!loading && cases.length > 0"
    class="overflow-x-auto mt-3">
      <DataTable
        :value="cases"
        responsiveLayout="scroll"
        class="p-datatable-sm"
        stripedRows
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел">
          <Column field="projectName" header="Проект">
              <template #body="{ data }">
                  <span class="font-medium">{{ data.projectName }}</span>
              </template>
          </Column>
          <Column field="taskName" header="Задача" >
              <template #body="{ data }">
                  <span class="font-medium">{{ data.taskName }}</span>
              </template>
          </Column>
          <Column field="employeeName" header="Исполнитель">
              <template #body="{ data }">
                  <span class="font-medium">{{ data.employeeName }}</span>
              </template>
          </Column>
          <Column field="date" header="Дата постановки">
              <template #body="{ data }">
                  <span class="font-medium">{{ formatDate(data.date) }}</span>
              </template>
          </Column>
          <Column field="pseudoTime" header="Планируемое время">
              <template #body="{ data }">
                  <span class="font-medium">{{ data.pseudoTime }}</span>
              </template>
          </Column>
          <Column field="realTime" header="Фактическое время">
              <template #body="{ data }">
                  <span class="font-medium">{{ data.realTime }}</span>
              </template>
          </Column>
      </DataTable>
  </div>
  <div
    v-if="!loading && cases.length === 0"
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
  import { ref, onMounted, computed, watch} from 'vue';
  import {formatHoursToHHMM, formatTableDate} from '../utils/formatters.js';
  import DateRangePicker from '../components/DateRangePicker.vue';
  import { useGlobalDates } from '../utils/globalDates.js';
  import { projectService } from '../services/projectsService.js';

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

  }

  const projectsOptions = computed(() => {
    const projectsMap = new Map();
    
    projects.value.forEach(project => {
      if (project.id && project.name && project.lastName) {
        projectsMap.set(project.id, {
            id: project.id,
            name: `${project.name} ${project.lastName}`,
        });
      }
    });

    const projects = Array.from(projectMap.values());
    projects.sort((a, b) => a.name.localeCompare(b.name));
    
    return [
      { id: null, name: 'Все сотрудники' },
      ...projects
    ];
  });

  const usersOptions = computed(() => {

  });

  onMounted(async () => {
    await loadProjects();
  });

</script>

