<template>
  <div class="flex w-full h-screen overflow-hidden">
    <ProSidebar
      :mainItems="mainItems"
      :utilityItems="utilityItems"
      showNotifications
      @main-item-click="handleMainItemClick"
      @utility-item-click="handleUtilityItemClick" />
    <main class="flex-1 bg-gray-100 p-8 overflow-auto">
      <!-- Вместо статичного контента вставляем router-view -->
      <router-view />
    </main>
  </div>
</template>

<script>
import ProSidebar from '../components/ProSidebar.vue';
import { mainItems, utilityItems } from '../menuItems.js'; // Импортируем из menuItems.js

export default {
  name: 'FullLayout',
  components: { ProSidebar },
  data() {
    return {
      mainItems, // Используем импортированные массивы
      utilityItems,
    };
  },
  methods: {
    handleMainItemClick(item) {
      console.log('Основной пункт:', item.label);
      this.$router.push(item.additionalPath);
    },
    handleUtilityItemClick(item) {
      console.log('Второстепенный пункт:', item.label);
      this.$router.push(item.additionalPath);
    },
  },
};
</script>
