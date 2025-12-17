export const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  export const formatHoursToHHMM = (hours) => {
    const absHours = Math.abs(hours);
    if (absHours === 0) return '0ч 0м';
    
    const totalMinutes = Math.round(absHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return `${h}ч ${m}м`;
  };
  
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  export const formatHours = (hours) => {
    if (hours === null || hours === undefined) return '0';
    const rounded = Math.round(hours * 10) / 10;
    return rounded.toFixed(1);
  };
  
  export const formatTableDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };