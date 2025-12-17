<!-- src/components/PageHeader.vue -->
<template>
  <div class="relative bg-primary text-white py-16 overflow-hidden mb-8 w-full">
    <!-- Декоративные элементы -->
    <div class="absolute inset-0 overflow-hidden opacity-10">
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full"></div>
      <div class="absolute left-1/4 -bottom-20 w-80 h-80 bg-white rounded-full"></div>
    </div>

    <div class="container mx-auto px-4 relative z-10 w-full">
      <div class="w-full">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          <slot name="title">Заголовок страницы</slot>
        </h1>
        <p class="text-xl opacity-90 mb-6 leading-relaxed">
          <slot name="subtitle">Подзаголовок или описание страницы</slot>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
};
</script>

<style scoped>
.bg-primary {
  background-color: #3b82f6;
}
</style>
