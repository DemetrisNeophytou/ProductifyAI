/**
 * Video Builder Contracts
 * Type definitions and interfaces for AI-powered video generation
 */

export interface VideoGenerationRequest {
  script: string;
  productId?: string;
  type: 'promo' | 'tutorial' | 'explainer' | 'social' | 'presentation';
  duration?: number; // in seconds
  style: 'modern' | 'energetic' | 'professional' | 'creative' | 'minimal';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  includeSubtitles?: boolean;
  includeBackgroundMusic?: boolean;
  voiceOver?: {
    enabled: boolean;
    voice: 'male' | 'female' | 'neutral';
    speed: number;
    pitch: number;
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export interface VideoGenerationResponse {
  ok: boolean;
  data?: {
    videoId: string;
    status: 'processing' | 'completed' | 'failed';
    scenes: VideoScene[];
    metadata: VideoMetadata;
    estimatedCompletion?: string;
    downloadUrl?: string;
    previewUrl?: string;
  };
  error?: string;
}

export interface VideoScene {
  id: string;
  order: number;
  duration: number;
  startTime: number;
  endTime: number;
  content: {
    text: string;
    visualPrompt: string;
    audioScript: string;
  };
  visuals: {
    background: string;
    elements: VisualElement[];
    transitions: Transition[];
  };
  audio: {
    voiceOver?: AudioTrack;
    backgroundMusic?: AudioTrack;
    soundEffects?: AudioTrack[];
  };
  metadata: {
    complexity: 'low' | 'medium' | 'high';
    style: string;
    mood: string;
    colors: string[];
  };
}

export interface VisualElement {
  id: string;
  type: 'text' | 'image' | 'icon' | 'shape' | 'logo' | 'chart' | 'animation';
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
    opacity?: number;
    animation?: Animation;
  };
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve' | 'none';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface Animation {
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'zoomIn' | 'zoomOut' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
  iterationCount: number | 'infinite';
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface AudioTrack {
  id: string;
  type: 'voice' | 'music' | 'effect';
  url: string;
  duration: number;
  volume: number;
  startTime: number;
  endTime: number;
  metadata: {
    title?: string;
    artist?: string;
    genre?: string;
    bpm?: number;
  };
}

export interface VideoMetadata {
  totalDuration: number;
  sceneCount: number;
  aspectRatio: string;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
  format: 'mp4' | 'mov' | 'avi' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fileSize: number;
  processingTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  type: 'promo' | 'tutorial' | 'explainer' | 'social' | 'presentation';
  style: string;
  aspectRatio: string;
  duration: number;
  structure: {
    intro: SceneTemplate;
    content: SceneTemplate[];
    outro: SceneTemplate;
  };
  branding: {
    colors: string[];
    fonts: string[];
    logo: string;
    style: string;
  };
  metadata: {
    category: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
  };
}

export interface SceneTemplate {
  id: string;
  type: 'intro' | 'content' | 'outro' | 'transition';
  duration: number;
  layout: {
    background: string;
    elements: VisualElement[];
    transitions: Transition[];
  };
  audio: {
    voiceOver: boolean;
    backgroundMusic: boolean;
    soundEffects: string[];
  };
  prompts: {
    visual: string;
    audio: string;
    text: string;
  };
}

export interface VideoBuilderConfig {
  rendering: {
    engine: 'remotion' | 'ffmpeg' | 'after-effects';
    quality: string;
    format: string;
    frameRate: number;
    bitrate: number;
  };
  ai: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
    imageModel: 'dall-e-3' | 'midjourney' | 'stable-diffusion';
    voiceModel: 'elevenlabs' | 'azure' | 'aws-polly';
  };
  storage: {
    provider: 'supabase' | 'aws-s3' | 'cloudinary';
    bucket: string;
    region: string;
  };
  limits: {
    maxDuration: number;
    maxScenes: number;
    maxFileSize: number;
    maxConcurrentRenders: number;
  };
}

export interface VideoBuilderService {
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  generateScenes(script: string, style: string): Promise<VideoScene[]>;
  generateVisualPrompts(scene: VideoScene): Promise<string[]>;
  renderVideo(scenes: VideoScene[], config: VideoBuilderConfig): Promise<string>;
  getVideoStatus(videoId: string): Promise<VideoGenerationResponse>;
  getTemplates(type: string): Promise<VideoTemplate[]>;
  getBuilderConfig(): Promise<VideoBuilderConfig>;
  validateRequest(request: VideoGenerationRequest): { valid: boolean; errors: string[] };
  estimateRenderTime(scenes: VideoScene[]): Promise<number>;
  getVideoPreview(videoId: string): Promise<string>;
}
