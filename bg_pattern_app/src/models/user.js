import { Task } from './task.js';
export class User {
  constructor(data) {
    this.id = data.id || data.ID;
    this.name = data.NAME || data.name;
    this.lastName = data.lastName || data.LAST_NAME;
    this.tasks = (data.tasks || []).map(item => new Task(item));
    // Кэш для ускорения расчетов
    this._filteredCache = new Map();
    this._calculationCache = new Map();
  }

  // Оптимизированная фильтрация с кэшированием
  getFilteredTasks(startDate = null, endDate = null) {
    const cacheKey = `filtered_tasks_${startDate}_${endDate}`;
    
    if (this._filteredCache.has(cacheKey)) {
      return this._filteredCache.get(cacheKey);
    }

    const filteredTasks = this.tasks.filter(task => 
      task.isInDateRange(startDate, endDate)
    );
    
    this._filteredCache.set(cacheKey, filteredTasks);
    return filteredTasks;
  }

  // Оптимизированные расчеты с кэшированием
  getTimeSpentHours(startDate = null, endDate = null) {
    const cacheKey = `time_spent_${startDate}_${endDate}`;
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }

    const result = this.getFilteredTasks(startDate, endDate)
      .reduce((sum, task) => sum + task.getTimeSpentHours(startDate, endDate), 0);
    
    this._calculationCache.set(cacheKey, result);
    return result;
  }

  getTasksInDateCount(startDate = null, endDate = null) {
    return this.getFilteredTasks(startDate, endDate).length;
  }

  // Оптимизированный toTableRowWithDate
  toTableRowWithDate(date, workTime) {
    const cacheKey = `table_row_${date}_${workTime}`;
    const startDateCopy = new Date(date);
    const endDateCopy = new Date(date);
    endDateCopy.setHours(23, 59, 59, 999);
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }
    const filtered = this.getFilteredTasks(startDateCopy, endDateCopy)
    const timeSpent = this.getTimeSpentHours(startDateCopy, endDateCopy);
    const filteredTasks = filtered
      .map(task => {
        const taskTimeSpent = task.getTimeSpentHours(startDateCopy, endDateCopy);
        return {
          title: task.title,
          timeSpent: taskTimeSpent,
          workTime,
          result: (taskTimeSpent / workTime * 100).toFixed(2)
        };
      });
    const result = {
      id: this.id,
      date: startDateCopy,
      name: `${this.name} ${this.lastName}`,
      taskCount: filteredTasks.length,
      timeSpent: timeSpent,
      tasks: filteredTasks,
      workTime,
      result: workTime > 0 ? (timeSpent / workTime * 100).toFixed(2) : '0.00',
    };

    this._calculationCache.set(cacheKey, result);
    return result;
  }

  // Оптимизированный toTableRow
  toTableRow(dateStart, dateEnd) {
    const cacheKey = `table_row_range_${dateStart}_${dateEnd}`;
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }

    const filteredTasks = this.tasks.filter(task => 
      task.isInDateRange(dateStart, dateEnd)||
      task.elapsedItems.length===0
    );
    const timeEstimate = filteredTasks.reduce((sum, task) => 
      sum + task.getTimeEstimateHours(), 0);
    const timeSpent = filteredTasks.reduce((sum, task) => 
      sum + task.getTimeSpentHours(dateStart, dateEnd), 0);

    const result = {
      id: this.id,
      name: `${this.name} ${this.lastName}`,
      taskCount: filteredTasks.length,
      timeSpent: timeSpent,
      timeEstimate: timeEstimate,
      resultTime: timeEstimate - timeSpent,
      tasks: filteredTasks.map(task => ({
        title: task.title,
        timeSpent: task.getTimeSpentHours(dateStart, dateEnd),
        timeEstimate: task.getTimeEstimateHours(),
        resultTime: task.getTimeEstimateHours() - task.getTimeSpentHours(dateStart, dateEnd)
      }))
    };

    this._calculationCache.set(cacheKey, result);
    return result;
  }
}