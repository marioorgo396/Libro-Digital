import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { PDFSidebar } from '@/components/PDFSidebar';
import { HighlightOverlay } from '@/components/HighlightOverlay';
import { 
  pdfjsLib, 
  saveHighlights, 
  loadHighlights, 
  exportHighlightsAsJSON,
  importHighlightsFromJSON,
  mergeHighlights,
  isBookUnlocked,
  saveAnnotations,
  loadAnnotations,
} from '@/lib/pdfHelpers';
import { HIGHLIGHT_COLORS } from '@shared/schema';
import type { Highlight, Book, BooksConfig, TextAnnotation } from '@shared/schema';

export default function PDFViewer() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId || '';
  const [, setLocation] = useLocation();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(HIGHLIGHT_COLORS[0].value);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<string | number>('fit-width');
  const { toast } = useToast();

  useEffect(() => {
    if (!bookId) {
      setLocation('/');
      return;
    }
    
    loadBookAndPDF();
  }, [bookId]);

  const loadBookAndPDF = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/libros/books.json');
      if (!response.ok) throw new Error('No se pudo cargar la biblioteca');
      
      const config: BooksConfig = await response.json();
      const foundBook = config.books.find(b => b.id === bookId);
      
      if (!foundBook) {
        toast({
          title: 'Libro no encontrado',
          description: 'El libro solicitado no existe en la biblioteca',
          variant: 'destructive',
        });
        setLocation('/');
        return;
      }

      if (!isBookUnlocked(bookId)) {
        toast({
          title: 'Acceso denegado',
          description: 'Necesitas desbloquear este libro con una licencia válida',
          variant: 'destructive',
        });
        setLocation('/');
        return;
      }

      setBook(foundBook);
      
      const loadedHighlights = loadHighlights(bookId);
      setHighlights(loadedHighlights);
      
      const loadedAnnotations = loadAnnotations(bookId);
      setAnnotations(loadedAnnotations);
      
      const pdfUrl = `/libros/${foundBook.file}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cargar el PDF',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const calculateScale = useCallback((page: any) => {
    if (!containerRef.current) return 1;
    
    const containerWidth = containerRef.current.clientWidth - 64;
    const containerHeight = containerRef.current.clientHeight - 64;
    const viewport = page.getViewport({ scale: 1 });
    
    if (zoomLevel === 'fit-width') {
      return Math.min(containerWidth / viewport.width, 2);
    } else if (zoomLevel === 'fit-page') {
      const scaleWidth = containerWidth / viewport.width;
      const scaleHeight = containerHeight / viewport.height;
      return Math.min(scaleWidth, scaleHeight, 2);
    } else {
      return Number(zoomLevel);
    }
  }, [zoomLevel]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const scale = calculateScale(page);
      const scaledViewport = page.getViewport({ scale });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      setCanvasSize({
        width: scaledViewport.width,
        height: scaledViewport.height,
      });

      if (context) {
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, calculateScale]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage, zoomLevel]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleAddHighlight = (highlight: Omit<Highlight, 'id' | 'timestamp' | 'originalCanvasWidth' | 'originalCanvasHeight'>) => {
    if (!canvasSize.width || !canvasSize.height || canvasSize.width <= 0 || canvasSize.height <= 0) {
      console.error('Cannot save highlight with invalid canvas dimensions:', canvasSize);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el subrayado debido a dimensiones inválidas',
        variant: 'destructive',
      });
      return;
    }
    
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      originalCanvasWidth: canvasSize.width,
      originalCanvasHeight: canvasSize.height,
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);
    saveHighlights(bookId, updatedHighlights);
    
    toast({
      title: 'Subrayado agregado',
      description: 'El subrayado se ha guardado automáticamente',
    });
  };

  const handleClearCurrentPage = () => {
    const updatedHighlights = highlights.filter(h => h.pageNumber !== currentPage);
    const removedCount = highlights.length - updatedHighlights.length;
    
    if (removedCount > 0) {
      setHighlights(updatedHighlights);
      saveHighlights(bookId, updatedHighlights);
      
      toast({
        title: 'Subrayados eliminados',
        description: `Se eliminaron ${removedCount} ${removedCount === 1 ? 'subrayado' : 'subrayados'} de esta página`,
      });
    } else {
      toast({
        title: 'Sin cambios',
        description: 'No hay subrayados en esta página',
      });
    }
  };

  const handleExportHighlights = () => {
    exportHighlightsAsJSON(bookId, highlights);
    toast({
      title: 'Exportación completa',
      description: 'Los subrayados se han exportado como JSON',
    });
  };

  const handleImportHighlights = async (file: File) => {
    const imported = await importHighlightsFromJSON(file);
    
    if (!imported) {
      toast({
        title: 'Error de importación',
        description: 'El archivo no tiene un formato válido',
        variant: 'destructive',
      });
      return;
    }

    if (imported.pdfId !== bookId) {
      toast({
        title: 'Advertencia',
        description: 'Los subrayados fueron creados para otro libro, pero se importarán igualmente',
      });
    }

    const mergedHighlights = mergeHighlights(highlights, imported.highlights);
    const newCount = mergedHighlights.length - highlights.length;
    
    setHighlights(mergedHighlights);
    saveHighlights(bookId, mergedHighlights);
    
    toast({
      title: 'Importación completa',
      description: `Se importaron ${newCount} ${newCount === 1 ? 'subrayado nuevo' : 'subrayados nuevos'}`,
    });
  };

  const handleAddAnnotation = (content: string) => {
    const newAnnotation: TextAnnotation = {
      id: crypto.randomUUID(),
      bookId,
      pageNumber: currentPage,
      content,
      timestamp: Date.now(),
    };
    
    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    saveAnnotations(bookId, updatedAnnotations);
    
    toast({
      title: 'Anotación añadida',
      description: 'La anotación se ha guardado automáticamente',
    });
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== annotationId);
    setAnnotations(updatedAnnotations);
    saveAnnotations(bookId, updatedAnnotations);
    
    toast({
      title: 'Anotación eliminada',
      description: 'La anotación se ha eliminado correctamente',
    });
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleZoomChange = (zoom: string | number) => {
    setZoomLevel(zoom);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'Escape') {
        setIsDrawingMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (pdfDoc && currentPage) {
          renderPage(currentPage);
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [pdfDoc, currentPage, renderPage]);

  return (
    <div className="flex h-screen bg-background">
      <PDFSidebar
        bookTitle={book?.title}
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={() => setIsDrawingMode(prev => !prev)}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        onClearCurrentPage={handleClearCurrentPage}
        onExportHighlights={handleExportHighlights}
        onImportHighlights={handleImportHighlights}
        onBack={handleBack}
        highlightCount={highlights.length}
        zoomLevel={zoomLevel}
        onZoomChange={handleZoomChange}
        annotations={annotations}
        onAddAnnotation={handleAddAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
      />

      <main 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
      >
        {loading ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg text-muted-foreground">Cargando PDF...</p>
          </div>
        ) : (
          <div 
            className="relative transition-all duration-400 ease-in-out"
            style={{
              transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
              opacity: isTransitioning ? 0.5 : 1,
            }}
          >
            <div
              className="relative shadow-lg rounded-md overflow-hidden"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
              }}
            >
              <canvas
                ref={canvasRef}
                className="block"
                data-testid="pdf-canvas"
              />
              <HighlightOverlay
                highlights={highlights}
                pageNumber={currentPage}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                isDrawing={isDrawingMode}
                selectedColor={selectedColor}
                onAddHighlight={handleAddHighlight}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
