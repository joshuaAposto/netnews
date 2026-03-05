import { useArticles } from "@/hooks/use-articles";
import { Link } from "wouter";
import { Zap } from "lucide-react";

export function BreakingTicker() {
  const { data: articles, isLoading } = useArticles({ trending: "true" });

  if (isLoading || !articles || articles.length === 0) return null;

  return (
    <div className="bg-foreground text-background border-b border-border/10 overflow-hidden relative flex items-center h-10">
      <div className="absolute left-0 z-10 h-full bg-accent text-accent-foreground px-4 flex items-center font-bold text-sm uppercase tracking-widest shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        <Zap className="w-4 h-4 mr-2 animate-pulse" />
        Breaking
      </div>
      
      <div className="flex-1 overflow-hidden ml-32 relative">
        <div className="animate-ticker whitespace-nowrap flex items-center">
          {articles.map((article, i) => (
            <span key={article.id} className="flex items-center text-sm font-medium">
              <Link href={`/article/${article.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}`} className="hover:text-primary-foreground hover:underline transition-colors">
                {article.title}
              </Link>
              {i < articles.length - 1 && (
                <span className="mx-6 text-background/30">•</span>
              )}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          <span className="mx-6 text-background/30">•</span>
          {articles.map((article, i) => (
            <span key={`dup-${article.id}`} className="flex items-center text-sm font-medium">
              <Link href={`/article/${article.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}`} className="hover:text-primary-foreground hover:underline transition-colors">
                {article.title}
              </Link>
              {i < articles.length - 1 && (
                <span className="mx-6 text-background/30">•</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
