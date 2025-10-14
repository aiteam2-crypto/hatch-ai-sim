import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SignIn = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTestInsert = async () => {
    try {
      // Step 1: Test Supabase connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('User')
        .select('count')
        .limit(0);

      if (connectionError) {
        if (connectionError.message.includes('does not exist')) {
          toast({
            title: "Table 'User' Not Found",
            description: "You need to create the 'User' table in Supabase first. Check the Cloud tab to create it.",
            variant: "destructive",
          });
          console.error("Table structure needed:", {
            table_name: "User",
            columns: [
              "User_id (uuid, primary key, default: gen_random_uuid())",
              "User_name (text)",
              "User_email (text, unique)",
              "Created_at (timestamp with time zone, default: now())"
            ]
          });
          return;
        }
        toast({
          title: "Connection Error",
          description: connectionError.message,
          variant: "destructive",
        });
        return;
      }

      // Step 2: Try inserting mock data
      const mockData = {
        User_name: "John Doe",
        User_Email: `test.user.${Date.now()}@example.com`,
      };

      const { data, error } = await supabase
        .from('User')
        .insert(mockData)
        .select();

      if (error) {
        toast({
          title: "Test Insert Failed",
          description: error.message,
          variant: "destructive",
        });
        console.error("Insert error:", error);
      } else {
        toast({
          title: "Test Insert Success! ✅",
          description: `Inserted: ${mockData.User_name} (${mockData.User_Email})`,
        });
        console.log("Inserted data:", data);
      }
    } catch (err) {
      toast({
        title: "Test Insert Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md p-8 glass-card animate-slide-up">
        <div className="flex flex-col items-center space-y-8">
          <Logo />
          
          <div className="w-full space-y-6">
            <h2 className="text-2xl font-semibold text-center">Sign in to continue</h2>
            
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full py-6 text-base hover:border-primary hover:bg-primary/5 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="w-full py-6 text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleTestInsert}
                  variant="secondary"
                  className="w-full py-6 text-base"
                >
                  🧪 Test Database Insert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignIn;
