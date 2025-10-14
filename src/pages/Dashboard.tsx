import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { User, Lightbulb, MessageCircleQuestion } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = () => {
    if (name && linkedinUrl) {
      setShowResults(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Logo />
            <Button
              variant="ghost"
              onClick={() => navigate("/personas")}
              className="text-muted-foreground hover:text-foreground"
            >
              My Personas
            </Button>
          </div>
          
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
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-center gradient-text">
            Create AI Personas
          </h1>

          {/* Input Section */}
          <Card className="p-8 glass-card shadow-[var(--shadow-elevated)]">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Name of the person
                </label>
                <Input
                  placeholder="e.g., John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  LinkedIn URL
                </label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full mt-6 h-12 text-base bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300"
            >
              Generate Persona
            </Button>
          </Card>

          {/* Results Section */}
          {showResults && (
            <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
              <Card className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Summary</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Senior Product Manager with 10+ years of experience in tech startups. 
                    Specializes in AI/ML products and user-centric design.
                  </p>
                </div>
              </Card>

              <Card className="p-6 glass-card hover:shadow-[var(--glow-secondary)] transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold">Key Interests</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• AI & Machine Learning</li>
                    <li>• Product Strategy</li>
                    <li>• User Experience Design</li>
                    <li>• Startup Growth</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircleQuestion className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Questions to Ask</h3>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• What's your approach to product-market fit?</li>
                    <li>• How do you balance user needs with business goals?</li>
                    <li>• What AI trends excite you most?</li>
                  </ul>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
