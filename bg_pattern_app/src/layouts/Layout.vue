<template>
  <div class="flex min-h-screen">
    <!-- Боковая панель -->
    <Sidebar
      :initial-collapsed="false"
      :menuItems="menu"
      @menu-item-click="handleMenuClick">
      <!-- Доп. контент в слоте, например, кнопка «Выход» -->
      <button class="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
        Выход
      </button>
    </Sidebar>

    <!-- Основное поле - пока пустая заглушка -->
    <main class="flex-1 bg-gray-100 p-8">
      <!-- Заголовок / контент -->
      <h1 class="text-3xl font-bold mb-6">Главная рабочая зона</h1>
      <p class="text-gray-600">Здесь будет любой функционал (IFrame, другой контент и т.д.).</p>
    </main>
  </div>
</template>

<script>
import Sidebar from '../components/Sidebar.vue';
сд;

export default {
  name: 'Layout',
  components: { Sidebar },
  data() {
    return {
      menu: [
        { icon: 'home', text: 'Главная' },
        { icon: 'search', text: 'Поиск' },
        { icon: 'settings', text: 'Настройки' },
      ],
    };
  },
  methods: {
    handleMenuClick(item) {
      console.log('Клик по меню: ', item);
      // Здесь можно рендерить разные компоненты, менять router-view и т.д.
    },
  },
};
</script>
