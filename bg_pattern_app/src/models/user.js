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

  getElapsedTimeHours(startDate = null, endDate = null) {

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

  toTableRow(date, workTime){
    const startDateCopy = new Date(date);
    const endDateCopy = new Date(date);
    endDateCopy.setHours(23, 59, 59, 999);
    
    const timeSpent = this.getTimeSpentHours(startDateCopy, endDateCopy);
    const result = (timeSpent/workTime*100).toFixed(2)

    const filteredTasks = this.getFilteredTasks(startDateCopy, endDateCopy)
    .map(task=>{
      const taskTimeSpent = task.getTimeSpentHours(startDateCopy,endDateCopy)
      return{
        timeSpent:taskTimeSpent,
        workTime,
        result:(taskTimeSpent/workTime*100).toFixed(2)
      }
    })

    console.log("filteredTasks",filteredTasks)
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
}