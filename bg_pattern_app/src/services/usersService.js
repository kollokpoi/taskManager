import { User } from "../models/user.js";
import bitrixService from "./bitrixService.js";
import { taskService } from "./tasksService.js";

export class UserService {
  constructor() {
    this.shortUsers = null;
    this.usersCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  async getUsers(startDate, endDate) {
    const cacheKey = `users_${startDate}_${endDate}`;
    if (this.usersCache.has(cacheKey)) {
      return this.usersCache.get(cacheKey);
    }

    try {
      const usersData = await this._fetchUsers();
      const allUsersTasks = await this._fetchAllUsersTasks(
        usersData,
        startDate,
        endDate
      );

      const users = usersData.map((userData) => {
        const tasks = allUsersTasks.get(userData.ID.toString()) || [];
        return new User({ ...userData, tasks });
      });
      this.usersCache.set(cacheKey, users);
      return users;
    } catch (error) {
      console.error("Ошибка получения пользователей:", error);
      throw error;
    }
  }

  async getUserById(userId) {
    const users = await this.getUsers();
    return users.find((user) => user.id == userId) || null;
  }

  async getCurrentUser() {
    try {
      const user = await bitrixService.getCurrentUser();
      return new User({
        id: user.ID,
        name: user.NAME,
        lastName: user.LAST_NAME,
      });
    } catch (error) {
      console.error("Ошибка получения текущего пользователя:", error);
      throw error;
    }
  }

  async _fetchUsers() {
    if (this.shortUsers && this._isCacheValid(this.shortUsers.timestamp)) {
      return this.shortUsers.data;
    }
    const response = await bitrixService.callMethod("user.get", {
      filter: { ACTIVE: true },
      select: ["ID", "NAME", "LAST_NAME"],
    });

    this.shortUsers = {
      data: response.result || response || [],
      timestamp: Date.now(),
    };
    return response.result || response || [];
  }

  async _fetchAllUsersTasks(users, startDate, endDate) {
    const tasksMap = new Map();
    const batchSize = 5;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(async (user) => ({
        userId: user.ID.toString(),
        tasks: await taskService
          .getUserTasks(user.ID, startDate, endDate)
          .catch((error) => {
            console.log(error);
          }),
      }));

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ userId, tasks }) => tasksMap.set(userId, tasks));
    }

    return tasksMap;
  }

  _isCacheValid(timestamp) {
    return timestamp && Date.now() - timestamp < this.CACHE_DURATION;
  }

  clearCache() {
    this.usersCache = null;
  }
}

export const userService = new UserService();
