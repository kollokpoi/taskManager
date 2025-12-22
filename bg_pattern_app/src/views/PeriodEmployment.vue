<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Учет времени занятости сотрудников</h1>
    <div class="flex w-full justify-between mb-4">
      <div class="inputs flex items-center h-10">
        <DateRangePicker 
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          @change="onDatesChange"
        />
        <Dropdown 
          v-model="selectedUser"
          :options="usersOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Все сотрудники" 
          class="mr-4 w-64"
          @change="onUserChange"
          :disabled="!startDate || !endDate"
        />
        <InputNumber 
          placeholder="Рабочее время"  
          v-model="workingHours"
          :min="0" 
          :max="24" 
          :step="0.5"
          :disabled="!startDate || !endDate"/>
      </div>
      <ExcelCreate     
        :excelData="excelData"
        fileName="Отчет_по_занятости_сотрудников.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"
        :disabled="!filteredUsers.data.length"/>
    </div>

    <!-- Статус загрузки -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="mt-3 text-gray-600">Загрузка данных о сотрудниках...</p>
    </div>

    <!-- Таблица с данными -->
    <div v-else-if="filteredUsers.data && filteredUsers.data.length > 0"
      class="overflow-x-auto mt-3">
        <DataTable
          :value="filteredUsers.data"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          stripedRows
          paginator
          :rows="10"
          :rowClass="rowClassFunction"
          @row-click="onRowClick"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} записей">
            <Column field="date" header="Дата" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatTableDate(data.date) }}</span>
                </template>
                <template #footer>
                  <span class="font-bold">Итого</span>
                </template>
            </Column>
            <Column field="name" header="Имя сотрудника" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ data.name }}</span>
                </template>
            </Column>
            <Column field="taskCount" header="Количество задач" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ data.taskCount }}</span>
                </template>
                <template #footer>
                  <span>{{ filteredUsers.totals?.totalTaskCount || 0 }}</span>
                </template>
            </Column>
            <Column field="timeSpent" header="Затраченное время" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeSpent)  }}</span>
                </template>
                <template #footer>
                  <span>{{ formatHoursToHHMM(filteredUsers.totals?.totalTimeSpent || 0) }}</span>
                </template>
            </Column>
            <Column field="workTime" header="Рабочее время " sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.workTime) }}</span>
                </template>
                <template #footer>
                  <span>{{ formatHoursToHHMM(filteredUsers.totals?.totalWorkTime || 0) }}</span>
                </template>
            </Column>
            <Column field="result" header="Итого/% затраченного времени" sortable>
                <template #body="{ data }">
                    <span :class="['font-medium',
                      data.result<=75?'text-red-600':'text-green-600'
                    ]"
                    > {{ data.result }}%</span>
                </template>
                <template #footer>
                  <span :class="['font-bold', 
                    filteredUsers.totals?.totalPercent < 75 ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ filteredUsers.totals?.totalPercent || '0.00' }}%
                  </span>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Сообщения об отсутствии данных -->
    <div v-else-if="!filteredUsers.data.length" class="text-center py-8 text-gray-500">
      <i class="pi text-4xl mb-4" 
        :class="{
          'pi-calendar': !startDate || !endDate,
          'pi-inbox': startDate && endDate && (!users.length || filteredUsers.message?.includes('сотрудников')),
          'pi-user': selectedUser && !filteredUsers.data.length && users.length > 0
        }"></i>
      
      <template v-if="!startDate || !endDate">
        <p>Выберите период для отображения данных</p>
        <p class="text-sm mt-2">Укажите начальную и конечную дату</p>
      </template>
      <template v-else-if="loading">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p class="mt-3 text-gray-600">Загрузка данных о сотрудниках...</p>
      </template>
      <template v-else-if="selectedUser && !filteredUsers.data.length && users.length > 0">
        <p>У выбранного сотрудника нет данных по задачам в указанный период</p>
        <p class="text-sm mt-2">Попробуйте выбрать другого сотрудника или изменить период</p>
      </template>
      <template v-else>
        <p>{{ filteredUsers.message || 'Нет данных о занятости сотрудников в выбранном периоде' }}</p>
        <p class="text-sm mt-2">Попробуйте изменить фильтры или выбрать другой период</p>
      </template>
    </div>
    
    <!-- Диалог с детальной информацией -->
    <Dialog 
      v-model:visible="showDialog" 
      modal 
      header="Детальная информация"
      :style="{ width: '80%' }"
      @hide="closeDialog"
    >
      <div v-if="selectedRow" class="space-y-4">
        
        <!-- Основная информация -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Сотрудник</div>
            <div class="font-medium">{{ selectedRow.name }}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Задач</div>
            <div class="font-medium">{{ selectedRow.taskCount }}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Затраченное время</div>
            <div class="font-medium">{{ formatHoursToHHMM(selectedRow.timeSpent)  }}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Итого/%</div>
            <div :class="[
              'font-medium',
              selectedRow.result<=75?'text-red-600':'text-green-600']">
              {{ selectedRow.result }}%</div>
          </div>
        </div>
        
        <!-- Таблица задач сотрудника -->
        <DataTable
          :value="selectedRow.tasks"
          v-if="selectedRow.tasks && selectedRow.tasks.length"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел">
            <Column field="title" header="Задача" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{data.title  }}</span>
                </template>
            </Column>
            <Column field="timeSpent" header="Затраченное время" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeSpent)  }}</span>
                </template>
            </Column>
            <Column field="workTime" header="Рабочее время " sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.workTime) }}</span>
                </template>
            </Column>
            <Column field="result" header="Итого/% затраченного времени" sortable>
                <template #body="{ data }">
                    <span class="font-medium"> {{ data.result }}%</span>
                </template>
            </Column>
        </DataTable>

        <div v-else class="text-center text-gray-500 py-4">
          Нет информации о задачах
        </div>
      </div>
    </Dialog>
  </div>
</template>
<script setup>
  import ExcelCreate from '../components/ExcelCreate.vue';
  import { ref, onMounted, computed, watch} from 'vue';
  import {formatHoursToHHMM, formatTableDate} from '../utils/formatters.js';
  import DateRangePicker from '../components/DateRangePicker.vue';
  import { useGlobalDates } from '../utils/globalDates.js';
  import { userService } from '../services/usersService.js';
  import debounce from '../utils/debounce.js';
  const globalDates = useGlobalDates();

  const startDate = ref();
  const endDate = ref();
  const selectedUser = ref(null);
  const loading = ref(false);
  const users = ref([]);
  const workingHours = ref(8)
  const selectedRow = ref(null)
  const showDialog = ref(false);

  const loadUsers = async () => {
    try {
      loading.value = true;
      users.value = await userService.getUsers(startDate.value, endDate.value);
      console.log('Загружено пользователей:', users.value.length);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      loading.value = false;
    }
  };

  const filteredUsers = computed(() => {
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("Invalid dates");
        return [];
      }
      
      const usersArray = []
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const sortedUsers = users.value
          .filter(user => !selectedUser.value || user.id == selectedUser.value)
          .map(user=>user.toTableRowWithDate(currentDate, workingHours.value))
        usersArray.push(...sortedUsers) 
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const totalTasks =  usersArray.reduce((sum, row) => sum + row.taskCount, 0);
      const totalTimeSpent = usersArray.reduce((sum, row) => sum + row.timeSpent, 0);
      const totalWorkTime = usersArray.reduce((sum, row) => sum + row.workTime, 0);
      const totalPercent = totalWorkTime > 0 ? (totalTimeSpent / totalWorkTime * 100).toFixed(2) : '0.00';
      const remainingPercent = totalWorkTime > 0 ? (100 - parseFloat(totalPercent)).toFixed(2) : '0.0'
      return {
      data: usersArray,
      totals: {
        totalTasks,
        totalTimeSpent,
        totalWorkTime,
        totalPercent,
        remainingPercent,
        totalTaskCount: usersArray.reduce((sum, row) => sum + row.taskCount, 0)
      }
    };
      
    } else {
      return { data: [], totals: null };
    }
  });
  
  const usersOptions = computed(() => {
    const usersMap = new Map();
    
    users.value.forEach(user => {
      if (user.id && user.name && user.lastName) {
        usersMap.set(user.id, {
            id: user.id,
            name: `${user.name} ${user.lastName}`,
        });
      }
    });

    const employees = Array.from(usersMap.values());
    employees.sort((a, b) => a.name.localeCompare(b.name));
    
    return [
      { id: null, name: 'Все сотрудники' },
      ...employees
    ];
  });

  const onUserChange = (event) => {
    console.log('Выбран сотрудник:', {
      id: event.value,
      name: usersOptions.value.find(emp => emp.id === event.value)?.name
    });
  };

  const rowClassFunction = () => {
    return "cursor-pointer hover:bg-blue-50";
  };

  const onRowClick = (event) => {
    selectedRow.value = event.data
    showDialog.value = true;
  };

  const closeDialog = () => {
    showDialog.value = false;
  };

  const excelData = computed(() => {
    const title = "Учет времени занятости сотрудников";
    const filters = [
      `Период: ${formatTableDate(startDate.value)} - ${formatTableDate(endDate.value)}`,
      selectedUser.value 
        ? `Сотрудник: ${usersOptions.value.find(user => user.id === selectedUser.value)?.name || 'Все'}`
        : 'Сотрудник: Все сотрудники',
      `Рабочее время в день: ${workingHours.value} ч`
    ];
    const totals = []

    const columns = [
      { title: "Дата", values: [] },
      { title: "Имя сотрудника", values: [] },
      { title: "Количество задач", values: [] },
      { title: "Затраченное время", values: [] },
      { title: "Рабочее время", values: [] },
      { title: "Итого/% затраченного времени", values: [] },
    ];

    if(filteredUsers.value && filteredUsers.value.data && filteredUsers.value.data.length > 0){
      filteredUsers.value.data.forEach(user => {
        columns[0].values.push(formatTableDate(user.date));
        columns[1].values.push(user.name || '');
        columns[2].values.push(user.taskCount || 0);
        columns[3].values.push(formatHoursToHHMM(user.timeSpent));
        columns[4].values.push(formatHoursToHHMM(user.workTime));
        columns[5].values.push(`${user.result}%`);
      });
      
      if(filteredUsers.value && filteredUsers.value.totals){
        totals.push( filteredUsers.value.totals.totalTasks)
        totals.push( formatHoursToHHMM(filteredUsers.value.totals.totalTimeSpent))
        totals.push( formatHoursToHHMM(filteredUsers.value.totals.totalWorkTime))
        totals.push( filteredUsers.value.totals.totalPercent+'%')
      }

      return { title, filters, columns,totals };
    } else {
      return [];
    }
  });

  const handleExportSuccess = (eventData) => {
    console.log('✅ Экспорт отчета по занятости успешен:', eventData);
    // Можно добавить уведомление для пользователя
  };

  const handleExportError = (errorData) => {
    console.error('❌ Ошибка экспорта отчета по занятости:', errorData);
    // Можно добавить уведомление об ошибке
  };
  watch([startDate, endDate], async () => {
    if(startDate.value && endDate.value)
      await loadUsers()
  }, { deep: true });

  onMounted(()=>{
    startDate.value = globalDates.dates.start
    endDate.value = globalDates.dates.end
  })
</script>
