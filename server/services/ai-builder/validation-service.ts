/**
 * Validation Service
 * Handles validation for AI product generation requests
 */

import { AIProductRequest } from '../../../shared/ai-builder-contracts';

export class ValidationService {
  validateRequest(request: AIProductRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!request.idea || request.idea.trim().length === 0) {
      errors.push('Idea is required');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!request.productType || !['eBook', 'course', 'template', 'video-pack'].includes(request.productType)) {
      errors.push('Valid product type is required');
    }

    // Validate idea length
    if (request.idea && request.idea.length > 1000) {
      errors.push('Idea is too long (max 1000 characters)');
    }

    // Validate optional fields
    if (request.niche && request.niche.length > 100) {
      errors.push('Niche is too long (max 100 characters)');
    }

    if (request.targetAudience && request.targetAudience.length > 200) {
      errors.push('Target audience is too long (max 200 characters)');
    }

    if (request.tone && !['professional', 'casual', 'friendly', 'authoritative'].includes(request.tone)) {
      errors.push('Invalid tone specified');
    }

    if (request.length && !['short', 'medium', 'long'].includes(request.length)) {
      errors.push('Invalid length specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}


