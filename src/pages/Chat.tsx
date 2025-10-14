import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Plus, Search, ArrowLeft, LogOut, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Persona {
  Persona_Id: string;
  Persona_Name: string;
  Summary: any;
  User_Id: string;
}

const mockChats = [
  { id: "1", name: "First conversation", preview: "How do you approach..." },
  { id: "2", name: "Product Strategy", preview: "Tell me about your..." }
];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchPersona = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No persona ID provided",
          variant: "destructive",
        });
        navigate("/personas");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("Persona")
          .select("*")
          .eq("Persona_Id", id)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Error",
            description: "Persona not found",
            variant: "destructive",
          });
          navigate("/personas");
          return;
        }

        if (!data.Summary) {
          toast({
            title: "Summary Not Ready",
            description: "This persona's summary is still being generated. Please try again later.",
            variant: "destructive",
          });
          navigate("/personas");
          return;
        }

        setPersona(data);
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm ${data.Persona_Name}. Feel free to ask me anything!`
          }
        ]);
      } catch (error) {
        console.error("Error fetching persona:", error);
        toast({
          title: "Error",
          description: "Failed to load persona",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersona();
  }, [id, navigate, toast]);

  const handleSend = async () => {
    if (!input.trim() || !persona || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);

    // Add user message to UI
    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Call OpenAI via edge function
      const { data, error } = await supabase.functions.invoke("chat-with-persona", {
        body: {
          messages: messages
            .concat(newUserMessage)
            .map(m => ({ role: m.role, content: m.content })),
          personaName: persona.Persona_Name,
          personaSummary: persona.Summary,
        },
      });

      if (error) throw error;

      const aiMessage = data.message;
      
      // Add AI message to UI
      setMessages(prev => [...prev, { role: "assistant", content: aiMessage }]);

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not fetch a response. Please try again.",
        variant: "destructive",
      });
      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = () => {
    navigate("/");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/personas");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-muted-foreground">Loading persona...</p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return null;
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Cluely-style animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(162,89,255,0.15),transparent_60%),radial-gradient(ellipse_at_top_right,rgba(42,250,223,0.15),transparent_60%)]"></div>
      
      {/* Floating emoji particles */}
      <div className="absolute top-20 left-20 text-4xl animate-float opacity-30">💬</div>
      <div className="absolute top-40 right-32 text-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}>⚡</div>
      <div className="absolute bottom-32 left-40 text-4xl animate-float opacity-25" style={{ animationDelay: '4s' }}>🌈</div>

      {/* Sidebar */}
      <aside className="w-80 border-r border-border/50 backdrop-blur-sm bg-background/80 flex flex-col relative z-10">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-xl hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Button className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] rounded-xl font-semibold">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {mockChats.map((chat) => (
              <Card
                key={chat.id}
                className="p-3 cursor-pointer hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/30 rounded-xl"
              >
                <h4 className="font-medium text-sm mb-1">{chat.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{chat.preview}</p>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Chat Header */}
        <header className="p-6 border-b border-border/50 backdrop-blur-sm bg-background/80">
          <h1 className="text-3xl font-bold gradient-text">Ask Me Anything 💬</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Chatting with <span className="text-primary font-semibold">{persona.Persona_Name}</span> ⚡
          </p>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div
                  className={`max-w-[80%] p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 shadow-lg glow-primary'
                      : 'bg-gradient-to-br from-secondary/30 to-accent/30 border border-secondary/40 shadow-lg glow-secondary'
                  }`}
                >
                  <p className="text-foreground leading-relaxed text-lg">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-gradient-to-r from-card/70 via-card/80 to-card/70 backdrop-blur-xl p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message... 💬"
                disabled={isSending}
                className="flex-1 rounded-3xl py-7 text-lg border-primary/40 focus:border-primary bg-background/60 backdrop-blur-xl hover:bg-background/70 transition-all font-medium"
              />
              <Button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="px-10 py-7 rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-neon transition-all duration-300 hover:scale-105 font-bold text-lg relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {isSending ? "Sending..." : "Send 🚀"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
