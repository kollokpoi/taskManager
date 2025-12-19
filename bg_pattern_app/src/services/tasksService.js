import bitrixService from './bitrixService.js';
import { Task } from '../models/task.js';
import { TaskElapsedItem } from '../models/TaskElapsedItem.js';

export class TaskService {
  constructor() {
    this.tasksCache = new Map();
    this.elapsedItemsCache = new Map();
  }

  /**
   * Получает задачи сделки с фильтрацией по периоду
   */
  async getDealTasks(dealId, startDate = null, endDate = null) {
    const cacheKey = `deal_tasks_${dealId}_${startDate}_${endDate}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    // Базовый фильтр для сделки
    const filter = { "UF_CRM_TASK": `D_${dealId}` };
    

    console.log("taskFilter", filter)
    const tasks = await this._fetchTasks({
      filter: filter,
      select: this._getBaseSelect()
    }, startDate, endDate); // Передаем даты для фильтрации периодов
    console.log("tasks", tasks)
    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает задачи пользователя с фильтрацией по периоду
   */
  async getUserTasks(userId, startDate = null, endDate = null, loadElapsedItems = true) {
    const cacheKey = `user_tasks_${userId}_${startDate}_${endDate}_${loadElapsedItems}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const filter = { "RESPONSIBLE_ID": userId };
    
    // Фильтр по периоду
    if (startDate || endDate) {
      filter[">TIME_SPENT_IN_LOGS"] = 0;
    }

    const tasks = await this._fetchTasks({
      filter: filter,
      select: [...this._getBaseSelect(), "CLOSED_BY"]
    }, startDate, endDate, loadElapsedItems);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает задачи проекта с фильтрацией по периоду
   */
  async getProjectTasks(projectId, startDate = null, endDate = null) {
    const cacheKey = `project_tasks_${projectId}_${startDate}_${endDate}`;
    
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const filter = { "GROUP_ID": projectId };
    
    if (startDate || endDate) {
      filter[">TIME_SPENT_IN_LOGS"] = 0;
    }

    const tasks = await this._fetchTasks({
      filter: filter,
      select: this._getBaseSelect()
    }, startDate, endDate);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

  /**
   * Получает периоды времени задачи с фильтрацией по дате
   */
  async getTaskElapsedItems(taskId, startDate = null, endDate = null) {
    const cacheKey = `elapsed_items_${taskId}_${startDate}_${endDate}`;
    
    if (this.elapsedItemsCache.has(cacheKey)) {
      return this.elapsedItemsCache.get(cacheKey);
    }

    try {
      const response = await bitrixService.callMethod('task.elapseditem.getlist', {
        TASKID: taskId
      });

      let items = (Array.isArray(response) ? response : response.result || [])
        .map(item => new TaskElapsedItem(item));

      // Фильтруем по дате если указан период
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        
        items = items.filter(item => {
          if (!item.createdDate) return false;
          const itemDate = new Date(item.createdDate);
          
          if (start && itemDate < start) return false;
          if (end && itemDate > end) return false;
          return true;
        });
      }

      this.elapsedItemsCache.set(cacheKey, items);
      setTimeout(() => this.elapsedItemsCache.delete(cacheKey), 300000);
      
      return items;
      
    } catch (error) {
      console.error(`Ошибка получения периодов задачи ${taskId}:`, error);
      return [];
    }
  }

  /**
   * Загружает задачи с умной загрузкой периодов
   * @private
   */
  async _fetchTasks(params, startDate = null, endDate = null, loadElapsedItems = true) {
    try {
      // Определяем, нужно ли загружать периоды
      const shouldLoadElapsed = loadElapsedItems && startDate && endDate;
      
      const response = await bitrixService.callMethod('tasks.task.list', {
        order: { 'ID': 'DESC' },
        select: this._getBaseSelect(),
        ...params
      });
      console.log("taskResponse",response)

      const tasksData = this._extractTasks(response);
      
      // Если не нужно загружать периоды или нет дат периода
      if (!shouldLoadElapsed) {
        return tasksData.map(data => new Task(data));
      }

      // Загружаем периоды только для задач, у которых есть затраченное время
      const tasksWithTimeSpent = tasksData.filter(task => 
        task.timeSpentInLogs > 0
      );

      if (tasksWithTimeSpent.length === 0) {
        return tasksData.map(data => new Task(data));
      }

      // Параллельная загрузка периодов с фильтрацией по дате
      const tasksWithElapsed = await Promise.all(
        tasksWithTimeSpent.map(async taskData => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(
              taskData.id, 
              startDate, 
              endDate
            );
            
            // Проверяем, есть ли периоды в указанном диапазоне
            if (elapsedItems.length > 0) {
              return { ...taskData, elapsedItems };
            } else {
              // Если нет периодов в диапазоне, возвращаем задачу без периодов
              return taskData;
            }
          } catch {
            return taskData;
          }
        })
      );

      // Собираем все задачи: с периодами и без
      const allTasks = tasksData.map(taskData => {
        const taskWithElapsed = tasksWithElapsed.find(t => t.id === taskData.id);
        return taskWithElapsed || taskData;
      });

      return allTasks.map(data => new Task(data));
      
    } catch (error) {
      console.error('Ошибка получения задач:', error);
      throw error;
    }
  }

  /**
   * Базовый набор полей с оптимизацией
   * @private
   */
  _getBaseSelect() {
    return [
      "ID", 
      "RESPONSIBLE_ID", 
      "TIME_SPENT_IN_LOGS", 
      "TIME_ESTIMATE", 
      "DATE_START", 
      "DEADLINE", 
      "TITLE", 
      "STATUS", 
      "CREATED_DATE",
      "CLOSED_DATE",
      "GROUP_ID" // Для проектных задач
    ];
  }

  /**
   * Получает задачи с фильтрацией по времени затрат
   * @param {Object} options - Опции фильтрации
   * @param {Date} options.startDate - Начало периода
   * @param {Date} options.endDate - Конец периода
   * @param {number} options.userId - ID пользователя (опционально)
   * @param {number} options.projectId - ID проекта (опционально)
   * @param {number} options.dealId - ID сделки (опционально)
   */
  async getTasksWithTimeSpent(options = {}) {
    const { startDate, endDate, userId, projectId, dealId } = options;
    
    // Строим базовый фильтр
    const filter = {};
    
    if (userId) filter["RESPONSIBLE_ID"] = userId;
    if (projectId) filter["GROUP_ID"] = projectId;
    if (dealId) filter["UF_CRM_TASK"] = `D_${dealId}`;
    
    // Фильтр по наличию затраченного времени
    filter[">TIME_SPENT_IN_LOGS"] = 0;
    
    // Фильтр по дате создания задачи (если нужно)
    if (startDate) {
      filter[">=CREATED_DATE"] = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      filter["<=CREATED_DATE"] = endDate.toISOString().split('T')[0];
    }

    try {
      const tasks = await this._fetchTasks({
        filter: filter,
        select: this._getBaseSelect()
      }, startDate, endDate, true);

      return tasks.filter(task => 
        task.elapsedItems && task.elapsedItems.length > 0
      );
      
    } catch (error) {
      console.error('Ошибка получения задач с затраченным временем:', error);
      throw error;
    }
  }

  /**
   * Статистика по задачам в периоде
   */
  async getTasksStats(startDate, endDate, userId = null, projectId = null) {
    const tasks = await this.getTasksWithTimeSpent({
      startDate,
      endDate,
      userId,
      projectId
    });

    const stats = {
      totalTasks: tasks.length,
      totalTimeSpent: tasks.reduce((sum, task) => 
        sum + task.getTimeSpentHours(startDate, endDate), 0
      ),
      totalTimeEstimate: tasks.reduce((sum, task) => 
        sum + task.getTimeEstimateHours(), 0
      ),
      byStatus: {},
      byUser: {}
    };

    tasks.forEach(task => {
      // Статистика по статусам
      const status = task.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Статистика по пользователям
      if (task.responsibleId) {
        const userId = task.responsibleId.toString();
        if (!stats.byUser[userId]) {
          stats.byUser[userId] = {
            count: 0,
            timeSpent: 0,
            name: task.responsibleName || 'Неизвестно'
          };
        }
        stats.byUser[userId].count++;
        stats.byUser[userId].timeSpent += task.getTimeSpentHours(startDate, endDate);
      }
    });

    return stats;
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