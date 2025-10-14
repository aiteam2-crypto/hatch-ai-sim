import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Persona {
  Persona_Id: string;
  Persona_Name: string;
  Summary: any;
  LinkedIn_URL: string;
}

const Personas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data, error } = await supabase
          .from("Persona")
          .select("*")
          .not("Summary", "is", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPersonas(data || []);
      } catch (error) {
        console.error("Error fetching personas:", error);
        toast({
          title: "Error",
          description: "Failed to load personas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text">My Personas</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : personas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No personas found. Create one to get started!</p>
              <Button onClick={() => navigate("/dashboard")}>
                Create Persona
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <Card
                  key={persona.Persona_Id}
                  className="p-6 glass-card hover:shadow-[var(--glow-primary)] transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/chat/${persona.Persona_Id}`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-xl">
                        {persona.Persona_Name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-1">{persona.Persona_Name}</h3>
                      {persona.Summary?.role && (
                        <p className="text-sm text-muted-foreground">{persona.Summary.role}</p>
                      )}
                      {persona.Summary?.company && (
                        <p className="text-sm text-muted-foreground">{persona.Summary.company}</p>
                      )}
                    </div>

                    {persona.Summary?.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {persona.Summary.bio}
                      </p>
                    )}

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
          )}
        </div>
      </main>
    </div>
  );
};

export default Personas;
