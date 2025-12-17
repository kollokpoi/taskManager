class BitrixService {
  constructor() {
    this.isInitialized = false;
    this.isAuthorized = false; 
    this.appData = {
      placementOptions: null,
      auth: null,
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (window.BX24) {
        try {
          window.BX24.init(() => {
            this.isInitialized = true;
            this.appData.placementOptions = window.BX24.placement.info();
            this.appData.auth = window.BX24.getAuth();
            
            this.isAuthorized = !!(this.appData.auth && this.appData.auth.access_token);
            
            console.log('BX24 успешно инициализирован', {
              isAuthorized: this.isAuthorized,
              auth: this.appData.auth
            });
            
            resolve(true);
          });
        } catch (error) {
          console.error('Ошибка при инициализации BX24:', error);
          this.isAuthorized = false;
          reject(error);
        }
      } else {
        console.error('BX24 не найден. Убедитесь, что приложение запущено в среде Битрикс24');
        this.isAuthorized = false;
        reject(new Error('BX24 не найден'));
      }
    });
  }
  
  checkAuth() {
    return this.isAuthorized && this.isInitialized;
  }
  
  reset() {
    this.isInitialized = false;
    this.isAuthorized = false;
    this.appData = {
      placementOptions: null,
      auth: null,
    };
  }
  
    async checkConnection() {
      try {
        if (!this.isInitialized) {
          await this.init();
        }
        await this.callMethod('app.info');
        return { success: true, message: 'Соединение установлено успешно' };
      } catch (error) {
        console.error('Ошибка при проверке подключения:', error);
        return { success: false, message: error.message || 'Не удалось установить соединение' };
      }
    }
  
    async isConnected() {
      try {
        if (!this.isInitialized) {
          await this.init();
        }
        return this.isInitialized;
      } catch (error) {
        return false;
      }
    }
  
    callMethod(method, params = {}) {
      return new Promise((resolve, reject) => {
        if (!this.isInitialized) {
          reject(
            new Error(
              'BX24 не инициализирован. Вызовите метод init() перед использованием callMethod()',
            ),
          );
          return;
        }
        const decodedMethod = decodeURIComponent(method);
        window.BX24.callMethod(decodedMethod, params, (result) => {
          if (result.error()) {
            console.error(`Ошибка при вызове метода ${method}:`, result.error());
            reject(new Error(result.error()));
          } else {
            resolve(result.data());
          }
        });
      });
    }

    async placementInfo() {
      try {
        if (!this.isInitialized) {
          await this.init();
        }
        return await BX24.placement.info();
      } catch (error) {
        console.error('Ошибка при получении информации о размещении:', error);
        throw error;
      }
    }
  
    async GetUserField(entityType, entityId) {
      try {
        if (!entityType || !entityId) {
          throw new Error('Не указаны обязательные параметры (entitytype или entityid)');
        }
  
        const result = await new Promise((resolve, reject) => {
          BX24.callMethod(`crm.${entityType}.get`, { id: entityId }, function (response) {
            if (response.error()) {
              console.error('BX24 API Error:', response.error());
              reject(new Error(response.error()));
            } else {
              resolve(response);
            }
          });
        });
  
        // Проверяем, что результат содержит данные
        if (!result) {
          throw new Error('Пустой ответ от BX24 API');
        }
  
        // Получаем данные из ответа
        const data = result.data();
        console.log('GetUserField:', data);
        return data;
      } catch (error) {
        console.error('GetUserField failed:', {
          entityType,
          entityId,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    }
  
    async GetRequisites(entityType, entityId) {
      try {
        // Проверка обязательных параметров
        if (!entityType || !entityId) {
          throw new Error('Не указаны обязательные параметры (entityType или entityId)');
        }
  
        // Маппинг типов сущностей на ID в Битрикс24
        const entityTypeMapping = {
          contact: 3,
          company: 4,
        };
  
        // Проверяем, что переданный тип сущности поддерживается
        if (!entityTypeMapping[entityType]) {
          throw new Error(`Неподдерживаемый тип сущности: ${entityType}`);
        }
  
        // Выполняем запрос к API Битрикс24
        const response = await new Promise((resolve, reject) => {
          BX24.callMethod(
            'crm.requisite.list',
            {
              order: { DATE_CREATE: 'ASC' },
              filter: {
                PRESET_ID: '1',
                ENTITY_TYPE_ID: entityTypeMapping[entityType],
                ENTITY_ID: entityId,
              },
              select: ['*'],
            },
            (response) => {
              if (response.error()) {
                console.error('BX24 API Error:', response.error());
                reject(new Error(response.error()));
              } else {
                resolve(response);
              }
            },
          );
        });
  
        // Проверяем и возвращаем данные
        if (!response.data()) {
          throw new Error('Пустой ответ от BX24 API');
        }
  
        const requisites = response.data();
        console.log('Получены реквизиты:', requisites);
        return requisites;
      } catch (error) {
        console.error('Ошибка в GetRequisites:', {
          entityType,
          entityId,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    }
  
  
    async getCurrentUser() {
      try {
        if (!this.isInitialized) {
          await this.init();
        }
        return await this.callMethod('user.current');
      } catch (error) {
        console.error('Ошибка при получении информации о пользователе:', error);
        throw error;
      }
    }
  
    finishWork() {
      if (window.BX24 && this.isInitialized) {
        window.BX24.closeApplication();
      }
    }

    
  }
  
  export default new BitrixService();
  