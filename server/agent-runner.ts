import { storage } from "./storage";
import { nanoid } from "nanoid";
import {
  AgentRunRequest,
  AgentRunResponse,
  AGENT_PRICING,
  type AgentName,
} from "@shared/agent-types";
import type { InsertAgentJob } from "@shared/schema";

type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export class AgentRunner {
  async estimateCredits(agentName: AgentName): Promise<number> {
    switch (agentName) {
      case "idea_finder":
      case "offer_crafter":
      case "outline_builder":
        return AGENT_PRICING[agentName].min;
      case "content_writer":
        return AGENT_PRICING.content_writer.min;
      case "image_agent":
        return AGENT_PRICING.image_agent.search;
      case "video_agent":
        return AGENT_PRICING.video_agent.min;
      case "analytics_agent":
      case "ai_coach":
        return AGENT_PRICING[agentName].min;
      default:
        return 1;
    }
  }

  async runAgent(
    userId: string,
    agentName: AgentName,
    input: any,
    projectId?: string,
    skipCreditCheck: boolean = false
  ): Promise<AgentRunResponse> {
    const jobId = nanoid();
    const estimatedCredits = await this.estimateCredits(agentName);
    
    if (!skipCreditCheck) {
      const userCredits = await storage.getUserCredits(userId);
      
      if (userCredits < estimatedCredits) {
        return {
          jobId,
          status: "failed",
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: `Insufficient credits. Need ${estimatedCredits}, have ${userCredits}`,
          },
          estimatedCredits,
        };
      }
    }

    const job: InsertAgentJob = {
      id: jobId,
      userId,
      projectId: projectId || null,
      agentName,
      input: input as any,
      status: "queued",
      estimatedCredits,
      consumedCredits: null,
      steps: [],
    };

    await storage.createAgentJob(job);

    this.executeAgent(jobId, userId, agentName, input).catch(async (error) => {
      console.error(`Agent job ${jobId} failed:`, error);
      await storage.updateAgentJob(jobId, {
        status: "failed",
        error: { code: "EXECUTION_ERROR", message: error.message },
      });
    });

    return {
      jobId,
      status: "queued",
      estimatedCredits,
    };
  }

  private async executeAgent(
    jobId: string,
    userId: string,
    agentName: AgentName,
    input: any
  ): Promise<void> {
    await this.updateJobStatus(jobId, "running");
    
    const steps: Array<{ at: string; message: string }> = [];
    let consumedCredits = 0;

    try {
      switch (agentName) {
        case "content_writer":
          const result = await this.executeContentWriter(jobId, input, steps);
          consumedCredits = AGENT_PRICING.content_writer.min;
          await this.completeJob(jobId, userId, result, consumedCredits, steps);
          break;
          
        case "image_agent":
          const imageResult = await this.executeImageAgent(jobId, input, steps);
          consumedCredits = 1;
          await this.completeJob(jobId, userId, imageResult, consumedCredits, steps);
          break;
          
        default:
          throw new Error(`Agent type ${agentName} not implemented yet`);
      }
    } catch (error: any) {
      await storage.updateAgentJob(jobId, {
        status: "failed",
        error: { code: "EXECUTION_ERROR", message: error.message },
        steps,
      });
      throw error;
    }
  }

  private async executeContentWriter(
    jobId: string,
    input: any,
    steps: Array<{ at: string; message: string }>
  ): Promise<any> {
    steps.push({
      at: new Date().toISOString(),
      message: "Validating input",
    });

    if (!input.blockId || !input.operation) {
      throw new Error("blockId and operation are required");
    }

    steps.push({
      at: new Date().toISOString(),
      message: "Fetching block content",
    });

    const block = await storage.getBlock(input.blockId);
    if (!block) {
      throw new Error("Block not found");
    }

    const content = typeof block.content === 'string' 
      ? block.content 
      : JSON.stringify(block.content);

    steps.push({
      at: new Date().toISOString(),
      message: "Processing content with AI",
    });

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompts: Record<string, string> = {
      polish: "Polish and refine the following content while maintaining its core message:",
      improve: "Improve the quality and clarity of the following content:",
      shorten: "Condense the following content while keeping the key points:",
      expand: "Expand the following content with more detail and examples:",
      translate: `Translate the following content to ${input.targetLang || 'Spanish'}:`,
    };

    const prompt = prompts[input.operation] || prompts.improve;
    const systemMessage = input.tone 
      ? `You are a professional content writer. Write in a ${input.tone} tone. Return only the improved content without explanations.`
      : "You are a professional content writer. Return only the improved content without explanations.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: `${prompt}\n\n${content}${input.context ? `\n\nContext: ${input.context}` : ''}`,
        },
      ],
      temperature: 0.7,
      max_tokens: input.maxTokens || 1000,
    });

    const improvedContent = completion.choices[0]?.message?.content || content;

    steps.push({
      at: new Date().toISOString(),
      message: "Updating block with new content",
    });

    let newBlockContent: any;
    if (block.type === 'paragraph') {
      newBlockContent = { text: improvedContent };
    } else if (block.type === 'heading' && typeof block.content === 'object' && 'level' in block.content) {
      newBlockContent = { text: improvedContent, level: block.content.level };
    } else {
      newBlockContent = improvedContent;
    }

    await storage.updateBlock(input.blockId, {
      content: newBlockContent as any,
    });

    steps.push({
      at: new Date().toISOString(),
      message: `Content ${input.operation} completed`,
    });

    return {
      blockId: input.blockId,
      newText: improvedContent,
    };
  }

  private async executeImageAgent(
    jobId: string,
    input: any,
    steps: Array<{ at: string; message: string }>
  ): Promise<any> {
    steps.push({
      at: new Date().toISOString(),
      message: "Validating input",
    });

    if (!input.sectionId || !input.mode) {
      throw new Error("sectionId and mode are required for image agent");
    }

    if (input.mode === "generate") {
      steps.push({
        at: new Date().toISOString(),
        message: "Generating image with DALL-E",
      });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      if (!input.query) {
        throw new Error("query is required for image generation");
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: input.query,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data?.[0]?.url || "";

      steps.push({
        at: new Date().toISOString(),
        message: "Image generation completed",
      });

      return {
        sectionId: input.sectionId,
        images: [{
          url: imageUrl,
          width: 1024,
          height: 1024,
          source: "ai" as const,
          alt: input.query,
        }],
        selectedIndex: 0,
      };
    } else if (input.mode === "search") {
      steps.push({
        at: new Date().toISOString(),
        message: `Searching ${input.license} for images`,
      });

      steps.push({
        at: new Date().toISOString(),
        message: "Stock image search not yet implemented",
      });

      return {
        sectionId: input.sectionId,
        images: [],
        selectedIndex: 0,
      };
    } else if (input.mode === "upload") {
      throw new Error("Upload mode should be handled by the frontend");
    }

    throw new Error(`Unknown image mode: ${input.mode}`);
  }

  private async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    await storage.updateAgentJob(jobId, {
      status,
    });
  }

  private async completeJob(
    jobId: string,
    userId: string,
    output: any,
    consumedCredits: number,
    steps: Array<{ at: string; message: string }>
  ): Promise<void> {
    await storage.deductCredits(
      userId,
      consumedCredits,
      "agent_execution",
      `Agent job ${jobId}`
    );

    await storage.updateAgentJob(jobId, {
      status: "succeeded",
      output: output as any,
      consumedCredits,
      steps,
      completedAt: new Date(),
    });
  }

  async getJobStatus(jobId: string): Promise<AgentRunResponse> {
    const job = await storage.getAgentJob(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    return {
      jobId: job.id,
      status: job.status as JobStatus,
      output: job.output,
      error: job.error || undefined,
      estimatedCredits: job.estimatedCredits || undefined,
      consumedCredits: job.consumedCredits || undefined,
      steps: job.steps || undefined,
    };
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await storage.getAgentJob(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status === "succeeded" || job.status === "failed") {
      throw new Error("Cannot cancel a completed or failed job");
    }

    await storage.updateAgentJob(jobId, {
      status: "cancelled",
    });
  }
}

export const agentRunner = new AgentRunner();
