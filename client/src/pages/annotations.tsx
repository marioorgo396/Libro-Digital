import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquareText, BookOpen, FileText } from 'lucide-react';
import { getAllAnnotations } from '@/lib/pdfHelpers';
import type { TextAnnotation, Book, BooksConfig } from '@shared/schema';

interface BookAnnotations {
  bookId: string;
  bookTitle: string;
  annotations: TextAnnotation[];
}

export default function Annotations() {
  const [, setLocation] = useLocation();
  const [bookAnnotations, setBookAnnotations] = useState<BookAnnotations[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/libros/books.json');
      if (response.ok) {
        const config: BooksConfig = await response.json();
        setBooks(config.books);
        
        const allAnnotations = getAllAnnotations();
        const enrichedAnnotations = allAnnotations.map(({ bookId, annotations }) => {
          const book = config.books.find(b => b.id === bookId);
          return {
            bookId,
            bookTitle: book?.title || bookId,
            annotations: annotations.sort((a, b) => a.pageNumber - b.pageNumber),
          };
        }).filter(ba => ba.annotations.length > 0);
        
        setBookAnnotations(enrichedAnnotations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAnnotations = () => {
    return bookAnnotations.reduce((sum, ba) => sum + ba.annotations.length, 0);
  };

  const groupAnnotationsByPage = (annotations: TextAnnotation[]) => {
    const grouped: Record<number, TextAnnotation[]> = {};
    annotations.forEach(a => {
      if (!grouped[a.pageNumber]) {
        grouped[a.pageNumber] = [];
      }
      grouped[a.pageNumber].push(a);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Cargando anotaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-md">
              <MessageSquareText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Todas las Anotaciones</h1>
              <p className="text-sm text-muted-foreground">
                {getTotalAnnotations()} {getTotalAnnotations() === 1 ? 'anotación' : 'anotaciones'} en {bookAnnotations.length} {bookAnnotations.length === 1 ? 'libro' : 'libros'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {bookAnnotations.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No hay anotaciones
            </h2>
            <p className="text-muted-foreground">
              Las anotaciones que añadas en el visor aparecerán aquí organizadas por libro y página
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {bookAnnotations.map(({ bookId, bookTitle, annotations }) => {
              const pageGroups = groupAnnotationsByPage(annotations);
              const pageNumbers = Object.keys(pageGroups).map(Number).sort((a, b) => a - b);
              
              return (
                <Card key={bookId} data-testid={`card-book-annotations-${bookId}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{bookTitle}</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/visor/${bookId}`)}
                        data-testid={`button-open-book-${bookId}`}
                      >
                        Abrir libro
                      </Button>
                    </div>
                    <CardDescription>
                      {annotations.length} {annotations.length === 1 ? 'anotación' : 'anotaciones'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pageNumbers.map(pageNumber => (
                      <div key={pageNumber} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Página {pageNumber}
                          </span>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                          {pageGroups[pageNumber].map(annotation => (
                            <div
                              key={annotation.id}
                              className="p-3 bg-card rounded-md border"
                              data-testid={`annotation-${annotation.id}`}
                            >
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {annotation.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(annotation.timestamp).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
