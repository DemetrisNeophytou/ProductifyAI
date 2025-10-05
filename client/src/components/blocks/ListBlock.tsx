import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { ListContent } from "@shared/schema";

interface ListBlockProps {
  content: ListContent;
  onChange: (content: ListContent) => void;
}

export function ListBlock({ content, onChange }: ListBlockProps) {
  const handleItemChange = (index: number, text: string) => {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], text };
    onChange({ ...content, items: newItems });
  };

  const handleItemCheckChange = (index: number, checked: boolean) => {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], checked };
    onChange({ ...content, items: newItems });
  };

  const handleAddItem = () => {
    onChange({
      ...content,
      items: [...content.items, { text: "", checked: content.style === "checklist" ? false : undefined }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (content.items.length === 1) return;
    const newItems = content.items.filter((_, i) => i !== index);
    onChange({ ...content, items: newItems });
  };

  const handleStyleChange = (style: 'bullet' | 'numbered' | 'checklist') => {
    onChange({ ...content, style });
  };

  const ListTag = content.style === "numbered" ? "ol" : "ul";

  return (
    <div className="space-y-3">
      <Select value={content.style} onValueChange={handleStyleChange}>
        <SelectTrigger className="w-40" data-testid="select-list-style">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bullet">Bullet List</SelectItem>
          <SelectItem value="numbered">Numbered List</SelectItem>
          <SelectItem value="checklist">Checklist</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {content.items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {content.style === "checklist" && (
              <Checkbox
                checked={item.checked || false}
                onCheckedChange={(checked) => handleItemCheckChange(index, checked as boolean)}
                data-testid={`checkbox-list-item-${index}`}
              />
            )}
            <Input
              value={item.text}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
              data-testid={`input-list-item-${index}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleRemoveItem(index)}
              disabled={content.items.length === 1}
              data-testid={`button-remove-item-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={handleAddItem}
        className="w-full"
        data-testid="button-add-list-item"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>

      {content.style === "checklist" ? (
        <div className="space-y-1">
          {content.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox checked={item.checked || false} disabled />
              <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                {item.text || `Item ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <ListTag className={content.style === "numbered" ? "list-decimal list-inside space-y-1" : "list-disc list-inside space-y-1"}>
          {content.items.map((item, index) => (
            <li key={index} className="text-sm">
              {item.text || `Item ${index + 1}`}
            </li>
          ))}
        </ListTag>
      )}
    </div>
  );
}
