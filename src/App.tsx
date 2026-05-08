import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ContasPage from "./pages/ContasPage";
import RendaPage from "./pages/RendaPage";
import PoupancaPage from "./pages/PoupancaPage";
import HistoricoPage from "./pages/HistoricoPage";
import AjustesPage from "./pages/AjustesPage";
import PerfilPage from "./pages/PerfilPage";
import InvestimentosPage from "./pages/investimentos/InvestimentosPage";
import NovoInvestimentoPage from "./pages/investimentos/NovoInvestimentoPage";
import InvestimentoDetalhePage from "./pages/investimentos/InvestimentoDetalhePage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/contas" element={<AppLayout><ContasPage /></AppLayout>} />
              <Route path="/renda" element={<AppLayout><RendaPage /></AppLayout>} />
              <Route path="/poupanca" element={<AppLayout><PoupancaPage /></AppLayout>} />
              <Route path="/historico" element={<AppLayout><HistoricoPage /></AppLayout>} />
              <Route path="/ajustes" element={<AppLayout><AjustesPage /></AppLayout>} />
              <Route path="/perfil" element={<AppLayout><PerfilPage /></AppLayout>} />
              <Route path="/investimentos" element={<AppLayout><InvestimentosPage /></AppLayout>} />
              <Route path="/investimentos/novo" element={<AppLayout><NovoInvestimentoPage /></AppLayout>} />
              <Route path="/investimentos/:id" element={<AppLayout><InvestimentoDetalhePage /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
