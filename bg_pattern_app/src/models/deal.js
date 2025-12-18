export class Deal {
  constructor(data) {
    this.id = data.ID || data.id;
    this.name = data.TITLE || data.title || 'Без названия';
    this.sum = parseFloat(data.OPPORTUNITY || data.sum || 0);
    this.plannedTime = parseFloat(data.UF_CRM_PLANNED_TIME || data.plannedTime || 0);
    this.tasks = (data.tasks || []);
    
    this._calculationCache = new Map();
  }

  hasTasksInPeriod(startDate = null, endDate = null) {
    return this.tasks.some(task => task.isInDateRange(startDate, endDate));
  }

  getTimeSpentHours(startDate = null, endDate = null) {
    const cacheKey = `timeSpent_${startDate}_${endDate}`;
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }

    const filteredTasks = this.tasks.filter(task => 
      task.isInDateRange(startDate, endDate)
    );

    const result = filteredTasks.reduce((sum, task) => 
      sum + task.getTimeSpentHours(startDate, endDate), 0
    );

    this._calculationCache.set(cacheKey, result);
    return result;
  }

  // Быстрые расчеты с кэшированием
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

  // Метод для таблицы с предварительными расчетами
  toTableRow(wage = 0, startDate = null, endDate = null) {
    const timeSpent = this.getTimeSpentHours(startDate, endDate);
    const resultTime = this.plannedTime - timeSpent;
    
    return {
      id: this.id,
      name: this.name,
      sum: this.sum,
      plannedTime: this.plannedTime,
      timeSpent: timeSpent,
      resultTime: resultTime,
      plannedCost: timeSpent * wage,
      realCost: this.sum - timeSpent * wage,
      hasTasks: this.tasks.length > 0
    };
  }
}