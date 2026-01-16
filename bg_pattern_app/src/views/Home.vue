<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">
      Учет времени задач/занятости/трудозатрат сотрудников
    </h1>
    <div class="flex w-full justify-between">
      <div class="inputs flex items-center h-10">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          @change="onDatesChange"
        />
        <InputNumber placeholder="Ставка" @input="updateWage" />
        <Dropdown
          v-model="selectedCategory"
          :options="categoryOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Все воронки"
          class="mr-4 w-64"
          :disabled="loading"
        />
      </div>
      <ExcelCreate
        :excelData="excelData"
        fileName="Отчет_по_сделкам.xlsx"
        @export="handleExportSuccess"
        @error="handleExportError"
      />
    </div>
    <div
      v-if="!loading && dealsWithCosts.length > 0"
      class="overflow-x-auto mt-3"
    >
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
        currentPageReportTemplate="Показано {first} - {last} из {totalRecords} сделок"
      >
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
            <span :class="['font-medium', getDealResultColorClasses(data)]">
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
            <span :class="['font-medium', getDealResultColorClasses(data)]">
              {{ formatCurrency(data.realCost) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
    <div
      v-else-if="!dealsWithCosts.length"
      class="text-center py-8 text-gray-500"
    >
      <i
        class="pi text-4xl mb-4"
        :class="{
          'pi-calendar': !startDate || !endDate,
        }"
      ></i>

      <template v-if="!startDate || !endDate">
        <p>Выберите период для отображения данных</p>
        <p class="text-sm mt-2">Укажите начальную и конечную дату</p>
      </template>
      <template v-else-if="loading">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p class="mt-3 text-gray-600">Загрузка сделок...</p>
      </template>
      <template v-else>
        <p>Нет сделок для отображения в выбранном периоде</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import ExcelCreate from "../components/ExcelCreate.vue";
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import debounce from "../utils/debounce";
import { dealService } from "../services/dealsService.js";
import {
  formatCurrency,
  formatHoursToHHMM,
  formatTableDate,
} from "../utils/formatters.js";
import DateRangePicker from "../components/DateRangePicker.vue";
import { useGlobalDates } from "../utils/globalDates.js";
import { getDealResultColorClasses } from "../utils/classGetters.js";

const router = useRouter();
const globalDates = useGlobalDates();

const loading = ref(false);
const deals = ref([]);
const wage = ref(0);
const startDate = ref();
const endDate = ref();
const selectedDealId = ref(null);
const selectedCategory = ref(null);
const categories = ref();

const loadDeals = async () => {
  try {
    loading.value = true;
    deals.value = await dealService.getDeals(
      {},
      startDate.value,
      endDate.value
    );
    console.log("Загружено сделок:", deals.value);
  } catch (error) {
    console.error("Ошибка загрузки сделок:", error);
  } finally {
    loading.value = false;
  }
};
const loadCategories = async () => {
  try {
    categories.value = await dealService.loadCategories();
    console.log("Загружено воронок:", categories.value.length);
  } catch (error) {
    console.error("Ошибка загрузки пользователей:", error);
  }
};

const dealsWithCosts = computed(() => {
  if (startDate.value && endDate.value && deals.value) {
    const filtred = deals.value
      .filter(
        (deal) =>
          selectedCategory.value === null ||
          deal.categoryId == selectedCategory.value
      )
      .map((deal) =>
        deal.toTableRow(wage.value, startDate.value, endDate.value)
      );
    console.log("filtred", filtred);
    return filtred;
  } else return [];
});

const categoryOptions = computed(() => {
  if (!categories.value) {
    return [{ id: null, name: "Все категории" }];
  }

  const categoryMap = new Map();

  categories.value.forEach((category) => {
    if (category.id !== undefined && category.id !== null && category.name) {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
      });
    }
  });

  const categoryes = Array.from(categoryMap.values());
  categoryes.sort((a, b) => a.name.localeCompare(b.name));

  return [{ id: null, name: "Все категории" }, ...categoryes];
});

const updateWage = debounce((event) => {
  wage.value = parseFloat(event.value) || 0;
}, 500);

const onRowClick = (event) => {
  const dealData = event.data;
  selectedDealId.value = dealData.id;

  router.push({
    path: "/tasks",
    query: {
      dealId: selectedDealId.value,
    },
  });

  console.log("Выбрана сделка:", {
    id: dealData.id,
    name: dealData.name,
  });
};

const rowClassFunction = (data) => {
  const classes = ["cursor-pointer"];
  return classes.join(" ");
};

const onDatesChange = ({ start, end }) => {
  if (start && end) globalDates.updateDates(start, end);
};

const excelData = computed(() => {
  const title = "Учет времени задач/занятости/трудозатрат сотрудников";
  const filters = [
    `Период: ${formatTableDate(startDate.value)}-${formatTableDate(
      endDate.value
    )}`,
    wage.value > 0 ? `Ставка: ${wage.value}` : "Ставка: не указана",
  ];

  const columns = [
    { title: "Название", values: [] },
    { title: "Сумма", values: [] },
    { title: "Планируемое время", values: [] },
    { title: "Фактическое время", values: [] },
    { title: "Итого", values: [] },
    { title: "Затраты", values: [] },
    { title: "Прибыль", values: [] },
  ];

  if (dealsWithCosts.value && dealsWithCosts.value.length > 0) {
    dealsWithCosts.value.forEach((deal) => {
      columns[0].values.push(deal.name);
      columns[1].values.push(formatCurrency(deal.sum));
      columns[2].values.push(deal.plannedTime);
      columns[3].values.push(formatHoursToHHMM(deal.timeSpent));
      columns[4].values.push(formatHoursToHHMM(deal.resultTime));
      columns[5].values.push(formatCurrency(deal.plannedCost));
      columns[6].values.push(formatCurrency(deal.realCost));
    });

    return { title, filters, columns };
  } else {
    return [];
  }
});

const handleExportSuccess = (eventData) => {
  console.log("✅ Экспорт успешен:", eventData);
};

const handleExportError = (errorData) => {
  console.error("❌ Ошибка экспорта:", errorData);
};
watch(
  [startDate, endDate],
  async () => {
    if (startDate.value && endDate.value) await loadDeals();
  },
  { deep: true }
);

onMounted(() => {
  startDate.value = globalDates.dates.start;
  endDate.value = globalDates.dates.end;
  loadCategories();
});
</script>
