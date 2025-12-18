<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Распланировать задачи </h1>
    <div class="flex w-full justify-between">
      <div class="inputs flex items-center h-10">
        <DateRangePicker 
          v-model:startDate="startDate"
          v-model:endDate="endDate"
        />
      </div>
      <ExcelCreate     
      :excelData="excelData"
      fileName="Планирование_задач_сотрудников.xlsx"
      @export="handleExportSuccess"
      @error="handleExportError"/>
    </div>
    <div
      v-if="!loading && filteredUsers.length > 0"
      class="overflow-x-auto mt-3">
        <DataTable
          :value="filteredUsers"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          stripedRows
          paginator
          :rows="10"
          :rowClass="rowClassFunction"
          @row-click="onRowClick"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел">
            <Column field="name" header="Сотрудник" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ data.name }}</span>
                </template>
            </Column>
            <Column field="taskCount" header="Задачи" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ data.taskCount }}</span>
                </template>
            </Column>
            <Column field="timeEstimate" header="Время задач" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeEstimate)  }}</span>
                </template>
            </Column>
            <Column field="timeSpent" header="Израсходовано фактически" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeSpent)  }}</span>
                </template>
            </Column>
            <Column field="result" header="Итого" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.result)}}</span>
                </template>
            </Column>
        </DataTable>
    </div>
    <div
      v-if="loading"
      class="overflow-x-auto mt-3">
      <DataTable
        :value="skeletonData"
        class="p-datatable-sm"
        responsiveLayout="scroll">
        <Column field="employerName" header="Сотрудник" >
            <template #body>
                <Skeleton
                  height="1.5rem"
                  class="mb-2" />
            </template>
        </Column>
        <Column field="taskCount" header="Задачи">
            <template #body>
                <Skeleton
                  height="1.5rem"
                  class="mb-2" />
            </template>
        </Column>
        <Column field="lostTime" header="Время задач">
            <template #body>
                <Skeleton
                  height="1.5rem"
                  class="mb-2" />
            </template>
        </Column>
        <Column field="workTime" header="Израсходовано фактически">
            <template #body>
                <Skeleton
                  height="1.5rem"
                  class="mb-2" />
            </template>
        </Column>
        <Column field="result" header="Итого">
          <template #body>
            <Skeleton
              height="1.5rem"
              class="mb-2" />
          </template>
        </Column>
      </DataTable>
    </div>
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
            <div class="text-sm text-gray-500">Время задач</div>
            <div class="font-medium">{{ formatHoursToHHMM(selectedRow.timeEstimate)}}</div>
          </div>
          
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Задач</div>
            <div class="font-medium">{{ selectedRow.taskCount }}</div>
          </div>
          <div class="flex w-full justify-between">
            <div class="bg-gray-50 p-3 rounded w-1/2 mr-2">
              <div class="text-sm text-gray-500">Затрачено времени</div>
              <div class="font-medium">{{ formatHoursToHHMM(selectedRow.timeSpent)}}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded w-1/2">
              <div class="text-sm text-gray-500">Итого</div>
              <div class="font-medium">{{ formatHoursToHHMM(selectedRow.result)}}</div>
            </div>
          </div>
        </div>
        
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
                    <span class="font-medium">{{data.title}}</span>
                </template>
            </Column>
            <Column field="timeEstimate" header="Время задачи" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeEstimate)  }}</span>
                </template>
            </Column>
            <Column field="timeSpent" header="Израсходовано фактически" sortable>
                <template #body="{ data }">
                    <span class="font-medium">{{ formatHoursToHHMM(data.timeSpent)  }}</span>
                </template>
            </Column>
            <Column field="result" header="Итого" sortable>
                <template #body="{ data }">
                    <span class="font-medium"> {{ formatHoursToHHMM(data.result) }}</span>
                </template>
            </Column>
        </DataTable>

        <!-- Нет задач -->
        <div v-else class="text-center text-gray-500 py-4">
          Нет информации о задачах
        </div>
      </div>
      <div class="flex w-full">
        <Dropdown 
          v-model="selectedUserTask"
          :options="userTasksOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Задачи" 
          class="mr-3 flex-1"/>
        <Button 
          v-if="selectedUserTask"
          label="Сохранить" 
          class="w-1/4"
          @click="addTaskClick"
          autofocus 
        />
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
  import { taskService } from '../services/tasksService.js';

  const globalDates = useGlobalDates();

  const startDate = ref(globalDates.dates.start);
  const endDate = ref(globalDates.dates.end);
  const loading = ref(false);
  const users = ref([]);
  const userTasks = ref([])
  const skeletonData = Array(5).fill({});
  const selectedRow = ref(null)
  const selectedUserTask = ref(null)
  const showDialog = ref(false);
  const currentUser = ref(null)

  const loadUsers = async () => {
    try {
      loading.value = true;
      users.value = await userService.getUsers();
      console.log('Загружено пользователей:', users.value.length);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      loading.value = false;
    }
  };
  
  const loadUserTasks = async () => {
    try {
      currentUser.value = await userService.getCurrentUser()
      userTasks.value = await taskService.getUserTasks(currentUser.value.id,false);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      loading.value = false;
    }
  };

  const userTasksOptions = computed(() => {
    const userTasksMap = new Map();
    const filteredUserTasks =  userTasks.value.filter(task=>!task.closedBy)
    filteredUserTasks.forEach(userTask => {
      userTasksMap.set(userTask.id, {
            id: userTask.id,
            name: userTask.title,
        });
    });

    const userTasksArray= Array.from(userTasksMap.values());
    userTasksArray.sort((a, b) => a.name.localeCompare(b.name));
    
    return [
      { id: null, name: 'Все задачи' },
      ...userTasksArray 
    ];
  });

  const filteredUsers = computed(() => {
    const sortedUsers = users.value
          .map(user=>user.toTableRow(startDate.value,endDate.value))
    return sortedUsers;
  });

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

  const addTaskClick = async () => {
    const taskId = selectedUserTask.value;
    const newResponsibleId = selectedRow.value.id


    try {
      loading.value = true
      await taskService.changeTaskResponsible(taskId, newResponsibleId);
      
      await Promise.all([
        loadUsers(),      // Перезагружаем сотрудников
        loadUserTasks()   // Перезагружаем задачи текущего пользователя
      ]);
      
      closeDialog();
      
    } catch (error) {
      console.error('Ошибка при изменении ответственного:', error);
    }
  };

  watch(() => globalDates.dates.start, (newVal) => {
    if (newVal !== startDate.value) {
      startDate.value = newVal;
    }
  });

  watch(() => globalDates.dates.end, (newVal) => {
    if (newVal !== endDate.value) {
      endDate.value = newVal;
    }
  });
  
  const excelData = computed(() => {
    const title = "Распланировать задачи сотрудников";
    const filters = [
      `Период: ${formatTableDate(startDate.value)} - ${formatTableDate(endDate.value)}`
    ];
    
    const columns = [
      { title: "Сотрудник", values: [] },
      { title: "Задачи", values: [] },
      { title: "Время задач", values: [] },
      { title: "Израсходовано фактически", values: [] },
      { title: "Итого", values: [] },
    ];
    
    if(filteredUsers.value && filteredUsers.value.length > 0){
      filteredUsers.value.forEach(user => {
        columns[0].values.push(user.name || '');
        columns[1].values.push(user.taskCount || 0);
        columns[2].values.push(formatHoursToHHMM(user.timeEstimate));
        columns[3].values.push(formatHoursToHHMM(user.timeSpent));
        columns[4].values.push(formatHoursToHHMM(user.result));
      });
      
      return { title, filters, columns };
    } else {
      return [];
    }
  });

  const handleExportSuccess = (eventData) => {
    console.log('✅ Экспорт отчета по планированию успешен:', eventData);
    // Можно добавить уведомление для пользователя
  };

  const handleExportError = (errorData) => {
    console.error('❌ Ошибка экспорта отчета по планированию:', errorData);
    // Можно добавить уведомление об ошибке
  };
  onMounted( () => {
    loadUsers();
    loadUserTasks();
  });
</script>
