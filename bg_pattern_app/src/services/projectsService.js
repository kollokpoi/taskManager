import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';
import { userService } from './usersService.js';
import { Project } from '../models/project.js';

export class ProjectService {
  constructor() {
    this.projectsCache = new Map();
    this.projectDetailsCache = new Map();
  }

  async getProjectsList() {
    const cacheKey = 'projects_list';
    
    if (this.projectsCache.has(cacheKey)) {
      return this.projectsCache.get(cacheKey);
    }

    try {
      const response = await bitrixService.callMethod('sonet_group.get', {
        order: { ID: 'DESC' },
        select: ['ID', 'NAME']
      });

      const projectsList = (response.result || response || [])
        .filter(project => project.ACTIVE !== false)
        .map(project => ({
          id: project.ID,
          name: project.NAME || 'Без названия'
        }));

      this.projectsCache.set(cacheKey, projectsList);
      setTimeout(() => this.projectsCache.delete(cacheKey), 300000);
      
      return projectsList;
    } catch (error) {
      console.error('Ошибка получения списка проектов:', error);
      throw error;
    }
  }

  async getProjectDetails(projectId, startDate, endDate) {
    const cacheKey = `project_details_${projectId}`;
    
    if (this.projectDetailsCache.has(cacheKey)) {
      return this.projectDetailsCache.get(cacheKey);
    }

    try {
      const response = await bitrixService.callMethod('sonet_group.get', {
        order: { ID: 'DESC' },
        select: ['ID', 'NAME', 'DESCRIPTION', 'DATE_CREATE', 'ACTIVE', 'IMAGE_ID']
      });

      const allProjects = response.result || response || [];
      const projectData = allProjects.find(project => project.ID == projectId);
      
      if (!projectData) {
        throw new Error(`Проект ${projectId} не найден`);
      }

      const [users, tasks] = await Promise.all([
        this._getProjectUsers(projectId),
        taskService.getProjectTasks(projectId, startDate, endDate).catch(() => [])
      ]);

      const project = new Project({ ...projectData, users, tasks });

      this.projectDetailsCache.set(cacheKey, project);
      setTimeout(() => this.projectDetailsCache.delete(cacheKey), 300000);
      
      return project;
    } catch (error) {
      console.error(`Ошибка получения деталей проекта ${projectId}:`, error);
      throw error;
    }
  }

  async _getProjectUsers(projectId) {
    try {
      const response = await bitrixService.callMethod('sonet_group.user.get', {
        ID: projectId
      });

      const userIds = (response.result || response || [])
        .map(item => item.USER_ID?.toString())
        .filter(Boolean);

      if (!userIds.length) {
        return [];
      }

      const users = await userService.getUsers();
      return users.filter(user => userIds.includes(user.id.toString()));
    } catch (error) {
      console.error(`Ошибка получения участников проекта ${projectId}:`, error);
      return [];
    }
  }

  clearCache() {
    this.projectsCache.clear();
    this.projectDetailsCache.clear();
  }
}

export const projectService = new ProjectService();