import bitrixService from './bitrixService.js';
import { Deal } from '../models/deal.js';
import { taskService } from './tasksService.js';

export class ProjectService {
    async getProjects(params = {}) {
      try {
        const defaultParams = {
          order: { ID: 'DESC' },
          select: [
            'ID',
            'NAME',
            'DESCRIPTION',
            'DATE_CREATE',
            'ACTIVE',
            'ACTIVITY_DATE',
            'LEAD_ID',
            'UF_CRM_TASK'
          ]
        };

        const response = await bitrixService.callMethod('sonet_group.get', {
          ...defaultParams,
          ...params
        });

        return this._extractProjects(response);
        
      } catch (error) {
        console.error('Ошибка получения проектов:', error);
        throw error;
      }
    }
    
    _extractProjects(response) {
      if (response.result) return response.result;
      if (Array.isArray(response)) return response;
      return [];
    }
}

export const projectService = new ProjectService();