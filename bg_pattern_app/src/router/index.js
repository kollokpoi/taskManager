// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import bitrixService from '../services/bitrixService';

import FullLayout from '../layouts/FullLayout.vue';
import Home from '../views/Home.vue';
import Tasks from '../views/Tasks.vue';
import PeriodEmployment from '../views/PeriodEmployment.vue';
import ProjectEmployment from '../views/ProjectEmployment.vue';
import TaskCreate from '../views/TaskCreate.vue';
import AuthError from '../views/AuthError.vue';
import instruction from '../views/instruction.vue';
import Solutions from '../views/OurSolutions.vue'
import Ideas from '../views/SubmitIdea.vue'


const routes = [
  {
    path: '/',
    component: FullLayout,
    children: [
      { path: '/', name: 'home', component: Home },
      { path: '/tasks', name: 'tasks', component: Tasks },
      { path: '/periodEmployment', name: 'periodEmployment', component: PeriodEmployment },
      { path: '/projectEmployment', name: 'projectEmployment', component: ProjectEmployment },
      { path: '/taskCreate', name: 'taskCreate', component: TaskCreate },
      { path: '/solutions', name: 'solutions', component: Solutions },
      {
        path: '/reviews',
        name: 'reviews',
        beforeEnter(to, from, next) {
          const url = 'https://www.bitrix24.ru/partners/partner/13927904/';
          window.open(url, '_blank');
          next(false);
        },
      },
      { path: '/ideas', name: 'ideas', component: Ideas },
      { path: '/instruction', name: 'instruction', component: instruction },
      {
        path: '/auth-error',
        name: 'auth-error',
        component: AuthError,
        meta: { skipAuth: true }
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {

  if (to.meta?.skipAuth) {
    return next();
  }
  
  const publicRoutes = ['/login', '/error'];
  if (publicRoutes.includes(to.path)) {
    return next();
  }
  
  try {
    if (!bitrixService.isInitialized) {
      await bitrixService.init();
    }
    if (!bitrixService.checkAuth()) {
      console.warn('Пользователь не авторизован, перенаправление...');

      return next({
        name: 'auth-error',
        query: { redirect: to.fullPath }
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    
    next({
      name: 'auth-error',
      query: { 
        error: error.message,
        redirect: to.fullPath 
      }
    });
  }
});

export default router;
