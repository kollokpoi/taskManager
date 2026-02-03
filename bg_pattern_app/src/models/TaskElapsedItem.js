export class TaskElapsedItem {
  constructor(data) {
    this.id = data.ID || data.id;
    this.taskId = data.TASK_ID || data.taskId;
    this.userId = data.USER_ID || data.userId;
    this.seconds = parseInt(data.SECONDS || data.seconds) || 0;
    this.createdDate = data.CREATED_DATE || data.createdDate ? new Date(data.CREATED_DATE || data.createdDate) : null;
    this.comment = data.COMMENT_TEXT || data.comment || '';

    // Кэшируем преобразованные даты
    this._normalizedDate = this.createdDate ?
      new Date(this.createdDate.getFullYear(), this.createdDate.getMonth(), 
      this.createdDate.getDate(), this.createdDate.getHours(), 
      this.createdDate.getMinutes(), this.createdDate.getSeconds()) :
      null;
  }

  getHours() {
    return this.seconds / 3600;
  }

  isInDateRange(startDate, endDate) {
    if (!startDate && !endDate) return true;
    if (!this._normalizedDate) return false;

    const filterStart = startDate ? new Date(startDate) : null;
    const filterEnd = endDate ? new Date(endDate) : null;

    if (filterEnd) {
      filterEnd.setHours(23, 59, 59, 999);
    }
    if (filterStart) {
      filterStart.setHours(0, 0, 0, 1);
    }
    console.log("dates", {
      filterStart,
      filterEnd,
      date: this._normalizedDate
    })
    // Используем предвычисленные значения
    if (filterStart && this._normalizedDate < filterStart) return false;
    if (filterEnd && this._normalizedDate > filterEnd) return false;

    return true;
  }
}