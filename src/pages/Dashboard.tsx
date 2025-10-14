import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { User, Lightbulb, MessageCircleQuestion, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [createdPersonaId, setCreatedPersonaId] = useState<string | null>(null);
  const n8nWebhookUrl = "https://jags0101.app.n8n.cloud/webhook-test/f71075d7-ab4f-4242-92ad-a69c78d0f319";

  const pollForSummary = async (personaId: string, maxAttempts = 9): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const { data, error } = await supabase
        .from('Persona')
        .select('Summary')
        .eq('Persona_Id', personaId)
        .single();
      
      if (error) {
        console.error('Error polling for summary:', error);
        continue;
      }
      
      if (data?.Summary) {
        console.log('Summary found:', data.Summary);
        return true;
      }
      
      console.log(`Polling attempt ${i + 1}/${maxAttempts} - no summary yet`);
    }
    
    return false;
  };

  const createChatbotConversation = async (personaId: string, personaName: string) => {
    try {
      const { error } = await supabase
        .from('Conversation')
        .insert({
          User_id: user!.id,
          persona_id: personaId,
          message: `Hello, I am ${personaName} — ask me anything!`,
          By_AI: true
        });
      
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Chatbot conversation initialized');
    } catch (error) {
      console.error('Failed to create chatbot conversation:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    // Validate inputs
    if (!name.trim() || !linkedinUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both the person's name and a valid LinkedIn URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate LinkedIn URL format
    if (!linkedinUrl.startsWith('https://www.linkedin.com/in/')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn URL starting with https://www.linkedin.com/in/",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a persona",
        variant: "destructive",
      });
      navigate('/signin');
      return;
    }

    setIsGenerating(true);
    setPersonaData(null);
    setCreatedPersonaId(null);

    let insertedPersonaId: string | null = null;

    try {
      // Step 1: Insert persona record first
      toast({
        title: "Saving persona...",
        description: "Creating your AI persona profile",
      });

      const { data: insertedPersona, error: insertError } = await supabase
        .from('Persona')
        .insert({
          Persona_Name: name,
          LinkedIn_URL: linkedinUrl,
          User_Id: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting persona:', insertError);
        throw new Error('Failed to save persona to database');
      }

      insertedPersonaId = insertedPersona.Persona_Id;
      setCreatedPersonaId(insertedPersonaId);
      console.log('Persona inserted with ID:', insertedPersonaId);

      // Step 2: Trigger n8n webhook for data scraping
      if (n8nWebhookUrl && insertedPersonaId) {
        try {
          toast({
            title: "Enriching profile...",
            description: "Scraping data from web sources",
          });

          await supabase.functions.invoke('trigger-n8n', {
            body: {
              webhookUrl: n8nWebhookUrl,
              personaData: {
                Persona_Id: insertedPersonaId,
                Persona_Name: name,
                LinkedIn_URL: linkedinUrl,
                User_Id: user.id,
                created_at: new Date().toISOString()
              }
            }
          });
          
          console.log('n8n webhook triggered');

          // Wait for n8n to scrape data (give it some time)
          toast({
            title: "Scraping data...",
            description: "Collecting information from LinkedIn and web sources",
          });
          await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds

        } catch (webhookError) {
          console.error('Error in n8n workflow:', webhookError);
          // Continue even if webhook fails
        }
      }

      // Step 3: Generate AI persona from scraped data
      toast({
        title: "Generating profile...",
        description: "AI is analyzing the persona details",
      });

      const { data, error } = await supabase.functions.invoke('generate-persona', {
        body: { personaId: insertedPersonaId }
      });

      if (error || data?.error) {
        console.error('Edge function error:', error || data.error);
        throw new Error(error?.message || data?.error || 'Failed to generate persona');
      }

      setPersonaData(data);

      // Step 4: Create chatbot conversation
      if (insertedPersonaId) {
        await createChatbotConversation(insertedPersonaId, name);
      }

      // Step 5: Success
      toast({
        title: `✅ ${name} has been created!`,
        description: "Summary generated successfully — start chatting now.",
      });

    } catch (error) {
      console.error('Error generating persona:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "We couldn't reach the AI service. Please try again.",
        variant: "destructive",
      });
      
      // Clean up failed persona if it was created
      if (insertedPersonaId) {
        try {
          await supabase.from('Persona').delete().eq('Persona_Id', insertedPersonaId);
        } catch (cleanupError) {
          console.error('Error cleaning up failed persona:', cleanupError);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" />
      </div>

      <div className="relative z-10">
        <Header showBackButton={false} />

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl md:text-6xl font-bold gradient-text">
                Create AI Personas ✨
              </h1>
              <Button
                variant="outline"
                onClick={() => navigate("/personas")}
                className="hover:border-primary hover:bg-primary/5 transition-all duration-300 rounded-xl"
              >
                My Personas
              </Button>
            </div>

          {/* Input Section */}
          <Card className="p-10 glass-card-glow">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  👤 Name of the person
                </label>
                <Input
                  placeholder="e.g., John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 text-base rounded-xl border-2 focus:border-primary transition-all"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  🔗 LinkedIn URL
                </label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-14 text-base rounded-xl border-2 focus:border-primary transition-all"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="w-full mt-8 h-16 text-lg bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[var(--shadow-neon)] transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 rounded-2xl font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Generating AI Persona... ⚡
                </>
              ) : (
                "Generate Persona ✨"
              )}
            </Button>
          </Card>

          {/* Quick Start Button - Shows immediately after persona creation */}
          {createdPersonaId && !personaData && (
            <Card className="p-8 glass-card-glow animate-slide-up border-2 border-primary/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2 gradient-text">Persona Created! 🎉</h3>
                  <p className="text-muted-foreground">
                    Your AI persona is being generated. Start chatting now while we finish processing! 💬
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/chat/${createdPersonaId}`)}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] rounded-2xl font-semibold hover:scale-105 transition-all"
                >
                  Start Chatting ⚡
                </Button>
              </div>
            </Card>
          )}

          {/* Results Section */}
          {personaData && (
            <div className="space-y-8 animate-slide-up">
              <h2 className="text-3xl font-bold gradient-text text-center">Your AI Persona is Ready! 🎊</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 glass-card-glow hover:scale-105 transition-all duration-300 border-2 border-primary/30 hover:border-primary/60">
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

                <Card className="p-6 glass-card-glow hover:scale-105 transition-all duration-300 border-2 border-secondary/30 hover:border-secondary/60">
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

                <Card className="p-6 glass-card-glow hover:scale-105 transition-all duration-300 border-2 border-accent/30 hover:border-accent/60">
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
                onClick={() => {
                  if (createdPersonaId) {
                    navigate(`/chat/${createdPersonaId}`);
                  } else {
                    toast({
                      title: "Error",
                      description: "Persona ID not found. Please try from My Personas page.",
                      variant: "destructive"
                    });
                  }
                }}
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300"
              >
                Start Chatting with {personaData.personaSummary.name}
              </Button>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;
