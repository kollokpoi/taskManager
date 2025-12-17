<!-- src/views/OurSolutions.vue -->
<template>
  <div class="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
    <!-- Hero секция -->
    <div class="relative bg-primary text-white py-16 overflow-hidden">
      <!-- Декоративные элементы -->
      <div class="absolute inset-0 overflow-hidden opacity-10">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full"></div>
        <div class="absolute left-1/4 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="max-w-3xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Наши решения</h1>
          <p class="text-xl opacity-90 mb-6 leading-relaxed">
            Инновационные технологии и продукты, разработанные для оптимизации ваших
            бизнес-процессов и увеличения эффективности работы.
          </p>
          <div class="flex flex-wrap gap-4">
            <Button
              label="Связаться с нами"
              icon="pi pi-envelope"
              rounded />
            <Button
              label="Смотреть демо"
              icon="pi pi-play"
              rounded
              outlined
              class="text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="container mx-auto px-6 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div class="w-full md:w-auto">
          <span class="p-input-icon-left w-full md:w-64">
            <i class="pi pi-search text-gray-400"></i>
            <InputText
              v-model="searchQuery"
              placeholder="Поиск решений..."
              class="w-full" />
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <ButtonGroup>
            <Button
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :text="true"
              :severity="selectedCategory === category.id ? 'primary' : 'secondary'"
              @click="selectedCategory = category.id" />
          </ButtonGroup>
        </div>
      </div>
    </div>

    <!-- Сетка карточек решений -->
    <div class="container mx-auto px-6 pb-16">
      <Divider align="left">
        <div class="flex items-center">
          <i class="pi pi-th-large mr-2"></i>
          <span class="text-lg font-medium">{{ filteredSolutions.length }} доступных решений</span>
        </div>
      </Divider>

      <div
        v-if="filteredSolutions.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="solution in filteredSolutions"
          :key="solution.id"
          class="group">
          <Card
            class="h-full transition-all duration-300 hover:shadow-lg border border-gray-200 overflow-hidden">
            <!-- Заголовок карточки с изображением -->
            <template #header>
              <div class="relative overflow-hidden">
                <img
                  :src="solution.image"
                  :alt="solution.title"
                  class="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500" />
                <div
                  class="absolute top-0 right-0 bg-primary px-3 py-1 rounded-bl-lg text-white text-sm">
                  {{ solution.category }}
                </div>
              </div>
            </template>

            <!-- Основное содержимое карточки -->
            <template #content>
              <div class="p-4">
                <div class="mb-3 flex items-center gap-2">
                  <i :class="['text-primary text-lg', solution.icon]"></i>
                  <h3 class="text-xl font-bold text-gray-800">{{ solution.title }}</h3>
                </div>

                <p class="text-gray-600 mb-4">{{ solution.description }}</p>

                <!-- Ключевые особенности -->
                <div
                  v-if="solution.features && solution.features.length"
                  class="mb-4">
                  <h4 class="font-medium text-gray-800 mb-2">Ключевые особенности:</h4>
                  <ul class="space-y-1">
                    <li
                      v-for="(feature, idx) in solution.features"
                      :key="idx"
                      class="flex items-start gap-2">
                      <i class="pi pi-check-circle text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-600">{{ feature }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Технические метки -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span
                    v-for="(tag, idx) in solution.tags"
                    :key="idx"
                    class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Футер карточки -->
            <template #footer>
              <div class="px-4 pb-4 pt-2 flex justify-between items-center">
                <Tag
                  :value="`${solution.clients}+ клиентов`"
                  severity="info" />

                <Button
                  label="Подробнее"
                  icon="pi pi-arrow-right"
                  text
                  @click="goToSolution(solution.link)" />
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Состояние пустого результата -->
      <div
        v-else
        class="p-8 text-center bg-white rounded-lg shadow">
        <i class="pi pi-search text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-medium text-gray-800 mb-2">Решения не найдены</h3>
        <p class="text-gray-600 mb-4">Попробуйте изменить параметры поиска или фильтры</p>
        <Button
          label="Сбросить фильтры"
          icon="pi pi-refresh"
          @click="resetFilters" />
      </div>
    </div>

    <!-- Секция призыва к действию -->
    <div class="bg-primary text-white py-16">
      <div class="container mx-auto px-6 text-center">
        <h2 class="text-3xl font-bold mb-4">Не нашли подходящее решение?</h2>
        <p class="max-w-2xl mx-auto mb-8 text-lg opacity-90">
          Наша команда разработает индивидуальное решение под ваши потребности
        </p>
        <div class="flex justify-center gap-4">
          <Button
            label="Обсудить проект"
            icon="pi pi-comments"
            rounded
            size="large"
            severity="success" />
          <Button
            label="Посмотреть все услуги"
            icon="pi pi-list"
            rounded
            size="large"
            outlined
            class="text-white" />
        </div>
      </div>
    </div>

    <!-- Секция клиентов -->
    <div class="bg-white py-16">
      <div class="container mx-auto px-6">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-8">Нам доверяют</h2>
        <div class="flex flex-wrap justify-center items-center gap-8 opacity-70">
          <div
            v-for="i in 6"
            :key="i"
            class="w-32 h-12 bg-gray-200 rounded flex items-center justify-center">
            Клиент {{ i }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const selectedCategory = ref(null);

const categories = [
  { id: null, name: 'Все' },
  { id: 'analytics', name: 'Аналитика' },
  { id: 'automation', name: 'Автоматизация' },
  { id: 'integration', name: 'Интеграция' },
];

const solutions = [
  {
    id: 1,
    title: 'Бизнес-аналитика Pro',
    description:
      'Комплексное решение для анализа данных и построения интерактивных дашбордов с возможностью прогнозирования тенденций рынка.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-chart-bar',
    category: 'Аналитика',
    categoryId: 'analytics',
    clients: 120,
    features: ['Интерактивные дашборды', 'Предиктивная аналитика', 'Интеграция с CRM-системами'],
    tags: ['BI', 'Analytics', 'Dashboard'],
    link: '/solutions/1',
  },
  {
    id: 2,
    title: 'Smart Workflow',
    description:
      'Автоматизация бизнес-процессов с использованием искусственного интеллекта и машинного обучения для оптимизации рабочих потоков.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-cog',
    category: 'Автоматизация',
    categoryId: 'automation',
    clients: 85,
    features: [
      'ИИ для оптимизации процессов',
      'Автоматические уведомления',
      'Настраиваемые рабочие потоки',
    ],
    tags: ['AI', 'Workflow', 'Automation'],
    link: '/solutions/2',
  },
  {
    id: 3,
    title: 'Интеграционная платформа',
    description:
      'Универсальное решение для быстрой и безопасной интеграции различных систем и сервисов в единую экосистему вашего бизнеса.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-share-alt',
    category: 'Интеграция',
    categoryId: 'integration',
    clients: 150,
    features: ['API интеграция', 'Единая экосистема', 'Низкокодовая платформа'],
    tags: ['API', 'Integration', 'Ecosystem'],
    link: '/solutions/3',
  },
  {
    id: 4,
    title: 'Система мониторинга',
    description:
      'Комплексное решение для мониторинга инфраструктуры, сетевого оборудования и веб-сервисов с функцией проактивного оповещения.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-desktop',
    category: 'Аналитика',
    categoryId: 'analytics',
    clients: 75,
    features: [
      'Мониторинг в реальном времени',
      'Система раннего предупреждения',
      'Гибкая настройка триггеров',
    ],
    tags: ['Monitoring', 'Alerts', 'Infrastructure'],
    link: '/solutions/4',
  },
  {
    id: 5,
    title: 'HR Автоматизация',
    description:
      'Платформа для автоматизации HR-процессов, включая найм, адаптацию, обучение и аттестацию персонала.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-users',
    category: 'Автоматизация',
    categoryId: 'automation',
    clients: 90,
    features: ['Автоматизация рекрутинга', 'Система онбординга', 'Аналитика эффективности'],
    tags: ['HR', 'Recruitment', 'Onboarding'],
    link: '/solutions/5',
  },
  {
    id: 6,
    title: 'API Gateway',
    description:
      'Централизованный шлюз API для управления доступом, мониторинга и защиты ваших API от несанкционированного использования.',
    image: 'https://bg59.online/Apps/bg_pattern_app/images/logo.png',
    icon: 'pi pi-shield',
    category: 'Интеграция',
    categoryId: 'integration',
    clients: 110,
    features: ['Управление доступом', 'Защита от DDoS атак', 'Аналитика использования API'],
    tags: ['API', 'Security', 'Gateway'],
    link: '/solutions/6',
  },
];

const filteredSolutions = computed(() => {
  return solutions.filter((solution) => {
    // Фильтрация по поисковому запросу
    const matchesSearch =
      searchQuery.value === '' ||
      solution.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      solution.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Фильтрация по категории
    const matchesCategory =
      selectedCategory.value === null || solution.categoryId === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const goToSolution = (link) => {
  router.push(link);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = null;
};
</script>

<style scoped>
/* Стили для карточек */
:deep(.p-card) {
  border-radius: 12px;
  height: 100%;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}

:deep(.p-card .p-card-header) {
  padding: 0;
}

:deep(.p-card .p-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.p-card .p-card-content) {
  flex: 1;
}

/* Стили для героя */
.bg-primary {
  background-color: #3b82f6;
}

/* Анимации при наведении */
.transition-all {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Стили для скругленных углов изображений */
:deep(.p-card .p-card-header img) {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>
