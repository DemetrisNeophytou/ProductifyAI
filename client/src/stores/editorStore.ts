/**
 * ProductifyAI Editor Store
 * Zustand store for managing canvas state, layers, and history
 */

import { create } from 'zustand';
import type { Layer, Tool, HistoryState } from '@/types/editor';

interface EditorStore {
  // State
  layers: Layer[];
  selectedLayerIds: string[];
  history: HistoryState[];
  historyIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  tool: Tool;
  
  // Actions
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  selectLayer: (id: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  duplicateLayer: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  layers: [],
  selectedLayerIds: [],
  history: [],
  historyIndex: -1,
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridEnabled: true,
  snapEnabled: true,
  tool: 'select',

  // Add layer
  addLayer: (layer) => {
    set((state) => {
      const newLayers = [...state.layers, layer];
      return { layers: newLayers };
    });
    get().saveHistory();
  },

  // Update layer
  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    }));
  },

  // Delete layer
  deleteLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== id),
      selectedLayerIds: state.selectedLayerIds.filter((selectedId) => selectedId !== id),
    }));
    get().saveHistory();
  },

  // Select layer
  selectLayer: (id, addToSelection = false) => {
    set((state) => {
      if (addToSelection) {
        const isSelected = state.selectedLayerIds.includes(id);
        return {
          selectedLayerIds: isSelected
            ? state.selectedLayerIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedLayerIds, id],
        };
      }
      return { selectedLayerIds: [id] };
    });
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedLayerIds: [] });
  },

  // Set tool
  setTool: (tool) => {
    set({ tool });
  },

  // Set zoom
  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  // Set pan
  setPan: (pan) => {
    set({ pan });
  },

  // Toggle grid
  toggleGrid: () => {
    set((state) => ({ gridEnabled: !state.gridEnabled }));
  },

  // Toggle snap
  toggleSnap: () => {
    set((state) => ({ snapEnabled: !state.snapEnabled }));
  },

  // Save history
  saveHistory: () => {
    set((state) => {
      const { layers, history, historyIndex } = state;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ layers: JSON.parse(JSON.stringify(layers)), timestamp: Date.now() });
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  // Undo
  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          layers: JSON.parse(JSON.stringify(state.history[newIndex].layers)),
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  // Redo
  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          layers: JSON.parse(JSON.stringify(state.history[newIndex].layers)),
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  // Duplicate layer
  duplicateLayer: (id) => {
    const state = get();
    const layer = state.layers.find((l) => l.id === id);
    if (layer) {
      const newLayer: Layer = {
        ...JSON.parse(JSON.stringify(layer)),
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${layer.name} (Copy)`,
        x: layer.x + 20,
        y: layer.y + 20,
      };
      state.addLayer(newLayer);
      state.selectLayer(newLayer.id);
    }
  },

  // Bring to front
  bringToFront: (id) => {
    set((state) => {
      const maxZIndex = Math.max(...state.layers.map((l) => l.zIndex), 0);
      return {
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, zIndex: maxZIndex + 1 } : layer
        ),
      };
    });
    get().saveHistory();
  },

  // Send to back
  sendToBack: (id) => {
    set((state) => {
      const minZIndex = Math.min(...state.layers.map((l) => l.zIndex), 0);
      return {
        layers: state.layers.map((layer) =>
          layer.id === id ? { ...layer, zIndex: minZIndex - 1 } : layer
        ),
      };
    });
    get().saveHistory();
  },
}));

