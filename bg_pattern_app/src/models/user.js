import { TaskElapsedItem } from './TaskElapsedItem.js';
import { getStatusName } from '../constants/taskStatuses.js';
import { Task } from './task.js';

export class User {
  constructor(data) {
    this.id = data.id || data.ID;
    this.name = data.NAME || data.name;
    this.lastName = data.lastName || data.LAST_NAME
    this.tasks = (data.tasks || []).map(item => new Task(item));
  }

  getFilteredTasks(startDate = null, endDate = null){
    const filteredTasks = this.tasks.filter(task => {
      return task.isInDateRange(startDate, endDate);
    });
    return filteredTasks
  }

  getTimeSpentHours(startDate = null, endDate = null) {
    return this.getFilteredTasks(startDate, endDate).reduce((sum, task) => {
      return sum + task.getTimeSpentHours(startDate, endDate);
    }, 0);
  }

  getTasksInDateCount(startDate = null, endDate = null) {
    return this.getFilteredTasks(startDate, endDate).length;
  }

  toTableRowWithDate(date, workTime){
    const startDateCopy = new Date(date);
    const endDateCopy = new Date(date);
    endDateCopy.setHours(23, 59, 59, 999);
    
    const timeSpent = this.getTimeSpentHours(startDateCopy, endDateCopy);
    const result = (timeSpent/workTime*100).toFixed(2)

    const filteredTasks = this.getFilteredTasks(startDateCopy, endDateCopy)
    .map(task=>{
      const taskTimeSpent = task.getTimeSpentHours(startDateCopy,endDateCopy)
      return{
        title:task.title,
        timeSpent:taskTimeSpent,
        workTime,
        result:(taskTimeSpent/workTime*100).toFixed(2)
      }
    })

    return {
      id: this.id,
      date: startDateCopy,
      name : `${this.name} ${this.lastName}`,
      taskCount: filteredTasks.length,
      timeSpent : timeSpent,
      tasks:filteredTasks,
      workTime,
      result,
    };
  }

  toTableRow(dateStart, dateEnd){
    const tasks = this.getFilteredTasks(dateStart, dateEnd)

    const timeEstimate = tasks.reduce((sum, task) => {
      return sum + task.getTimeEstimateHours();
    }, 0);
    const timeSpent = tasks.reduce((sum, task) => {
      return sum + task.getTimeSpentHours(dateStart, dateEnd);
    }, 0);

    const resultTime = timeEstimate - timeSpent

    const filteredTasks = tasks.map(task=>{
      const taskTimeSpent = task.getTimeSpentHours(dateStart, dateEnd);
      const taskTimeEstimate = task.getTimeEstimateHours();
      const taskResult = taskTimeEstimate-taskTimeSpent
      return {
        title:task.title,
        timeSpent : taskTimeSpent,
        timeEstimate:taskTimeEstimate,
        resultTime:taskResult,
      }
    })

    return {
      id: this.id,
      name : `${this.name} ${this.lastName}`,
      taskCount: filteredTasks.length,
      timeSpent : timeSpent,
      tasks:filteredTasks,
      timeEstimate,
      resultTime,
    };
  }
}