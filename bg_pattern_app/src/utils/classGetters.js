
export const getDealResultColorClasses=(deal)=>{
    const classes = []
    if(!deal.plannedTime || deal.plannedTime===0)
        classes.push('text-yellow-200')
    else if(deal.resultTime<0){
        classes.push('text-red-200')
    }else{
        classes.push('text-green-400')
    }

    return classes.join(' ');
}