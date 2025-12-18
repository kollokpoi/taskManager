import bitrixService from './bitrixService.js';
import { taskService } from './tasksService.js';
import { userService } from './usersService.js';
import { Project } from '../models/project.js';

export class ProjectService {

    async getProjects(params = {}) {
        try {
            const defaultParams = {
                order: { ID: 'DESC' },
                select: ['ID', 'NAME', 'DESCRIPTION', 'DATE_CREATE', 'ACTIVE']
            };
    
            const response = await bitrixService.callMethod('sonet_group.get', {
                ...defaultParams,
                ...params
            });
    
            const projectsData = this._extractProjects(response);
            
            const projects = await Promise.all(
                projectsData.map(async (projectData) => {
                    try {
                        const [tasks, users] = await Promise.all([
                            taskService.getProjectTasks(projectData.ID),
                            this.getProjectUsersWithDetails(projectData.ID)
                        ]);
                        return new Project({ 
                            ...projectData, 
                            tasks: tasks,
                            users: users 
                        });
                        
                    } catch (error) {
                        console.error(`Ошибка загрузки данных проекта ${projectData.ID}:`, error);
                        return new Project(projectData); // Проект без доп. данных
                    }
                })
            );
            
            return projects;
            
        } catch (error) {
            console.error('Ошибка получения проектов:', error);
            throw error;
        }
    }
    
    async getProjectUsers(projectId){
        try {
            const response = await bitrixService.callMethod('sonet_group.user.get', {
                "ID": projectId,
            });
        
            const userData = this._extractProjects(response);
            console.log("projectUserIds",userData)
            return userData.map(item => item.USER_ID);

        } catch (error) {
            console.error('Ошибка получения проектов:', error);
            throw error;
        }
    }

    async getProjectUsersWithDetails(projectId) {
        try {
            const userIds = await this.getProjectUsers(projectId);
            
            if (!userIds.length) {
                return [];
            }
            
            const allUsers = await userService.getUsers();
            
            const projectUsers = allUsers.filter(user => 
                userIds.includes(user.id.toString())
            );
            
            console.log(`Найдено ${projectUsers.length} участников проекта ${projectId}`);
            return projectUsers;
            
        } catch (error) {
            console.error('Ошибка получения деталей участников проекта:', error);
            throw error;
        }
    }

    _extractProjects(response) {
      if (response.result) return response.result;
      if (Array.isArray(response)) return response;
      return [];
    }
}

export const projectService = new ProjectService();