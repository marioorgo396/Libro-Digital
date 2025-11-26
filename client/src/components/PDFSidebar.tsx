import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Download, Upload, Pencil, ArrowLeft, ZoomIn, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ColorPicker } from './ColorPicker';
import { cn } from '@/lib/utils';
import { ZOOM_LEVELS } from '@shared/schema';
import type { TextAnnotation } from '@shared/schema';

interface PDFSidebarProps {
  bookTitle?: string;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onClearCurrentPage: () => void;
  onExportHighlights: () => void;
  onImportHighlights: (file: File) => void;
  onBack: () => void;
  highlightCount: number;
  zoomLevel: string | number;
  onZoomChange: (zoom: string | number) => void;
  annotations: TextAnnotation[];
  onAddAnnotation: (content: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function PDFSidebar({
  bookTitle,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  isDrawingMode,
  onToggleDrawingMode,
  selectedColor,
  onColorSelect,
  onClearCurrentPage,
  onExportHighlights,
  onImportHighlights,
  onBack,
  highlightCount,
  zoomLevel,
  onZoomChange,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}: PDFSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportHighlights(file);
      e.target.value = '';
    }
  };

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      onAddAnnotation(newAnnotation.trim());
      setNewAnnotation('');
    }
  };

  const pageAnnotations = annotations.filter(a => a.pageNumber === currentPage);

  return (
    <aside className="w-[300px] bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full justify-start"
          data-testid="button-back-library"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Biblioteca
        </Button>
        {bookTitle && (
          <p className="text-sm font-medium text-foreground mt-3 line-clamp-2 px-1">
            {bookTitle}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-bold text-foreground font-mono">
                  {currentPage}
                </span>
                <span className="text-lg text-muted-foreground font-mono">
                  / {totalPages}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Página actual</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className="flex-1 h-10"
                variant="outline"
                data-testid="button-previous-page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className="flex-1 h-10"
                variant="outline"
                data-testid="button-next-page"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Zoom</span>
            </div>
            <Select
              value={String(zoomLevel)}
              onValueChange={(val) => {
                const numVal = parseFloat(val);
                onZoomChange(isNaN(numVal) ? val : numVal);
              }}
            >
              <SelectTrigger className="w-full" data-testid="select-zoom">
                <SelectValue placeholder="Seleccionar zoom" />
              </SelectTrigger>
              <SelectContent>
                {ZOOM_LEVELS.map((level) => (
                  <SelectItem key={String(level.value)} value={String(level.value)}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-card rounded-md border border-card-border">
              <div className="flex items-center gap-2">
                <Pencil className={cn(
                  "w-4 h-4",
                  isDrawingMode ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Dibujar</span>
              </div>
              <Switch
                checked={isDrawingMode}
                onCheckedChange={onToggleDrawingMode}
                data-testid="switch-drawing-mode"
              />
            </div>

            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={onColorSelect}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div 
              className="flex items-center justify-between p-3 bg-card rounded-md border border-card-border cursor-pointer hover-elevate"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={cn(
                  "w-4 h-4",
                  showAnnotations ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">Anotaciones</span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {pageAnnotations.length}
              </span>
            </div>

            {showAnnotations && (
              <div className="space-y-3 p-3 bg-card/50 rounded-md border border-card-border">
                <div className="space-y-2">
                  <Textarea
                    value={newAnnotation}
                    onChange={(e) => setNewAnnotation(e.target.value)}
                    placeholder="Escribe una anotación para esta página..."
                    className="min-h-[80px] text-sm resize-none"
                    data-testid="textarea-annotation"
                  />
                  <Button
                    onClick={handleAddAnnotation}
                    disabled={!newAnnotation.trim()}
                    size="sm"
                    className="w-full"
                    data-testid="button-add-annotation"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Añadir anotación
                  </Button>
                </div>

                {pageAnnotations.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {pageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="p-2 bg-background rounded border text-sm group relative"
                        data-testid={`annotation-${annotation.id}`}
                      >
                        <p className="text-foreground whitespace-pre-wrap pr-6">{annotation.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(annotation.timestamp).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => onDeleteAnnotation(annotation.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                          data-testid={`button-delete-annotation-${annotation.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Button
              onClick={onClearCurrentPage}
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              data-testid="button-clear-highlights"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Borrar Subrayados
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={onExportHighlights}
                variant="default"
                size="sm"
                className="flex-1"
                data-testid="button-export-highlights"
              >
                <Download className="w-3 h-3 mr-1" />
                Exportar
              </Button>

              <Button
                onClick={handleImportClick}
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid="button-import-highlights"
              >
                <Upload className="w-3 h-3 mr-1" />
                Importar
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-import-file"
            />

            <div className="text-center text-xs text-muted-foreground">
              {highlightCount} {highlightCount === 1 ? 'subrayado' : 'subrayados'}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <p className="text-xs text-center text-muted-foreground">
          Biblioteca Digital v1.0
        </p>
      </div>
    </aside>
  );
}
