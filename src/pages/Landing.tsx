import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-6 flex justify-between items-center">
          <Logo />
          <ThemeToggle />
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-88px)]">
          <div className="max-w-4xl space-y-8 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="gradient-text">CREATE AI</span>
              <br />
              <span className="gradient-text">PERSONAS</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              HATCH.AI helps you simulate realistic conversations with any professional.
              <br />
              Research them through their public data and talk to their AI persona.
            </p>

            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/signin")}
                className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;
