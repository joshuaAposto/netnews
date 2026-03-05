import { useParams } from "wouter";
import { useArticle, useIncrementView } from "@/hooks/use-articles";
import { useComments, useCreateComment, useReactions, useToggleReaction } from "@/hooks/use-interactions";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Heart, ThumbsUp, MessageSquare, Share2, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading, error } = useArticle(id);
  const { mutate: incrementView } = useIncrementView();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const articleId = article?.id || 0;
  const { data: comments } = useComments(articleId);
  const { mutate: createComment, isPending: isCommenting } = useCreateComment();
  const isPending = isCommenting;

  const { data: reactions } = useReactions(articleId);
  const { mutate: toggleReaction } = useToggleReaction();

  const [commentContent, setCommentContent] = useState("");

  useEffect(() => {
    if (articleId && article) {
      incrementView(articleId);
    }
  }, [articleId, article, incrementView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading story...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
      </div>
    );
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Authentication required", description: "Please log in to comment.", variant: "destructive" });
      return;
    }
    if (!commentContent.trim()) return;

    createComment(
      { articleId, content: commentContent },
      { onSuccess: () => setCommentContent("") }
    );
  };

  const handleReaction = (type: string) => {
    if (!isAuthenticated) {
      toast({ title: "Authentication required", description: "Please log in to react.", variant: "destructive" });
      return;
    }
    toggleReaction({ articleId, type });
  };

  // Safe placeholder image
  const imageUrl = article.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80`;

  // Process reactions
  const likes = reactions?.filter(r => r.type === 'Like').length || 0;
  const hearts = reactions?.filter(r => r.type === 'Heart').length || 0;
  const userReactedLike = reactions?.some(r => r.type === 'Like' && String(r.userId) === String(user?.id));
  const userReactedHeart = reactions?.some(r => r.type === 'Heart' && String(r.userId) === String(user?.id));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header / Video Section */}
      <div className="w-full bg-black">
        {article.videoUrl ? (
          <div className="w-full aspect-video max-w-7xl mx-auto">
            {article.videoUrl.includes('youtube.com') || article.videoUrl.includes('youtu.be') ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${article.videoUrl.split('v=')[1]?.split('&')[0] || article.videoUrl.split('/').pop()}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            ) : (
              <video 
                src={article.videoUrl} 
                controls 
                className="w-full h-full object-contain"
                poster={article.imageUrl || undefined}
              />
            )}
          </div>
        ) : (
          <div className="relative h-[40vh] md:h-[60vh] w-full">
            <img src={imageUrl} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground mb-4 px-3 py-1 font-bold shadow-lg">
            {article.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-foreground leading-tight mb-6">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center overflow-hidden">
                {article.author?.profileImageUrl ? (
                  <img src={article.author.profileImageUrl} alt="Author" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-foreground">
                {article.author ? `${article.author.firstName} ${article.author.lastName}` : "News Desk"}
              </span>
            </div>
            <span>•</span>
            <span>{format(new Date(article.createdAt || new Date()), "MMMM dd, yyyy")}</span>
            <span>•</span>
            <span>{article.viewCount} views</span>
          </div>
        </div>
        <div 
          className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-a:text-primary max-w-none animate-in fade-in duration-1000"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.sourceUrl && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/50 text-sm">
            <p className="text-muted-foreground">
              This article was automatically curated. 
              {article.sourceName && <span> Original source: <strong>{article.sourceName}</strong>.</span>}
              <a 
                href={article.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline font-medium"
              >
                Read original article →
              </a>
            </p>
          </div>
        )}

        {/* Interaction Bar */}
        <div className="mt-12 py-6 border-y border-border/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <Button 
              variant={userReactedLike ? "default" : "outline"} 
              size="sm" 
              className="rounded-full shadow-sm"
              onClick={() => handleReaction('Like')}
            >
              <ThumbsUp className={`w-4 h-4 mr-2 ${userReactedLike ? 'fill-current' : ''}`} />
              {likes} Likes
            </Button>
            <Button 
              variant={userReactedHeart ? "secondary" : "outline"} 
              size="sm" 
              className={`rounded-full shadow-sm ${userReactedHeart ? 'text-accent border-accent/20 bg-accent/10' : ''}`}
              onClick={() => handleReaction('Heart')}
            >
              <Heart className={`w-4 h-4 mr-2 ${userReactedHeart ? 'fill-accent text-accent' : ''}`} />
              {hearts}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="rounded-full">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>

        {/* Comments Section */}
        <section className="mt-12">
          <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Comments ({comments?.length || 0})
          </h3>

          {isAuthenticated ? (
            <form onSubmit={handleComment} className="mb-10 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <Textarea 
                placeholder="Share your thoughts on this story..." 
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                className="mb-4 resize-none bg-background focus-visible:ring-primary/20"
                rows={3}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || !commentContent.trim()} className="font-semibold shadow-md">
                  {isCommenting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-10 p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center">
              <p className="text-muted-foreground mb-4">Join the conversation with other readers.</p>
              <Button asChild>
                <a href="/login">Log in to Comment</a>
              </Button>
            </div>
          )}

          <div className="space-y-6">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                  {comment.user?.profileImageUrl ? (
                    <img src={comment.user.profileImageUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {(comment.user?.firstName?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-card border border-border/50 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">
                      {(comment.user as any)?.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(comment.createdAt || new Date()), "MMM dd, p")}
                    </span>
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AIChatWidget articleContextId={articleId} />
    </div>
  );
}
