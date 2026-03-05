import { Link } from "wouter";
import { useState } from "react";
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle } from "@/hooks/use-articles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TipTapEditor } from "@/components/TipTapEditor";
import { format } from "date-fns";
import { Loader2, Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ArticleResponse, InsertArticle } from "@shared/schema";

const CATEGORIES = ["Politics", "Entertainment", "Technology", "Sports", "Local News", "Video"];

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { mutate: deleteArticle } = useDeleteArticle();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleResponse | null>(null);

  if (authLoading || articlesLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  if (!isAuthenticated || user?.role !== 'admin') {
    // If we're loading, don't show access denied yet
    if (authLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-serif font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You must have administrator privileges to access the newsroom dashboard.</p>
        <div className="flex gap-4">
          <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
          <Button asChild><Link href="/admin-login">Log In as Admin</Link></Button>
        </div>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article? This cannot be undone.")) {
      deleteArticle(id, {
        onSuccess: () => toast({ title: "Article deleted successfully" })
      });
    }
  };

  const openEdit = (article: ArticleResponse) => {
    setEditingArticle(article);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditingArticle(null);
    setIsFormOpen(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Newsroom Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage articles, categories, and featured content.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="w-4 h-4 mr-2" /> New Article
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {articles?.map((article) => (
                <tr key={article.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground max-w-xs truncate">
                    {article.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {article.isFeatured ? (
                      <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Featured</span>
                    ) : (
                      <span className="text-muted-foreground">Standard</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {article.viewCount} views
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(article.createdAt || new Date()), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(article)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!articles || articles.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No articles found. Start writing!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">
              {editingArticle ? "Edit Article" : "Create New Article"}
            </DialogTitle>
          </DialogHeader>
          <ArticleForm 
            initialData={editingArticle} 
            onSuccess={() => setIsFormOpen(false)} 
            authorId={String(user?.id || "admin")} // Fallback for demo
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted form component for cleaner state management
function ArticleForm({ initialData, onSuccess, authorId }: { initialData: ArticleResponse | null, onSuccess: () => void, authorId: string }) {
  const { mutate: create } = useCreateArticle();
  const { mutate: update } = useUpdateArticle();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<InsertArticle>>({
    title: initialData?.title || "",
    category: initialData?.category || "Local News",
    content: initialData?.content || "",
    imageUrl: initialData?.imageUrl || "",
    videoUrl: initialData?.videoUrl || "",
    isFeatured: initialData?.isFeatured || false,
    authorId: initialData?.authorId || authorId
  });

  const isPending = false; // Add real pending state if needed from hooks

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({ title: "Validation Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    if (initialData) {
      update({ id: initialData.id, ...formData }, {
        onSuccess: () => {
          toast({ title: "Article updated successfully" });
          onSuccess();
        }
      });
    } else {
      create(formData as InsertArticle, {
        onSuccess: () => {
          toast({ title: "Article published successfully" });
          onSuccess();
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Headline</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            className="text-lg font-semibold"
            placeholder="Breaking news headline..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={v => setFormData({...formData, category: v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Cover Image URL (Optional)</Label>
        {/* landing page hero scenic mountain landscape */}
        <Input 
          id="image" 
          value={formData.imageUrl || ""} 
          onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
          placeholder="https://images.unsplash.com/..."
        />
        {formData.imageUrl && (
          <div className="mt-2 h-32 rounded-lg overflow-hidden bg-muted">
            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Video URL (Optional - YouTube/MP4)</Label>
        <Input 
          id="video" 
          value={formData.videoUrl || ""} 
          onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
          placeholder="https://www.youtube.com/watch?v=... or .mp4 link"
        />
      </div>

      <div className="flex items-center space-x-2 bg-muted/50 p-4 rounded-xl border border-border">
        <Switch 
          id="featured" 
          checked={formData.isFeatured || false} 
          onCheckedChange={c => setFormData({...formData, isFeatured: c})} 
        />
        <Label htmlFor="featured" className="cursor-pointer font-medium">Feature this story on the homepage</Label>
      </div>

      <div className="space-y-2">
        <Label>Article Content</Label>
        <TipTapEditor 
          content={formData.content || ""} 
          onChange={html => setFormData({...formData, content: html})} 
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="px-8 shadow-md">
          {initialData ? "Save Changes" : "Publish Article"}
        </Button>
      </div>
    </form>
  );
}
