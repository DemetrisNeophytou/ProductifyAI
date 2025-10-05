import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Star, TrendingUp, Zap, Home, User, Mail, Phone, Calendar, Clock, Download, Upload, Settings, Bell, Menu, X, Check, ChevronRight, ArrowRight, Plus, Minus, Edit, Trash2, Eye, EyeOff, Lock, Unlock } from "lucide-react";

const iconSets = {
  popular: [
    { name: "heart", Icon: Heart, category: "popular" },
    { name: "star", Icon: Star, category: "popular" },
    { name: "trending-up", Icon: TrendingUp, category: "popular" },
    { name: "zap", Icon: Zap, category: "popular" },
    { name: "check", Icon: Check, category: "popular" },
    { name: "arrow-right", Icon: ArrowRight, category: "popular" },
  ],
  navigation: [
    { name: "home", Icon: Home, category: "navigation" },
    { name: "menu", Icon: Menu, category: "navigation" },
    { name: "x", Icon: X, category: "navigation" },
    { name: "chevron-right", Icon: ChevronRight, category: "navigation" },
    { name: "settings", Icon: Settings, category: "navigation" },
  ],
  communication: [
    { name: "mail", Icon: Mail, category: "communication" },
    { name: "phone", Icon: Phone, category: "communication" },
    { name: "bell", Icon: Bell, category: "communication" },
    { name: "user", Icon: User, category: "communication" },
  ],
  actions: [
    { name: "plus", Icon: Plus, category: "actions" },
    { name: "minus", Icon: Minus, category: "actions" },
    { name: "edit", Icon: Edit, category: "actions" },
    { name: "trash-2", Icon: Trash2, category: "actions" },
    { name: "download", Icon: Download, category: "actions" },
    { name: "upload", Icon: Upload, category: "actions" },
    { name: "eye", Icon: Eye, category: "actions" },
    { name: "eye-off", Icon: EyeOff, category: "actions" },
    { name: "lock", Icon: Lock, category: "actions" },
    { name: "unlock", Icon: Unlock, category: "actions" },
  ],
  time: [
    { name: "calendar", Icon: Calendar, category: "time" },
    { name: "clock", Icon: Clock, category: "time" },
  ],
};

const allIcons = [
  ...iconSets.popular,
  ...iconSets.navigation,
  ...iconSets.communication,
  ...iconSets.actions,
  ...iconSets.time,
];

const colorPresets = [
  { name: "Primary", value: "#8B5CF6" },
  { name: "Success", value: "#10B981" },
  { name: "Warning", value: "#F59E0B" },
  { name: "Danger", value: "#EF4444" },
  { name: "Info", value: "#3B82F6" },
  { name: "Dark", value: "#1F2937" },
];

interface GraphicsTabProps {
  onInsert?: (svg: string, color: string) => void;
}

export function GraphicsTab({ onInsert }: GraphicsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");

  const filteredIcons = searchQuery
    ? allIcons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          icon.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allIcons;

  const handleInsertIcon = (iconName: string) => {
    if (onInsert) {
      onInsert(iconName, selectedColor);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-icon-search"
          />
          <Button size="icon" variant="ghost" data-testid="button-search-icons">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Icon Color</p>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSelectedColor(preset.value)}
                className={`h-8 w-8 rounded-md border-2 transition-all hover-elevate ${
                  selectedColor === preset.value ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                data-testid={`color-preset-${preset.name.toLowerCase()}`}
              />
            ))}
          </div>
          <Input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="mt-2 h-10 cursor-pointer"
            data-testid="input-custom-color"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""}
          </p>
          <Badge variant="outline" className="text-xs">
            Lucide Icons
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {filteredIcons.map((icon) => (
            <button
              key={icon.name}
              onClick={() => handleInsertIcon(icon.name)}
              className="aspect-square rounded-lg border bg-card hover-elevate active-elevate-2 flex items-center justify-center group"
              title={icon.name}
              data-testid={`icon-${icon.name}`}
            >
              <icon.Icon
                className="h-6 w-6 transition-colors"
                style={{ color: selectedColor }}
              />
            </button>
          ))}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No icons found</p>
            <p className="text-xs mt-1">Try different keywords</p>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground border-t pt-3">
        <p>Icons from Lucide (MIT License) - Free for commercial use</p>
      </div>
    </div>
  );
}
