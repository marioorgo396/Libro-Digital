import * as pdfjsLib from 'pdfjs-dist';
import { highlightStorageSchema, highlightSchema, annotationsStorageSchema } from '@shared/schema';
import type { Highlight, HighlightStorage, TextAnnotation, AnnotationsStorage, ExamEntry } from '@shared/schema';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export { pdfjsLib };

function getStorageKey(bookId: string): string {
  return `pdf-highlights-${bookId}`;
}

function getAnnotationsKey(bookId: string): string {
  return `pdf-annotations-${bookId}`;
}

const EXAMS_KEY = 'library-exams';

export function saveHighlights(bookId: string, highlights: Highlight[]): void {
  const storage: HighlightStorage = {
    pdfId: bookId,
    highlights,
  };
  localStorage.setItem(getStorageKey(bookId), JSON.stringify(storage));
}

export function loadHighlights(bookId: string): Highlight[] {
  const stored = localStorage.getItem(getStorageKey(bookId));
  if (!stored) return [];
  
  try {
    const storage: HighlightStorage = JSON.parse(stored);
    return storage.highlights;
  } catch {
    return [];
  }
}

export function exportHighlightsAsJSON(bookId: string, highlights: Highlight[]): void {
  const storage: HighlightStorage = {
    pdfId: bookId,
    highlights,
  };
  
  const dataStr = JSON.stringify(storage, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `highlights-${bookId}-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

export function importHighlightsFromJSON(file: File): Promise<HighlightStorage | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        const result = highlightStorageSchema.safeParse(parsed);
        
        if (result.success) {
          resolve(result.data);
        } else {
          console.warn('Invalid highlight file format:', result.error);
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

export function mergeHighlights(existing: Highlight[], imported: Highlight[]): Highlight[] {
  const existingIds = new Set(existing.map(h => h.id));
  const validImported = imported.filter(h => {
    const result = highlightSchema.safeParse(h);
    return result.success && !existingIds.has(h.id);
  });
  return [...existing, ...validImported];
}

export function normalizeCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number; originalCanvasWidth: number; originalCanvasHeight: number } {
  return {
    x: x / canvasWidth,
    y: y / canvasHeight,
    width: width / canvasWidth,
    height: height / canvasHeight,
    originalCanvasWidth: canvasWidth,
    originalCanvasHeight: canvasHeight,
  };
}

export function denormalizeCoordinates(
  highlight: { x: number; y: number; width: number; height: number; originalCanvasWidth?: number; originalCanvasHeight?: number },
  currentCanvasWidth: number,
  currentCanvasHeight: number
): { x: number; y: number; width: number; height: number } {
  if (!currentCanvasWidth || !currentCanvasHeight || currentCanvasWidth <= 0 || currentCanvasHeight <= 0) {
    console.warn('Invalid canvas dimensions:', { currentCanvasWidth, currentCanvasHeight });
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const originalWidth = highlight.originalCanvasWidth && highlight.originalCanvasWidth > 0 
    ? highlight.originalCanvasWidth 
    : currentCanvasWidth;
  
  const originalHeight = highlight.originalCanvasHeight && highlight.originalCanvasHeight > 0 
    ? highlight.originalCanvasHeight 
    : currentCanvasHeight;
  
  const scaleX = currentCanvasWidth / originalWidth;
  const scaleY = currentCanvasHeight / originalHeight;
  
  return {
    x: highlight.x * originalWidth * scaleX,
    y: highlight.y * originalHeight * scaleY,
    width: highlight.width * originalWidth * scaleX,
    height: highlight.height * originalHeight * scaleY,
  };
}

const UNLOCKED_BOOKS_KEY = 'unlocked-books';

export function getUnlockedBooks(): string[] {
  const stored = localStorage.getItem(UNLOCKED_BOOKS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function unlockBook(bookId: string): void {
  const unlocked = getUnlockedBooks();
  if (!unlocked.includes(bookId)) {
    unlocked.push(bookId);
    localStorage.setItem(UNLOCKED_BOOKS_KEY, JSON.stringify(unlocked));
  }
}

export function isBookUnlocked(bookId: string): boolean {
  return getUnlockedBooks().includes(bookId);
}

export function saveAnnotations(bookId: string, annotations: TextAnnotation[]): void {
  const storage: AnnotationsStorage = {
    bookId,
    annotations,
  };
  localStorage.setItem(getAnnotationsKey(bookId), JSON.stringify(storage));
}

export function loadAnnotations(bookId: string): TextAnnotation[] {
  const stored = localStorage.getItem(getAnnotationsKey(bookId));
  if (!stored) return [];
  
  try {
    const storage: AnnotationsStorage = JSON.parse(stored);
    return storage.annotations;
  } catch {
    return [];
  }
}

export function getAllAnnotations(): { bookId: string; annotations: TextAnnotation[] }[] {
  const allAnnotations: { bookId: string; annotations: TextAnnotation[] }[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pdf-annotations-')) {
      const bookId = key.replace('pdf-annotations-', '');
      const annotations = loadAnnotations(bookId);
      if (annotations.length > 0) {
        allAnnotations.push({ bookId, annotations });
      }
    }
  }
  
  return allAnnotations;
}

export function saveExams(exams: ExamEntry[]): void {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

export function loadExams(): ExamEntry[] {
  const stored = localStorage.getItem(EXAMS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addExam(exam: ExamEntry): void {
  const exams = loadExams();
  exams.push(exam);
  saveExams(exams);
}

export function deleteExam(examId: string): void {
  const exams = loadExams();
  const filtered = exams.filter(e => e.id !== examId);
  saveExams(filtered);
}
