import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';

export class DealService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  /**
   * Получает сделки с параллельной загрузкой задач
   * @param {Object} params - Параметры запроса
   * @returns {Promise<Deal[]>} Массив сделок
   */
  async getDeals(params = {}) {
    const cacheKey = this._generateCacheKey(params);
    
    if (this._isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const [dealsData, tasksMap] = await Promise.all([
        this._fetchDeals(params),
        this._fetchAllDealTasks(params)
      ]);

      const deals = this._createDealsWithTasks(dealsData, tasksMap);
      
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
    const response = await bitrixService.callMethod('crm.deal.list', {
      order: { DATE_CREATE: 'DESC' },
      select: ['ID', 'TITLE', 'OPPORTUNITY', 'UF_CRM_PLANNED_TIME', 'STAGE_ID', 'STAGE_NAME'],
      ...params
    });

    return response.result || response || [];
  }

  /**
   * Параллельно загружает задачи для всех сделок
   * @private
   */
  async _fetchAllDealTasks(params) {
    const dealsForTaskFetch = await this._fetchDeals({ ...params, select: ['ID'] });
    
    if (!dealsForTaskFetch.length) return new Map();

    const batchSize = 10;
    const tasksMap = new Map();
    
    for (let i = 0; i < dealsForTaskFetch.length; i += batchSize) {
      const batch = dealsForTaskFetch.slice(i, i + batchSize);
      const batchPromises = batch.map(async deal => ({
        dealId: deal.ID,
        tasks: await taskService.getDealTasks(deal.ID).catch(() => [])
      }));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ dealId, tasks }) => tasksMap.set(dealId, tasks));
    }

    return tasksMap;
  }

  /**
   * Создает объекты Deal с задачами
   * @private
   */
  _createDealsWithTasks(dealsData, tasksMap) {
    return dealsData.map(dealData => 
      new Deal({
        ...dealData,
        tasks: tasksMap.get(dealData.ID) || []
      })
    );
  }

  /**
   * Генерирует ключ кэша
   * @private
   */
  _generateCacheKey(params) {
    return `deals_${JSON.stringify(params)}`;
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