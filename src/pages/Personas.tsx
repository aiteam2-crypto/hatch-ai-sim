import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (e: React.MouseEvent, personaId: string, personaName: string) => {
    e.stopPropagation();
    if (deletingId) return;
    const confirmed = window.confirm(`Delete persona "${personaName}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setDeletingId(personaId);
      // Delete dependent conversations first to avoid FK constraint error (409)
      const { error: convErr } = await supabase
        .from('Conversation')
        .delete()
        .eq('persona_id', personaId);
      if (convErr) throw convErr;

      const { error } = await supabase
        .from('Persona')
        .delete()
        .eq('Persona_Id', personaId);
      if (error) throw error;

      // Verify persona removal from DB (defensive check)
      const { data: remaining, error: checkErr } = await supabase
        .from('Persona')
        .select('Persona_Id')
        .eq('Persona_Id', personaId)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (remaining) {
        throw new Error('Persona deletion verification failed');
      }
      setPersonas(prev => prev.filter(p => p.Persona_Id !== personaId));
      toast({ title: "Persona deleted", description: `${personaName} was removed.` });
    } catch (err) {
      console.error('Failed to delete persona', err);
      toast({ title: "Delete failed", description: "Could not delete persona.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float-slow" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold gradient-text">My Personas 💫</h1>
              <p className="text-lg text-muted-foreground">Chat with your AI personas anytime</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your personas...</p>
              </div>
            ) : personas.length === 0 ? (
              <Card className="p-12 glass-card-glow text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-6xl">🎭</div>
                  <h3 className="text-2xl font-bold">No personas yet</h3>
                  <p className="text-muted-foreground">Create your first AI persona to get started!</p>
                  <Button 
                    onClick={() => navigate("/dashboard")}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] rounded-2xl font-semibold"
                  >
                    Create Persona ✨
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {personas.map((persona) => (
                  <Card
                    key={persona.Persona_Id}
                    className="p-8 glass-card-glow hover:scale-105 transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/50"
                    onClick={() => navigate(`/chat/${persona.Persona_Id}`)}
                  >
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:shadow-[var(--glow-primary)] transition-shadow">
                          {persona.Persona_Name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-lg border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDelete(e, persona.Persona_Id, persona.Persona_Name)}
                            disabled={deletingId === persona.Persona_Id}
                            title="Delete persona"
                          >
                            {deletingId === persona.Persona_Id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:gradient-text transition-all">{persona.Persona_Name}</h3>
                        {persona.Summary?.role && (
                          <p className="text-sm font-semibold text-primary">{persona.Summary.role}</p>
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
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all group-hover:scale-105 rounded-xl font-semibold"
                      >
                        Start Conversation 💬
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Personas;
