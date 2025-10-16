import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <Card className="p-6 md:p-8 glass-card">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Profile Information</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      defaultValue={user?.user_metadata?.full_name || user?.user_metadata?.name || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      defaultValue={user?.email || ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Use the toggle in the header to switch between light and dark mode
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
