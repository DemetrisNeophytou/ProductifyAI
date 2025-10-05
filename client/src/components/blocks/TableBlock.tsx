import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { TableContent } from "@shared/schema";

interface TableBlockProps {
  content: TableContent;
  onChange: (content: TableContent) => void;
}

export function TableBlock({ content, onChange }: TableBlockProps) {
  const headers = content.headers || [];
  const hasHeaders = headers.length > 0;
  const columnCount = hasHeaders ? headers.length : (content.rows[0]?.length || 2);

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onChange({ ...content, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...content.rows];
    newRows[rowIndex][colIndex] = value;
    onChange({ ...content, rows: newRows });
  };

  const handleToggleHeaders = (enabled: boolean) => {
    if (enabled) {
      const newHeaders = Array(columnCount).fill("").map((_, i) => `Column ${i + 1}`);
      onChange({ ...content, headers: newHeaders });
    } else {
      onChange({ ...content, headers: undefined });
    }
  };

  const handleAddColumn = () => {
    const newHeaders = hasHeaders
      ? [...headers, `Column ${headers.length + 1}`]
      : undefined;
    const newRows = content.rows.map(row => [...row, ""]);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const handleRemoveColumn = (index: number) => {
    if (columnCount === 1) return;
    const newHeaders = hasHeaders
      ? headers.filter((_, i) => i !== index)
      : undefined;
    const newRows = content.rows.map(row => row.filter((_, i) => i !== index));
    onChange({ headers: newHeaders, rows: newRows });
  };

  const handleAddRow = () => {
    const newRow = Array(columnCount).fill("");
    onChange({ ...content, rows: [...content.rows, newRow] });
  };

  const handleRemoveRow = (index: number) => {
    if (content.rows.length === 1) return;
    const newRows = content.rows.filter((_, i) => i !== index);
    onChange({ ...content, rows: newRows });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={hasHeaders}
          onCheckedChange={handleToggleHeaders}
          data-testid="switch-table-headers"
        />
        <Label>Show Headers</Label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          {hasHeaders && (
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="border bg-muted p-2">
                    <Input
                      value={header}
                      onChange={(e) => handleHeaderChange(index, e.target.value)}
                      placeholder="Header"
                      className="h-8 text-sm"
                      data-testid={`input-table-header-${index}`}
                    />
                  </th>
                ))}
                <th className="border bg-muted/20 p-2 w-12"></th>
              </tr>
            </thead>
          )}
          <tbody>
            {content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border p-2">
                    <Input
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      placeholder="Cell"
                      className="h-8 text-sm"
                      data-testid={`input-table-cell-${rowIndex}-${colIndex}`}
                    />
                  </td>
                ))}
                <td className="border p-2 bg-muted/20">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveRow(rowIndex)}
                    disabled={content.rows.length === 1}
                    className="h-8 w-8"
                    data-testid={`button-remove-row-${rowIndex}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleAddColumn}
          className="flex-1"
          data-testid="button-add-column"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
        <Button
          variant="outline"
          onClick={handleAddRow}
          className="flex-1"
          data-testid="button-add-row"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        <Button
          variant="outline"
          onClick={() => handleRemoveColumn(columnCount - 1)}
          disabled={columnCount === 1}
          className="flex-1"
          data-testid="button-remove-column"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Column
        </Button>
      </div>
    </div>
  );
}
