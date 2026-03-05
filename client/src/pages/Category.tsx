import { useParams } from "wouter";
import { useArticles } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2 } from "lucide-react";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  
  // Format slug back to category string (e.g., 'local-news' -> 'Local News')
  const categoryName = slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const { data: articles, isLoading } = useArticles({ category: categoryName });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 pb-6 border-b-2 border-primary/20">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground">
          {categoryName}
        </h1>
        <p className="text-muted-foreground mt-3 font-medium">
          The latest coverage and updates on {categoryName?.toLowerCase()}.
        </p>
      </div>

      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <div key={article.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border border-dashed">
          <p className="text-xl font-serif text-muted-foreground">No articles found in this category yet.</p>
        </div>
      )}
    </div>
  );
}
