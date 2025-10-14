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
  const [activeTab, setActiveTab] = useState<'summary' | 'interests' | 'questions'>('summary');
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
      {/* Cluely-style Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-30 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(162,89,255,0.2),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(42,250,223,0.2),transparent_50%)]"></div>
      
      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-particle"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      
      {/* Loading Animation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl">
          <div className="text-center space-y-8 animate-fade-in">
            {/* Pulsing AI Brain Animation */}
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-2xl animate-pulse glow-neon"></div>
              <div className="absolute inset-4 bg-gradient-to-r from-accent via-primary to-secondary rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-8 bg-gradient-to-r from-secondary via-accent to-primary rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-6xl animate-float">
                🧠
              </div>
            </div>
            
            {/* Animated Text */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold gradient-text animate-pulse">
                Hatching your AI Persona...
              </h2>
              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            {/* Radiating particles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full animate-ping"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-secondary rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.9s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <Header showBackButton={false} />

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl md:text-7xl font-bold gradient-text leading-tight">
                GENERATE YOUR AI PERSONA
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

          {/* Results Section with Tabs */}
          {personaData && (
            <Card className="p-10 glass-card-glow border-accent/20 rounded-3xl animate-fade-in shadow-neon">
              <div className="space-y-8">
                <h2 className="text-4xl gradient-text flex items-center justify-center gap-3 font-bold">
                  Persona Created! 🎉
                </h2>
                
                {/* Tab Navigation */}
                <div className="flex justify-center gap-4 mb-8">
                  <Button
                    variant={activeTab === 'summary' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('summary')}
                    className="rounded-2xl px-8 py-5 font-bold transition-all duration-300 hover:scale-105 text-lg"
                  >
                    📝 Summary
                  </Button>
                  <Button
                    variant={activeTab === 'interests' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('interests')}
                    className="rounded-2xl px-8 py-5 font-bold transition-all duration-300 hover:scale-105 text-lg"
                  >
                    ⚡ Key Interests
                  </Button>
                  <Button
                    variant={activeTab === 'questions' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('questions')}
                    className="rounded-2xl px-8 py-5 font-bold transition-all duration-300 hover:scale-105 text-lg"
                  >
                    💡 Questions
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'summary' && (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-xl border border-primary/30 animate-fade-in">
                      <h3 className="text-2xl font-bold mb-6 gradient-text">Summary</h3>
                      <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                        {personaData.personaSummary.shortBio}
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                          <h4 className="font-bold text-primary mb-2">Personality Tone</h4>
                          <p className="text-foreground/80">{personaData.personaSummary.personalityTone}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                          <h4 className="font-bold text-secondary mb-2">Writing Style</h4>
                          <p className="text-foreground/80">{personaData.personaSummary.writingStyle}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'interests' && (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-secondary/10 to-accent/10 backdrop-blur-xl border border-secondary/30 animate-fade-in">
                      <h3 className="text-2xl font-bold mb-6 gradient-text">Key Interests & Expertise</h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-bold text-lg mb-4 text-secondary">Areas of Expertise</h4>
                          <div className="flex flex-wrap gap-3">
                            {personaData.personaSummary.expertise.map((item: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-secondary/30 to-accent/30 border border-secondary/50 text-base font-bold hover:scale-110 transition-transform duration-300 cursor-pointer glow-secondary"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-4 text-accent">Core Topics</h4>
                          <div className="flex flex-wrap gap-3">
                            {personaData.personaSummary.coreTopics.map((topic: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent/30 to-primary/30 border border-accent/50 text-base font-bold hover:scale-110 transition-transform duration-300 cursor-pointer glow-electric"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'questions' && (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur-xl border border-accent/30 animate-fade-in">
                      <h3 className="text-2xl font-bold mb-6 gradient-text">Interesting Questions to Ask</h3>
                      <ul className="space-y-4">
                        {personaData.personaSummary.exampleResponses.map((question: string, idx: number) => (
                          <li 
                            key={idx} 
                            className="flex items-start gap-4 text-lg text-foreground/90 p-5 rounded-2xl bg-card/30 hover:bg-card/50 transition-all duration-300 animate-fade-in border border-border/30 hover:border-primary/40 group"
                            style={{ animationDelay: `${idx * 0.15}s` }}
                          >
                            <span className="text-3xl group-hover:scale-125 transition-transform">💬</span>
                            <span className="leading-relaxed">{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
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
                  className="w-full py-8 text-2xl font-bold rounded-3xl bg-gradient-to-r from-accent via-primary to-secondary hover:shadow-neon transition-all duration-500 hover:scale-105 mt-8 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Start Chatting 💬
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;
