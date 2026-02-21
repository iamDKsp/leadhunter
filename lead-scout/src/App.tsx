import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { WhatsAppProvider, useWhatsApp } from "./context/WhatsAppContext";
import { IncomingMessageNotification } from "./components/chat/IncomingMessageNotification";

const queryClient = new QueryClient();

// Token handler component that runs before anything else
const TokenHandler = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const urlToken = searchParams.get('t');

  if (urlToken) {
    localStorage.setItem('token', urlToken);
    // Remove token from URL for security
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: newUrl }, "", newUrl);
    // Reload to ensure all components see the new token
    window.location.reload();
  }
  return null;
};

// Global notification overlay — must be inside WhatsAppProvider + BrowserRouter
const GlobalNotifications = () => {
  const { pendingNotifications, dismissNotification, dismissAllNotifications } = useWhatsApp();

  return (
    <IncomingMessageNotification
      notifications={pendingNotifications}
      onDismiss={dismissNotification}
      onDismissAll={dismissAllNotifications}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TokenHandler />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WhatsAppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/" element={<Index />} />
            <Route path="/:view" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalNotifications />
        </BrowserRouter>
      </WhatsAppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

