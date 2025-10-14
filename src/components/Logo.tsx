import { Sparkles } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Sparkles className="w-8 h-8 text-primary" />
        <div className="absolute inset-0 blur-md">
          <Sparkles className="w-8 h-8 text-primary opacity-50" />
        </div>
      </div>
      <span className="text-2xl font-bold tracking-tight gradient-text">
        HATCH.AI
      </span>
    </div>
  );
};
