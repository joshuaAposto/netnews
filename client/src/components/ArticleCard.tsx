import { Link } from "wouter";
import { format } from "date-fns";
import type { ArticleResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock } from "lucide-react";

interface ArticleCardProps {
  article: ArticleResponse;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  // Use a reliable fallback image placeholder
  const imageUrl = article.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80`;

  const linkHref = `/article/${article.slug || article.id}`;

  if (featured) {
    return (
      <Link href={linkHref} className="block group relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9] bg-muted shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 z-0">
          <img 
            src={imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        
        <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-end">
          <Badge className="w-fit mb-4 bg-accent text-accent-foreground hover:bg-accent/90 border-none font-semibold px-3 py-1 text-xs uppercase tracking-wider">
            {article.category}
          </Badge>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 leading-tight group-hover:text-primary-foreground transition-colors">
            {article.title}
          </h2>
          {article.sourceName && (
            <div className="mb-3 text-xs font-medium text-white/70 italic">
              Source: {article.sourceName}
            </div>
          )}
          <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {format(new Date(article.createdAt || new Date()), "MMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {article.viewCount} views
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={linkHref} className="group flex flex-col bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 hover:shadow-md hover:border-border transition-all duration-300">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img 
          src={imageUrl} 
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm font-semibold">
          {article.category}
        </Badge>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-serif text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
          {/* Strip HTML tags for preview */}
          {article.content.replace(/<[^>]*>?/gm, '')}
        </p>
        {article.sourceName && (
          <div className="mb-3 text-[10px] font-medium text-muted-foreground italic uppercase tracking-wider">
            Source: {article.sourceName}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(article.createdAt || new Date()), "MMM dd")}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {article.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
