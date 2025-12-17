<template>
    <div v-if="!initialized" class="auth-loading">
      <div class="spinner"></div>
      <p>Инициализация приложения...</p>
    </div>
    
    <div v-else-if="!authorized" class="auth-error">
      <div class="error-content">
        <h2>🔒 Требуется авторизация</h2>
        <p>Приложение может работать только внутри Битрикс24.</p>
        <p>Убедитесь, что:</p>
        <ul>
          <li>Вы открыли приложение через Битрикс24</li>
          <li>У вас есть доступ к этому приложению</li>
          <li>Приложение установлено с правильными правами</li>
        </ul>
        <button v-if="retryCount < 3" @click="retryAuth" class="retry-btn">
          Попробовать снова
        </button>
        <button @click="openInBitrix" class="bitrix-btn" v-else>
          Открыть в Битрикс24
        </button>
      </div>
    </div>
    
    <slot v-else />
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import bitrixService from '../services/bitrixService';
  
  const initialized = ref(false);
  const authorized = ref(false);
  const retryCount = ref(0);
  
  const initBitrix = async () => {
    try {
      // Сбрасываем состояние перед новой попыткой
      bitrixService.reset();
      
      await bitrixService.init();
      initialized.value = true;
      authorized.value = bitrixService.checkAuth();
      
      if (!authorized.value) {
        console.warn('Приложение инициализировано, но нет авторизации');
      }
      
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      initialized.value = true; // все равно показываем, что инициализация завершена
      authorized.value = false;
    }
  };
  
  const retryAuth = async () => {
    retryCount.value++;
    await initBitrix();
  };
  
  const openInBitrix = () => {
    // Если приложение запущено не в iframe Битрикс24,
    // перенаправляем на портал
    if (window.top === window.self) {
      alert('Откройте это приложение через Битрикс24');
    } else {
      // Обновляем страницу в iframe
      window.location.reload();
    }
  };
  
  onMounted(async () => {
    await initBitrix();
  });
  </script>
  
  <style scoped>
  .auth-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .auth-loading p {
    margin-top: 20px;
    font-size: 18px;
  }
  
  .spinner {
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top: 5px solid white;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .auth-error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  .error-content {
    background: white;
    border-radius: 12px;
    padding: 40px;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
  }
  
  .error-content h2 {
    color: #e74c3c;
    margin-bottom: 20px;
  }
  
  .error-content p {
    color: #555;
    margin: 10px 0;
  }
  
  .error-content ul {
    text-align: left;
    margin: 20px 0;
    padding-left: 20px;
    color: #666;
  }
  
  .error-content li {
    margin: 8px 0;
  }
  
  .retry-btn, .bitrix-btn {
    margin-top: 20px;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .retry-btn {
    background: #3498db;
    color: white;
  }
  
  .retry-btn:hover {
    background: #2980b9;
  }
  
  .bitrix-btn {
    background: #2ecc71;
    color: white;
  }
  
  .bitrix-btn:hover {
    background: #27ae60;
  }
  </style>