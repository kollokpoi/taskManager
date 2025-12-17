<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Учет времени задач/занятости/трудозатрат сотрудников</h1>
    <div class="flex w-full justify-between">
      <div class="inputs flex items-center h-10">
        <DateRangePicker 
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          @change="onDatesChange"
        />
        <InputNumber placeholder="Ставка"  
        @input="updateWage"
        />
      </div>
      <ExcelCreate :dataItems="deals" title="Учет времени задач/занятости/трудозатрат сотрудников"/>
    </div>
    <div
      v-if="!loading && dealsWithCosts.length > 0"
      class="overflow-x-auto mt-3">
        <DataTable
          :value="dealsWithCosts"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          :rowClass="rowClassFunction"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          @row-click="onRowClick"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} сделок">
          <Column field="name" header="Название" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.name }}</span>
            </template>
          </Column>
          <Column field="sum" header="Сумма" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ formatCurrency(data.sum) }}</span>
            </template>
          </Column>
          <Column field="plannedTime" header="Планируемое время" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.plannedTime }}</span>
            </template>
          </Column>
          <Column field="timeSpent" header="Фактическое время" sortable>
            <template #body="{ data }">
              <span class="font-medium">
                {{ formatHoursToHHMM(data.timeSpent) }}
              </span>
            </template>
          </Column>
          <Column field="resultTime" header="Итого" sortable>
            <template #body="{ data }">
              <span 
                :class="['font-medium',
                  data.resultTime<0?'text-red-600':'text-green-600'
                ]">
                {{ formatHoursToHHMM(data.resultTime) }}
              </span>
            </template>
          </Column>
          <Column field="plannedCost" header="Затраты" sortable>
            <template #body="{ data }">
              <span class="font-medium">
                {{ formatCurrency(data.plannedCost) }}
              </span>
            </template>
          </Column>
          <Column field="realCost" header="Прибыль" sortable>
            <template #body="{ data }">
              <span  
                :class="['font-medium',
                  data.realCost<0?'text-red-600':'text-green-600'
                ]">
                {{ formatCurrency(data.realCost) }}
              </span>
            </template>
          </Column>
        </DataTable>
    </div>
    <div
      v-if="!loading && deals.length === 0"
      class="overflow-x-auto mt-3">
      <DataTable
        :value="skeletonData"
        class="p-datatable-sm"
        responsiveLayout="scroll">
        <Column
          field="Name"
          header="Название">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column
          field="Sum"
          header="Сумма">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column
          field="PseudoTime"
          header="Планируемое время">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column
          field="RealTime"
          header="Фактическое время">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
        <Column
          field="Result"
          header="Итого">
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
  import { ref, onMounted, computed } from 'vue';
  import {useRouter } from 'vue-router';
  import debounce from '../utils/debounce';
  import { dealService } from '../services/dealsService.js';
  import { formatCurrency, formatHoursToHHMM } from '../utils/formatters.js';
  import DateRangePicker from '../components/DateRangePicker.vue';
  import { useGlobalDates } from '../utils/globalDates.js';

  const router = useRouter();
  const globalDates = useGlobalDates();

  const loading = ref(true);
  const deals = ref([]); 
  const wage = ref(0);
  const startDate = ref(globalDates.dates.start);
  const endDate = ref(globalDates.dates.end);
  const skeletonData = Array(7).fill({});
  const selectedDealId = ref(null);
  
  const loadDeals = async () => {
    try {
      loading.value = true;
      deals.value = await dealService.getDeals();
      console.log('Загружено сделок:', deals.value.length);
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    } finally {
      loading.value = false;
    }
  };
  
  const dealsWithCosts = computed(() => {
    return deals.value
      .filter(deal => deal.hasTasksInPeriod(startDate.value, endDate.value))
      .map(deal => deal.toTableRow(wage.value, startDate.value, endDate.value));
  });
  
  const updateWage = debounce((event) => {
    wage.value = parseFloat(event.value) || 0;
  }, 500);
  
  const onRowClick = (event) => {
    const dealData = event.data;
    selectedDealId.value = dealData.id;
    
    router.push({
    path: '/tasks',
      query: {
        dealId: selectedDealId.value,
      }
    });
    
    console.log('Выбрана сделка:', {
      id: dealData.id,
      name: dealData.name
    });
  };

  const rowClassFunction = () => {
    return 'cursor-pointer hover:bg-blue-50';
  };

  const onDatesChange = ({ start, end }) => {
    globalDates.updateDates(start, end);
  };

  onMounted(async () => {
    await loadDeals();
  });
  

  </script>
