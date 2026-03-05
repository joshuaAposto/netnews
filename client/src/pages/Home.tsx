import { useArticles } from "@/hooks/use-articles";
import { ArticleCard } from "@/components/ArticleCard";
import { BreakingTicker } from "@/components/BreakingTicker";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Loader2, TrendingUp, Sparkles } from "lucide-react";

export default function Home() {
  const { data: featuredArticles, isLoading: loadingFeatured } = useArticles({ isFeatured: "true" });
  const { data: allArticles, isLoading: loadingAll } = useArticles();

  if (loadingFeatured || loadingAll) {
    return (
      <div className="min-h-screen bg-background">
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading latest news...</p>
        </div>
      </div>
    );
  }

  const featured = featuredArticles?.[0];
  // Filter out the featured article from the main feed to avoid duplication
  const feed = allArticles?.filter(a => a.id !== featured?.id).slice(0, 12) || [];
  
  // Just take top 4 by view count for sidebar
  const trending = [...(allArticles || [])].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <BreakingTicker />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Featured Section */}
        {featured && (
          <section className="mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Top Story
            </h2>
            <ArticleCard article={featured} featured />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-serif font-bold border-b-2 border-primary pb-2 mb-6 inline-block">
              Latest News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {feed.map((article, i) => (
                <div key={article.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending Now
              </h2>
              <div className="space-y-6">
                {trending.map((article, i) => (
                  <div key={article.id} className="group flex gap-4 items-start">
                    <span className="text-3xl font-serif font-black text-muted-foreground/30 group-hover:text-primary/40 transition-colors leading-none">
                      {i + 1}
                    </span>
                    <div>
                      <a href={`/article/${article.id}`} className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </a>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        {article.category} • {article.viewCount} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter or Ad placeholder */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="font-serif text-2xl font-bold mb-2 relative z-10">Stay Informed</h3>
              <p className="text-primary-foreground/80 text-sm mb-6 relative z-10">Get the latest breaking news delivered to your inbox daily.</p>
              <div className="flex gap-2 relative z-10">
                <input type="email" placeholder="Email address" className="w-full px-3 py-2 rounded-lg text-foreground text-sm focus:outline-none" />
                <button className="bg-foreground text-background px-4 py-2 rounded-lg font-bold text-sm hover:bg-foreground/90 transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      
      <AIChatWidget />
    </div>
  );
}
