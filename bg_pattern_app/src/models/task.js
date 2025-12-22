import { TaskElapsedItem } from './TaskElapsedItem.js';
import { getStatusName } from '../constants/taskStatuses.js';

export class Task {
  constructor(data) {
    this.id = data.id || data.ID;
    this.title = data.title || data.TITLE || "Без названия";
    this.responsibleId = data.responsibleId || data.RESPONSIBLE_ID || data.responsible?.id;
    this.responsibleName = data.responsibleName || data.responsible?.name || 'Не указан';
    this.timeSpent = parseInt(data.timeSpent || data.timeSpentInLogs || data.TIME_SPENT_IN_LOGS) || 0;
    this.timeEstimate = parseInt(data.timeEstimate || data.TIME_ESTIMATE) || 0;
    this.dateStart = data.dateStart || data.DATE_START || null;
    this.deadline = data.deadline || data.DEADLINE;
    this.elapsedItems = (data.elapsedItems || []).map(item => new TaskElapsedItem(item));
    this.statusId = parseInt(data.status||data.STATUS)||0;
    this.createdDate = data.createdDate || null;
    this.closedBy = data.closedBy || null;
    this.closedDate = data.closedDate || data.CLOSED_DATE || null;
    this.ufCrmTask = data.ufCrmTask || data.UF_CRM_TASK,
    // Кэш для ускорения расчетов
    this._filteredCache = new Map();
    this._calculationCache = new Map();
  }

  // Оптимизированная фильтрация с кэшированием
  isInDateRange(startDate, endDate) {
    const cacheKey = `range_${startDate}_${endDate}`;
    
    if (this._filteredCache.has(cacheKey)) {
      return this._filteredCache.get(cacheKey);
    }

    const result = this.elapsedItems.some(item => 
      item.isInDateRange(startDate, endDate)
    );
    
    this._filteredCache.set(cacheKey, result);
    return result;
  }

  hasElapsedItemsInPeriod(startDate = null, endDate = null) {
    if (!this.elapsedItems || this.elapsedItems.length === 0) {
      return false;
    }
    
    return this.elapsedItems.some(item => 
      item.isInDateRange(startDate, endDate)
    );
  }
  
  getTimeSpentHours(startDate = null, endDate = null) {
    const cacheKey = `time_spent_${startDate}_${endDate}`;
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }

    const filteredItems = this.elapsedItems.filter(item => 
      item.isInDateRange(startDate, endDate)
    );

    const result = filteredItems.reduce((sum, item) => sum + item.seconds, 0) / 3600;
    this._calculationCache.set(cacheKey, result);
    return result;
  }

  getTimeEstimateHours() {
    return this.timeEstimate / 3600;
  }

  // ВАЖНО: Метод toTableRow используется в компонентах!
  toTableRow(startDate, endDate, employeeId = null, filter = null) {
    const cacheKey = `table_row_${startDate}_${endDate}`;
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }

    const timeSpent = this.getTimeSpentHours(startDate, endDate);
    const timeEstimateHours = this.getTimeEstimateHours();
    const resultTime = timeEstimateHours - timeSpent;
    
    const result = {
      id: this.id,
      title: this.title,
      responsibleId: this.responsibleId,
      responsibleName: this.responsibleName,
      timeSpent: timeSpent,
      timeEstimate: timeEstimateHours,
      deadline: this.deadline,
      resultTime: resultTime,
      status: getStatusName(this.statusId),
      statusId: this.statusId,
      dateStart: this.dateStart,
      dateCreate: this.createdDate,
      hasElapsedItems: this.elapsedItems.length > 0
    };

    this._calculationCache.set(cacheKey, result);
    return result;
  }
}