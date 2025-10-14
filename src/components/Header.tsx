import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  showBackButton?: boolean;
  showUserMenu?: boolean;
}

export const Header = ({ showBackButton = true, showUserMenu = true }: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const currentUser = {
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || ''
  };

  return (
    <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 bg-background/80 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-xl hover:bg-primary/10 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Logo />
        </div>
        
        {showUserMenu && (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl hover:bg-primary/10 hover:scale-110 transition-all"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none gradient-text">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer hover:bg-primary/5">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};
