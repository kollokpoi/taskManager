import bitrixService from "./bitrixService.js";
import { Task } from "../models/task.js";
import { TaskElapsedItem } from "../models/TaskElapsedItem.js";

export class TaskService {
  constructor() {
    this.tasksCache = new Map();
    this.elapsedItemsCache = new Map();
    this.CACHE_TTL = 300000; // 5 минут
  }

  // ============== Основные публичные методы ==============

  async getTasks(startDate = null, endDate = null) {

    const dateStr = startDate?.toISOString();

    const [closedTasks, openTasks] = await Promise.all([
      this._executeTasksQuery({ ">=CLOSED_DATE": dateStr }),
      this._executeTasksQuery({ CLOSED_DATE: "" }),
    ]);

    const allTasks = [...openTasks, ...closedTasks];
    return this._fetchAndProcessTasks(allTasks, startDate, endDate);
  }

  async getDealTasks(dealId, startDate = null, endDate = null) {
    return this._getCachedOrFetch(
      `deal_tasks_${dealId}_${startDate}_${endDate}`,
      () => this._fetchAndProcessTasks({ UF_CRM_TASK: `D_${dealId}` }, startDate, endDate)
    );
  }

  async getTaskDeals(startDate = null, endDate = null) {
    return this._getCachedOrFetch(
      `task_deals_${startDate}_${endDate}`,
      async () => {
        const [closedTasks, openTasks] = await Promise.all([
          this._executeTasksQuery({ "!UF_CRM_TASK": false, ">=CLOSED_DATE": startDate?.toISOString().split("T")[0] }),
          this._executeTasksQuery({ "!UF_CRM_TASK": false, CLOSED_DATE: "" }),
        ]);

        const allTasks = [...openTasks, ...closedTasks];
        const tasksWithTime = allTasks.filter(task => this._getTaskTimeSpent(task) > 0);

        if (tasksWithTime.length === 0) return new Map();

        const elapsedMap = await this.getTaskElapsedItemsBatch(
          tasksWithTime.map(t => t.id),
          startDate,
          endDate
        );

        const dealsMap = new Map();
        tasksWithTime.forEach(task => {
          const dealIds = this._extractDealIdsFromUFCRMTask(task.ufCrmTask);
          if (dealIds.length === 0) return;

          const taskObj = new Task({
            ...task,
            elapsedItems: elapsedMap.get(task.id) || [],
          });

          dealIds.forEach(dealId => {
            if (!dealsMap.has(dealId)) dealsMap.set(dealId, []);
            dealsMap.get(dealId).push(taskObj);
          });
        });

        return dealsMap;
      }
    );
  }

  async getUserTasks(userId, startDate = null, endDate = null) {
    const [closedTasks, openTasks] = await Promise.all([
      this._fetchAndProcessTasks({ RESPONSIBLE_ID: userId, ">=CLOSED_DATE": startDate?.toISOString().split("T")[0] }, startDate, endDate),
      this._fetchAndProcessTasks({ RESPONSIBLE_ID: userId, CLOSED_DATE: "" }, startDate, endDate),
    ]);

    return [...openTasks, ...closedTasks];
  }

  async getUserListTasks(users = [], startDate = null, endDate = null) {
    const userIds = users.map(u => u.ID);
    const dateStr = startDate?.toISOString().split("T")[0];

    const [closedTasks, openTasks] = await Promise.all([
      this._executeTasksQuery({ RESPONSIBLE_ID: userIds, ">=CLOSED_DATE": dateStr }),
      this._executeTasksQuery({ RESPONSIBLE_ID: userIds, CLOSED_DATE: "" }),
    ]);

    const allTasks = [...openTasks, ...closedTasks];
    const tasksWithTime = allTasks.filter(task => this._getTaskTimeSpent(task) > 0);

    if (tasksWithTime.length === 0) {
      return allTasks.map(data => new Task(data));
    }

    const elapsedMap = await this.getTaskElapsedItemsBatch(
      tasksWithTime.map(t => t.id),
      startDate,
      endDate
    );

    return allTasks.map(taskData => new Task({
      ...taskData,
      elapsedItems: elapsedMap.get(taskData.id) || [],
    }));
  }

  async getProjectTasks(projectId, startDate = null, endDate = null) {
    return this._getCachedOrFetch(
      `project_tasks_${projectId}_${startDate}_${endDate}`,
      () => this._fetchAndProcessTasks({ GROUP_ID: projectId }, startDate, endDate)
    );
  }

  // ============== Elapsed Items методы ==============

  async getTaskElapsedItemsBatch(taskIds, startDate = null, endDate = null) {
    if (!taskIds?.length) return new Map();

    const BATCH_SIZE = 20;
    const elapsedMap = new Map();

    for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
      const batch = taskIds.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(taskId =>
        this.getTaskElapsedItems(taskId, startDate, endDate).catch(() => [])
      );

      const batchResults = await Promise.all(batchPromises);
      batch.forEach((taskId, index) => {
        const items = batchResults[index];
        if (items?.length > 0) elapsedMap.set(taskId, items);
      });

      if (i + BATCH_SIZE < taskIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return elapsedMap;
  }

  async getTaskListElapsedItems(startDate = null, endDate = null) {
    if (!startDate || !endDate) return [];

    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const dateStart = startDate.toISOString();
    const dateEnd = nextDay.toISOString();

    const allItems = [];
    const perPage = 50;
    let page = 1;

    const loadPage = () => {
      return new Promise((resolve, reject) => {
        window.BX24.callMethod(
          "task.elapseditem.getlist",
          {
            order: { ID: "desc" },
            filter: { ">=CREATED_DATE": dateStart, "<=CREATED_DATE": dateEnd },
            SELECT: ["ID", "SECONDS", "TASK_ID", "CREATED_DATE", "USER_ID"],
            PARAMS: { NAV_PARAMS: { nPageSize: perPage, iNumPage: page } },
          },
          (result) => {
            if (result.error()) {
              reject(result.error());
              return;
            }

            allItems.push(...result.data());
            page++;

            if (result.more?.() && result.data().length > 0) {
              loadPage().then(resolve).catch(reject);
            } else {
              resolve(allItems.map(item => new TaskElapsedItem(item)));
            }
          }
        );
      });
    };

    try {
      return await loadPage();
    } catch (error) {
      console.error("Ошибка получения списка периодов:", error);
      return [];
    }
  }

  async getTaskElapsedItems(taskId, startDate = null, endDate = null) {
    if (!startDate || !endDate) return [];

    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const dateStart = startDate.toISOString().split("T")[0];
    const dateEnd = nextDay.toISOString().split("T")[0];

    try {
      const response = await bitrixService.callMethod("task.elapseditem.getlist", {
        TASKID: taskId,
        order: { ID: "desc" },
        filter: { ">=CREATED_DATE": dateStart, "<=CREATED_DATE": dateEnd },
      });

      const items = (Array.isArray(response) ? response : response?.result || [])
        .map(item => new TaskElapsedItem(item));
      return items;
    } catch (error) {
      console.error(`Ошибка получения периодов задачи ${taskId}:`, error);
      return [];
    }
  }

  async changeTaskResponsible(taskId, newResponsibleId) {
    await bitrixService.callMethod("tasks.task.update", {
      taskId: String(taskId),
      fields: { RESPONSIBLE_ID: newResponsibleId },
    });
  }

  clearCache() {
    this.tasksCache.clear();
    this.elapsedItemsCache.clear();
  }

  // ============== Приватные вспомогательные методы ==============

  async _executeTasksQuery(filter) {
    try {
      const response = await bitrixService.callMethod("tasks.task.list", {
        order: { ID: "DESC" },
        select: this._getBaseSelect(),
        filter,
      });
      return this._extractTasks(response);
    } catch (error) {
      console.error("Ошибка выполнения запроса задач:", error, { filter });
      return [];
    }
  }

  async _fetchAndProcessTasks(filterOrTasks, startDate = null, endDate = null) {
    const tasks = Array.isArray(filterOrTasks)
      ? filterOrTasks
      : await this._executeTasksQuery(filterOrTasks);
    if (!startDate || !endDate) {
      return tasks.map(data => new Task(data));
    }

    const tasksWithTime = tasks.filter(task => this._getTaskTimeSpent(task) > 0);
    if (tasksWithTime.length === 0) {
      return tasks.map(data => new Task(data));
    }

    return this._processTasksWithElapsedItems(tasks, startDate, endDate);
  }

  async _processTasksWithElapsedItems(tasks, startDate, endDate) {
    const elapsedItems = await this.getTaskListElapsedItems(startDate, endDate);
    const elapsedByTaskId = new Map();

    elapsedItems.forEach(item => {
      const taskId = item.taskId;
      if (!elapsedByTaskId.has(taskId)) {
        elapsedByTaskId.set(taskId, []);
      }
      elapsedByTaskId.get(taskId).push(item);
    });

    return tasks.map(taskData => new Task({
      ...taskData,
      elapsedItems: elapsedByTaskId.get(taskData.id) || [],
    }));
  }

  async _getCachedOrFetch(cacheKey, fetchFunction) {
    if (this.tasksCache.has(cacheKey)) {
      return this.tasksCache.get(cacheKey);
    }

    const result = await fetchFunction();
    this.tasksCache.set(cacheKey, result);
    setTimeout(() => this.tasksCache.delete(cacheKey), this.CACHE_TTL);

    return result;
  }

  _extractDealIdsFromUFCRMTask(ufCrmTask) {
    if (!ufCrmTask || ufCrmTask === false) return [];

    const dealIds = [];
    const items = Array.isArray(ufCrmTask) ? ufCrmTask : [ufCrmTask];

    items.forEach(item => {
      if (typeof item === "string") {
        const match = item.match(/^D_(\d+)/);
        if (match) dealIds.push(parseInt(match[1]));
      }
    });

    return dealIds;
  }

  _getBaseSelect() {
    return [
      "ID", "RESPONSIBLE_ID", "TIME_SPENT_IN_LOGS", "TIME_ESTIMATE",
      "DATE_START", "DEADLINE", "TITLE", "STATUS", "CREATED_DATE",
      "CLOSED_DATE", "CLOSED_BY", "GROUP_ID", "UF_CRM_TASK"
    ];
  }

  _getUniqueTasks(tasks) {
    const seenIds = new Set();
    return tasks.filter(task => {
      const taskId = task.id;
      if (seenIds.has(taskId)) return false;
      seenIds.add(taskId);
      return true;
    });
  }

  _extractTasks(response) {
    if (response?.tasks) return response.tasks;
    if (response?.result?.tasks) return response.result.tasks;
    if (Array.isArray(response)) return response;
    if (response?.result && Array.isArray(response.result)) return response.result;
    return [];
  }

  _getTaskTimeSpent(task) {
    const timeSpent = task.timeSpentInLogs || task.TIME_SPENT_IN_LOGS;
    return parseInt(timeSpent) || 0;
  }

  _normalizeTaskData(task) {
    return {
      id: task.ID || task.id,
      responsibleId: task.RESPONSIBLE_ID || task.responsibleId,
      timeSpentInLogs: task.TIME_SPENT_IN_LOGS || task.timeSpentInLogs,
      timeEstimate: task.TIME_ESTIMATE || task.timeEstimate,
      dateStart: task.DATE_START || task.dateStart,
      deadline: task.DEADLINE || task.deadline,
      title: task.TITLE || task.title,
      status: task.STATUS || task.status,
      createdDate: task.CREATED_DATE || task.createdDate,
      closedDate: task.CLOSED_DATE || task.closedDate,
      closedBy: task.CLOSED_BY || task.closedBy,
      groupId: task.GROUP_ID || task.groupId,
      ufCrmTask: task.UF_CRM_TASK || task.ufCrmTask,
    };
  }
}

export const taskService = new TaskService();