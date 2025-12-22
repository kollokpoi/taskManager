import { User } from '../models/user.js';
import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';

export class UserService {
  constructor() {
    this.usersCache = null;
    this.tasksCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  /**
   * Получает всех пользователей
   */
  async getUsers(startDate,endDate) {
    if (this.usersCache && this._isCacheValid(this.usersCache.timestamp)) {
      return this.usersCache.data;
    }

    try {
      const [usersData, allUsersTasks] = await Promise.all([
        this._fetchUsers(),
        this._fetchAllUsersTasks(startDate,endDate)
      ]);

      const users = usersData.map(userData => {
        const tasks = allUsersTasks.get(userData.ID.toString()) || [];
        return new User({ ...userData, tasks });
      });
      this.usersCache = { 
        data: users, 
        timestamp: Date.now() 
      };
      
      return users;

    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      throw error;
    }
  }

  /**
   * Получает пользователя по ID
   */
  async getUserById(userId) {
    const users = await this.getUsers();
    return users.find(user => user.id == userId) || null;
  }

  /**
   * Получает текущего пользователя
   */
  async getCurrentUser() {
    try {
      const user = await bitrixService.getCurrentUser();
      return new User({
        id: user.ID,
        name: user.NAME,
        lastName: user.LAST_NAME
      });
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      throw error;
    }
  }

  /**
   * Загружает пользователей из Битрикс
   * @private
   */
  async _fetchUsers() {
    const response = await bitrixService.callMethod('user.get', {
      filter: { 'ACTIVE': true },
      select: ['ID', 'NAME', 'LAST_NAME']
    });

    return response.result || response || [];
  }

  /**
   * Параллельно загружает задачи для всех пользователей
   * @private
   */
  async _fetchAllUsersTasks(startDate,endDate) {
    const users = await this._fetchUsers();
    const tasksMap = new Map();
    const batchSize = 5;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(async user => ({
        userId: user.ID.toString(),
        tasks: await taskService.getUserTasks(user.ID,startDate,endDate).catch(() => [])
      }));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ userId, tasks }) => tasksMap.set(userId, tasks));
    }
    return tasksMap;
  }

  /**
   * Проверяет валидность кэша
   * @private
   */
  _isCacheValid(timestamp) {
    return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  /**
   * Очищает кэш пользователей
   */
  clearCache() {
    this.usersCache = null;
    this.tasksCache.clear();
  }
}

export const userService = new UserService();