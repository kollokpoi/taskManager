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
      if (!window.BX24) {
        this.isAuthorized = false;
        return reject(new Error("BX24 не найден"));
      }

      try {
        window.BX24.init(async () => {
          this.isInitialized = true;
          this.appData.placementOptions = window.BX24.placement.info();
          this.appData.auth = window.BX24.getAuth();
          this.isAuthorized = !!this.appData.auth?.access_token;

          console.log(this.appData);
          try {
            await this.ensurePlannedTimeField();
          } catch (fieldError) {
            console.warn(
              "Ошибка при работе с пользовательским полем:",
              fieldError
            );
          }
          resolve(true);
        });
      } catch (error) {
        console.error("Ошибка при инициализации BX24:", error);
        this.isAuthorized = false;
        reject(error);
      }
    });
  }

  async checkPlannedTimeField() {
    try {
      const fields = await this.callMethod("crm.deal.userfield.list", {
        filter: { FIELD_NAME: "UF_CRM_PLANNED_TIME" },
        select: ["ID", "FIELD_NAME", "USER_TYPE_ID", "EDIT_FORM_LABEL"],
      });

      return fields.length > 0;
    } catch (error) {
      console.error("Ошибка при проверке поля UF_CRM_PLANNED_TIME:", error);
      return false;
    }
  }

  async createPlannedTimeField() {
    try {
      const fieldData = {
        FIELD_NAME: "UF_CRM_PLANNED_TIME",
        USER_TYPE_ID: "string",
        XML_ID: "PLANNED_TIME",
        SORT: 500,
        MULTIPLE: "N",
        MANDATORY: "N",
        SHOW_FILTER: "N",
        SHOW_IN_LIST: "Y",
        EDIT_IN_LIST: "Y",
        IS_SEARCHABLE: "N",
        EDIT_FORM_LABEL: {
          ru: "Планируемое время (ч)",
          en: "Planned time (hours)",
        },
        LIST_COLUMN_LABEL: {
          ru: "Планируемое время (ч)",
          en: "Planned time (hours)",
        },
        LIST_FILTER_LABEL: {
          ru: "Планируемое время (ч)",
          en: "Planned time (hours)",
        },
        SETTINGS: {
          SIZE: 20,
          MIN_LENGTH: 0,
          MAX_LENGTH: 255,
          DEFAULT_VALUE: "",
        },
      };

      return await this.callMethod("crm.deal.userfield.add", fieldData);
    } catch (error) {
      console.error("Ошибка при создании поля UF_CRM_PLANNED_TIME:", error);
      throw error;
    }
  }

  async ensurePlannedTimeField() {
    const exists = await this.checkPlannedTimeField();
    return !exists ? await this.createPlannedTimeField() : false;
  }

  checkAuth() {
    return this.isAuthorized && this.isInitialized;
  }

  reset() {
    this.isInitialized = false;
    this.isAuthorized = false;
    this.appData = { placementOptions: null, auth: null };
  }

  async checkConnection() {
    try {
      if (!this.isInitialized) await this.init();
      await this.callMethod("app.info");
      return { success: true, message: "Соединение установлено успешно" };
    } catch (error) {
      console.error("Ошибка при проверке подключения:", error);
      return {
        success: false,
        message: error.message || "Не удалось установить соединение",
      };
    }
  }

  async isConnected() {
    try {
      if (!this.isInitialized) await this.init();
      return this.isInitialized;
    } catch (error) {
      return false;
    }
  }

  callMethod(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        return reject(new Error("BX24 не инициализирован"));
      }
      //  const webhookUrl = `https://vedernikov.bitrix24.ru/rest/1/gw37vxseotwcebsk/${method}`;

      //  // 2. Параметры запроса
      //  const requestOptions = {
      //    method: "POST",
      //    headers: {
      //      "Content-Type": "application/json",
      //    },
      //    body: JSON.stringify(params),
      //  };

      //  // 3. Выполняем HTTP-запрос через fetch
      //  fetch(webhookUrl, requestOptions)
      //    .then((response) => {
      //      // Проверяем, был ли запрос успешен
      //      if (!response.ok) {
      //        throw new Error(`HTTP ошибка! Статус: ${response.status}`);
      //      }
      //      return response.json();
      //    })
      //    .then((result) => {
      //      // 4. Обрабатываем ответ Bitrix24
      //      if (result.error) {
      //        console.error(
      //          `Ошибка при вызове метода ${method}:`,
      //          result.error_description
      //        );
      //        reject(new Error(result.error_description || result.error));
      //      } else {
      //        resolve(result.result || result); // result.result для большинства методов
      //      }
      //    })
      //    .catch((error) => {
      //      console.error(`Сетевая ошибка при вызове метода ${method}:`, error);
      //      reject(new Error(error.message));
      //    });
      let allData = [];
      window.BX24.callMethod(method, params, (result) => {
        if (result.error()) {
          console.error(`Ошибка при вызове метода ${method}:`, result.error());
          reject(new Error(result.error()));
        } else {
          const data = result.data();

          console.log("data", {
            allData,
            result: data,
            total: result.total(),
          });
          if (result.total() > 1) {
            const items = data.tasks || data;
            allData = allData.concat(Array.isArray(items) ? items : [items]);

            if (result.more()) {
              result.next();
            } else {
              resolve(allData);
            }
          } else {
            resolve(data.tasks || data);
          }
        }
      });
    });
  }

  async placementInfo() {
    if (!this.isInitialized) await this.init();
    return await BX24.placement.info();
  }

  async GetUserField(entityType, entityId) {
    if (!entityType || !entityId) {
      throw new Error("Не указаны обязательные параметры");
    }

    const result = await new Promise((resolve, reject) => {
      BX24.callMethod(`crm.${entityType}.get`, { id: entityId }, (response) => {
        if (response.error()) {
          reject(new Error(response.error()));
        } else {
          resolve(response);
        }
      });
    });

    if (!result) throw new Error("Пустой ответ от BX24 API");
    return result.data();
  }

  async getCurrentUser() {
    if (!this.isInitialized) await this.init();
    return await this.callMethod("user.current");
  }

  finishWork() {
    if (window.BX24 && this.isInitialized) {
      window.BX24.closeApplication();
    }
  }
}

export default new BitrixService();
