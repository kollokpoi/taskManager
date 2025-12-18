import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';
import { userService } from './usersService.js';
import { Project } from '../models/project.js';

export class ProjectService {
  constructor() {
    this.projectsCache = new Map();
    this.usersCache = new Map();
  }

  /**
   * Получает проекты с задачами и участниками
   * @param {Object} params - Параметры запроса
   * @returns {Promise<Project[]>} Массив проектов
   */
  async getProjects(params = {}) {
    const cacheKey = `projects_${JSON.stringify(params)}`;
    
    if (this.projectsCache.has(cacheKey)) {
      return this.projectsCache.get(cacheKey);
    }

    try {
      const [projectsData, allUsers] = await Promise.all([
        this._fetchProjects(params),
        userService.getUsers()
      ]);

      const projects = await Promise.all(
        projectsData.map(projectData => 
          this._enrichProject(projectData, allUsers)
        )
      );

      this.projectsCache.set(cacheKey, projects);
      setTimeout(() => this.projectsCache.delete(cacheKey), 300000);
      
      return projects;

    } catch (error) {
      console.error('Ошибка получения проектов:', error);
      throw error;
    }
  }

  /**
   * Загружает проекты из Битрикс
   * @private
   */
  async _fetchProjects(params) {
    const response = await bitrixService.callMethod('sonet_group.get', {
      order: { ID: 'DESC' },
      select: ['ID', 'NAME', 'DESCRIPTION', 'ACTIVE'],
      ...params
    });

    return response.result || response || [];
  }

  /**
   * Обогащает проект задачами и участниками
   * @private
   */
  async _enrichProject(projectData, allUsers) {
    try {
      const [tasks, projectUsers] = await Promise.all([
        taskService.getProjectTasks(projectData.ID).catch(() => []),
        this._getProjectUsers(projectData.ID, allUsers).catch(() => [])
      ]);

      return new Project({ 
        ...projectData, 
        tasks,
        users: projectUsers
      });
      
    } catch (error) {
      console.error(`Ошибка загрузки данных проекта ${projectData.ID}:`, error);
      return new Project(projectData);
    }
  }

  /**
   * Получает участников проекта
   * @private
   */
  async _getProjectUsers(projectId, allUsers) {
    const cacheKey = `project_users_${projectId}`;
    
    if (this.usersCache.has(cacheKey)) {
      return this.usersCache.get(cacheKey);
    }

    try {
      const response = await bitrixService.callMethod('sonet_group.user.get', {
        ID: projectId
      });

      const userIds = (response.result || response || [])
        .map(item => item.USER_ID?.toString());
      
      const projectUsers = allUsers.filter(user => 
        userIds.includes(user.id.toString())
      );

      this.usersCache.set(cacheKey, projectUsers);
      setTimeout(() => this.usersCache.delete(cacheKey), 300000);
      
      return projectUsers;

    } catch (error) {
      console.error('Ошибка получения участников проекта:', error);
      return [];
    }
  }

  /**
   * Очищает кэш проектов
   */
  clearCache() {
    this.projectsCache.clear();
    this.usersCache.clear();
  }
}

export const projectService = new ProjectService();