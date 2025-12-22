import { User } from '../models/user.js';
import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';

export class UserService {
  constructor() {
    this.usersCache = null;
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  async getUsers(startDate, endDate) {
    if (this.usersCache && this._isCacheValid(this.usersCache.timestamp)) {
      return this.usersCache.data;
    }

    try {
      const [usersData, allUsersTasks] = await Promise.all([
        this._fetchUsers(),
        this._fetchAllUsersTasks(startDate, endDate)
      ]);

      const users = usersData.map(userData => {
        const tasks = allUsersTasks.get(userData.ID.toString()) || [];
        return new User({ ...userData, tasks });
      });

      this.usersCache = { data: users, timestamp: Date.now() };
      return users;
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    const users = await this.getUsers();
    return users.find(user => user.id == userId) || null;
  }

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

  async _fetchUsers() {
    const response = await bitrixService.callMethod('user.get', {
      filter: { 'ACTIVE': true },
      select: ['ID', 'NAME', 'LAST_NAME']
    });

    return response.result || response || [];
  }

  async _fetchAllUsersTasks(startDate, endDate) {
    const users = await this._fetchUsers();
    const tasksMap = new Map();
    const batchSize = 5;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(async user => ({
        userId: user.ID.toString(),
        tasks: await taskService.getUserTasks(user.ID, startDate, endDate).catch(() => [])
      }));
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ userId, tasks }) => tasksMap.set(userId, tasks));
    }
    
    return tasksMap;
  }

  _isCacheValid(timestamp) {
    return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  clearCache() {
    this.usersCache = null;
  }
}

export const userService = new UserService();