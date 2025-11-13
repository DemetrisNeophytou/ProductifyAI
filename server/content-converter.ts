type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  _listIndex?: number;
  [key: string]: unknown;
};

type TipTapContent = TipTapNode | TipTapNode[] | string | null | undefined;

export function convertTipTapToPlainText(content: TipTapContent): string {
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

  const extractText = (node: TipTapContent, depth: number = 0): void => {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach((child: TipTapNode) => extractText(child, depth));
      return;
    }

    const currentNode: TipTapNode = node;

    if (currentNode.type === 'doc') {
      if (currentNode.content && Array.isArray(currentNode.content)) {
        currentNode.content.forEach((child: TipTapNode) => extractText(child, depth));
      }
    } else if (currentNode.type === 'text') {
      text += currentNode.text || '';
    } else if (currentNode.type === 'hardBreak') {
      text += '\n';
    } else if (currentNode.type === 'paragraph') {
      if (currentNode.content && Array.isArray(currentNode.content)) {
        currentNode.content.forEach((child: TipTapNode) => extractText(child, depth));
      }
      if (!inList) {
        text += '\n\n';
      }
    } else if (currentNode.type === 'heading') {
      if (currentNode.content && Array.isArray(currentNode.content)) {
        currentNode.content.forEach((child: TipTapNode) => extractText(child, depth));
      }
      text += '\n\n';
    } else if (currentNode.type === 'bulletList') {
      const wasInList = inList;
      const wasListType = listType;
      inList = true;
      listType = 'bullet';
      if (currentNode.content && Array.isArray(currentNode.content)) {
        currentNode.content.forEach((child: TipTapNode) => extractText(child, depth + 1));
      }
      inList = wasInList;
      listType = wasListType;
      if (!inList) {
        text += '\n';
      }
    } else if (currentNode.type === 'orderedList') {
      const wasInList = inList;
      const wasListType = listType;
      inList = true;
      listType = 'ordered';
      listCounter = 0;
      if (currentNode.content && Array.isArray(currentNode.content)) {
        currentNode.content.forEach((child: TipTapNode) => {
          listCounter++;
          const currentCounter = listCounter;
          const itemNode: TipTapNode = { ...child, _listIndex: currentCounter };
          extractText(itemNode, depth + 1);
        });
      }
      inList = wasInList;
      listType = wasListType;
      if (!inList) {
        text += '\n';
      }
    } else if (currentNode.type === 'listItem') {
      const indent = '  '.repeat(Math.max(0, depth - 1));
      const marker = listType === 'ordered' 
        ? `${currentNode._listIndex || 1}. `
        : '• ';
      text += indent + marker;
      if (currentNode.content && Array.isArray(currentNode.content)) {
        const beforeLength = text.length;
        currentNode.content.forEach((child: TipTapNode) => extractText(child, depth));
        const addedText = text.substring(beforeLength).trim();
        if (addedText) {
          text = text.substring(0, beforeLength) + addedText;
        }
      }
      text += '\n';
    } else if (currentNode.content && Array.isArray(currentNode.content)) {
      currentNode.content.forEach((child: TipTapNode) => extractText(child, depth));
    }
  };

  extractText(content, 0);
  
  return text.trim();
}


