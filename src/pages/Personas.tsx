import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { User, MessageSquare, ArrowLeft } from "lucide-react";

const mockPersonas = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Product Manager",
    company: "Tech Startup",
    summary: "PM with 10+ years experience in AI/ML products"
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    role: "Engineering Director",
    company: "Fortune 500",
    summary: "Leading large-scale engineering teams"
  },
  {
    id: "3",
    name: "Emily Watson",
    role: "UX Design Lead",
    company: "Design Agency",
    summary: "Award-winning designer specializing in SaaS"
  }
];

const Personas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="mb-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold gradient-text">My Personas</h1>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPersonas.map((persona) => (
              <Card
                key={persona.id}
                className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/chat/${persona.id}`)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-xl">
                      {persona.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-1">{persona.name}</h3>
                    <p className="text-sm text-muted-foreground">{persona.role}</p>
                    <p className="text-sm text-muted-foreground">{persona.company}</p>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {persona.summary}
                  </p>

                  <Button
                    variant="outline"
                    className="w-full group-hover:border-primary group-hover:bg-primary/5 transition-all"
                  >
                    Start Conversation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Personas;
