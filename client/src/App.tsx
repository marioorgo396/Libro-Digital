import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Library from "@/pages/library";
import PDFViewer from "@/pages/pdf-viewer";
import Exams from "@/pages/exams";
import Annotations from "@/pages/annotations";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Library} />
      <Route path="/visor/:bookId" component={PDFViewer} />
      <Route path="/examenes" component={Exams} />
      <Route path="/anotaciones" component={Annotations} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
