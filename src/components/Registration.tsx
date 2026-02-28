import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Phone, Mail, MapPin, Users } from 'lucide-react';

const Registration = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    membershipType: '',
    emergencyContact: '',
    emergencyPhone: '',
    reasonForJoining: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Registration Submitted!",
      description: "Thank you for your interest. Our team will contact you within 24 hours to complete your membership setup.",
    });

    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      membershipType: '',
      emergencyContact: '',
      emergencyPhone: '',
      reasonForJoining: '',
    });

    setIsSubmitting(false);
  };

  return (
    <section id="register" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Join <span className="text-primary">Our Community</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Take the first step towards a more secure future. Fill out the registration form below 
            and become part of our supportive community family.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="shadow-medium border-border/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <UserPlus className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Membership Registration
              </CardTitle>
              <p className="text-muted-foreground">
                Complete the form below to begin your membership journey
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        className="pl-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="membershipType" className="text-foreground font-medium">
                      Membership Type *
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('membershipType', value)}>
                      <SelectTrigger className="border-border/50 focus:border-primary">
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Member - ₹500/month</SelectItem>
                        <SelectItem value="family">Family Member - ₹1,200/month</SelectItem>
                        <SelectItem value="leader">Community Leader - ₹2,500/month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground font-medium">
                    Address *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your complete address"
                      className="pl-10 border-border/50 focus:border-primary resize-none"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-foreground font-medium">
                      Emergency Contact Name *
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact person"
                        className="pl-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-foreground font-medium">
                      Emergency Contact Phone *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonForJoining" className="text-foreground font-medium">
                    Why do you want to join Team No Struggle?
                  </Label>
                  <Textarea
                    id="reasonForJoining"
                    value={formData.reasonForJoining}
                    onChange={(e) => handleInputChange('reasonForJoining', e.target.value)}
                    placeholder="Tell us about your motivation for joining our community..."
                    className="border-border/50 focus:border-primary resize-none"
                    rows={4}
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

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    By submitting this form, you agree to our community guidelines and 
                    understand that membership is subject to approval.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Registration;