import { Task } from './task.js';
import { getStatusName } from '../constants/taskStatuses.js';

export class Deal {
  constructor(data) {
    this.id = data.ID || data.id;
    this.name = data.TITLE || data.title || 'Без названия';
    this.sum = parseFloat(data.OPPORTUNITY || data.sum || 0);
    this.stageId = data.STAGE_ID || data.stageId;
    this.stageName = data.STAGE_NAME || data.stageName || 'Не указано';
    this.dateCreate = data.DATE_CREATE || data.dateCreate;
    this.plannedTime = parseFloat(data.UF_CRM_PLANNED_TIME || data.plannedTime || 0);
    this.tasks = (data.tasks || []).map(task => new Task(task));
    console.log(`Deal ${this.id}`,this)
  }

  // Расчеты внутри модели
  getTimeSpentHours(startDate = null, endDate = null) {
    const filteredTasks = this.tasks.filter(task => {
      return task.isInDateRange(startDate, endDate);
    });

    return filteredTasks.reduce((sum, task) => {
      return sum + task.getTimeSpentHours(startDate, endDate);
    }, 0);
  }

  getResultTime(startDate = null, endDate = null) {
    return this.plannedTime - this.getTimeSpentHours(startDate, endDate);
  }

  getPlannedCost(wage) {
    return this.plannedTime * (wage || 0);
  }

  getRealCost(wage, startDate = null, endDate = null) {
    const timeSpent = this.getTimeSpentHours(startDate, endDate);
    return this.sum - timeSpent * (wage || 0);
  }

  hasTasksInPeriod(startDate = null, endDate = null) {
    return this.tasks.some(task => task.isInDateRange(startDate, endDate));
  }

  getAllElapsedItems(startDate = null, endDate = null) {
    const allItems = [];
    
    this.tasks.forEach(task => {
      task.elapsedItems.forEach(item => {
        if (item.isInDateRange(startDate, endDate)) {
          allItems.push({
            taskId: task.id,
            taskName: task.responsibleName,
            ...item
          });
        }
      });
    });
    
    return allItems;
  }

  toTableRow(wage = 0, startDate = null, endDate = null) {
    const timeSpent = this.getTimeSpentHours(startDate, endDate);
    const resultTime = this.plannedTime - timeSpent;
    
    return {
      id: this.id,
      name: this.name,
      sum: this.sum,
      stageId:this.stageId,
      stage: getStatusName(this.stageId),
      plannedTime: this.plannedTime,
      timeSpent: timeSpent,
      resultTime: resultTime,
      plannedCost: timeSpent * wage,
      realCost: this.sum - timeSpent * wage,
      elapsedItemsCount: this.getAllElapsedItems(startDate, endDate).length
    };
  }
}