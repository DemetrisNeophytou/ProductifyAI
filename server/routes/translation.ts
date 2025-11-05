/**
 * Translation Routes
 * Handles project translation to different locales
 */

import { Router } from "express";
import { db } from "../db";
import { projects, projectBlocks } from "../schema";
import { eq, and } from "drizzle-orm";
import { validateTranslationRequest } from "../../shared/multilingual-dtos";

const router = Router();

// POST /api/projects/:id/translate - Translate project to target locale
router.post("/:id/translate", async (req, res) => {
  try {
    const projectId = req.params.id;
    const { to, force = false } = req.query;

    // Validate request
    const validation = validateTranslationRequest({ to, force });
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`
      });
    }

    const { to: targetLocale, force: forceUpdate } = validation.data!;

    // Check if project exists
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Check if translation already exists
    const existingTranslation = await db.select()
      .from(projectBlocks)
      .where(and(
        eq(projectBlocks.projectId, projectId),
        eq(projectBlocks.locale, targetLocale)
      ));

    if (existingTranslation.length > 0 && !forceUpdate) {
      return res.status(409).json({
        ok: false,
        error: "Translation already exists. Use ?force=true to overwrite."
      });
    }

    // Get original blocks (English)
    const originalBlocks = await db.select()
      .from(projectBlocks)
      .where(and(
        eq(projectBlocks.projectId, projectId),
        eq(projectBlocks.locale, "en")
      ))
      .orderBy(projectBlocks.order);

    if (originalBlocks.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No original content found to translate"
      });
    }

    // Delete existing translation if force update
    if (forceUpdate && existingTranslation.length > 0) {
      await db.delete(projectBlocks)
        .where(and(
          eq(projectBlocks.projectId, projectId),
          eq(projectBlocks.locale, targetLocale)
        ));
    }

    // Translate blocks (mock implementation - would use translation service)
    const translatedBlocks = await translateBlocks(originalBlocks, targetLocale);

    // Insert translated blocks
    await db.insert(projectBlocks).values(translatedBlocks);

    res.status(201).json({
      ok: true,
      data: {
        projectId,
        from: "en",
        to: targetLocale,
        blocks: translatedBlocks.map(block => ({
          id: block.id,
          content: block.content,
          locale: block.locale,
          originalId: block.originalId
        }))
      }
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to translate project"
    });
  }
});

// Mock translation function
async function translateBlocks(blocks: any[], targetLocale: string): Promise<any[]> {
  // This would integrate with a real translation service like Google Translate, DeepL, etc.
  const translations: Record<string, Record<string, string>> = {
    'es': {
      'Introduction': 'Introducción',
      'Overview': 'Resumen',
      'Key Concepts': 'Conceptos Clave',
      'Practical Tips': 'Consejos Prácticos',
      'Conclusion': 'Conclusión',
      'Welcome to this comprehensive guide': 'Bienvenido a esta guía completa',
      'Here are the key principles': 'Aquí están los principios clave',
      'Here are some actionable tips': 'Aquí hay algunos consejos prácticos',
      'Congratulations! You now have': '¡Felicidades! Ahora tienes'
    },
    'fr': {
      'Introduction': 'Introduction',
      'Overview': 'Aperçu',
      'Key Concepts': 'Concepts Clés',
      'Practical Tips': 'Conseils Pratiques',
      'Conclusion': 'Conclusion',
      'Welcome to this comprehensive guide': 'Bienvenue dans ce guide complet',
      'Here are the key principles': 'Voici les principes clés',
      'Here are some actionable tips': 'Voici quelques conseils pratiques',
      'Congratulations! You now have': 'Félicitations! Vous avez maintenant'
    },
    'de': {
      'Introduction': 'Einführung',
      'Overview': 'Überblick',
      'Key Concepts': 'Schlüsselkonzepte',
      'Practical Tips': 'Praktische Tipps',
      'Conclusion': 'Fazit',
      'Welcome to this comprehensive guide': 'Willkommen zu diesem umfassenden Leitfaden',
      'Here are the key principles': 'Hier sind die wichtigsten Prinzipien',
      'Here are some actionable tips': 'Hier sind einige umsetzbare Tipps',
      'Congratulations! You now have': 'Herzlichen Glückwunsch! Sie haben jetzt'
    }
  };

  const localeTranslations = translations[targetLocale] || {};

  return blocks.map(block => {
    const translatedContent = { ...block.content };
    
    // Translate text content
    if (translatedContent.text) {
      let translatedText = translatedContent.text;
      
      // Simple word/phrase replacement (in production, use proper translation API)
      Object.entries(localeTranslations).forEach(([original, translated]) => {
        translatedText = translatedText.replace(new RegExp(original, 'gi'), translated);
      });
      
      translatedContent.text = translatedText;
    }

    return {
      id: `translated_${block.id}_${targetLocale}`,
      projectId: block.projectId,
      type: block.type,
      content: translatedContent,
      order: block.order,
      section: block.section,
      locale: targetLocale,
      originalId: block.id,
      settings: block.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
}

export default router;
