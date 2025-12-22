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
          window.BX24.init(async () => {
            this.isInitialized = true;
            this.appData.placementOptions = window.BX24.placement.info();
            this.appData.auth = window.BX24.getAuth();
            
            this.isAuthorized = !!(this.appData.auth && this.appData.auth.access_token);
            
            console.log('BX24 успешно инициализирован', {
              isAuthorized: this.isAuthorized,
              auth: this.appData.auth
            });
            try {
              await this.ensurePlannedTimeField();
            } catch (fieldError) {
              console.warn('Ошибка при работе с пользовательским полем:', fieldError);
            }
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

  async checkPlannedTimeField() {
    try {
      console.log('Проверка наличия поля UF_CRM_PLANNED_TIME...');
      
      const fields = await this.callMethod('crm.deal.userfield.list', {
        filter: { FIELD_NAME: 'UF_CRM_PLANNED_TIME' },
        select: ['ID', 'FIELD_NAME', 'USER_TYPE_ID', 'EDIT_FORM_LABEL']
      });
      console.log("Поле", fields)
      
      const exists = fields.length > 0;
      console.log(`Поле UF_CRM_PLANNED_TIME ${exists ? 'существует' : 'не найдено'}`);
      return exists;
    } catch (error) {
      console.error('Ошибка при проверке поля UF_CRM_PLANNED_TIME:', error);
      return false;
    }
  }

  async createPlannedTimeField() {
    try {
      console.log('Создание поля UF_CRM_PLANNED_TIME...');
      
      const fieldData = {
        FIELD_NAME: 'UF_CRM_PLANNED_TIME',
        USER_TYPE_ID: 'string',
        XML_ID: 'PLANNED_TIME',
        SORT: 500,
        MULTIPLE: 'N',
        MANDATORY: 'N',
        SHOW_FILTER: 'N',
        SHOW_IN_LIST: 'Y',
        EDIT_IN_LIST: 'Y',
        IS_SEARCHABLE: 'N',
        EDIT_FORM_LABEL: {
          ru: 'Планируемое время (ч)',
          en: 'Planned time (hours)'
        },
        LIST_COLUMN_LABEL: {
          ru: 'Планируемое время (ч)',
          en: 'Planned time (hours)'
        },
        LIST_FILTER_LABEL: {
          ru: 'Планируемое время (ч)',
          en: 'Planned time (hours)'
        },
        SETTINGS: {
          SIZE: 20,
          MIN_LENGTH: 0,
          MAX_LENGTH: 255,
          DEFAULT_VALUE: ''
        }
      };

      const result = await this.callMethod('crm.deal.userfield.add', fieldData);
      console.log('Поле UF_CRM_PLANNED_TIME успешно создано:', result);
      return result;
      
    } catch (error) {
      console.error('Ошибка при создании поля UF_CRM_PLANNED_TIME:', error);
      throw error;
    }
  }

  async ensurePlannedTimeField() {
    try {
      const exists = await this.checkPlannedTimeField();
      
      if (!exists) {
        await this.createPlannedTimeField();
        return true;
      }
      
      return false; // поле уже существовало
      
    } catch (error) {
      console.error('Ошибка при ensurePlannedTimeField:', error);
      throw error;
    }
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
  