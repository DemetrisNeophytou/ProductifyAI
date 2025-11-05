import { StatsCard } from "../StatsCard";
import { Sparkles } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <StatsCard
        icon={Sparkles}
        label="Products Created"
        value="24"
        trend="+12% from last month"
      />
    </div>
  );
}
