// src/utils/globalDates.js
import { reactive, readonly } from 'vue';

const globalDates = reactive({
  start: null,
  end: null
});

// Сохраняем в localStorage
export const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('globalDates', JSON.stringify({
      start: globalDates.start,
      end: globalDates.end
    }));
  }
};

// Загружаем из localStorage
export const loadFromStorage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('globalDates');
    if (saved) {
      try {
        const { start, end } = JSON.parse(saved);
        globalDates.start = start;
        globalDates.end = end;
      } catch (e) {
        console.error('Ошибка загрузки дат:', e);
      }
    }
  }
};

export const useGlobalDates = () => {
  const updateDates = (start, end) => {
    globalDates.start = start;
    globalDates.end = end;
    saveToStorage();
  };

  return {
    dates: readonly(globalDates),
    updateDates,
    loadFromStorage
  };
};