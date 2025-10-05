import { storage } from './storage';

interface RenderJob {
  projectId: string;
  userId: string;
  startedAt: number;
}

// Simple in-memory queue for MVP
class VideoRenderQueue {
  private queue: RenderJob[] = [];
  private processing: boolean = false;

  async addJob(projectId: string, userId: string) {
    this.queue.push({
      projectId,
      userId,
      startedAt: Date.now(),
    });

    console.log(`[VideoQueue] Added job for project ${projectId}. Queue length: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        await this.processJob(job);
      }
    }

    this.processing = false;
  }

  private async processJob(job: RenderJob) {
    const { projectId, userId } = job;

    try {
      console.log(`[VideoQueue] Starting render for project ${projectId}`);

      // Simulate video rendering process
      // In a real implementation, this would:
      // 1. Download video clips
      // 2. Composite them together
      // 3. Add captions/subtitles
      // 4. Add music
      // 5. Export to MP4
      // 6. Upload to storage (S3, etc.)
      
      // For MVP, simulate rendering time (3-10 seconds based on complexity)
      const renderTime = Math.random() * 7000 + 3000;
      await new Promise(resolve => setTimeout(resolve, renderTime));

      // Update project status to completed
      await storage.updateVideoProject(projectId, {
        status: 'completed',
        outputUrl: `https://example.com/videos/${projectId}.mp4`, // Placeholder URL
      });

      console.log(`[VideoQueue] Completed render for project ${projectId} in ${Math.round(renderTime / 1000)}s`);

    } catch (error: any) {
      console.error(`[VideoQueue] Error rendering project ${projectId}:`, error);

      // Mark as failed
      try {
        await storage.updateVideoProject(projectId, {
          status: 'failed',
        });
      } catch (updateError) {
        console.error(`[VideoQueue] Error updating failed status for ${projectId}:`, updateError);
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

// Singleton instance
export const videoRenderQueue = new VideoRenderQueue();
