import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User as UserIcon, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAIChat } from "@/hooks/use-ai";

type Message = { role: 'user' | 'ai'; content: string };

export function AIChatWidget({ articleContextId }: { articleContextId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your AI News Assistant. How can I help you understand today\'s stories?' }
  ]);
  const [input, setInput] = useState("");
  const [personality, setPersonality] = useState("Helpful Assistant");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: sendMessage, isPending } = useAIChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");

    sendMessage(
      { message: userMsg, personality, articleContextId },
      {
        onSuccess: (data) => {
          setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
        },
        onError: () => {
          setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to my servers right now." }]);
        }
      }
    );
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-tr from-primary to-blue-400 hover:scale-105 transition-transform duration-300 z-50 p-0"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] shadow-2xl flex flex-col z-50 overflow-hidden border-border/50 animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-500 p-4 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">News Assistant</h3>
            <div className="text-[10px] text-white/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-white hover:bg-white/20" onClick={() => setMessages([messages[0]])}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="bg-muted/50 p-2 border-b border-border/50 flex items-center gap-2 shrink-0">
        <Settings2 className="w-4 h-4 text-muted-foreground ml-1" />
        <Select value={personality} onValueChange={setPersonality}>
          <SelectTrigger className="h-7 text-xs bg-background border-transparent shadow-sm">
            <SelectValue placeholder="Personality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Helpful Assistant">Helpful Assistant</SelectItem>
            <SelectItem value="Formal News Anchor">Formal Anchor</SelectItem>
            <SelectItem value="Casual Reporter">Casual Reporter</SelectItem>
            <SelectItem value="Serious Analyst">Serious Analyst</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-muted border border-border/50 rounded-tl-sm text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="p-4 rounded-2xl bg-muted border border-border/50 rounded-tl-sm flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-background border-t border-border shrink-0 flex gap-2">
        <Input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={articleContextId ? "Ask about this article..." : "Ask me anything..."}
          className="rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/20"
        />
        <Button type="submit" size="icon" disabled={isPending || !input.trim()} className="rounded-full shrink-0 shadow-sm">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
