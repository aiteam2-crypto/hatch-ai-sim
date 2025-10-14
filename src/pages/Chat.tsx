import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Plus, Search, ArrowLeft, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const mockChats = [
  { id: "1", name: "First conversation", preview: "How do you approach..." },
  { id: "2", name: "Product Strategy", preview: "Tell me about your..." }
];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the AI persona of Sarah Chen. Feel free to ask me anything about product management, AI/ML, or my experience in tech!"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "That's a great question! Based on my experience..."
        }
      ]);
    }, 1000);

    setInput("");
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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/10">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border/50 backdrop-blur-sm bg-background/80 flex flex-col">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="rounded-full text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Button className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {mockChats.map((chat) => (
              <Card
                key={chat.id}
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
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
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="p-6 border-b border-border/50 backdrop-blur-sm bg-background/80">
          <h1 className="text-2xl font-bold gradient-text">Ask Me Anything</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chatting with Sarah Chen's AI Persona
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
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                      : "glass-card"
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
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-12"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
