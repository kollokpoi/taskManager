// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import bitrixService from '../services/bitrixService';

import FullLayout from '../layouts/FullLayout.vue';
import Home from '../views/Home.vue';
import Tasks from '../views/Tasks.vue';
import Settings from '../views/Settings.vue';
import PeriodEmployment from '../views/PeriodEmployment.vue';
import ProjectEmployment from '../views/ProjectEmployment.vue';
import DealsCreate from '../views/DealsCreate.vue';
import test from '../views/test.vue';
import AuthError from '../views/AuthError.vue';

const routes = [
  {
    path: '/',
    component: FullLayout,
    children: [
      { path: '/', name: 'home', component: Home },
      { path: '/tasks', name: 'tasks', component: Tasks },
      { path: '/test', name: 'test', component: test },
      { path: '/periodEmployment', name: 'periodEmployment', component: PeriodEmployment },
      { path: '/projectEmployment', name: 'projectEmployment', component: ProjectEmployment },
      { path: '/settings', name: 'settings', component: Settings },
      { path: '/dealsCreate', name: 'dealsCreate', component: DealsCreate },
      {
        path: '/auth-error',
        name: 'auth-error',
        component: AuthError,
        meta: { skipAuth: true }
      },
      {
        path: '/reviews',
        name: 'reviews',
        beforeEnter(to, from, next) {
          if (window.top !== window) {
            window.top.location.href = 'https://doka-guide.vercel.app/css/background/';
          } else {
            window.location.href = 'https://doka-guide.vercel.app/css/background/';
          }
        },
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
