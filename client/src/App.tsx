import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";

import { Navbar } from "@/components/layout/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ArticleView from "@/pages/ArticleView";
import Category from "@/pages/Category";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AuthPage from "@/pages/AuthPage";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/article/:id" component={ArticleView} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="news-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Router />
            </main>
            {/* Simple Footer */}
            <footer className="bg-muted py-8 mt-auto border-t border-border">
              <div className="container max-w-7xl mx-auto px-4 text-center">
                <span className="font-serif font-black text-xl text-foreground">
                  NET<span className="text-primary">NEWS</span>
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  © {new Date().getFullYear()} NetNews Media Network. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
