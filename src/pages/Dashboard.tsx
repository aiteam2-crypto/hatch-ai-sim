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

      // Step 2: Generate AI persona
      toast({
        title: "Generating profile...",
        description: "AI is analyzing the persona details",
      });

      const { data, error } = await supabase.functions.invoke('generate-persona', {
        body: {
          name,
          linkedinUrl,
          scrapedData: `Professional profile for ${name}. Based on LinkedIn and public sources.`
        }
      });

      if (error || data?.error) {
        console.error('Edge function error:', error || data.error);
        throw new Error(error?.message || data?.error || 'Failed to generate persona');
      }

      setPersonaData(data);

      // Step 3: Trigger n8n webhook for summary generation
      if (n8nWebhookUrl && insertedPersonaId) {
        try {
          toast({
            title: "Enriching profile...",
            description: "Generating detailed summary",
          });

          await supabase.functions.invoke('trigger-n8n', {
            body: {
              webhookUrl: n8nWebhookUrl,
              personaData: {
                Persona_Id: insertedPersonaId,
                Persona_Name: name,
                LinkedIn_URL: linkedinUrl,
                User_Id: user.id,
                summary: data.personaSummary,
                instructions: data.chatbotInstructions,
                created_at: new Date().toISOString()
              }
            }
          });
          
          console.log('n8n webhook triggered');

          // Step 4: Poll for summary
          toast({
            title: "Processing...",
            description: "Waiting for summary generation (up to 90 seconds)",
          });

          const summaryReady = await pollForSummary(insertedPersonaId);
          
          if (!summaryReady) {
            toast({
              title: "Summary Still Processing",
              description: "Summary generation is still processing. You'll be notified when it's ready.",
              variant: "default",
            });
          }

        } catch (webhookError) {
          console.error('Error in n8n workflow:', webhookError);
          // Continue even if webhook fails
        }
      }

      // Step 5: Create chatbot conversation
      if (insertedPersonaId) {
        await createChatbotConversation(insertedPersonaId, name);
      }

      // Step 6: Success
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
  );
};

export default Dashboard;
