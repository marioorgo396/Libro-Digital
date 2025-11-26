import { HIGHLIGHT_COLORS } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground tracking-tight">
        Color de Subrayado
      </label>
      <div className="grid grid-cols-3 gap-2">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={cn(
              "h-10 w-full rounded-md transition-all duration-150",
              "border-2 hover-elevate active-elevate-2",
              selectedColor === color.value
                ? "border-foreground scale-110"
                : "border-border"
            )}
            style={{
              backgroundColor: color.value,
              opacity: selectedColor === color.value ? 0.8 : 0.6,
            }}
            data-testid={`color-${color.name.toLowerCase()}`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
