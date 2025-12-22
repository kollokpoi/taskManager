import bitrixService from './bitrixService.js';
import { Task } from '../models/task.js';
import { TaskElapsedItem } from '../models/TaskElapsedItem.js';

export class TaskService {
  constructor() {
    this.tasksCache = new Map();
    this.elapsedItemsCache = new Map();
  }
  async getTasks(startDate = null, endDate = null) {
    try {
      const dateStr = startDate.toISOString().split('T')[0];
      
      const [closedTasks, openTasks] = await Promise.all([
          bitrixService.callMethod('tasks.task.list', {
              "filter": {
                  ">=CLOSED_DATE": dateStr
              },
              "select": this._getBaseSelect()
          }),
          
          bitrixService.callMethod('tasks.task.list', {
              filter: {
                  "CLOSED_DATE": null
              },
              "select": this._getBaseSelect()
          })
      ]);

      const allTasks = [
          ...(closedTasks.tasks || []),
          ...(openTasks.tasks || [])
      ];
      const uniqueTasks = [];
      const seenIds = new Set();
      
      allTasks.forEach(task => {
          const taskId = task.id || task.ID;
          if (!seenIds.has(taskId)) {
              seenIds.add(taskId);
              uniqueTasks.push(task);
          }
      });

      const filteredTasks = uniqueTasks.filter(task => {
        const timeSpent = task.timeSpentInLogs || task.TIME_SPENT_IN_LOGS;
        return timeSpent && parseInt(timeSpent) > 0;
      });

      console.log(`Задач после фильтрации: ${filteredTasks.length}`);
      
      if (filteredTasks.length === 0) {
        return [];
      }

      const taskIds = filteredTasks.map(task => task.ID || task.id);

      const elapsedItemsMap = await this.getTaskElapsedItemsBatch(taskIds, startDate, endDate);

      const tasks = filteredTasks.map(taskData => {
        const taskElapsedItems = elapsedItemsMap.get(taskData.ID || taskData.id) || [];
        const dealIds = this._extractDealIdsFromUFCRMTask(taskData.ufCrmTask || taskData.UF_CRM_TASK);
        return new Task({
          ...taskData,
          elapsedItems: taskElapsedItems,
          dealIds: dealIds // Добавляем ID сделок для удобства
        });
      });

      console.log(`Создано объектов Task: ${tasks.length}`);
      
      return tasks;
    } catch (error) {
      console.error('Ошибка в getTasks:', error);
      throw error;
    }
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
    
    const tasks = await this._fetchTasks({
      filter: filter,
      select: this._getBaseSelect()
    }, startDate, endDate); // Передаем даты для фильтрации периодов
    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }
  /**
   * Получает задачи сделки с фильтрацией по периоду
   */
  async getTaskDeals(startDate = null, endDate = null) {
    const cacheKey = `task_deals_${startDate}_${endDate}`;
    
    if (this.tasksCache.has(cacheKey)) {
        return this.tasksCache.get(cacheKey);
    }

    try {
      const dateStr = startDate.toISOString().split('T')[0];
      
      const [closedTasks, openTasks] = await Promise.all([
          bitrixService.callMethod('tasks.task.list', {
              "filter": {
                  "!UF_CRM_TASK": false,
                  ">=CLOSED_DATE": dateStr
              },
              "select": this._getBaseSelect()
          }),
          
          bitrixService.callMethod('tasks.task.list', {
              filter: {
                  "!UF_CRM_TASK": false,
                  "CLOSED_DATE": null
              },
              "select": this._getBaseSelect()
          })
      ]);
      const allTasks = [
          ...(closedTasks.tasks || []),
          ...(openTasks.tasks || [])
      ];
      const uniqueTasks = [];
      const seenIds = new Set();
      
      allTasks.forEach(task => {
          const taskId = task.id || task.ID;
          if (!seenIds.has(taskId)) {
              seenIds.add(taskId);
              uniqueTasks.push(task);
          }
      });
      console.log("allTasks",allTasks)
      

      const filteredTasks = allTasks.filter(task => {
            const timeSpent = task.timeSpentInLogs || task.TIME_SPENT_IN_LOGS;
            const hasTime = timeSpent && parseInt(timeSpent) > 0;
            if (!hasTime) return false;
            const ufCrmTask = task.ufCrmTask || task.UF_CRM_TASK;
            return this._extractDealIdsFromUFCRMTask(ufCrmTask).length > 0;
      });

      console.log(`Задач после фильтрации: ${filteredTasks.length}`);
      
      if (filteredTasks.length === 0) {
          return new Map();
      }
      const dealsMap = new Map();
      const taskIds = filteredTasks.map(task => task.ID || task.id);
      
      const elapsedItemsMap = await this.getTaskElapsedItemsBatch(taskIds, startDate, endDate);
      
      filteredTasks.forEach(taskData => {
        const dealIds = this._extractDealIdsFromUFCRMTask(taskData.ufCrmTask || taskData.UF_CRM_TASK);
        const taskElapsedItems = elapsedItemsMap.get(taskData.ID || taskData.id) || [];
        
        const taskObj = new Task({
          ...taskData,
          elapsedItems: taskElapsedItems
        });
        
        dealIds.forEach(dealId => {
            if (!dealsMap.has(dealId)) {
                dealsMap.set(dealId, []);
            }
            dealsMap.get(dealId).push(taskObj);
        });
      });
      console.log(`Сделок с задачами: ${dealsMap.size}`);
      
      return dealsMap;

    } catch (error) {
        console.error('Ошибка в getTaskDeals:', error);
        throw error;
    }
  }

  /**
   * Извлекает ID сделок из поля UF_CRM_TASK
   * @private
   */
  _extractDealIdsFromUFCRMTask(ufCrmTask) {
      if (!ufCrmTask || ufCrmTask === false) {
          return [];
      }
      
      const dealIds = [];
      
      // Если это массив
      if (Array.isArray(ufCrmTask)) {
          ufCrmTask.forEach(item => {
              if (item && typeof item === 'string') {
                  const match = item.match(/^D_(\d+)/);
                  if (match) {
                      dealIds.push(parseInt(match[1]));
                  }
              }
          });
      }
      // Если это строка
      else if (typeof ufCrmTask === 'string') {
          const match = ufCrmTask.match(/^D_(\d+)/);
          if (match) {
              dealIds.push(parseInt(match[1]));
          }
      }
      
      return dealIds;
  }
  /**
   * Получает задачи пользователя с фильтрацией по периоду
   */
  async getUserTasks(userId, startDate = null, endDate = null) {

    const filter = { "RESPONSIBLE_ID": userId };

    const tasks = await this._fetchTasks({
      filter: filter,
      select: this._getBaseSelect()
    }, startDate, endDate);
    
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

    const tasks = await this._fetchTasks({
      filter: filter,
      select: this._getBaseSelect()
    }, startDate, endDate);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);
    
    return tasks;
  }

 async getTaskElapsedItemsBatch(taskIds) {
    if (!taskIds || taskIds.length === 0) {
        return new Map();
    }

    try {
        const BATCH_SIZE = 20;
        const elapsedMap = new Map();
        
        for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
            const batch = taskIds.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(taskId =>
                this.getTaskElapsedItems(taskId)
                    .catch(error => {
                        console.error(`Ошибка загрузки elapsedItems для задачи ${taskId}:`, error);
                        return [];
                    })
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            batch.forEach((taskId, index) => {
                const elapsedItems = batchResults[index];
                if (elapsedItems && elapsedItems.length > 0) {
                    elapsedMap.set(taskId, elapsedItems);
                }
            });
            
            // Небольшая пауза между пакетами
            if (i + BATCH_SIZE < taskIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return elapsedMap;
        
    } catch (error) {
        console.error('Ошибка пакетной загрузки elapsedItems:', error);
        return new Map();
    }
  }
  /**
   * Получает периоды времени задачи с фильтрацией по дате
   */
  async getTaskElapsedItems(taskId) {

    try {
      const response = await bitrixService.callMethod('task.elapseditem.getlist', {
        TASKID: taskId
      });

      let items = (Array.isArray(response) ? response : response.result || [])
        .map(item => new TaskElapsedItem(item));
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
      const shouldLoadElapsed = loadElapsedItems && startDate && endDate;
      
      const response = await bitrixService.callMethod('tasks.task.list', {
        order: { 'ID': 'DESC' },
        select: this._getBaseSelect(),
        ...params
      });
      const tasksData = this._extractTasks(response);
      if (!shouldLoadElapsed) {
        return tasksData.map(data => new Task(data));
      }
      const tasksWithTimeSpent = tasksData.filter(task => 
        task.timeSpentInLogs > 0
      );
      if (tasksWithTimeSpent.length === 0) {
        return tasksData.map(data => new Task(data));
      }

      const tasksWithElapsed = await Promise.all(
        tasksWithTimeSpent.map(async taskData => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(
              taskData.id, 
              startDate, 
              endDate
            );
            if (elapsedItems.length > 0) {
              return { ...taskData, elapsedItems };
            } else {
              return taskData;
            }
          } catch {
            return taskData;
          }
        })
      );
      const allTasks = tasksData.map(taskData => {
        const taskWithElapsed = tasksWithElapsed.find(t => t.id === taskData.id);
        return taskWithElapsed || taskData;
      });
      
      const tasks = allTasks.map(data => new Task(data));
      return tasks
      
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
      "CLOSED_BY",
      "GROUP_ID",
      "UF_CRM_TASK"
    ];
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