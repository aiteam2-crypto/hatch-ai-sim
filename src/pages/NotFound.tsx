import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 p-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="text-8xl md:text-9xl font-bold gradient-text">404</div>
        <h1 className="text-2xl md:text-3xl font-bold">Oops! Page not found</h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate("/")}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] rounded-2xl"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
