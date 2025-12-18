import { Task } from "./task";
import { User } from "./user";

export class Project{
    constructor(data){
        this.id = data.id || data.ID;
        this.name = data.name || data.NAME || "Без названия"
        this.description = data.description || data.DESCRIPTION || "Без описания";
        this.dateCreate = data.dateCreate || data.DATE_CREATE
        this.active = data.active || data.ACTIVE
        this.tasks = (data.tasks || []);
        this.users = (data.users || []);
        console.log("dataTasks",data.tasks)
        console.log("projectTasks",this.tasks)
    }

    getTimeSpentHours(startDate = null, endDate = null) {
        const filteredTasks = this.tasks.filter(task => {
          return task.isInDateRange(startDate, endDate);
        });
    
        return filteredTasks.reduce((sum, task) => {
            return sum + task.getTimeSpentHours(startDate, endDate);}, 
        0);
    }

    toTableRows(startDate,endDate, planedTime){
        const tasks = this.tasks.map(task=>task.toTableRow(startDate,endDate))
        return tasks.map(task=>{
            return {
                ...task,
                projectName:this.name,
                planedTime,
                projectId:this.id,
                resultTime:planedTime-task.timeSpent
            }
        })
    }
}