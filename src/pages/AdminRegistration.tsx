import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mysql } from '@/integrations/mysql/client';

const AdminRegistration = () => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    areaOfResidence: '',
  });

  const roles = [
    { value: 'Admin', label: '☑️ Admin' },
    { value: 'Advisory Committee', label: 'Advisory Committee' },
    { value: 'General Coordinator', label: 'General Coordinator' },
    { value: 'Area Coordinator', label: '☑️ Area Coordinator' },
    { value: 'Secretary', label: '☑️ Secretary' },
    { value: 'Customer Service', label: 'Customer Service Personnel' },
    { value: 'Organizing Secretary', label: 'Organizing Secretary' },
    { value: 'Treasurer', label: '☑️ Treasurer' },
    { value: 'Auditor', label: '☑️ Auditor' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select your role before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await mysql
        .from('staff_registrations')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            staff_role: selectedRole,
            assigned_area: formData.areaOfResidence,
            pending: 'pending',
          }
        ]);

      if (error) {
        console.error('Error submitting staff registration:', error);
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to submit registration. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Admin Registration Submitted!",
        description: "Your registration has been submitted for approval. You will be contacted within 24 hours.",
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        areaOfResidence: '',
      });
      setSelectedRole('');

    } catch (error) {
      console.error('Error submitting staff registration:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Admin Registration
              </h1>
              <p className="text-xl text-muted-foreground">
                Register for committee and administrative roles in Team No Struggle
              </p>
            </div>

            <Card className="shadow-medium border-border/50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-primary rounded-full">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Administrative Role Registration
                </CardTitle>
                <p className="text-muted-foreground">
                  Complete the form below to register for an administrative role
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground font-medium">
                      Select Role *
                    </Label>
                    <Select onValueChange={setSelectedRole} value={selectedRole}>
                      <SelectTrigger className="border-border/50 focus:border-primary">
                        <SelectValue placeholder="Choose your administrative role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaOfResidence" className="text-foreground font-medium">
                      Area of Residence/Assignment
                    </Label>
                    <Input
                      id="areaOfResidence"
                      value={formData.areaOfResidence}
                      onChange={(e) => handleInputChange('areaOfResidence', e.target.value)}
                      placeholder="Enter your area of residence or assignment"
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      className="w-full py-6 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting Registration...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Submit Registration
                        </>
                      )}
                    </Button>
                  </div>
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

export default AdminRegistration;
