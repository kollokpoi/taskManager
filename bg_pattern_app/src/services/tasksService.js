import bitrixService from './bitrixService.js';
import { Task } from '../models/task.js';
import { TaskElapsedItem } from '../models/TaskElapsedItem.js';

export class TaskService {
  constructor() {
    this.tasksCache = new Map();
    this.elapsedItemsCache = new Map();
  }

  /**
   * Получает все задачи
   */
  async getTasks() {
    return this._fetchTasks({});
  }

  /**
   * Получает задачи сделки
   */
  async getDealTasks(dealId) {
    const cacheKey = `deal_tasks_${dealId}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const tasks = await this._fetchTasks({
      filter: { "UF_CRM_TASK": `D_${dealId}` }
    });

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает задачи пользователя
   */
  async getUserTasks(userId, loadElapsedItems = true) {
    const cacheKey = `user_tasks_${userId}_${loadElapsedItems}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const tasks = await this._fetchTasks({
      filter: { "RESPONSIBLE_ID": userId },
      select: [...this._getBaseSelect(), "CLOSED_BY"]
    }, loadElapsedItems);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает задачи проекта
   */
  async getProjectTasks(projectId) {
    const cacheKey = `project_tasks_${projectId}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const tasks = await this._fetchTasks({
      filter: { "GROUP_ID": projectId }
    });

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает периоды времени задачи
   */
  async getTaskElapsedItems(taskId) {
    const cacheKey = `elapsed_items_${taskId}`;
    
    if (this.elapsedItemsCache.has(cacheKey)) {
      return this.elapsedItemsCache.get(cacheKey);
    }

    try {
      const response = await bitrixService.callMethod('task.elapseditem.getlist', {
        TASKID: taskId
      });

      const items = (Array.isArray(response) ? response : response.result || [])
        .map(item => new TaskElapsedItem(item));

      this.elapsedItemsCache.set(cacheKey, items);
      setTimeout(() => this.elapsedItemsCache.delete(cacheKey), 300000);
      
      return items;
      
    } catch (error) {
      console.error(`Ошибка получения периодов задачи ${taskId}:`, error);
      return [];
    }
  }

  /**
   * Изменяет ответственного задачи
   */
  async changeTaskResponsible(taskId, newResponsibleId) {
    try {
      const response = await bitrixService.callMethod('tasks.task.update', {
        taskId: taskId,
        fields: { "RESPONSIBLE_ID": newResponsibleId }
      });

      // Очищаем кэш связанных данных
      this.tasksCache.clear();
      this.elapsedItemsCache.clear();
      
      return response;
      
    } catch (error) {
      console.error(`Ошибка изменения ответственного задачи ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Загружает задачи с периодами
   * @private
   */
  async _fetchTasks(params, loadElapsedItems = true) {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        order: { 'ID': 'DESC' },
        select: this._getBaseSelect(),
        ...params
      });

      const tasksData = this._extractTasks(response);
      
      if (!loadElapsedItems) {
        return tasksData.map(data => new Task(data));
      }

      // Параллельная загрузка периодов для всех задач
      const tasksWithElapsed = await Promise.all(
        tasksData.map(async taskData => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(taskData.id);
            return { ...taskData, elapsedItems };
          } catch {
            return taskData;
          }
        })
      );

      return tasksWithElapsed.map(data => new Task(data));
      
    } catch (error) {
      console.error('Ошибка получения задач:', error);
      throw error;
    }
  }

  /**
   * Базовый набор полей
   * @private
   */
  _getBaseSelect() {
    return ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", 
            "DATE_START", "DEADLINE", "TITLE", "STATUS", "CREATED_DATE","CLOSED_DATE"];
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
   * Очищает кэш задач
   */
  clearCache() {
    this.tasksCache.clear();
    this.elapsedItemsCache.clear();
  }
}

export const taskService = new TaskService();