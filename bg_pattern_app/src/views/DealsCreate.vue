<script setup>
    import { ArrowRightIcon } from '@heroicons/vue/24/solid';
    import { DocumentIcon, Cog6ToothIcon, ChatBubbleLeftIcon, InformationCircleIcon} from '@heroicons/vue/24/outline';
    import { ref } from 'vue';
    import ExcelCreate from '../components/ExcelCreate.vue';
    // Реактивные данные
    const testData = [
      {
        name: "Дело 1",
        sum: 1000,
        pseudoTime: "10:00",
        realTime: "11:30",
        result: "Выполнено"
      },
      {
        name: "Дело 1",
        sum: 1000,
        pseudoTime: "10:00",
        realTime: "11:30",
        result: "Выполнено"
      },
      {
        name: "Дело 1",
        sum: 1000,
        pseudoTime: "10:00",
        realTime: "11:30",
        result: "Выполнено"
      },
    ];
    const loading = ref(false);
    const cases = ref([]);
    const firstLoad = ref(true);
    const skeletonData = Array(5).fill({});
    const formatDate = (dateString) => {
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('.');
            const isoDate = `${year}-${month}-${day}`;
            const date = new Date(isoDate);
            if (isNaN(date.getTime())) {
            console.error('Некорректная дата после преобразования:', isoDate);
            return 'Неверная дата';
            }
            return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            });
        } else {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
            console.error('Некорректная дата:', dateString);
            return 'Неверная дата';
            }
            return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            });
        }
    };
  </script>
  
<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Распланировать задачи</h1>
    <div class="flex w-full justify-between mb-3">
      <div class="inputs flex items-center h-10">
        <button class="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer items-center h-full mr-2">
          <i class="pi pi-save  h-5"></i>
        </button>
        <DatePicker v-model="buttondisplay" showIcon fluid class="mr-4" placeholder="Календарь"/>
        <button class="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer items-center mr-2">
          <ChatBubbleLeftIcon class="h-5 mr-2"/>
          <span>Поддержка</span>
        </button>
        <button class="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer items-center mr-2">
          <InformationCircleIcon class="h-5 mr-2"/>
          <span>Инструкция</span>
        </button>
      </div>
      <ExcelCreate :dataItems="cases" title="Учет времени задач/занятости/трудозатрат сотрудников"/>
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
      v-if="!loading && cases.length === 0 && firstLoad"
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