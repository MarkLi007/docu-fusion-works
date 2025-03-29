
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import SubmitPaper from "./pages/SubmitPaper";
import SearchPaper from "./pages/SearchPaper";
import MyPapers from "./pages/MyPapers";
import PaperDetail from "./pages/PaperDetail";
import AddVersion from "./pages/AddVersion";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/submit" element={<SubmitPaper />} />
            <Route path="/search" element={<SearchPaper />} />
            <Route path="/my-papers" element={<MyPapers />} />
            <Route path="/paper/:id" element={<PaperDetail />} />
            <Route path="/paper/:id/add-version" element={<AddVersion />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Catch-all not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
