/**
 * ProductifyAI Storage Utilities
 * LocalStorage persistence for editor state
 */

import type { Layer } from '@/types/editor';

const STORAGE_PREFIX = 'productifyai_';
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;

export interface ProjectState {
  projectId: string;
  layers: Layer[];
  zoom: number;
  pan: { x: number; y: number };
  lastSaved: string;
}

/**
 * Save project state to localStorage
 */
export function saveProjectState(projectId: string, state: Omit<ProjectState, 'projectId' | 'lastSaved'>): void {
  try {
    const projectState: ProjectState = {
      projectId,
      ...state,
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem(`${STORAGE_PREFIX}project_${projectId}`, JSON.stringify(projectState));
    localStorage.setItem(AUTOSAVE_KEY, projectId); // Track last edited project
  } catch (error) {
    console.error('Failed to save project state:', error);
  }
}

/**
 * Load project state from localStorage
 */
export function loadProjectState(projectId: string): ProjectState | null {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}project_${projectId}`);
    
    if (!data) return null;
    
    const state = JSON.parse(data) as ProjectState;
    
    // Validate basic structure
    if (!Array.isArray(state.layers)) return null;
    
    return state;
  } catch (error) {
    console.error('Failed to load project state:', error);
    return null;
  }
}

/**
 * Clear project state from localStorage
 */
export function clearProjectState(projectId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}project_${projectId}`);
  } catch (error) {
    console.error('Failed to clear project state:', error);
  }
}

/**
 * Get last edited project ID
 */
export function getLastEditedProject(): string | null {
  try {
    return localStorage.getItem(AUTOSAVE_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Get all saved project IDs
 */
export function getAllSavedProjects(): string[] {
  try {
    const keys = Object.keys(localStorage);
    const projectKeys = keys.filter(key => key.startsWith(`${STORAGE_PREFIX}project_`));
    
    return projectKeys.map(key => key.replace(`${STORAGE_PREFIX}project_`, ''));
  } catch (error) {
    return [];
  }
}

/**
 * Export project as JSON
 */
export function exportProjectJSON(projectId: string, state: ProjectState): void {
  try {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `productifyai-project-${projectId}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export project:', error);
  }
}

/**
 * Import project from JSON file
 */
export function importProjectJSON(file: File): Promise<ProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const state = JSON.parse(json) as ProjectState;
        
        // Validate structure
        if (!Array.isArray(state.layers)) {
          reject(new Error('Invalid project file'));
          return;
        }
        
        resolve(state);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

