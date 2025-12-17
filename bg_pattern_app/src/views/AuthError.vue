<!-- views/AuthError.vue -->
<template>
    <div class="auth-error-page">
      <div class="container">
        <h1>🚫 Ошибка доступа</h1>
        
        <div v-if="errorMessage" class="error-details">
          <p><strong>Причина:</strong> {{ errorMessage }}</p>
        </div>
        
        <div class="solutions">
          <h3>Возможные решения:</h3>
          <ul>
            <li>Откройте приложение через меню Битрикс24</li>
            <li>Убедитесь, что вы авторизованы в Битрикс24</li>
            <li>Проверьте права доступа приложения</li>
            <li>Переустановите приложение</li>
          </ul>
        </div>
        
        <div class="actions">
          <button @click="reload" class="btn-primary">
            🔄 Обновить страницу
          </button>
          <button @click="goToBitrix" class="btn-secondary">
            📋 Открыть Битрикс24
          </button>
          <button @click="goHome" class="btn-outline" v-if="canGoBack">
            ← Вернуться назад
          </button>
        </div>
        
        <div class="debug" v-if="debugInfo">
          <button @click="showDebug = !showDebug" class="debug-toggle">
            {{ showDebug ? 'Скрыть' : 'Показать' }} техническую информацию
          </button>
          
          <div v-if="showDebug" class="debug-content">
            <pre>{{ debugInfo }}</pre>
            <button @click="copyDebug" class="copy-btn">
              📋 Копировать
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import bitrixService from '../services/bitrixService';
  
  const route = useRoute();
  const router = useRouter();
  
  const errorMessage = ref(route.query.error || '');
  const showDebug = ref(false);
  const canGoBack = ref(router.options.history.state.back !== null);
  
  const debugInfo = computed(() => ({
    timestamp: new Date().toISOString(),
    url: window.location.href,
    bitrixStatus: {
      isInitialized: bitrixService.isInitialized,
      isAuthorized: bitrixService.checkAuth(),
      auth: bitrixService.appData.auth ? 'Есть' : 'Нет'
    },
    userAgent: navigator.userAgent,
    route: {
      path: route.path,
      query: route.query
    }
  }));
  
  const reload = () => {
    window.location.reload();
  };
  
  const goToBitrix = () => {
    if (window.top !== window.self) {
      window.top.location.href = '/';
    } else {
      alert('Откройте приложение через портал Битрикс24');
    }
  };
  
  const goHome = () => {
    router.go(-1);
  };
  
  const copyDebug = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo.value, null, 2));
      alert('Информация скопирована в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };
  
  onMounted(() => {
    console.error('Auth error occurred:', errorMessage.value);
  });
  </script>
  
  <style scoped>
  .auth-error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .container {
    background: white;
    border-radius: 16px;
    padding: 40px;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  h1 {
    color: #e74c3c;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .error-details {
    background: #f8f9fa;
    border-left: 4px solid #e74c3c;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 4px;
  }
  
  .solutions {
    background: #f1f8ff;
    border: 1px solid #c8e1ff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .solutions h3 {
    color: #0366d6;
    margin-bottom: 10px;
  }
  
  .solutions ul {
    padding-left: 20px;
    color: #24292e;
  }
  
  .solutions li {
    margin: 8px 0;
  }
  
  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .actions button {
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-primary:hover {
    background: #0056b3;
  }
  
  .btn-secondary {
    background: #28a745;
    color: white;
  }
  
  .btn-secondary:hover {
    background: #1e7e34;
  }
  
  .btn-outline {
    background: transparent;
    border: 2px solid #6c757d;
    color: #6c757d;
  }
  
  .btn-outline:hover {
    background: #6c757d;
    color: white;
  }
  
  .debug {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #dee2e6;
  }
  
  .debug-toggle {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    font-size: 14px;
    padding: 5px 10px;
  }
  
  .debug-toggle:hover {
    color: #495057;
  }
  
  .debug-content {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 15px;
    margin-top: 10px;
    position: relative;
  }
  
  .debug-content pre {
    margin: 0;
    font-size: 12px;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .copy-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .copy-btn:hover {
    background: #545b62;
  }
  </style>