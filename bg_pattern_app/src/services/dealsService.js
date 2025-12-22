import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';
import { Task } from '../models/task.js';

export class DealService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  /**
   * Получает сделки с задачами (опционально с фильтрацией по периоду)
   * @param {Object} params - Параметры запроса
   * @param {Date} startDate - Начало периода (опционально)
   * @param {Date} endDate - Конец периода (опционально)
   * @returns {Promise<Deal[]>} Массив сделок
   */
  async getDeals(params = {}, startDate = null, endDate = null) {
    const cacheKey = this._generateCacheKey(params, startDate, endDate);
    
    if (this._isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }
  
    try {
      const tasksMap = await taskService.getTaskDeals(startDate, endDate);
      console.log('Получено сделок с задачами:', tasksMap.size);
      
      if (tasksMap.size === 0) {
        this.cache.set(cacheKey, []);
        return [];
      }
      const dealIds = Array.from(tasksMap.keys());

      const dealsData = await this._fetchDeals({
        ...params,
        filter: {
          ...params.filter,
          "ID": dealIds // Просто массив ID!
        }
      });
  
      // 4. Проверяем, что все сделки найдены
      const foundDealIds = dealsData.map(deal => parseInt(deal.ID));
      const missingIds = dealIds.filter(id => !foundDealIds.includes(id));
      
      if (missingIds.length > 0) {
        console.warn('Не найдены сделки с ID:', missingIds);
        // Опционально: можем загрузить недостающие сделки по отдельности
        for (const missingId of missingIds) {
          try {
            const missingDeal = await bitrixService.callMethod('crm.deal.get', {
              id: missingId
            });
            if (missingDeal?.result) {
              dealsData.push(missingDeal.result);
              console.log(`Дозагружена сделка ${missingId}`);
            }
          } catch (error) {
            console.error(`Ошибка загрузки сделки ${missingId}:`, error.message);
          }
        }
      }

      console.log("dealsData",dealsData)
      const deals = this._createDealsWithTasks(dealsData, tasksMap);
      console.log(`Создано объектов Deal: ${deals.length}`, {
        deals,
        tasksMap
      });

      this.cache.set(cacheKey, deals);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_DURATION);
      
      return deals;
  
    } catch (error) {
      console.error('Ошибка получения сделок:', error);
      throw error;
    }
  }

  /**
   * Загружает данные сделок
   * @private
   */
  async _fetchDeals(params) {
    console.log("Запрос сделок с фильтром:", params.filter);
    
    const response = await bitrixService.callMethod('crm.deal.list', {
      order: { DATE_CREATE: 'DESC' },
      select: ['ID', 'TITLE', 'OPPORTUNITY', 'UF_CRM_PLANNED_TIME', 'STAGE_ID', 'STAGE_NAME'],
      ...params
    });
    
    console.log("Ответ на запрос сделок:", response);
    return response.result || response || [];
  }

  /**
   * Создает объекты Deal с задачами
   * @private
   */
  _createDealsWithTasks(dealsData, tasksMap) {
    return dealsData.map(dealData => 
      new Deal({
        ...dealData,
        tasks: tasksMap.get(parseInt(dealData.ID)) || []
      })
    );
  }

  /**
   * Генерирует ключ кэша с учетом периода
   * @private
   */
  _generateCacheKey(params, startDate, endDate) {
    const dateKey = startDate || endDate 
      ? `_${startDate}_${endDate}` 
      : '';
    return `deals_${JSON.stringify(params)}${dateKey}`;
  }

  /**
   * Проверяет валидность кэша
   * @private
   */
  _isCacheValid(key) {
    return this.cache.has(key);
  }

  /**
   * Очищает кэш сделок
   */
  clearCache() {
    this.cache.clear();
  }
}

export const dealService = new DealService();