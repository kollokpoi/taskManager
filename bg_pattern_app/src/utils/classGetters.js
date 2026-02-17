
import { isInWork } from "../constants/taskStatuses"
export const getDealResultColorClasses=(deal)=>{
    const classes = []
    if(deal.resultTime<0){
        classes.push('text-red-200')
    }else{
        classes.push('text-green-400')
    }

    return classes.join(' ');
}

export const getTaskResultColorClasses=(task)=>{
    const classes = []
    if(isInWork(task.statusId))
        classes.push('text-blue-200')
    else {
        if(task.resultTime<0) classes.push('text-red-200')
        else classes.push('text-green-400')
    }

    return classes.join(' ');
}

export const getSmallerThanNullClasses=(value)=>value<0?'text-red-200':'text-green-400'