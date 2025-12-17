<template>
    <div class="dashboard">
      <!-- Загрузка -->
      <div v-if="loading" class="loading">
        <p>🔄 Инициализация приложения...</p>
      </div>
  
      <!-- Ошибка -->
      <div v-else-if="error" class="error">
        <p>❌ {{ error }}</p>
        <button @click="retryInit">Повторить</button>
      </div>
  
      <!-- Основной контент -->
      <div v-else class="content">
        <!-- Шапка с пользователем -->
        <div class="header">
          <h1>Добро пожаловать, {{ user?.NAME || 'Пользователь' }}!</h1>
          <button @click="logout" class="logout-btn">Выйти</button>
        </div>
  
        <!-- Информация о контексте -->
        <div v-if="placementInfo" class="context-info">
          <h3>Контекст приложения:</h3>
          <p><strong>Режим:</strong> {{ placementInfo.placement }}</p>
          <p v-if="placementInfo.options?.entityId">
            <strong>ID сущности:</strong> {{ placementInfo.options.entityId }}
          </p>
        </div>
  
        <!-- Кнопки действий -->
        <div class="actions">
          <button @click="getUserInfo" :disabled="actionsDisabled">
            Получить данные пользователя
          </button>
          
          <button @click="checkConnection" :disabled="actionsDisabled">
            Проверить соединение
          </button>
  
          <button 
            v-if="placementInfo?.options?.entityId"
            @click="getEntityData"
            :disabled="actionsDisabled"
          >
            Получить данные сущности
          </button>
        </div>
  
        <!-- Результаты -->
        <div class="results">
          <!-- Информация о пользователе -->
          <div v-if="userInfo" class="user-card">
            <h3>Информация о пользователе:</h3>
            <p><strong>ID:</strong> {{ userInfo.ID }}</p>
            <p><strong>Имя:</strong> {{ userInfo.NAME }} {{ userInfo.LAST_NAME }}</p>
            <p><strong>Email:</strong> {{ userInfo.EMAIL }}</p>
            <p><strong>Должность:</strong> {{ userInfo.WORK_POSITION }}</p>
          </div>
  
          <!-- Данные сущности -->
          <div v-if="entityData" class="entity-card">
            <h3>Данные сущности:</h3>
            <pre>{{ entityData }}</pre>
          </div>
  
          <!-- Реквизиты -->
          <div v-if="requisites.length" class="requisites-card">
            <h3>Реквизиты:</h3>
            <ul>
              <li v-for="req in requisites" :key="req.ID">
                {{ req.NAME }} - {{ req.INN || 'ИНН не указан' }}
              </li>
            </ul>
          </div>
  
          <!-- Соединение -->
          <div v-if="connectionStatus" class="connection-card">
            <h3>Статус соединения:</h3>
            <p :class="{ 'success': connectionStatus.success, 'error': !connectionStatus.success }">
              {{ connectionStatus.message }}
            </p>
          </div>
        </div>
  
        <!-- Отладка (можно скрыть) -->
        <div v-if="debugMode" class="debug">
          <h3>Отладочная информация:</h3>
          <button @click="toggleDebug">Скрыть отладку</button>
          <pre>{{ debugInfo }}</pre>
        </div>
        <div v-else>
          <button @click="toggleDebug">Показать отладку</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import bitrixService from '../services/bitrixService'
  
  // Состояние
  const loading = ref(true)
  const error = ref(null)
  const user = ref(null)
  const placementInfo = ref(null)
  const userInfo = ref(null)
  const entityData = ref(null)
  const requisites = ref([])
  const connectionStatus = ref(null)
  const debugMode = ref(false)
  
  // Вычисляемое свойство для блокировки кнопок
  const actionsDisabled = computed(() => loading.value || !!error.value)
  
  // Отладочная информация
  const debugInfo = computed(() => ({
    isInitialized: bitrixService.isInitialized,
    appData: bitrixService.appData,
    placementInfo: placementInfo.value,
    user: user.value
  }))
  
  // Инициализация при загрузке
  onMounted(async () => {
    try {
      await bitrixService.init()
      
      // Получаем данные о размещении
      placementInfo.value = bitrixService.appData.placementOptions
      
      // Получаем текущего пользователя
      user.value = await bitrixService.getCurrentUser()
      
      loading.value = false
    } catch (err) {
      error.value = `Ошибка инициализации: ${err.message}`
      loading.value = false
      console.error('Ошибка в onMounted:', err)
    }
  })
  
  // Методы
  const retryInit = async () => {
    loading.value = true
    error.value = null
    try {
      await bitrixService.init()
      user.value = await bitrixService.getCurrentUser()
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
    }
  }
  
  const getUserInfo = async () => {
    try {
      userInfo.value = await bitrixService.callMethod('user.current', {
        select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'WORK_POSITION', 'UF_DEPARTMENT']
      })
    } catch (err) {
      console.error('Ошибка получения пользователя:', err)
    }
  }
  
  const checkConnection = async () => {
    try {
      connectionStatus.value = await bitrixService.checkConnection()
    } catch (err) {
      connectionStatus.value = {
        success: false,
        message: err.message
      }
    }
  }
  
  const getEntityData = async () => {
    if (!placementInfo.value?.options?.entityId) return
    
    try {
      const entityType = getEntityTypeFromPlacement(placementInfo.value.placement)
      
      if (entityType) {
        // Получаем основные данные сущности
        entityData.value = await bitrixService.GetUserField(entityType, placementInfo.value.options.entityId)
        
        // Пробуем получить реквизиты (если это контакт или компания)
        if (entityType === 'contact' || entityType === 'company') {
          try {
            requisites.value = await bitrixService.GetRequisites(entityType, placementInfo.value.options.entityId)
          } catch (reqErr) {
            console.warn('Не удалось получить реквизиты:', reqErr.message)
          }
        }
      }
    } catch (err) {
      console.error('Ошибка получения данных сущности:', err)
    }
  }
  
  // Вспомогательная функция для определения типа сущности
  const getEntityTypeFromPlacement = (placement) => {
    const mapping = {
      'CRM_LEAD_DETAIL_TAB': 'lead',
      'CRM_DEAL_DETAIL_TAB': 'deal',
      'CRM_COMPANY_DETAIL_TAB': 'company',
      'CRM_CONTACT_DETAIL_TAB': 'contact'
    }
    return mapping[placement] || null
  }
  
  const logout = () => {
    bitrixService.finishWork()
  }
  
  const toggleDebug = () => {
    debugMode.value = !debugMode.value
  }
  </script>
  
  <style scoped>
  .dashboard {
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  
  .loading, .error {
    text-align: center;
    padding: 50px;
  }
  
  .error {
    color: #d32f2f;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #eee;
  }
  
  .logout-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .logout-btn:hover {
    background: #cc0000;
  }
  
  .context-info {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }
  
  .actions button {
    padding: 10px 20px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .actions button:hover:not(:disabled) {
    background: #1976d2;
  }
  
  .actions button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .results {
    display: grid;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .user-card, .entity-card, .requisites-card, .connection-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .user-card h3, .entity-card h3, .requisites-card h3, .connection-card h3 {
    margin-top: 0;
    color: #333;
  }
  
  .success {
    color: #4caf50;
  }
  
  .error-text {
    color: #f44336;
  }
  
  .debug {
    background: #333;
    color: #fff;
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;
    overflow: auto;
  }
  
  .debug pre {
    margin: 10px 0 0 0;
    white-space: pre-wrap;
    font-size: 12px;
  }
  </style>