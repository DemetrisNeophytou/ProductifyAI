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
    logo?: string;
    fonts?: {
      heading?: string;
      body?: string;
    };
  };
}

function extractTextFromContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (content.text) return content.text;
  return '';
}

function renderBlock(block: Block, primaryColor: string): string {
  const content = extractTextFromContent(block.content);
  
  switch (block.type) {
    case 'heading': {
      const level = block.content?.level || 2;
      const tag = `h${level}`;
      return `<${tag} class="heading-${level}">${content}</${tag}>`;
    }
    
    case 'paragraph':
      return `<p class="paragraph">${content}</p>`;
    
    case 'quote':
      return `<blockquote class="quote">"${content}"</blockquote>`;
    
    case 'list': {
      const items = block.content?.items || [];
      const listType = block.content?.listType || 'bullet';
      const tag = listType === 'bullet' ? 'ul' : 'ol';
      const itemsHtml = items.map((item: string) => `<li>${item}</li>`).join('');
      return `<${tag} class="list">${itemsHtml}</${tag}>`;
    }
    
    case 'cta': {
      const buttonText = block.content?.buttonText || 'Click Here';
      const url = block.content?.url || '#';
      return `
        <div class="cta-wrapper">
          <a href="${url}" class="cta-button">${buttonText}</a>
        </div>
      `;
    }
    
    case 'image': {
      const url = block.content?.url || '';
      const alt = block.content?.alt || 'Image';
      if (!url) return `<div class="image-placeholder">[Image placeholder]</div>`;
      return `<img src="${url}" alt="${alt}" class="block-image" />`;
    }
    
    case 'table': {
      const headers = block.content?.headers || [];
      const rows = block.content?.rows || [];
      
      const headersHtml = headers.length > 0
        ? `<thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr></thead>`
        : '';
      
      const rowsHtml = rows.map((row: string[]) => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
      ).join('');
      
      return `
        <table class="block-table">
          ${headersHtml}
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }
    
    default:
      return '';
  }
}

export function generateBlocksHTML(data: ExportData): string {
  const primaryColor = data.brandKit?.primaryColor || '#a855f7';
  const secondaryColor = data.brandKit?.secondaryColor || '#6366f1';
  const logo = data.brandKit?.logo || '';
  const headingFont = data.brandKit?.fonts?.heading || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const bodyFont = data.brandKit?.fonts?.body || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  
  const pagesHtml = data.pages.map(page => {
    const sortedBlocks = [...page.blocks].sort((a, b) => a.order - b.order);
    const blocksHtml = sortedBlocks.map(block => renderBlock(block, primaryColor)).join('\n');
    
    return `
      <section class="page-section">
        <h2 class="page-title">${page.title}</h2>
        <div class="page-content">
          ${blocksHtml}
        </div>
      </section>
    `;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.projectTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${bodyFont};
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 60px;
      padding-bottom: 30px;
      border-bottom: 2px solid ${primaryColor};
    }
    
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    
    .main-title {
      font-family: ${headingFont};
      font-size: 2.5rem;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .page-section {
      margin-bottom: 50px;
    }
    
    .page-title {
      font-family: ${headingFont};
      font-size: 2rem;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 1px solid ${secondaryColor};
    }
    
    .page-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .heading-1 {
      font-family: ${headingFont};
      font-size: 2rem;
      font-weight: 600;
      color: ${primaryColor};
      margin: 30px 0 20px;
    }
    
    .heading-2 {
      font-family: ${headingFont};
      font-size: 1.75rem;
      font-weight: 600;
      color: ${secondaryColor};
      margin: 25px 0 15px;
    }
    
    .heading-3 {
      font-family: ${headingFont};
      font-size: 1.5rem;
      font-weight: 600;
      color: ${secondaryColor};
      margin: 20px 0 10px;
    }
    
    .paragraph {
      font-size: 1rem;
      line-height: 1.8;
      color: #374151;
    }
    
    .quote {
      font-size: 1.125rem;
      font-style: italic;
      color: #6b7280;
      padding: 20px;
      border-left: 4px solid ${primaryColor};
      background: #f9fafb;
      margin: 20px 0;
    }
    
    .list {
      padding-left: 30px;
      color: #374151;
    }
    
    .list li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    .cta-wrapper {
      text-align: center;
      margin: 30px 0;
    }
    
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: ${primaryColor};
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1.125rem;
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      background: ${secondaryColor};
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    
    .block-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .image-placeholder {
      padding: 60px;
      background: #f3f4f6;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      text-align: center;
      color: #9ca3af;
      margin: 20px 0;
    }
    
    .block-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .block-table th,
    .block-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .block-table th {
      background: ${primaryColor};
      color: white;
      font-weight: 600;
    }
    
    .block-table tr:hover {
      background: #f9fafb;
    }
    
    @media (max-width: 640px) {
      .main-title {
        font-size: 2rem;
      }
      
      .page-title {
        font-size: 1.5rem;
      }
      
      .heading-1 {
        font-size: 1.5rem;
      }
      
      .heading-2 {
        font-size: 1.25rem;
      }
      
      .cta-button {
        padding: 12px 30px;
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      ${logo ? `<img src="${logo}" alt="Logo" class="logo" />` : ''}
      <h1 class="main-title">${data.projectTitle}</h1>
    </header>
    
    <main>
      ${pagesHtml}
    </main>
  </div>
</body>
</html>`;
}
