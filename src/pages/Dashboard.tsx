import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { User, Lightbulb, MessageCircleQuestion, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonaSummary {
  name: string;
  shortBio: string;
  personalityTone: string;
  expertise: string[];
  commonPhrases: string[];
  writingStyle: string;
  coreTopics: string[];
  exampleResponses: string[];
}

interface PersonaData {
  personaSummary: PersonaSummary;
  chatbotInstructions: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);

  const handleGenerate = async () => {
    if (!name || !linkedinUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and LinkedIn URL",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPersonaData(null);

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-persona', {
        body: {
          name,
          linkedinUrl,
          scrapedData: `Professional profile for ${name}. Based on LinkedIn and public sources.`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate persona');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPersonaData(data);
      
      toast({
        title: "Persona Generated!",
        description: "Your AI persona is ready to chat",
      });

    } catch (error) {
      console.error('Error generating persona:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate persona. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header showBackButton={false} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-5xl font-bold gradient-text">
              Create AI Personas
            </h1>
            <Button
              variant="ghost"
              onClick={() => navigate("/personas")}
              className="text-muted-foreground hover:text-foreground"
            >
              My Personas
            </Button>
          </div>

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
              disabled={isGenerating}
              className="w-full mt-6 h-12 text-base bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating AI Persona...
                </>
              ) : (
                "Generate Persona"
              )}
            </Button>
          </Card>

          {/* Results Section */}
          {personaData && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Summary</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {personaData.personaSummary.shortBio}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <strong>Style:</strong> {personaData.personaSummary.writingStyle}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 glass-card hover:shadow-[var(--glow-secondary)] transition-all duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold">Expertise</h3>
                    <ul className="text-muted-foreground space-y-2">
                      {personaData.personaSummary.expertise.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircleQuestion className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Core Topics</h3>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      {personaData.personaSummary.coreTopics.map((topic, idx) => (
                        <li key={idx}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <Card className="p-6 glass-card">
                <h3 className="text-xl font-semibold mb-4">Example Responses</h3>
                <div className="space-y-3">
                  {personaData.personaSummary.exampleResponses.map((response, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      "{response}"
                    </div>
                  ))}
                </div>
              </Card>

              <Button
                onClick={() => navigate('/chat/new')}
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300"
              >
                Start Chatting with {personaData.personaSummary.name}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
