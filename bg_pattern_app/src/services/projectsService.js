import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';
import { userService } from './usersService.js';
import { Project } from '../models/project.js';

export class ProjectService {
  constructor() {
    this.projectsCache = new Map();
    this.projectDetailsCache = new Map();
  }

  /**
   * Получает только базовую информацию о проектах (ID и название)
   */
  async getProjectsList() {
    const cacheKey = 'projects_list';
    
    if (this.projectsCache.has(cacheKey)) {
      return this.projectsCache.get(cacheKey);
    }

    try {
      // ВАЖНО: sonet_group.get возвращает ВСЕ проекты
      // Фильтрация по ID должна быть на уровне ответа
      const response = await bitrixService.callMethod('sonet_group.get', {
        order: { ID: 'DESC' },
        // Можно указать только нужные поля
        select: ['ID', 'NAME']
      });

      // Фильтруем только активные проекты на клиенте
      const projectsList = (response.result || response || [])
        .filter(project => project.ACTIVE !== false) // Фильтр активных
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

  /**
   * Получает детальную информацию о проекте
   * Для получения одного проекта лучше использовать sonet_group.get со всеми полями
   */
  async getProjectDetails(projectId) {
    const cacheKey = `project_details_${projectId}`;
    
    if (this.projectDetailsCache.has(cacheKey)) {
      return this.projectDetailsCache.get(cacheKey);
    }

    try {
      // Получаем ВСЕ проекты и фильтруем по ID на клиенте
      const response = await bitrixService.callMethod('sonet_group.get', {
        order: { ID: 'DESC' },
        select: ['ID', 'NAME', 'DESCRIPTION', 'DATE_CREATE', 'ACTIVE', 'IMAGE_ID']
      });

      // Находим нужный проект
      const allProjects = response.result || response || [];
      const projectData = allProjects.find(project => project.ID == projectId);
      
      if (!projectData) {
        throw new Error(`Проект ${projectId} не найден`);
      }

      // Параллельно загружаем участников и задачи
      const [users, tasks] = await Promise.all([
        this._getProjectUsers(projectId),
        taskService.getProjectTasks(projectId).catch(() => [])
      ]);

      const project = new Project({
        ...projectData,
        users,
        tasks
      });

      this.projectDetailsCache.set(cacheKey, project);
      setTimeout(() => this.projectDetailsCache.delete(cacheKey), 300000);
      
      return project;

    } catch (error) {
      console.error(`Ошибка получения деталей проекта ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Альтернативный вариант: получение деталей через sonet_group.user.get
   * (Может работать иначе в разных версиях Битрикс)
   */
  async getProjectDetailsAlternative(projectId) {
    try {
      // Получаем базовую информацию о проекте
      const [projectResponse, users, tasks] = await Promise.all([
        bitrixService.callMethod('sonet_group.get', {
          filter: { ID: projectId },
          select: ['ID', 'NAME', 'DESCRIPTION', 'DATE_CREATE', 'ACTIVE']
        }).catch(() => ({ result: [] })),
        
        this._getProjectUsers(projectId),
        taskService.getProjectTasks(projectId).catch(() => [])
      ]);

      const projectData = (projectResponse.result || [])[0];
      if (!projectData) {
        // Если через filter не нашли, попробуем получить из общего списка
        const allProjects = await this.getProjectsList();
        const projectInfo = allProjects.find(p => p.id == projectId);
        
        if (!projectInfo) {
          throw new Error(`Проект ${projectId} не найден`);
        }

        // Создаем минимальный объект проекта
        projectData = {
          ID: projectId,
          NAME: projectInfo.name,
          DESCRIPTION: '',
          DATE_CREATE: '',
          ACTIVE: true
        };
      }

      return new Project({
        ...projectData,
        users,
        tasks
      });

    } catch (error) {
      console.error(`Ошибка получения деталей проекта ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Получает участников проекта
   */
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

      // Получаем информацию о пользователях
      const users = await userService.getUsers();
      return users.filter(user => 
        userIds.includes(user.id.toString())
      );

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