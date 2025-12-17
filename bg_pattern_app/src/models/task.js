import { TaskElapsedItem } from './TaskElapsedItem.js';
import { getStatusName } from '../constants/taskStatuses.js';

export class Task {
  constructor(data) {
    this.id = data.id || data.ID;
    this.title = data.title || data.TITLE || "Без названия"
    this.responsibleId = data.responsibleId || data.RESPONSIBLE_ID || data.responsible?.id;
    this.responsibleName = data.responsibleName || data.responsible?.name || 'Не указан';
    this.timeSpent = parseInt(data.timeSpent || data.timeSpentInLogs || data.TIME_SPENT_IN_LOGS) || 0;
    this.timeEstimate = parseInt(data.timeEstimate || data.TIME_ESTIMATE) || 0;
    this.dateStart = data.dateStart || data.DATE_START || null;
    this.deadline = data.deadline || data.DEADLINE;
    this.elapsedItems = (data.elapsedItems || []).map(item => new TaskElapsedItem(item));
    this.statusId = parseInt(data.status||data.STATUS)||0
  }

  // Добавляем периоды времени
  addElapsedItems(items) {
    const itemsArray = items.map(item => new TaskElapsedItem(item));
    console.log("itemsArray")
    console.log({
      id:this.id,
      itemsArray
    })
    this.elapsedItems = itemsArray
  }

  // Полное время (из поля или из items)
  getTimeSpentHours(startDate = null, endDate = null) {
    const filteredItems = this.elapsedItems.filter(item => 
      item.isInDateRange(startDate, endDate)
    );

    return filteredItems.reduce((sum, item) => sum + item.getHours(), 0);
  }

  getTimeEstimateHours() {
    return this.timeEstimate / 3600;
  }

  hasElapsedItemsInPeriod(startDate = null, endDate = null) {
    return this.elapsedItems.some(item => item.isInDateRange(startDate, endDate));
  }

  // Для обратной совместимости
  isInDateRange(startDate, endDate) {
    return this.elapsedItems.some(item => item.isInDateRange(startDate, endDate));
  }
  toTableRow(startDate, endDate,employeeId=null,filter=null){
    const timeSpent = this.getTimeSpentHours(startDate, endDate);
    const resultTime = this.timeEstimate/3600 - timeSpent
    return {
      id: this.id,
      title : this.title,
      responsibleId : this.responsibleId,
      responsibleName : this.responsibleName,
      timeSpent : timeSpent,
      timeEstimate : this.timeEstimate/3600,
      deadline:this.deadline,
      resultTime,
      status:getStatusName(this.statusId)
    };
  }
}