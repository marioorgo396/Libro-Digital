import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, CalendarDays, ClipboardList, BookOpen } from 'lucide-react';
import { loadExams, addExam, deleteExam } from '@/lib/pdfHelpers';
import type { ExamEntry, Book, BooksConfig } from '@shared/schema';

export default function Exams() {
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setExams(loadExams());
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch('/libros/books.json');
      if (response.ok) {
        const config: BooksConfig = await response.json();
        setBooks(config.books);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const handleAddExam = () => {
    if (!newTitle.trim() || !newDate) {
      toast({
        title: 'Error',
        description: 'Título y fecha son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const newExam: ExamEntry = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      date: newDate,
      description: newDescription.trim() || undefined,
      bookIds: [],
      timestamp: Date.now(),
    };

    addExam(newExam);
    setExams([...exams, newExam]);
    setNewTitle('');
    setNewDate('');
    setNewDescription('');
    setShowForm(false);

    toast({
      title: 'Examen añadido',
      description: 'El examen se ha guardado correctamente',
    });
  };

  const handleDeleteExam = (examId: string) => {
    deleteExam(examId);
    setExams(exams.filter(e => e.id !== examId));

    toast({
      title: 'Examen eliminado',
      description: 'El examen se ha eliminado correctamente',
    });
  };

  const getBookTitle = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book?.title || bookId;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingExams = sortedExams.filter(e => new Date(e.date) >= new Date(new Date().toDateString()));
  const pastExams = sortedExams.filter(e => new Date(e.date) < new Date(new Date().toDateString()));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Exámenes y Entregas</h1>
                <p className="text-sm text-muted-foreground">
                  {exams.length} {exams.length === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowForm(!showForm)}
              data-testid="button-add-exam"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Examen
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nuevo Examen / Entrega</CardTitle>
              <CardDescription>Añade una nueva fecha importante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej: Examen Filosofía Tema 1"
                    data-testid="input-exam-title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha *</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    data-testid="input-exam-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción (opcional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="resize-none"
                  data-testid="textarea-exam-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddExam} data-testid="button-save-exam">
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {exams.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No hay exámenes programados
            </h2>
            <p className="text-muted-foreground">
              Añade tus exámenes y entregas para tenerlos organizados
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingExams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Próximos</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingExams.map((exam) => (
                    <Card key={exam.id} data-testid={`card-exam-${exam.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{exam.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteExam(exam.id)}
                            data-testid={`button-delete-exam-${exam.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(exam.date)}
                        </CardDescription>
                      </CardHeader>
                      {exam.description && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastExams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">Pasados</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastExams.map((exam) => (
                    <Card key={exam.id} className="opacity-60" data-testid={`card-exam-${exam.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{exam.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteExam(exam.id)}
                            data-testid={`button-delete-exam-${exam.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(exam.date)}
                        </CardDescription>
                      </CardHeader>
                      {exam.description && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
