import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';

export class DealService {
  async getDealsWithElapsedItems(params = {}) {
    const defaultParams = {
      order: { DATE_CREATE: 'DESC' },
      select: [
        'ID',
        'TITLE', 
        'OPPORTUNITY',
        'UF_CRM_PLANNED_TIME',
        'STAGE_ID',      
        'STAGE_NAME',
        'DATE_CREATE'
      ]
    };

    try {
      const response = await bitrixService.callMethod('crm.deal.list', {
        ...defaultParams,
        ...params
      });

      const dealsData = response.result || response;
      
      if (!Array.isArray(dealsData)) {
        console.error('Неверный формат ответа сделок:', response);
        return [];
      }

      // Для каждой сделки загружаем задачи С периодами времени
      const deals = await Promise.all(
        dealsData.map(async (dealData) => {
          try {
            const tasks = await taskService.getDealTasks(dealData.ID);
            return new Deal({ ...dealData, tasks: tasks });
          } catch (error) {
            console.error(`Ошибка загрузки задач для сделки ${dealData.ID}:`, error);
            return new Deal(dealData); // Сделка без задач
          }
        })
      );

      return deals;

    } catch (error) {
      console.error('Ошибка получения сделок:', error);
      throw error;
    }
  }

  // Старый метод для обратной совместимости
  async getDeals(params = {}) {
    return this.getDealsWithElapsedItems(params);
  }
}

export const dealService = new DealService();