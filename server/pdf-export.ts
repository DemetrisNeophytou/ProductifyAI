import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ExportSection {
  title: string;
  content: string;
  order: number;
}

interface BrandKit {
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: {
    heading?: string;
    body?: string;
  };
}

interface ExportProject {
  title: string;
  type: string;
  description?: string | null;
  sections: ExportSection[];
  brandKit?: BrandKit;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.545, g: 0.361, b: 0.965 };
}

export async function generatePDF(project: ExportProject): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const primaryColor = project.brandKit?.primaryColor 
    ? hexToRgb(project.brandKit.primaryColor)
    : { r: 0.545, g: 0.361, b: 0.965 };
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  const titleSize = 24;
  const headingSize = 18;
  const bodySize = 12;
  const lineHeight = 1.5;
  
  const drawText = (text: string, font: any, size: number, bold: boolean = false) => {
    const lines = wrapText(text, contentWidth, font, size);
    
    for (const line of lines) {
      if (yPosition < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
      
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size,
        font: bold ? timesRomanBold : font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= size * lineHeight;
    }
  };
  
  page.drawText(project.title, {
    x: margin,
    y: yPosition,
    size: titleSize,
    font: timesRomanBold,
    color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
  });
  yPosition -= titleSize * lineHeight + 10;
  
  if (project.description) {
    drawText(project.description, timesRomanFont, bodySize);
    yPosition -= 20;
  } else {
    yPosition -= 10;
  }
  
  const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
  
  for (const section of sortedSections) {
    if (yPosition < margin + 100) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }
    
    yPosition -= 20;
    drawText(section.title, timesRomanBold, headingSize, true);
    yPosition -= 10;
    
    if (section.content) {
      const cleanContent = section.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      
      drawText(cleanContent, timesRomanFont, bodySize);
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
