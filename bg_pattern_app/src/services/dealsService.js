import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';

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
      // Определяем, нужно ли загружать задачи с периодами
      const shouldLoadTasksWithElapsed = !!(startDate || endDate);
      
      const [dealsData, tasksMap] = await Promise.all([
        this._fetchDeals(params),
        shouldLoadTasksWithElapsed 
          ? this._fetchAllDealTasks(params, startDate, endDate)
          : this._fetchDealTasksWithoutPeriod(params) // Без периодов если нет дат
      ]);
      console.log("data",{
        startDate,
        endDate,
        shouldLoadTasksWithElapsed
      })
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
   * Параллельно загружает задачи для всех сделок с фильтрацией по периоду
   * @private
   */
  async _fetchAllDealTasks(params, startDate, endDate) {
    const dealsForTaskFetch = await this._fetchDeals({ ...params, select: ['ID'] });
    
    if (!dealsForTaskFetch.length) return new Map();

    const batchSize = 10;
    const tasksMap = new Map();
    
    for (let i = 0; i < dealsForTaskFetch.length; i += batchSize) {
      const batch = dealsForTaskFetch.slice(i, i + batchSize);
      const batchPromises = batch.map(async deal => ({
        dealId: deal.ID,
        tasks: await taskService.getDealTasks(deal.ID, startDate, endDate).catch(() => [])
      }));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ dealId, tasks }) => tasksMap.set(dealId, tasks));
    }

    return tasksMap;
  }

  /**
   * Загружает задачи для сделок без периодов (только базовые данные)
   * @private
   */
  async _fetchDealTasksWithoutPeriod(params) {
    const dealsForTaskFetch = await this._fetchDeals({ ...params, select: ['ID'] });
    
    if (!dealsForTaskFetch.length) return new Map();

    const batchSize = 10;
    const tasksMap = new Map();
    
    for (let i = 0; i < dealsForTaskFetch.length; i += batchSize) {
      const batch = dealsForTaskFetch.slice(i, i + batchSize);
      const batchPromises = batch.map(async deal => ({
        dealId: deal.ID,
        tasks: await this._fetchDealTasksBasic(deal.ID).catch(() => [])
      }));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ dealId, tasks }) => tasksMap.set(dealId, tasks));
    }

    return tasksMap;
  }

  /**
   * Быстрая загрузка задач сделки без периодов
   * @private
   */
  async _fetchDealTasksBasic(dealId) {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        filter: { "UF_CRM_TASK": `D_${dealId}` },
        select: ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", 
                "DATE_START", "DEADLINE", "TITLE", "STATUS", "CREATED_DATE"],
        order: { 'ID': 'DESC' }
      });

      const tasksData = this._extractTasks(response);
      return tasksData.map(data => new Task(data));
      
    } catch (error) {
      console.error(`Ошибка загрузки задач сделки ${dealId}:`, error);
      return [];
    }
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
   * Получает сделку по ID с задачами
   */
  async getDealById(dealId, startDate = null, endDate = null) {
    const cacheKey = `deal_${dealId}_${startDate}_${endDate}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const deals = await this.getDeals(
        { filter: { ID: dealId } },
        startDate,
        endDate
      );

      const deal = deals.length > 0 ? deals[0] : null;
      
      if (deal) {
        this.cache.set(cacheKey, deal);
        setTimeout(() => this.cache.delete(cacheKey), this.CACHE_DURATION);
      }
      
      return deal;
    } catch (error) {
      console.error(`Ошибка получения сделки ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Получает сделки с затраченным временем в периоде
   */
  async getDealsWithTimeSpent(startDate, endDate, params = {}) {
    const cacheKey = `deals_time_spent_${startDate}_${endDate}_${JSON.stringify(params)}`;
    
    if (this._isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Сначала получаем все сделки
      const deals = await this.getDeals(params, startDate, endDate);
      
      // Фильтруем сделки, у которых есть задачи с затраченным временем в периоде
      const dealsWithTimeSpent = deals.filter(deal => 
        deal.hasTasksInPeriod(startDate, endDate)
      );

      this.cache.set(cacheKey, dealsWithTimeSpent);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_DURATION);
      
      return dealsWithTimeSpent;

    } catch (error) {
      console.error('Ошибка получения сделок с затраченным временем:', error);
      throw error;
    }
  }

  /**
   * Статистика по сделкам в периоде
   */
  async getDealsStats(startDate, endDate, params = {}) {
    try {
      const deals = await this.getDealsWithTimeSpent(startDate, endDate, params);
      
      const stats = {
        total: deals.length,
        totalOpportunity: deals.reduce((sum, deal) => sum + (deal.sum || 0), 0),
        totalPlannedTime: deals.reduce((sum, deal) => sum + (deal.plannedTime || 0), 0),
        totalTimeSpent: deals.reduce((sum, deal) => 
          sum + deal.getTimeSpentHours(startDate, endDate), 0
        ),
        byStage: {},
        averageResultTime: 0
      };

      deals.forEach(deal => {
        // Группировка по стадиям
        const stage = deal.stageName || 'Без стадии';
        if (!stats.byStage[stage]) {
          stats.byStage[stage] = {
            count: 0,
            opportunity: 0,
            timeSpent: 0
          };
        }
        stats.byStage[stage].count++;
        stats.byStage[stage].opportunity += deal.sum || 0;
        stats.byStage[stage].timeSpent += deal.getTimeSpentHours(startDate, endDate);
      });

      if (deals.length > 0) {
        stats.averageResultTime = deals.reduce((sum, deal) => 
          sum + deal.getResultTime(startDate, endDate), 0
        ) / deals.length;
      }

      return stats;

    } catch (error) {
      console.error('Ошибка получения статистики сделок:', error);
      throw error;
    }
  }

  /**
   * Извлекает задачи из ответа
   * @private
   */
  _extractTasks(response) {
    if (response?.tasks) return response.tasks;
    if (response?.result?.tasks) return response.result.tasks;
    if (Array.isArray(response)) return response;
    if (response?.result && Array.isArray(response.result)) return response.result;
    return [];
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