import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';

interface ExportSection {
  title: string;
  content: string;
  order: number;
}

interface ExportProject {
  title: string;
  type: string;
  description?: string | null;
  sections: ExportSection[];
}

export async function generateDOCX(project: ExportProject): Promise<Buffer> {
  const children: Paragraph[] = [];
  
  children.push(
    new Paragraph({
      text: project.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  if (project.description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: project.description })],
        spacing: { after: 400 }
      })
    );
  }
  
  const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
  
  for (const section of sortedSections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );
    
    if (section.content) {
      const cleanContent = section.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      
      const paragraphs = cleanContent.split('\n').filter(p => p.trim());
      
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: para })],
            spacing: { after: 200 }
          })
        );
      }
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


