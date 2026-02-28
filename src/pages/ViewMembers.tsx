import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ViewMembers = () => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate password verification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, accept any non-empty password
    if (password.trim()) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the members area.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  TNS - Registered Members
                </h1>
                <p className="text-xl text-muted-foreground">
                  Access to member directory and information
                </p>
              </div>

              <Card className="shadow-medium border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Members Directory
                  </CardTitle>
                  <p className="text-muted-foreground">
                    View and manage registered members
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gradient-primary rounded-full">
                        <Eye className="h-8 w-8 text-primary-foreground" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Members Area
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      This is a protected area for viewing registered members. In a full implementation, 
                      this would show member lists, profiles, and administrative tools.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-4 shadow-soft">
                        <div className="text-2xl font-bold text-primary mb-1">3,500+</div>
                        <div className="text-muted-foreground text-sm">Total Members</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-soft">
                        <div className="text-2xl font-bold text-secondary mb-1">2,100</div>
                        <div className="text-muted-foreground text-sm">Active Members</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-soft">
                        <div className="text-2xl font-bold text-success mb-1">₹300K</div>
                        <div className="text-muted-foreground text-sm">Max Payout</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setPassword('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                TNS - View Member Form
              </h1>
              <p className="text-xl text-muted-foreground">
                Enter password to access members area
              </p>
            </div>

            <Card className="shadow-medium border-border/50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-primary rounded-full">
                    <Lock className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Access Protected Area
                </CardTitle>
                <p className="text-muted-foreground">
                  This area is restricted to authorized personnel only
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter access password"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5 mr-2" />
                        Access Members Area
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ViewMembers;