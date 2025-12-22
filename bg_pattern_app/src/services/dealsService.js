import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';

export class DealService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  async getDeals(params = {}, startDate = null, endDate = null) {
    const cacheKey = this._generateCacheKey(params, startDate, endDate);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
  
    try {
      const tasksMap = await taskService.getTaskDeals(startDate, endDate);
      if (tasksMap.size === 0) {
        this.cache.set(cacheKey, []);
        return [];
      }

      const dealIds = Array.from(tasksMap.keys());
      const dealsData = await this._fetchDeals({
        ...params,
        filter: { ...params.filter, "ID": dealIds }
      });

      await this._loadMissingDeals(dealIds, dealsData);
      
      const deals = dealsData.map(dealData => 
        new Deal({
          ...dealData,
          tasks: tasksMap.get(parseInt(dealData.ID)) || []
        })
      );

      this.cache.set(cacheKey, deals);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_DURATION);
      
      return deals;
    } catch (error) {
      console.error('Ошибка получения сделок:', error);
      throw error;
    }
  }

  async _fetchDeals(params) {
    const response = await bitrixService.callMethod('crm.deal.list', {
      order: { DATE_CREATE: 'DESC' },
      select: ['ID', 'TITLE', 'OPPORTUNITY', 'UF_CRM_PLANNED_TIME', 'STAGE_ID', 'STAGE_NAME'],
      ...params
    });
    
    return response.result || response || [];
  }

  async _loadMissingDeals(dealIds, dealsData) {
    const foundDealIds = dealsData.map(deal => parseInt(deal.ID));
    const missingIds = dealIds.filter(id => !foundDealIds.includes(id));
    
    if (missingIds.length === 0) return;

    for (const missingId of missingIds) {
      try {
        const missingDeal = await bitrixService.callMethod('crm.deal.get', { id: missingId });
        if (missingDeal?.result) {
          dealsData.push(missingDeal.result);
        }
      } catch (error) {
        console.error(`Ошибка загрузки сделки ${missingId}:`, error.message);
      }
    }
  }

  _generateCacheKey(params, startDate, endDate) {
    const dateKey = startDate || endDate ? `_${startDate}_${endDate}` : '';
    return `deals_${JSON.stringify(params)}${dateKey}`;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const dealService = new DealService();