import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Calendar, MapPin, DollarSign } from 'lucide-react';

const Requirements = () => {
  const eligibilityRequirements = [
    {
      icon: Calendar,
      title: 'Age Requirement',
      description: '18 years and above - open to all adults',
    },
    {
      icon: Users,
      title: 'Gender Inclusive',
      description: 'All genders welcome - no discrimination',
    },
    {
      icon: MapPin,
      title: 'No Residence Boundaries',
      description: 'Open to members from any location or region',
    },
  ];

  const contributionRules = [
    {
      icon: DollarSign,
      title: 'Standard Contribution',
      description: 'Ksh 100 per bereavement occurrence for all members',
    },
    {
      icon: Users,
      title: 'Children\'s Contribution',
      description: 'Ksh 50 for children below 10 years of age',
    },
    {
      icon: CheckCircle,
      title: 'Registration Fee',
      description: 'One-time Ksh 1000 administrative fee to join',
    },
  ];

  return (
    <section id="requirements" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Membership <span className="text-primary">Requirements</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Simple and inclusive eligibility criteria designed to welcome everyone who wants 
            to be part of our supportive community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Eligibility Requirements */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Who Can Join
            </h3>
            <div className="space-y-6">
              {eligibilityRequirements.map((requirement, index) => {
                const Icon = requirement.icon;
                return (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-foreground mb-2">{requirement.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{requirement.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contribution Rules */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Contribution Rules
            </h3>
            <div className="space-y-6">
              {contributionRules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                          <Icon className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-foreground mb-2">{rule.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{rule.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Join?
          </h3>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            If you meet these simple requirements and are ready to be part of a community that 
            supports each other through difficult times, we welcome you to Team No Struggle.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-primary mb-1">18+</div>
              <div className="text-muted-foreground text-sm">Age Requirement</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-secondary mb-1">Ksh 100</div>
              <div className="text-muted-foreground text-sm">Per Contribution</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-success mb-1">Ksh 1000</div>
              <div className="text-muted-foreground text-sm">Registration Fee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Requirements;
