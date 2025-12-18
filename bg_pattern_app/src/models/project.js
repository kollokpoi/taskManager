export class Project {
    constructor(data) {
      this.id = data.id || data.ID;
      this.name = data.name || data.NAME || "Без названия";
      this.tasks = (data.tasks || []);
      this.users = (data.users || []);
      
      // Кэш для расчетов
      this._calculationCache = new Map();
    }
  
    getTimeSpentHours(startDate = null, endDate = null) {
      const cacheKey = `time_spent_${startDate}_${endDate}`;
      
      if (this._calculationCache.has(cacheKey)) {
        return this._calculationCache.get(cacheKey);
      }
  
      const result = this.tasks
        .filter(task => task.isInDateRange(startDate, endDate))
        .reduce((sum, task) => sum + task.getTimeSpentHours(startDate, endDate), 0);
      
      this._calculationCache.set(cacheKey, result);
      return result;
    }
  
    toTableRows(startDate, endDate, planedTime) {
      const cacheKey = `table_rows_${startDate}_${endDate}_${planedTime}`;
      
      if (this._calculationCache.has(cacheKey)) {
        return this._calculationCache.get(cacheKey);
      }
  
      const result = this.tasks
        .filter(task => task.isInDateRange(startDate, endDate))
        .map(task => {
          const taskRow = task.toTableRow(startDate, endDate);
          return {
            ...taskRow,
            projectName: this.name,
            projectId: this.id,
            resultTime: taskRow.timeEstimate - taskRow.timeSpent
          };
        });
  
      this._calculationCache.set(cacheKey, result);
      return result;
    }
  }