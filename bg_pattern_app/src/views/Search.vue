<!-- src/views/Search.vue -->
<template>
  <div class="p-8 space-y-8">
    <!-- Заголовок страницы -->
    <header class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800">Поиск</h1>
      <p-button
        label="Дополнительное действие"
        icon="pi pi-info-circle"
        class="p-button-raised p-button-text" />
    </header>

    <!-- Поисковая панель -->
    <section class="p-4 bg-white rounded shadow border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-700 mb-2">Найти</h2>
      <div class="p-fluid flex flex-col md:flex-row items-start md:items-center gap-4">
        <p-inputText
          v-model="searchQuery"
          placeholder="Введите ключевые слова..."
          class="flex-1" />
        <p-button
          label="Найти"
          icon="pi pi-search"
          class="p-button-raised"
          @click="search" />
      </div>
    </section>

    <!-- Фильтры -->
    <section class="p-4 bg-white rounded shadow border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-700 mb-2">Фильтры</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Фильтр 1: Checkbox -->
        <div class="flex items-center gap-2">
          <p-checkbox
            v-model="filter1"
            binary="true"
            inputId="filter1" />
          <label
            for="filter1"
            class="text-gray-700"
            >Фильтр 1</label
          >
        </div>
        <!-- Фильтр 2: Checkbox -->
        <div class="flex items-center gap-2">
          <p-checkbox
            v-model="filter2"
            binary="true"
            inputId="filter2" />
          <label
            for="filter2"
            class="text-gray-700"
            >Фильтр 2</label
          >
        </div>
        <!-- Фильтр 3: Dropdown (Категория) -->
        <div>
          <label
            for="category"
            class="block mb-1 text-gray-700"
            >Категория</label
          >
          <p-dropdown
            v-model="selectedCategory"
            :options="categories"
            optionLabel="label"
            placeholder="Выберите категорию"
            class="w-full md:w-56" />
        </div>
      </div>
    </section>

    <!-- Результаты поиска -->
    <section class="p-4 bg-white rounded shadow border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Результаты поиска</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <p-card
          v-for="result in results"
          :key="result.id"
          class="cursor-pointer transition hover:shadow-xl"
          style="min-height: 280px"
          @click.native="goToResult(result.link)">
          <template #header>
            <img
              :src="result.image"
              :alt="result.title"
              class="w-full h-48 object-cover" />
          </template>
          <template #title>
            <div class="text-xl font-bold text-gray-800">{{ result.title }}</div>
          </template>
          <template #content>
            <p class="text-gray-600">{{ result.description }}</p>
          </template>
          <template #footer>
            <p-button
              label="Подробнее"
              icon="pi pi-chevron-right"
              class="p-button-text" />
          </template>
        </p-card>
      </div>
    </section>

    <!-- CTA / Дополнительная секция -->
    <section
      class="p-6 bg-white rounded shadow border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Не нашли, что искали?</h2>
        <p class="text-gray-600">
          Свяжитесь с нашей поддержкой для получения дополнительной информации.
        </p>
      </div>
      <p-button
        label="Связаться с нами"
        icon="pi pi-envelope"
        class="p-button-raised" />
    </section>
  </div>
</template>

<script>
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

export default {
  name: 'Search',
  components: {
    'p-inputText': InputText,
    'p-button': Button,
    'p-dropdown': Dropdown,
    'p-checkbox': Checkbox,
    'p-card': Card,
  },
  data() {
    return {
      searchQuery: '',
      filter1: false,
      filter2: false,
      selectedCategory: null,
      categories: [
        { label: 'Все', value: null },
        { label: 'Категория A', value: 'A' },
        { label: 'Категория B', value: 'B' },
        { label: 'Категория C', value: 'C' },
      ],
      results: [
        {
          id: 1,
          title: 'Результат 1',
          description: 'Короткое описание результата 1 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/1',
        },
        {
          id: 2,
          title: 'Результат 2',
          description: 'Короткое описание результата 2 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/2',
        },
        {
          id: 3,
          title: 'Результат 3',
          description: 'Короткое описание результата 3 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/3',
        },
        {
          id: 4,
          title: 'Результат 4',
          description: 'Короткое описание результата 4 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/4',
        },
        {
          id: 5,
          title: 'Результат 5',
          description: 'Короткое описание результата 5 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/5',
        },
        {
          id: 6,
          title: 'Результат 6',
          description: 'Короткое описание результата 6 или релевантный контент.',
          image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
          link: '/results/6',
        },
      ],
    };
  },
  methods: {
    search() {
      console.log('Поисковый запрос:', this.searchQuery);
      // Здесь можно добавить логику поиска, например, вызов API.
    },
    goToResult(link) {
      this.$router.push(link);
    },
  },
};
</script>

<style scoped>
/* Дополнительные стили, если нужно */
</style>
