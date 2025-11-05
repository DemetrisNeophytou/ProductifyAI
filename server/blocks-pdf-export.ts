import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';

export interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'cta' | 'list' | 'quote' | 'table';
  content: any;
  order: number;
}

export interface Page {
  id: string;
  title: string;
  blocks: Block[];
}

export interface ExportData {
  projectTitle: string;
  pages: Page[];
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
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

function extractTextFromContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  if (content.text) return content.text;
  
  if (Array.isArray(content.items)) {
    return content.items.map((item: string) => `• ${item}`).join('\n');
  }
  
  return JSON.stringify(content);
}

export async function generateBlocksPDF(data: ExportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const primaryColor = data.brandKit?.primaryColor 
    ? hexToRgb(data.brandKit.primaryColor)
    : { r: 0.545, g: 0.361, b: 0.965 };
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  const sizes = {
    title: 28,
    heading1: 24,
    heading2: 20,
    heading3: 18,
    body: 12,
    quote: 14,
    cta: 16,
  };
  
  const lineHeight = 1.5;
  
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition < margin + requiredSpace) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      return true;
    }
    return false;
  };
  
  const drawText = (text: string, font: any, size: number, color = rgb(0, 0, 0)) => {
    const lines = wrapText(text, contentWidth, font, size);
    
    for (const line of lines) {
      checkNewPage(size * lineHeight + 10);
      
      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size,
        font,
        color,
      });
      
      yPosition -= size * lineHeight;
    }
  };
  
  currentPage.drawText(data.projectTitle, {
    x: margin,
    y: yPosition,
    size: sizes.title,
    font: timesRomanBold,
    color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
  });
  yPosition -= sizes.title * lineHeight + 20;
  
  for (const page of data.pages) {
    checkNewPage(sizes.heading1 * lineHeight + 20);
    
    currentPage.drawText(page.title, {
      x: margin,
      y: yPosition,
      size: sizes.heading1,
      font: timesRomanBold,
      color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
    });
    yPosition -= sizes.heading1 * lineHeight + 15;
    
    const sortedBlocks = [...page.blocks].sort((a, b) => a.order - b.order);
    
    for (const block of sortedBlocks) {
      const content = extractTextFromContent(block.content);
      
      switch (block.type) {
        case 'heading': {
          const level = block.content?.level || 2;
          const size = level === 1 ? sizes.heading1 : level === 2 ? sizes.heading2 : sizes.heading3;
          checkNewPage(size * lineHeight + 10);
          drawText(content, timesRomanBold, size, rgb(primaryColor.r, primaryColor.g, primaryColor.b));
          yPosition -= 10;
          break;
        }
        
        case 'paragraph':
          checkNewPage(sizes.body * lineHeight + 10);
          drawText(content, timesRomanFont, sizes.body);
          yPosition -= 5;
          break;
        
        case 'quote':
          checkNewPage(sizes.quote * lineHeight + 20);
          currentPage.drawRectangle({
            x: margin - 5,
            y: yPosition - sizes.quote * lineHeight - 5,
            width: 3,
            height: sizes.quote * lineHeight + 10,
            color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
          });
          drawText(`"${content}"`, timesRomanFont, sizes.quote, rgb(0.3, 0.3, 0.3));
          yPosition -= 10;
          break;
        
        case 'list': {
          const items = block.content?.items || [];
          const listType = block.content?.listType || 'bullet';
          
          for (let i = 0; i < items.length; i++) {
            checkNewPage(sizes.body * lineHeight + 5);
            const bullet = listType === 'bullet' ? '•' : `${i + 1}.`;
            const bulletWidth = timesRomanFont.widthOfTextAtSize(bullet + ' ', sizes.body);
            
            currentPage.drawText(bullet, {
              x: margin,
              y: yPosition,
              size: sizes.body,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            });
            
            const itemLines = wrapText(items[i], contentWidth - bulletWidth - 10, timesRomanFont, sizes.body);
            for (let j = 0; j < itemLines.length; j++) {
              if (j > 0) checkNewPage(sizes.body * lineHeight);
              currentPage.drawText(itemLines[j], {
                x: margin + bulletWidth + 5,
                y: yPosition,
                size: sizes.body,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
              });
              yPosition -= sizes.body * lineHeight;
            }
          }
          yPosition -= 5;
          break;
        }
        
        case 'cta':
          checkNewPage(sizes.cta * lineHeight + 30);
          const buttonText = block.content?.buttonText || 'Click Here';
          const buttonWidth = timesRomanBold.widthOfTextAtSize(buttonText, sizes.cta);
          const buttonX = (pageWidth - buttonWidth - 40) / 2;
          
          currentPage.drawRectangle({
            x: buttonX,
            y: yPosition - sizes.cta * lineHeight - 10,
            width: buttonWidth + 40,
            height: sizes.cta * lineHeight + 20,
            color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
            borderRadius: 8,
          });
          
          currentPage.drawText(buttonText, {
            x: buttonX + 20,
            y: yPosition - sizes.cta,
            size: sizes.cta,
            font: timesRomanBold,
            color: rgb(1, 1, 1),
          });
          
          yPosition -= sizes.cta * lineHeight + 35;
          break;
        
        case 'image':
          checkNewPage(60);
          drawText('[Image placeholder]', timesRomanFont, sizes.body, rgb(0.5, 0.5, 0.5));
          yPosition -= 40;
          break;
        
        case 'table': {
          const headers = block.content?.headers || [];
          const rows = block.content?.rows || [];
          
          checkNewPage((headers.length > 0 ? sizes.body * lineHeight + 5 : 0) + (rows.length * sizes.body * lineHeight) + 20);
          
          if (headers.length > 0) {
            const headerText = headers.join(' | ');
            drawText(headerText, timesRomanBold, sizes.body);
            yPosition -= 3;
          }
          
          for (const row of rows) {
            const rowText = row.join(' | ');
            drawText(rowText, timesRomanFont, sizes.body);
          }
          yPosition -= 10;
          break;
        }
      }
    }
    
    yPosition -= 30;
  }
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
