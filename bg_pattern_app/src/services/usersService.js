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
      console.log("user", user);
      return new User(user);
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
    console.log("shortUser", {
      shortUsers: this.shortUsers,
      response,
    });
    return response.result || response || [];
  }

  async _fetchAllUsersTasks(users, startDate, endDate) {
    const tasks = await taskService.getUserListTasks(users, startDate, endDate);
    const tasksByRespId = new Map();

    tasks.forEach((item) => {
      const respId = item.responsibleId;
      if (!tasksByRespId.has(respId)) {
        tasksByRespId.set(respId, []);
      }
      tasksByRespId.get(respId).push(item);
    });

    return tasksByRespId;
  }

  _isCacheValid(timestamp) {
    return timestamp && Date.now() - timestamp < this.CACHE_DURATION;
  }

  clearCache() {
    this.usersCache = null;
  }
}

export const userService = new UserService();
