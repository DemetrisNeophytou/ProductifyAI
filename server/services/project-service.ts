// ProductifyAI Project Service
import { db } from '../db';
import { projects, pages, blocks, projectBlocks, assets } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Logger } from '../utils/logger';

export interface CreateProjectData {
  userId: string;
  type: string;
  title: string;
  status?: string;
  metadata?: any;
  outline?: any;
  brand?: any;
  canvasData?: string;
}

export interface ProjectWithContent {
  id: string;
  userId: string;
  type: string;
  title: string;
  status: string;
  metadata: any;
  outline: any;
  brand: any;
  coverImageUrl?: string;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
  pages: Array<{
    id: string;
    title: string;
    order: number;
    settings: any;
    blocks: Array<{
      id: string;
      type: string;
      content: any;
      order: number;
      settings: any;
    }>;
  }>;
}

export class ProjectService {
  private static instance: ProjectService;
  private static canvasDataStore: Map<string, any> = new Map();

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  async createProject(data: CreateProjectData): Promise<any> {
    try {
      Logger.info(`Creating project: ${data.title}`);

      // For now, return mock project since database tables don't exist yet
      const mockProject = {
        id: `proj_${Date.now()}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        status: data.status || 'draft',
        metadata: data.metadata || {},
        outline: data.outline || [],
        brand: data.brand || {},
        coverImageUrl: null,
        backgroundColor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Logger.info(`Project created successfully: ${mockProject.id} (mock)`);
      return mockProject;
    } catch (error) {
      Logger.error('Failed to create project', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<any> {
    try {
      // For now, return mock project data
      const mockProject = {
        id: id,
        userId: 'demo-user',
        type: 'ebook',
        title: 'Sample Project',
        status: 'draft',
        metadata: {},
        outline: [],
        brand: {},
        coverImageUrl: null,
        backgroundColor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return mockProject;
    } catch (error) {
      Logger.error('Failed to get project', error);
      throw error;
    }
  }

  async getProjectWithContent(id: string): Promise<ProjectWithContent | null> {
    try {
      // Get project
      const project = await this.getProject(id);
      if (!project) {
        return null;
      }

      // For now, return mock project with content
      const mockProject = {
        ...project,
        pages: [
          {
            id: `page_${id}`,
            title: 'Main Content',
            order: 0,
            settings: {},
            blocks: [
              {
                id: `block_${id}`,
                type: 'heading',
                content: { text: 'Sample Heading', level: 1 },
                order: 0,
                settings: {}
              }
            ]
          }
        ]
      };
      return mockProject;
    } catch (error) {
      Logger.error('Failed to get project with content', error);
      throw error;
    }
  }

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<any> {
    try {
      Logger.info(`Updating project: ${id}`);

      // For now, return mock updated project
      const mockUpdatedProject = {
        id: id,
        userId: 'demo-user',
        type: data.type || 'ebook',
        title: data.title || 'Updated Project',
        status: data.status || 'draft',
        metadata: data.metadata || {},
        outline: data.outline || [],
        brand: data.brand || {},
        canvasData: data.canvasData || null,
        coverImageUrl: null,
        backgroundColor: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If canvasData was provided, save it to project_blocks
      if (data.canvasData) {
        await this.saveCanvasData(id, data.canvasData);
      }

      Logger.info(`Project updated successfully: ${id} (mock)`);
      return mockUpdatedProject;
    } catch (error) {
      Logger.error('Failed to update project', error);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<any[]> {
    try {
      // For now, return mock user projects
      const mockProjects = [
        {
          id: 'proj_1',
          userId: userId,
          type: 'ebook',
          title: 'Sample eBook',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'proj_2',
          userId: userId,
          type: 'course',
          title: 'Sample Course',
          status: 'final',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      return mockProjects;
    } catch (error) {
      Logger.error('Failed to get user projects', error);
      throw error;
    }
  }

  async createProductPages(projectId: string, layout: any): Promise<any[]> {
    try {
      Logger.info(`Creating pages for project: ${projectId}`);

      // For now, return mock pages
      const mockPages = [
        {
          id: `page_${Date.now()}`,
          projectId,
          title: 'Main Content',
          order: 0,
          settings: {
            backgroundColor: '#ffffff',
            layout: 'single-column',
            padding: '2rem'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      if (layout && layout.sections) {
        layout.sections.forEach((section: any, index: number) => {
          mockPages.push({
            id: `page_${Date.now()}_${index}`,
            projectId,
            title: section.title,
            order: index + 1,
            settings: {
              backgroundColor: '#f8fafc',
              layout: 'single-column',
              padding: '1.5rem'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      Logger.info(`Created ${mockPages.length} pages for project: ${projectId} (mock)`);
      return mockPages;
    } catch (error) {
      Logger.error('Failed to create product pages', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      Logger.info(`Deleting project: ${id}`);

      // For now, just return true since we're using mock data
      Logger.info(`Project deleted successfully: ${id} (mock)`);
      return true;
    } catch (error) {
      Logger.error('Failed to delete project', error);
      throw error;
    }
  }

  // Canvas data methods for visual editor
  async saveCanvasData(projectId: string, canvasData: string, isAutoSave: boolean = false): Promise<any> {
    try {
      Logger.info(`Saving canvas data for project: ${projectId}`);

      const mockCanvasData = {
        id: `canvas_${Date.now()}`,
        projectId,
        canvasData: JSON.parse(canvasData),
        version: 1,
        isAutoSave: isAutoSave ? 1 : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in memory for retrieval
      ProjectService.canvasDataStore.set(projectId, mockCanvasData);

      Logger.info(`Canvas data saved successfully for project: ${projectId} (mock)`);
      return mockCanvasData;
    } catch (error) {
      Logger.error('Failed to save canvas data', error);
      throw error;
    }
  }

  async getCanvasData(projectId: string, version?: number): Promise<any> {
    try {
      // Get from memory store
      const canvasData = ProjectService.canvasDataStore.get(projectId);
      Logger.info(`Getting canvas data for project: ${projectId} (mock) - Store size: ${ProjectService.canvasDataStore.size}`);
      Logger.info(`Available keys: ${Array.from(ProjectService.canvasDataStore.keys()).join(', ')}`);
      return canvasData || null;
    } catch (error) {
      Logger.error('Failed to get canvas data', error);
      throw error;
    }
  }

  // Media upload methods
  async saveAsset(userId: string, projectId: string, assetData: {
    type: string;
    url: string;
    filename: string;
    metadata?: any;
  }): Promise<any> {
    try {
      Logger.info(`Saving asset for project: ${projectId}`);

      // For now, return mock asset data
      const mockAsset = {
        id: `asset_${Date.now()}`,
        userId,
        projectId,
        type: assetData.type,
        url: assetData.url,
        filename: assetData.filename,
        metadata: assetData.metadata || {},
        createdAt: new Date()
      };

      Logger.info(`Asset saved successfully: ${mockAsset.id} (mock)`);
      return mockAsset;
    } catch (error) {
      Logger.error('Failed to save asset', error);
      throw error;
    }
  }

  async getProjectAssets(projectId: string): Promise<any[]> {
    try {
      // For now, return mock project assets
      const mockAssets = [
        {
          id: `asset_${projectId}_1`,
          projectId,
          type: 'image',
          url: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          metadata: { size: 1024, mimeType: 'image/jpeg' },
          createdAt: new Date()
        }
      ];
      
      return mockAssets;
    } catch (error) {
      Logger.error('Failed to get project assets', error);
      throw error;
    }
  }
}


