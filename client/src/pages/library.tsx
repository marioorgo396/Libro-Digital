import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Book, BookOpen, Lock, Unlock, Search, ClipboardList, MessageSquareText } from 'lucide-react';
import { isBookUnlocked, unlockBook } from '@/lib/pdfHelpers';
import type { Book as BookType, BooksConfig } from '@shared/schema';

export default function Library() {
  const [, setLocation] = useLocation();
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [licenseInputs, setLicenseInputs] = useState<Record<string, string>>({});
  const [unlockedBooks, setUnlockedBooks] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadBooks();
    setUnlockedBooks(getStoredUnlockedBooks());
  }, []);

  const getStoredUnlockedBooks = (): string[] => {
    const stored = localStorage.getItem('unlocked-books');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  };

  const loadBooks = async () => {
    try {
      const response = await fetch('/libros/books.json');
      if (!response.ok) throw new Error('No se pudo cargar la biblioteca');
      
      const config: BooksConfig = await response.json();
      setBooks(config.books);
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la biblioteca de libros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockBook = (book: BookType) => {
    const enteredLicense = licenseInputs[book.id] || '';
    
    if (enteredLicense.trim().toUpperCase() === book.license.toUpperCase()) {
      unlockBook(book.id);
      setUnlockedBooks([...unlockedBooks, book.id]);
      setLicenseInputs({ ...licenseInputs, [book.id]: '' });
      
      toast({
        title: 'Libro desbloqueado',
        description: `"${book.title}" ahora está disponible`,
      });
    } else {
      toast({
        title: 'Licencia incorrecta',
        description: 'La licencia introducida no es válida',
        variant: 'destructive',
      });
    }
  };

  const handleOpenBook = (book: BookType) => {
    setLocation(`/visor/${book.id}`);
  };

  const isUnlocked = (bookId: string) => unlockedBooks.includes(bookId);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Cargando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Mi Biblioteca</h1>
                  <p className="text-sm text-muted-foreground">
                    {books.length} {books.length === 1 ? 'libro disponible' : 'libros disponibles'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setLocation('/examenes')}
                  data-testid="button-exams"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Exámenes / Entregas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/anotaciones')}
                  data-testid="button-all-annotations"
                >
                  <MessageSquareText className="w-4 h-4 mr-2" />
                  Anotaciones
                </Button>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar libros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-books"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm ? 'No se encontraron libros' : 'No hay libros en la biblioteca'}
            </h2>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Añade libros a la carpeta "libros/" para comenzar'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Card 
                key={book.id} 
                className="flex flex-col"
                data-testid={`card-book-${book.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                      <CardDescription className="mt-1">{book.author}</CardDescription>
                    </div>
                    <div className={`p-2 rounded-md ${isUnlocked(book.id) ? 'bg-green-500/10' : 'bg-muted'}`}>
                      {isUnlocked(book.id) ? (
                        <Unlock className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {book.description}
                  </p>
                  
                  <div className="mt-auto space-y-3">
                    {isUnlocked(book.id) ? (
                      <Button 
                        className="w-full" 
                        onClick={() => handleOpenBook(book)}
                        data-testid={`button-open-book-${book.id}`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Abrir libro
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Introduce la licencia"
                            value={licenseInputs[book.id] || ''}
                            onChange={(e) => setLicenseInputs({ 
                              ...licenseInputs, 
                              [book.id]: e.target.value 
                            })}
                            className="flex-1"
                            data-testid={`input-license-${book.id}`}
                          />
                          <Button 
                            onClick={() => handleUnlockBook(book)}
                            data-testid={`button-unlock-${book.id}`}
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Introduce la licencia para desbloquear
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
