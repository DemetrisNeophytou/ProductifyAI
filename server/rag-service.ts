import fs from 'fs';
import path from 'path';

interface RAGDocument {
  filename: string;
  category: string;
  content: string;
  sections: {
    heading: string;
    text: string;
  }[];
}

class RAGService {
  private documents: RAGDocument[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    const ragBasePath = path.join(process.cwd(), 'data', 'rag');
    const categories = ['recipes', 'design'];

    for (const category of categories) {
      const categoryPath = path.join(ragBasePath, category);
      
      if (!fs.existsSync(categoryPath)) {
        console.warn(`RAG category path not found: ${categoryPath}`);
        continue;
      }

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Parse markdown into sections
        const sections = this.parseMarkdownSections(content);

        this.documents.push({
          filename: file.replace('.md', ''),
          category,
          content,
          sections
        });
      }
    }

    this.initialized = true;
    console.log(`RAG initialized with ${this.documents.length} documents`);
  }

  private parseMarkdownSections(content: string) {
    const sections: { heading: string; text: string }[] = [];
    const lines = content.split('\n');
    let currentHeading = '';
    let currentText: string[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentHeading) {
          sections.push({
            heading: currentHeading,
            text: currentText.join('\n').trim()
          });
        }
        currentHeading = line.replace('# ', '').trim();
        currentText = [];
      } else {
        currentText.push(line);
      }
    }

    // Push the last section
    if (currentHeading) {
      sections.push({
        heading: currentHeading,
        text: currentText.join('\n').trim()
      });
    }

    return sections;
  }

  async retrieveContext(query: string, options: { k?: number; category?: string } = {}): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const k = options.k || 3;
    const queryLower = query.toLowerCase();
    
    // Simple keyword-based scoring
    const scored = this.documents
      .filter(doc => !options.category || doc.category === options.category)
      .flatMap(doc => 
        doc.sections.map(section => ({
          doc,
          section,
          score: this.scoreMatch(queryLower, doc, section)
        }))
      )
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    if (scored.length === 0) {
      return "No recipe context found.";
    }

    // Format the top results
    const contextParts = scored.map(item => {
      const {doc, section} = item;
      return `### ${doc.filename} - ${section.heading}\n${section.text.substring(0, 500)}...`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  private scoreMatch(query: string, doc: RAGDocument, section: { heading: string; text: string }): number {
    let score = 0;
    const queryTerms = query.split(/\s+/).filter(t => t.length > 2);

    for (const term of queryTerms) {
      // Filename match (high weight)
      if (doc.filename.toLowerCase().includes(term)) {
        score += 10;
      }

      // Heading match (medium weight)
      if (section.heading.toLowerCase().includes(term)) {
        score += 5;
      }

      // Content match (low weight)
      const contentLower = section.text.toLowerCase();
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.5;
    }

    return score;
  }

  getAvailableRecipes(): string[] {
    return this.documents
      .filter(doc => doc.category === 'recipes')
      .map(doc => doc.filename);
  }

  getAvailableDesignGuides(): string[] {
    return this.documents
      .filter(doc => doc.category === 'design')
      .map(doc => doc.filename);
  }
}

// Singleton instance
export const ragService = new RAGService();
