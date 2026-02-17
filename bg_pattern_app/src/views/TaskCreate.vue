<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Распланировать задачи</h1>
    <div class="flex w-full justify-between mb-4">
      <div class="inputs flex items-center h-10">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          @change="onDatesChange"
        />
      </div>
      <ExcelCreate
        :excelData="excelData"
        fileName="Планирование_задач_сотрудников.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"
        :disabled="!filteredUsers.length"
      />
    </div>

    <!-- Статус загрузки -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="mt-3 text-gray-600">Загрузка данных о сотрудниках...</p>
    </div>

    <!-- Таблица с данными -->
    <div
      v-else-if="filteredUsers && filteredUsers.length > 0"
      class="overflow-x-auto mt-3"
    >
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
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел"
      >
        <Column field="name" header="Сотрудник" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ "Демонстрационный сотрудник" }}</span>
          </template>
        </Column>
        <Column field="taskCount" header="Задачи" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{ data.taskCount }}</span>
          </template>
        </Column>
        <Column field="timeEstimate" header="Время задач" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{
              formatHoursToHHMM(data.timeEstimate)
            }}</span>
          </template>
        </Column>
        <Column field="timeSpent" header="Израсходовано фактически" sortable>
          <template #body="{ data }">
            <span class="font-medium">{{
              formatHoursToHHMM(data.timeSpent)
            }}</span>
          </template>
        </Column>
        <Column field="resultTime" header="Итого" sortable>
          <template #body="{ data }">
            <span :class="['font-medium', getTaskResultColorClasses(data)]">
              {{ formatHoursToHHMM(data.resultTime) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Сообщения об отсутствии данных -->
    <div
      v-else-if="!filteredUsers.length"
      class="text-center py-8 text-gray-500"
    >
      <i
        class="pi text-4xl mb-4"
        :class="{
          'pi-calendar': !startDate || !endDate,
          'pi-inbox':
            startDate &&
            endDate &&
            (!users.length || filteredUsers.message?.includes('сотрудников')),
          'pi-spinner pi-spin': loading,
        }"
      ></i>

      <template v-if="!startDate || !endDate">
        <p>Выберите период для отображения данных</p>
        <p class="text-sm mt-2">Укажите начальную и конечную дату</p>
      </template>
      <template v-else-if="loading">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p class="mt-3 text-gray-600">Загрузка данных о сотрудниках...</p>
      </template>
      <template v-else>
        <p>
          {{
            filteredUsers.message ||
            "Нет данных о сотрудниках в выбранном периоде"
          }}
        </p>
        <p class="text-sm mt-2">Попробуйте изменить период</p>
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
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Сотрудник</div>
            <div class="font-medium">{{ "Демонстрационный сотрудник" }}</div>
          </div>

          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Время задач</div>
            <div class="font-medium">
              {{ formatHoursToHHMM(selectedRow.timeEstimate) }}
            </div>
          </div>

          <div class="bg-gray-50 p-3 rounded">
            <div class="text-sm text-gray-500">Задач</div>
            <div class="font-medium">{{ selectedRow.taskCount }}</div>
          </div>
          <div class="flex w-full justify-between">
            <div class="bg-gray-50 p-3 rounded w-1/2 mr-2">
              <div class="text-sm text-gray-500">Затрачено времени</div>
              <div class="font-medium">
                {{ formatHoursToHHMM(selectedRow.timeSpent) }}
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded w-1/2">
              <div class="text-sm text-gray-500">Итого</div>
              <div
                :class="['font-medium', getTaskResultColorClasses(selectedRow)]"
              >
                {{ formatHoursToHHMM(selectedRow.resultTime) }}
              </div>
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
          currentPageReportTemplate="Показано {first} - {last} из {totalRecords} дел"
        >
          <Column field="title" header="Задача" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ "Демонстрационные задачи" }}</span>
            </template>
          </Column>
          <Column field="timeEstimate" header="Время задачи" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{
                formatHoursToHHMM(data.timeEstimate)
              }}</span>
            </template>
          </Column>
          <Column field="timeSpent" header="Израсходовано фактически" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{
                formatHoursToHHMM(data.timeSpent)
              }}</span>
            </template>
          </Column>
          <Column field="resultTime" header="Итого" sortable>
            <template #body="{ data }">
              <span :class="['font-medium', getTaskResultColorClasses(data)]">
                {{ formatHoursToHHMM(data.resultTime) }}
              </span>
            </template>
          </Column>
        </DataTable>

        <div v-else class="text-center text-gray-500 py-4">
          Нет информации о задачах
        </div>
      </div>

      <!-- Блок для назначения задач -->
      <div
        v-if="selectedRow && userTasksOptions.length > 0"
        class="mt-6 pt-6 border-t border-gray-200"
      >
        <h3 class="text-lg font-semibold mb-3">Назначить новую задачу</h3>
        <div class="flex gap-3 items-center">
          <Dropdown
            v-model="selectedUserTask"
            :options="userTasksOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите задачу"
            class="flex-1"
          />
          <Button
            v-if="selectedUserTask"
            label="Назначить"
            icon="pi pi-user-plus"
            @click="addTaskClick"
            autofocus
          />
        </div>
        <small class="text-gray-500 mt-2 block"
          >Выберите задачу для назначения {{ selectedRow?.name }}</small
        >
      </div>

      <div
        v-else-if="selectedRow"
        class="mt-6 pt-6 border-t border-gray-200 text-gray-500 text-sm"
      >
        <i class="pi pi-info-circle mr-2"></i>
        Нет доступных задач для назначения
      </div>
    </Dialog>
  </div>
</template>
<script setup>
import ExcelCreate from "../components/ExcelCreate.vue";
import { ref, onMounted, computed, watch } from "vue";
import { formatHoursToHHMM, formatTableDate } from "../utils/formatters.js";
import DateRangePicker from "../components/DateRangePicker.vue";
import { useGlobalDates } from "../utils/globalDates.js";
import { userService } from "../services/usersService.js";
import { taskService } from "../services/tasksService.js";
import { getTaskResultColorClasses } from "../utils/classGetters.js";

const globalDates = useGlobalDates();

const startDate = ref();
const endDate = ref();
const loading = ref(false);
const users = ref([]);
const userTasks = ref([]);
const selectedRow = ref(null);
const selectedUserTask = ref(null);
const showDialog = ref(false);
const currentUser = ref(null);

const loadUsers = async () => {
  try {
    loading.value = true;
    users.value = await userService.getUsers(startDate.value, endDate.value);
    console.log("Загружено пользователей:", users.value.length);
  } catch (error) {
    console.error("Ошибка загрузки пользователей:", error);
  } finally {
    loading.value = false;
  }
};

const loadUserTasks = async () => {
  try {
    currentUser.value = await userService.getCurrentUser();
    console.log("currentUser", currentUser.value);
    userTasks.value = await taskService.getUserTasks(
      currentUser.value.id,
      startDate.value,
      endDate.value
    );
  } catch (error) {
    console.error("Ошибка загрузки пользователей:", error);
  } finally {
    loading.value = false;
  }
};

const userTasksOptions = computed(() => {
  const userTasksMap = new Map();
  const filteredUserTasks = userTasks.value.filter(
    (task) => !task.closedBy || !task.closedDate
  );
  filteredUserTasks.forEach((userTask) => {
    userTasksMap.set(userTask.id, {
      id: userTask.id,
      name: userTask.title,
    });
  });

  const userTasksArray = Array.from(userTasksMap.values());
  userTasksArray.sort((a, b) => a.name.localeCompare(b.name));
  console.log("userTasksOptions", {
    filteredUserTasks,
    tasks: userTasks.value,
    userTasksArray,
  });
  return [...userTasksArray];
});

const filteredUsers = computed(() => {
  const sortedUsers = users.value.map((user) =>
    user.toTableRow(startDate.value, endDate.value)
  );
  return sortedUsers;
});

const rowClassFunction = () => {
  return "cursor-pointer hover:bg-blue-50";
};

const onRowClick = (event) => {
  selectedRow.value = event.data;
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
};

const addTaskClick = async () => {
  const taskId = selectedUserTask.value;
  const newResponsibleId = selectedRow.value.id;

  try {
    loading.value = true;
    await taskService.changeTaskResponsible(taskId, newResponsibleId);

    await Promise.all([loadUsers(), loadUserTasks()]);

    closeDialog();
  } catch (error) {
    console.error("Ошибка при изменении ответственного:", error);
  }
};

watch(
  [startDate, endDate],
  async () => {
    if (startDate.value && endDate.value) {
      await loadUsers();
      await loadUserTasks();
    }
  },
  { deep: true }
);

const excelData = computed(() => {
  const title = "Распланировать задачи сотрудников";
  const filters = [
    `Период: ${formatTableDate(startDate.value)} - ${formatTableDate(
      endDate.value
    )}`,
  ];

  const columns = [
    { title: "Сотрудник", values: [] },
    { title: "Задачи", values: [] },
    { title: "Время задач", values: [] },
    { title: "Израсходовано фактически", values: [] },
    { title: "Итого", values: [] },
  ];

  if (filteredUsers.value && filteredUsers.value.length > 0) {
    filteredUsers.value.forEach((user) => {
      columns[0].values.push(user.name || "");
      columns[1].values.push(user.taskCount || 0);
      columns[2].values.push(formatHoursToHHMM(user.timeEstimate));
      columns[3].values.push(formatHoursToHHMM(user.timeSpent));
      columns[4].values.push(formatHoursToHHMM(user.resultTime));
    });

    return { title, filters, columns };
  } else {
    return [];
  }
});

const handleExportSuccess = (eventData) => {
  console.log("✅ Экспорт отчета по планированию успешен:", eventData);
};

const handleExportError = (errorData) => {
  console.error("❌ Ошибка экспорта отчета по планированию:", errorData);
};
onMounted(() => {
  startDate.value = globalDates.dates.start;
  endDate.value = globalDates.dates.end;
});
</script>
