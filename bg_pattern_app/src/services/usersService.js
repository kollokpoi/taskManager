// src/services/userService.js
import { User } from '../models/user.js';
import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';

export class UserService {
  constructor() {
    this.usersCache = null;
    this.cacheTimestamp = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 минут
  }

  async getUsers() {
    if (this.usersCache && this.cacheTimestamp && 
        Date.now() - this.cacheTimestamp < this.cacheDuration) {
      return this.usersCache;
    }

    try {
      const response = await bitrixService.callMethod('user.get', {
        filter: { 'ACTIVE': true },
        select: ['ID', 'NAME', 'LAST_NAME']
      });

      const usersData = response.result || response;
      if (!Array.isArray(usersData)) {
        console.error('Неверный формат ответа пользователей:', response);
        return [];
      }

      const users = await Promise.all(
        usersData.map(async (userData)=>{
            try {
              const tasks = await taskService.getUserTasks(userData.ID);
              return new User({ ...userData, tasks: tasks });
            } catch (error) {
              console.error(`Ошибка загрузки задач для пользователя ${userData.ID}:`, error);
              return new User(userData); 
            }
        })
      )

      // Сохраняем в кэш
      this.usersCache = users;
      this.cacheTimestamp = Date.now();

      return users;

    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      throw error;
    }
  }
  // Получить пользователя по ID
  async getUserById(userId) {
    const users = await this.getUsers();
    return users.find(user => user.id == userId) || null;
  }

  // Получить текущего пользователя
  async getCurrentUser() {
    try {
      const user = await bitrixService.getCurrentUser();
      return {
        id: user.ID,
        name: `${user.NAME} ${user.LAST_NAME}`.trim() || user.EMAIL,
        email: user.EMAIL,
        position: user.WORK_POSITION || ''
      };
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      throw error;
    }
  }

  // Поиск пользователей
  async searchUsers(query) {
    const users = await this.getUsers();
    
    if (!query) return users;
    
    const lowerQuery = query.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.position.toLowerCase().includes(lowerQuery)
    );
  }
}

export const userService = new UserService();