export function convertTipTapToPlainText(content: any): string {
  if (!content) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  if (typeof content !== 'object') {
    return '';
  }

  let text = '';
  let listCounter = 0;
  let inList = false;
  let listType: 'bullet' | 'ordered' | null = null;

  const extractText = (node: any, depth: number = 0): void => {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(n => extractText(n, depth));
      return;
    }

    if (node.type === 'doc') {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(n => extractText(n, depth));
      }
    } else if (node.type === 'text') {
      text += node.text || '';
    } else if (node.type === 'hardBreak') {
      text += '\n';
    } else if (node.type === 'paragraph') {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(n => extractText(n, depth));
      }
      if (!inList) {
        text += '\n\n';
      }
    } else if (node.type === 'heading') {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(n => extractText(n, depth));
      }
      text += '\n\n';
    } else if (node.type === 'bulletList') {
      const wasInList = inList;
      const wasListType = listType;
      inList = true;
      listType = 'bullet';
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(n => extractText(n, depth + 1));
      }
      inList = wasInList;
      listType = wasListType;
      if (!inList) {
        text += '\n';
      }
    } else if (node.type === 'orderedList') {
      const wasInList = inList;
      const wasListType = listType;
      inList = true;
      listType = 'ordered';
      listCounter = 0;
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(n => {
          listCounter++;
          const currentCounter = listCounter;
          extractText({ ...n, _listIndex: currentCounter }, depth + 1);
        });
      }
      inList = wasInList;
      listType = wasListType;
      if (!inList) {
        text += '\n';
      }
    } else if (node.type === 'listItem') {
      const indent = '  '.repeat(Math.max(0, depth - 1));
      const marker = listType === 'ordered' 
        ? `${node._listIndex || 1}. `
        : '• ';
      text += indent + marker;
      if (node.content && Array.isArray(node.content)) {
        const beforeLength = text.length;
        node.content.forEach(n => extractText(n, depth));
        const addedText = text.substring(beforeLength).trim();
        if (addedText) {
          text = text.substring(0, beforeLength) + addedText;
        }
      }
      text += '\n';
    } else if (node.content && Array.isArray(node.content)) {
      node.content.forEach(n => extractText(n, depth));
    }
  };

  extractText(content, 0);
  
  return text.trim();
}
