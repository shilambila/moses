import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Crown } from 'lucide-react';

const Membership = () => {
  const plans = [
    {
      name: 'Basic Member',
      price: 'Ksh 500',
      period: 'per month',
      description: 'Essential support for individuals and small families',
      features: [
        'Emergency financial assistance up to Ksh 50,000',
        'Medical emergency support',
        'Community network access',
        'Basic grief support',
        'Mobile app access',
        'Member directory',
      ],
      popular: false,
      icon: Users,
    },
    {
      name: 'Family Member',
      price: 'Ksh 1,200',
      period: 'per month',
      description: 'Comprehensive coverage for families with enhanced benefits',
      features: [
        'Emergency financial assistance up to Ksh 1,50,000',
        'Extended medical emergency support',
        'Family crisis intervention',
        'Premium grief support services',
        'Priority assistance processing',
        'Family counseling resources',
        'Educational support fund access',
        'Annual family retreat invitation',
      ],
      popular: true,
      icon: Crown,
    },
    {
      name: 'Community Leader',
      price: 'Ksh 2,500',
      period: 'per month',
      description: 'Leadership role with maximum support and community benefits',
      features: [
        'Emergency financial assistance up to Ksh 3,00,000',
        'Comprehensive medical coverage',
        'Priority support in all categories',
        'Leadership development programs',
        'Community decision-making participation',
        'Mentor network access',
        'Business networking opportunities',
        'Annual leadership conference',
        'Special recognition benefits',
      ],
      popular: false,
      icon: Star,
    },
  ];

  const scrollToRegister = () => {
    const element = document.querySelector('#register');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="membership" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your <span className="text-primary">Membership Level</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Select the membership plan that best fits your needs and join thousands of families 
            who have found security and support through our community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative hover:shadow-large transition-all duration-300 ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-medium scale-105' 
                    : 'border-border/50 hover:border-primary/20'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full ${
                      plan.popular ? 'bg-gradient-primary' : 'bg-primary/10'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        plan.popular ? 'text-primary-foreground' : 'text-primary'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="mt-1">
                          <Check className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full py-6 text-lg ${
                      plan.popular 
                        ? 'bg-gradient-primary hover:opacity-90' 
                        : 'bg-primary hover:bg-primary-dark'
                    }`}
                    onClick={scrollToRegister}
                  >
                    Choose {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All membership plans include our core benefits and 24/7 support
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              No hidden fees
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Community support
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Transparent processes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Membership;
