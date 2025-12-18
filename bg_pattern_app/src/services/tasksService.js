import bitrixService from './bitrixService.js';
import { Task } from '../models/task.js';
import { TaskElapsedItem } from '../models/TaskElapsedItem.js';

export class TaskService {
  async getTasks() {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        select: ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", "DATE_START","DEADLINE","TITLE","STATUS","CREATED_DATE"],
        order: { 'ID': 'DESC' }
      });

      const tasks = this._extractTasks(response);
      const tasksWithElapsed = await Promise.all(
        tasks.map(async (task) => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(task.id);
            return { ...task, elapsedItems };
          } catch (error) {
            console.error(`Ошибка загрузки периодов задачи ${task.id}:`, error);
            return task;
          }
        })
      );
      
      return tasksWithElapsed.map(taskData => new Task(taskData));
      
    } catch (error) {
      console.error(`Ошибка получения задач сделки ${dealId}:`, error);
      throw error;
    }
  }
  async getDealTasks(dealId) {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        filter: { "UF_CRM_TASK": `D_${dealId}` },
        select: ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", "DATE_START","DEADLINE","TITLE","STATUS","CREATED_DATE"],
        order: { 'ID': 'DESC' }
      });
      const tasks = this._extractTasks(response);
      const tasksWithElapsed = await Promise.all(
        tasks.map(async (task) => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(task.id);
            return { ...task, elapsedItems };
          } catch (error) {
            console.error(`Ошибка загрузки периодов задачи ${task.id}:`, error);
            return task;
          }
        })
      );
      
      return tasksWithElapsed.map(taskData => new Task(taskData));
      
    } catch (error) {
      console.error(`Ошибка получения задач сделки ${dealId}:`, error);
      throw error;
    }
  }

  async getUserTasks(userId, loadElapsedItems = true) {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        filter: { "RESPONSIBLE_ID": userId },
        select: ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", "DATE_START","DEADLINE","TITLE","STATUS","CREATED_DATE","CLOSED_BY"],
        order: { 'ID': 'DESC' }
      });
      const tasks = this._extractTasks(response);
      const tasksWithElapsed = loadElapsedItems ? 
      await Promise.all(
        tasks.map(async (task) => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(task.id);
            return { ...task, elapsedItems };
          } catch (error) {
            console.error(`Ошибка загрузки периодов задачи ${task.id}:`, error);
            return task;
          }
        })
      ) : tasks
      
      return tasksWithElapsed.map(taskData => new Task(taskData));
      
    } catch (error) {
      console.error(`Ошибка получения задач сделки ${dealId}:`, error);
      throw error;
    }
  }

  async getProjectTasks(projectId) {
    try {
      const response = await bitrixService.callMethod('tasks.task.list', {
        filter: { "GROUP_ID": projectId },
        select: ["ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE", "DATE_START","DEADLINE","TITLE","STATUS","CREATED_DATE"],
        order: { 'ID': 'DESC' }
      });
      const tasks = this._extractTasks(response);
      const tasksWithElapsed = await Promise.all(
        tasks.map(async (task) => {
          try {
            const elapsedItems = await this.getTaskElapsedItems(task.id);
            return { ...task, elapsedItems };
          } catch (error) {
            console.error(`Ошибка загрузки периодов задачи ${task.id}:`, error);
            return task;
          }
        })
      );
      return tasksWithElapsed.map(taskData => new Task(taskData));
      
    } catch (error) {
      console.error(`Ошибка получения задач сделки ${dealId}:`, error);
      throw error;
    }
  }

  async getTaskElapsedItems(taskId) {
    try {
      const response = await bitrixService.callMethod('task.elapseditem.getlist', {
        "TASKID": taskId,
      });
      return response.map(item => new TaskElapsedItem(item));
      
    } catch (error) {
      console.error(`Ошибка получения периодов задачи ${taskId}:`, error);
      throw error;
    }
  }

  async changeTaskResponsible(taskId, newResponsibleId) {
    try {
      const response = await bitrixService.callMethod('tasks.task.update', {
        taskId: taskId,
        fields: {
          "RESPONSIBLE_ID": newResponsibleId
        }
      });
      
      console.log('Ответственный изменен:', response);
      return response;
      
    } catch (error) {
      console.error(`Ошибка изменения ответственного задачи ${taskId}:`, error);
      throw error;
    }
  }
  
  _extractTasks(response) {
    if (response.result?.tasks) return response.result.tasks;
    if (response.tasks) return response.tasks;
    if (Array.isArray(response)) return response;
    if (response.result && Array.isArray(response.result)) return response.result;
    
    console.warn('Неизвестный формат ответа задач:', response);
    return [];
  }
}

export const taskService = new TaskService();