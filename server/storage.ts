import {
  users,
  products_old,
  brandKits,
  projects,
  sections,
  assets,
  projectVersions,
  type User,
  type UpsertUser,
  type BrandKit,
  type InsertBrandKit,
  type Project,
  type InsertProject,
  type Section,
  type InsertSection,
  type Asset,
  type InsertAsset,
  type ProjectVersion,
  type InsertProjectVersion,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Brand Kit operations
  getBrandKit(userId: string): Promise<BrandKit | undefined>;
  upsertBrandKit(brandKit: InsertBrandKit): Promise<BrandKit>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string, userId: string): Promise<Project>;
  
  // Section operations
  createSection(section: InsertSection): Promise<Section>;
  getSection(id: string): Promise<Section | undefined>;
  getProjectSections(projectId: string): Promise<Section[]>;
  updateSection(id: string, data: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: string): Promise<void>;
  reorderSections(projectId: string, sectionIds: string[]): Promise<void>;
  
  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAsset(id: string): Promise<Asset | undefined>;
  getUserAssets(userId: string): Promise<Asset[]>;
  getProjectAssets(projectId: string): Promise<Asset[]>;
  deleteAsset(id: string): Promise<void>;
  
  // Version operations
  createVersion(version: InsertProjectVersion): Promise<ProjectVersion>;
  getProjectVersions(projectId: string, limit?: number): Promise<ProjectVersion[]>;
  restoreVersion(versionId: string): Promise<Project>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Brand Kit operations
  async getBrandKit(userId: string): Promise<BrandKit | undefined> {
    const [brandKit] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.userId, userId));
    return brandKit;
  }

  async upsertBrandKit(brandKitData: InsertBrandKit): Promise<BrandKit> {
    const [brandKit] = await db
      .insert(brandKits)
      .values(brandKitData)
      .onConflictDoUpdate({
        target: brandKits.userId,
        set: {
          logoUrl: brandKitData.logoUrl,
          primaryColor: brandKitData.primaryColor,
          secondaryColor: brandKitData.secondaryColor,
          fonts: brandKitData.fonts,
          toneOfVoice: brandKitData.toneOfVoice,
          updatedAt: new Date(),
        },
      })
      .returning();
    return brandKit;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async duplicateProject(id: string, userId: string): Promise<Project> {
    const original = await this.getProject(id);
    if (!original) throw new Error("Project not found");

    const projectSections = await this.getProjectSections(id);

    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          userId,
          type: original.type,
          title: `${original.title} (Copy)`,
          status: "draft",
          metadata: original.metadata,
          coverImageUrl: original.coverImageUrl,
          backgroundColor: original.backgroundColor,
        })
        .returning();

      for (const section of projectSections) {
        await tx.insert(sections).values({
          projectId: newProject.id,
          type: section.type,
          title: section.title,
          content: section.content,
          order: section.order,
        });
      }

      return newProject;
    });
  }

  // Section operations
  async createSection(section: InsertSection): Promise<Section> {
    const [newSection] = await db.insert(sections).values(section).returning();
    return newSection;
  }

  async getSection(id: string): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.id, id));
    return section;
  }

  async getProjectSections(projectId: string): Promise<Section[]> {
    return await db
      .select()
      .from(sections)
      .where(eq(sections.projectId, projectId))
      .orderBy(sections.order);
  }

  async updateSection(id: string, data: Partial<InsertSection>): Promise<Section> {
    const [updated] = await db
      .update(sections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sections.id, id))
      .returning();
    return updated;
  }

  async deleteSection(id: string): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }

  async reorderSections(projectId: string, sectionIds: string[]): Promise<void> {
    // Use transaction to ensure all updates succeed or fail together
    await db.transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await tx
          .update(sections)
          .set({ order: i })
          .where(eq(sections.id, sectionIds[i]));
      }
    });
  }

  // Asset operations
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getUserAssets(userId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId))
      .orderBy(desc(assets.createdAt));
  }

  async getProjectAssets(projectId: string): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.projectId, projectId!))
      .orderBy(desc(assets.createdAt));
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Version operations
  async createVersion(version: InsertProjectVersion): Promise<ProjectVersion> {
    // Get the next version number for this project
    const versions = await this.getProjectVersions(version.projectId, 1);
    const versionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;
    
    const [newVersion] = await db
      .insert(projectVersions)
      .values({ ...version, versionNumber })
      .returning();
    return newVersion;
  }

  async getProjectVersions(projectId: string, limit = 10): Promise<ProjectVersion[]> {
    return await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.createdAt))
      .limit(limit);
  }

  async restoreVersion(versionId: string): Promise<Project> {
    const [version] = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.id, versionId));
    
    if (!version) throw new Error("Version not found");
    
    const snapshot = version.snapshot as any;
    
    // Use transaction to ensure atomicity when restoring project and sections
    return await db.transaction(async (tx) => {
      const [restored] = await tx
        .update(projects)
        .set({
          ...snapshot.project,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, version.projectId))
        .returning();

      // If snapshot contains sections, restore them as well
      if (snapshot.sections && Array.isArray(snapshot.sections)) {
        // Delete existing sections
        await tx.delete(sections).where(eq(sections.projectId, version.projectId));
        
        // Restore sections from snapshot
        for (const section of snapshot.sections) {
          await tx.insert(sections).values({
            projectId: version.projectId,
            type: section.type,
            title: section.title,
            content: section.content,
            order: section.order,
          });
        }
      }

      return restored;
    });
  }
}

export const storage = new DatabaseStorage();
