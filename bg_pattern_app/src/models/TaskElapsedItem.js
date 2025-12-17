export class TaskElapsedItem {
    constructor(data) {
      this.id = data.ID || data.id;
      this.taskId = data.TASK_ID || data.taskId;
      this.userId = data.USER_ID || data.userId;
      this.seconds = parseInt(data.SECONDS || data.seconds) || 0;
      this.createdDate = data.CREATED_DATE || data.createdDate ? new Date(data.CREATED_DATE || data.createdDate) : null;
      this.comment = data.COMMENT_TEXT || data.comment || '';
    }
  
    getHours() {
      return this.seconds / 3600;
    }
  
    isInDateRange(startDate, endDate) {
      if (!startDate && !endDate) return true;
      
      const itemDate = new Date(this.createdDate);
      const filterStart = startDate ? new Date(startDate) : null;
      const filterEnd = endDate ? new Date(endDate) : null;

      if (filterEnd) {
        filterEnd.setHours(23, 59, 59, 999);
      }
      if (filterStart && itemDate < filterStart) return false;
      if (filterEnd && itemDate >= filterEnd) return false;
      return true;
    }
  }