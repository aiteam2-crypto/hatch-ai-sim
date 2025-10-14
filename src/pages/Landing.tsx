import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Brain, 
  Users, 
  MessageSquare, 
  Zap, 
  Shield, 
  Target,
  ArrowRight,
  Quote,
  ChevronRight
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const personas = [
    { name: "Tech CEO", role: "Innovation Leader", icon: Brain, color: "from-primary to-accent" },
    { name: "Investor", role: "Venture Capital", icon: Target, color: "from-secondary to-primary" },
    { name: "Designer", role: "Creative Director", icon: Sparkles, color: "from-accent to-secondary" },
    { name: "Engineer", role: "Tech Architect", icon: Zap, color: "from-primary to-secondary" },
  ];

  const features = [
    {
      icon: Brain,
      title: "Data-Backed Responses",
      description: "Powered by real public data and professional insights for authentic conversations."
    },
    {
      icon: Shield,
      title: "Ethical AI Simulation",
      description: "Built with privacy and ethical considerations at the core of every interaction."
    },
    {
      icon: Target,
      title: "Personalization",
      description: "Tailored responses that adapt to your learning style and professional goals."
    },
  ];

  const testimonials = [
    {
      quote: "HATCH.AI transformed how we research and engage with industry leaders.",
      author: "Sarah Chen",
      role: "Product Manager",
      avatar: "SC"
    },
    {
      quote: "The most realistic AI personas I've experienced. Incredible technology.",
      author: "Michael Torres",
      role: "Startup Founder",
      avatar: "MT"
    },
    {
      quote: "Learning from simulated experts has accelerated our team's growth exponentially.",
      author: "Emily Park",
      role: "Head of Innovation",
      avatar: "EP"
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent/20 rounded-full blur-[120px] animate-float" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Glassy Navbar */}
        <header className="sticky top-0 z-50 glass-card border-b">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Logo />
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                <span className="gradient-text animate-fade-in">Create AI Personas.</span>
                <br />
                <span className="gradient-text animate-fade-in" style={{ animationDelay: '0.2s' }}>Chat Like Never Before.</span>
                <br />
                <span className="text-4xl md:text-5xl lg:text-6xl">⚡💬✨</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                Talk to AI versions of real professionals. Research, learn, and engage through intelligent simulations powered by next-gen technology. 🚀
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/signin")}
                  className="text-lg px-10 py-7 rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[var(--shadow-neon)] transition-all duration-500 hover:scale-110 group animate-glow-pulse"
                >
                  Get Started 💬
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Holographic Avatar */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-full blur-3xl animate-glow-shift" />
                <div className="relative glass-card-glow p-12 rounded-3xl animate-hologram">
                  <Brain className="w-48 h-48 text-primary" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">Meet AI Personas</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interact with realistic simulations of professionals across industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, index) => {
              const Icon = persona.icon;
              return (
                <Card 
                  key={index}
                  className="group glass-card border-border/50 hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-[var(--shadow-neon)] cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8 space-y-4 relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2">{persona.name}</h3>
                      <p className="text-muted-foreground">{persona.role}</p>
                      
                      <div className="mt-4 flex items-center text-sm text-primary group-hover:translate-x-2 transition-transform duration-300">
                        Chat Now <ChevronRight className="ml-1 w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to intelligent conversations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-30 -translate-y-1/2" />
            
            {[
              {
                step: "01",
                icon: Users,
                title: "Choose Persona",
                description: "Select from our library of AI-powered professional personas"
              },
              {
                step: "02",
                icon: MessageSquare,
                title: "Ask Questions",
                description: "Engage in realistic conversations based on real data"
              },
              {
                step: "03",
                icon: Zap,
                title: "Get Insights",
                description: "Receive authentic responses powered by advanced AI"
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="relative glass-card-glow p-8 rounded-2xl space-y-4 hover:scale-105 transition-all duration-500 group"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-6xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">Premium Features</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="glass-card border-border/50 hover:border-primary/50 transition-all duration-500 hover:scale-105 group overflow-hidden"
                >
                  <CardContent className="p-8 space-y-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:glow-primary transition-shadow duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">What People Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="glass-card-glow hover:scale-105 transition-all duration-500 group"
              >
                <CardContent className="p-8 space-y-6">
                  <Quote className="w-10 h-10 text-primary opacity-50" />
                  
                  <p className="text-lg leading-relaxed italic">"{testimonial.quote}"</p>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="glass-card-glow rounded-3xl p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Ready to Experience</span>
                <br />
                <span className="gradient-text">Next-Gen AI?</span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of professionals using HATCH.AI to learn, research, and grow.
              </p>
              
              <Button
                size="lg"
                onClick={() => navigate("/signin")}
                className="text-lg px-12 py-6 rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[var(--shadow-neon)] transition-all duration-500 hover:scale-105 group"
              >
                Get Started Free 🎉
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-border/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary glow-primary" />
              <span className="text-xl font-bold gradient-text">HATCH.AI</span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">ABOUT</a>
              <a href="#" className="hover:text-primary transition-colors">FEATURES</a>
              <a href="#" className="hover:text-primary transition-colors">PRICING</a>
              <a href="#" className="hover:text-primary transition-colors">CONTACT</a>
            </nav>
            
            <div className="text-sm text-muted-foreground">
              © 2025 HATCH.AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
