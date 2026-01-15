import bitrixService from "./bitrixService.js";
import { Task } from "../models/task.js";
import { TaskElapsedItem } from "../models/TaskElapsedItem.js";

export class TaskService {
  constructor() {
    this.tasksCache = new Map();
    this.elapsedItemsCache = new Map();
  }

  async getTasks(startDate = null, endDate = null) {
    try {
      const dateStr = startDate.toISOString().split("T")[0];

      const [closedTasks, openTasks] = await Promise.all([
        bitrixService.callMethod("tasks.task.list", {
          filter: { ">=CLOSED_DATE": dateStr },
          select: this._getBaseSelect(),
        }),
        bitrixService.callMethod("tasks.task.list", {
          filter: { CLOSED_DATE: null },
          select: this._getBaseSelect(),
        }),
      ]);

      const allTasks = [
        ...(closedTasks.tasks || []),
        ...(openTasks.tasks || []),
      ];
      const uniqueTasks = this._getUniqueTasks(allTasks);

      const filteredTasks = uniqueTasks.filter((task) => {
        const timeSpent = task.timeSpentInLogs || task.TIME_SPENT_IN_LOGS;
        return timeSpent && parseInt(timeSpent) > 0;
      });

      if (filteredTasks.length === 0) return [];

      const taskIds = filteredTasks.map((task) => task.ID || task.id);
      const elapsedItemsMap = await this.getTaskElapsedItemsBatch(
        taskIds,
        startDate,
        endDate
      );

      return filteredTasks.map((taskData) => {
        const taskElapsedItems =
          elapsedItemsMap.get(taskData.ID || taskData.id) || [];
        const dealIds = this._extractDealIdsFromUFCRMTask(
          taskData.ufCrmTask || taskData.UF_CRM_TASK
        );
        return new Task({
          ...taskData,
          elapsedItems: taskElapsedItems,
          dealIds,
        });
      });
    } catch (error) {
      console.error("Ошибка в getTasks:", error);
      throw error;
    }
  }

  async getDealTasks(dealId, startDate = null, endDate = null) {
    const cacheKey = `deal_tasks_${dealId}_${startDate}_${endDate}`;

    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const filter = { UF_CRM_TASK: `D_${dealId}` };
    const tasks = await this._fetchTasks({ filter }, startDate, endDate);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);

    return tasks;
  }

  async getTaskDeals(startDate = null, endDate = null) {
    const cacheKey = `task_deals_${startDate}_${endDate}`;

    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    try {
      const dateStr = startDate.toISOString().split("T")[0];

      const [closedTasks, openTasks] = await Promise.all([
        bitrixService.callMethod("tasks.task.list", {
          filter: { "!UF_CRM_TASK": false, ">=CLOSED_DATE": dateStr },
          select: this._getBaseSelect(),
        }),
        bitrixService.callMethod("tasks.task.list", {
          filter: { "!UF_CRM_TASK": false, CLOSED_DATE: null },
          select: this._getBaseSelect(),
        }),
      ]);

      const allTasks = [
        ...(closedTasks.tasks || []),
        ...(openTasks.tasks || []),
      ];
      const uniqueTasks = this._getUniqueTasks(allTasks);

      const filteredTasks = uniqueTasks.filter((task) => {
        const timeSpent = task.timeSpentInLogs || task.TIME_SPENT_IN_LOGS;
        if (!timeSpent || parseInt(timeSpent) <= 0) return false;
        const ufCrmTask = task.ufCrmTask || task.UF_CRM_TASK;
        return this._extractDealIdsFromUFCRMTask(ufCrmTask).length > 0;
      });

      if (filteredTasks.length === 0) return new Map();

      const taskIds = filteredTasks.map((task) => task.ID || task.id);
      const elapsedItemsMap = await this.getTaskElapsedItemsBatch(
        taskIds,
        startDate,
        endDate
      );
      const dealsMap = new Map();

      filteredTasks.forEach((taskData) => {
        const dealIds = this._extractDealIdsFromUFCRMTask(
          taskData.ufCrmTask || taskData.UF_CRM_TASK
        );
        const taskElapsedItems =
          elapsedItemsMap.get(taskData.ID || taskData.id) || [];
        const taskObj = new Task({
          ...taskData,
          elapsedItems: taskElapsedItems,
        });

        dealIds.forEach((dealId) => {
          if (!dealsMap.has(dealId)) dealsMap.set(dealId, []);
          dealsMap.get(dealId).push(taskObj);
        });
      });

      this.tasksCache.set(cacheKey, dealsMap);
      setTimeout(() => this.tasksCache.delete(cacheKey), 300000);

      return dealsMap;
    } catch (error) {
      console.error("Ошибка в getTaskDeals:", error);
      throw error;
    }
  }

  _extractDealIdsFromUFCRMTask(ufCrmTask) {
    if (!ufCrmTask || ufCrmTask === false) return [];

    const dealIds = [];

    if (Array.isArray(ufCrmTask)) {
      ufCrmTask.forEach((item) => {
        if (item && typeof item === "string") {
          const match = item.match(/^D_(\d+)/);
          if (match) dealIds.push(parseInt(match[1]));
        }
      });
    } else if (typeof ufCrmTask === "string") {
      const match = ufCrmTask.match(/^D_(\d+)/);
      if (match) dealIds.push(parseInt(match[1]));
    }

    return dealIds;
  }

  async getUserTasks(userId, startDate = null, endDate = null) {
    const dateStr = startDate.toISOString().split("T")[0];

    const [closedTasks, openTasks] = await Promise.all([
      this._fetchTasks(
        {
          filter: { RESPONSIBLE_ID: userId, ">=CLOSED_DATE": dateStr },
        },
        startDate,
        endDate
      ),
      this._fetchTasks(
        {
          filter: { RESPONSIBLE_ID: userId, CLOSED_DATE: null },
        },
        startDate,
        endDate
      ),
    ]);

    const allTasks = [...(closedTasks || []), ...(openTasks || [])];
    const uniqueTasks = this._getUniqueTasks(allTasks);

    return uniqueTasks;
  }

  async getProjectTasks(projectId, startDate = null, endDate = null) {
    const cacheKey = `project_tasks_${projectId}_${startDate}_${endDate}`;

    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const filter = { GROUP_ID: projectId };
    const tasks = await this._fetchTasks({ filter }, startDate, endDate);

    this.tasksCache.set(cacheKey, tasks);
    setTimeout(() => this.tasksCache.delete(cacheKey), 300000);

    return tasks;
  }

  async getTaskElapsedItemsBatch(taskIds, startDate = null, endDate = null) {
    if (!taskIds || taskIds.length === 0) return new Map();

    try {
      const BATCH_SIZE = 20;
      const elapsedMap = new Map();

      for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
        const batch = taskIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((taskId) =>
          this.getTaskElapsedItems(taskId, startDate, endDate).catch(() => [])
        );

        const batchResults = await Promise.all(batchPromises);

        batch.forEach((taskId, index) => {
          const elapsedItems = batchResults[index];
          if (elapsedItems?.length > 0) elapsedMap.set(taskId, elapsedItems);
        });

        if (i + BATCH_SIZE < taskIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return elapsedMap;
    } catch (error) {
      console.error("Ошибка пакетной загрузки elapsedItems:", error);
      return new Map();
    }
  }

  async getTaskListElapsedItems(startDate = null, endDate = null) {
    try {
      const dateStart = startDate.toISOString().split("T")[0];
      const dateEnd = endDate.toISOString().split("T")[0];

      const allItems = [];
      const perPage = 50;
      let currentPage = 1;
      let totalItems = 0;

      // Рекурсивная функция для загрузки всех страниц
      const loadPage = (page) => {
        return new Promise((resolve, reject) => {
          window.BX24.callMethod(
            "task.elapseditem.getlist",
            {
              order: { ID: "desc" },
              filter: {
                ">=CREATED_DATE": dateStart,
                "<=CREATED_DATE": dateEnd,
              },
              SELECT: ["ID", "SECONDS", "TASK_ID", "CREATED_DATE", "USER_ID"],
              PARAMS: {
                NAV_PARAMS: {
                  nPageSize: perPage,
                  iNumPage: page,
                },
              },
            },
            async (result) => {
              if (result.error()) {
                reject(new Error(result.error()));
                return;
              }

              allItems.push(...result.data());

              if (totalItems === 0) {
                totalItems = result.total();
              }

              console.log(
                `Страница ${page}: ${result.data().length} записей, всего: ${
                  allItems.length
                } из ${totalItems}`
              );

              const hasMore = result.more && result.more();
              const loadedEnough = allItems.length >= totalItems;
              const pageHasData = result.data().length > 0;

              if (hasMore && !loadedEnough && pageHasData) {
                try {
                  await loadPage(page + 1);
                  resolve(allItems);
                } catch (error) {
                  reject(error);
                }
              } else {
                resolve(allItems);
              }
            }
          );
        });
      };

      const itemsData = await loadPage(1);

      const items = itemsData.map((item) => new TaskElapsedItem(item));
      return items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getTaskElapsedItems(taskId, startDate = null, endDate = null) {
    try {
      const dateStart = startDate.toISOString().split("T")[0];
      const dateEnd = endDate.toISOString().split("T")[0];
      const response = await bitrixService.callMethod(
        "task.elapseditem.getlist",
        {
          TASKID: taskId,
          order: {
            ID: "desc",
          },
          filter: {
            ">=CREATED_DATE": dateStart,
            "<=CREATED_DATE": dateEnd,
          },
        }
      );

      const items = (
        Array.isArray(response) ? response : response.result || []
      ).map((item) => new TaskElapsedItem(item));
      return items;
    } catch (error) {
      console.error(`Ошибка получения периодов задачи ${taskId}:`, error);
      return [];
    }
  }

  async _fetchTasks(params, startDate = null, endDate = null) {
    try {
      const response = await bitrixService.callMethod("tasks.task.list", {
        order: { ID: "DESC" },
        select: this._getBaseSelect(),
        ...params,
      });

      const tasksData = this._extractTasks(response);
      if (!startDate || !endDate) {
        return tasksData.map((data) => new Task(data));
      }

      const tasksWithTimeSpent = tasksData.filter(
        (task) => task.timeSpentInLogs > 0
      );
      if (tasksWithTimeSpent.length === 0) {
        return tasksData.map((data) => new Task(data));
      }

      const elapsedItems = await this.getTaskListElapsedItems(
        startDate,
        endDate
      );
      const elapsedByTaskId = new Map();
      elapsedItems.forEach((item) => {
        const taskId = item.taskId;
        if (!elapsedByTaskId.has(taskId)) {
          elapsedByTaskId.set(taskId, []);
        }
        elapsedByTaskId.get(taskId).push(item);
      });
      let totalLength = 0;
      elapsedByTaskId.forEach((item) => {
        totalLength += item.length;
      });
      console.log("totalLength", {
        totalLength,
        tasksData,
      });

      const tasksWithElapsed = tasksData.map((taskData) => {
        const taskElapsedItems = elapsedByTaskId.get(taskData.id) || [];
        return new Task({
          ...taskData,
          elapsedItems: taskElapsedItems
        });
      });
      console.log("tasksWithElapsed",tasksWithElapsed)
      return tasksWithElapsed;
    } catch (error) {
      console.error("Ошибка получения задач:", error);
      throw error;
    }
  }

  _getBaseSelect() {
    return [
      "ID",
      "RESPONSIBLE_ID",
      "TIME_SPENT_IN_LOGS",
      "TIME_ESTIMATE",
      "DATE_START",
      "DEADLINE",
      "TITLE",
      "STATUS",
      "CREATED_DATE",
      "CLOSED_DATE",
      "CLOSED_BY",
      "GROUP_ID",
      "UF_CRM_TASK",
    ];
  }

  _getUniqueTasks(tasks) {
    const seenIds = new Set();
    const uniqueTasks = [];

    tasks.forEach((task) => {
      const taskId = task.id || task.ID;
      if (!seenIds.has(taskId)) {
        seenIds.add(taskId);
        uniqueTasks.push(task);
      }
    });

    return uniqueTasks;
  }

  _extractTasks(response) {
    if (response?.tasks) return response.tasks;
    if (response?.result?.tasks) return response.result.tasks;
    if (Array.isArray(response)) return response;
    if (response?.result && Array.isArray(response.result))
      return response.result;
    return [];
  }

  clearCache() {
    this.tasksCache.clear();
    this.elapsedItemsCache.clear();
  }
}

export const taskService = new TaskService();
