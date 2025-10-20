/**
 * ProductifyAI Visual Editor Types
 * Type definitions for the visual canvas editor
 */

export type LayerType = "text" | "image" | "video" | "shape" | "container";

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  groupId?: string; // Parent group ID
  isGroup?: boolean; // Is this a group container
  isLocked?: boolean; // Alternative naming for consistency
  isHidden?: boolean; // Alternative naming for consistency
  blur?: number; // Blur effect
  style?: {
    background?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    padding?: number;
    shadow?: string;
  };
  content?: string;
  assetUrl?: string;
  children?: string[]; // IDs of child layers
}

export interface EditorState {
  layers: Layer[];
  selectedLayerIds: string[];
  history: HistoryState[];
  historyIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  tool: Tool;
}

export interface HistoryState {
  layers: Layer[];
  timestamp: number;
}

export type Tool = "select" | "text" | "image" | "video" | "shape" | "hand";

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CanvasViewport {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
}

