// src/menuItems.js
import {
  BriefcaseIcon,//Сделки
  ClipboardIcon,//Задачи
  UsersIcon,//Занятость по сотрудникам за период
  ClipboardDocumentCheckIcon,//Занятость по проектам
  CalendarIcon,//Распланировать задачи
  LightBulbIcon, // Наши решения
  StarIcon,//Отзывы
  PencilIcon,//Оставить идею
  ChatBubbleLeftIcon, //поддержка
  InformationCircleIcon //инструкция
} from '@heroicons/vue/24/solid';

export const mainItems = [
  { label: 'Сделки', icon: BriefcaseIcon, active: true,additionalPath:'/'},
  { label: 'Задачи', icon: ClipboardIcon , additionalPath:'/tasks'},
  { label: 'Занятость по сотрудникам за период', icon: UsersIcon , additionalPath:'/periodEmployment'},
  { label: 'Занятость по проектам', icon: ClipboardDocumentCheckIcon , additionalPath:'/projectEmployment'},
  { label: 'Распланировать задачи', icon: CalendarIcon , additionalPath:'/taskCreate'},
];

export const utilityItems = [
  { label: 'Наши решения', icon: LightBulbIcon , additionalPath:'/solutions'},
  { label: 'Отзывы', icon: StarIcon , additionalPath:'/reviews'},
  { label: 'Оставить идею', icon: PencilIcon , additionalPath:'/ideas'},
  { label: 'Поддержка', icon: ChatBubbleLeftIcon , additionalPath:'/'},
  { label: 'Инструкция', icon: InformationCircleIcon , additionalPath:'/instruction'},
];
