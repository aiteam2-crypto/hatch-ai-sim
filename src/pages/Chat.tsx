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
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float-slow" />
      </div>

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
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <Card
                  className={`max-w-[80%] p-5 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg rounded-2xl rounded-tr-sm"
                      : "glass-card-glow rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-background/80">
          <div className="max-w-3xl mx-auto flex gap-4">
            <Input
              placeholder="Type your message... 💭"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-14 text-base rounded-2xl border-2 focus:border-primary transition-all"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isSending || !input.trim()}
              className="h-14 w-14 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] disabled:opacity-50 hover:scale-105 transition-all"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
