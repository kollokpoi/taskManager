
export const TASK_STATUSES = {
    1: { id: 1, name: 'Новая', color: 'blue', icon: '🆕' },
    2: { id: 2, name: 'Ждет выполнения', color: 'yellow', icon: '⏳' },
    3: { id: 3, name: 'Выполняется', color: 'orange', icon: '⚡' },
    4: { id: 4, name: 'Ждет контроля', color: 'purple', icon: '👀' },
    5: { id: 5, name: 'Завершена', color: 'green', icon: '✅' },
    6: { id: 6, name: 'Отложена', color: 'gray', icon: '💤' },
    7: { id: 7, name: 'Отклонена', color: 'red', icon: '❌' }
  };
  
  export const getStatusName = (statusId) => {
    return TASK_STATUSES[statusId]?.name || 'Неизвестно';
  };
  
  export const getStatusColor = (statusId) => {
    return TASK_STATUSES[statusId]?.color || 'gray';
  };
  
  export const getStatusIcon = (statusId) => {
    return TASK_STATUSES[statusId]?.icon || '❓';
  };