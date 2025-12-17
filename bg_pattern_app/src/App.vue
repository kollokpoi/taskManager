<template>
  <AuthGuard>
    <router-view />
  </AuthGuard>
</template>

<script setup>
import AuthGuard from './components/AuthGuard.vue';
</script>