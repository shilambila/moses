import { Card, CardContent } from '@/components/ui/card';
import { Users, Heart, Shield, Target, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Heart,
      title: 'Contribution Model',
      description: 'Each member contributes Ksh 100 per occurrence (Ksh 50 for children under 10) to support families in need.',
    },
    {
      icon: Shield,
      title: 'Guaranteed Payouts after achieving the registration membership target',
      description: 'Up to Ksh 300,000 for principal members, spouses and parents; Ksh 150,000 for children under 10.',
    },
    {
      icon: Users,
      title: 'Open Membership',
      description: 'Anyone 18+, any gender, no residence boundaries. Join our inclusive community of 3,500+ members.',
    },
    {
      icon: Target,
      title: 'Pooled Support',
      description: 'Small contributions from many members create a powerful safety net for all families.',
    },
    {
      icon: Award,
      title: 'Administrative Fee',
      description: 'One-time Ksh 1000 registration fee to join and become part of our supportive community.',
    },
    {
      icon: Globe,
      title: 'Wide Coverage',
      description: 'Supporting members and their families across all regions with no geographical restrictions.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            About <span className="text-primary">Team No Struggle</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Team No Struggle is a benevolent welfare group targeting 3,500+ members. We operate through 
            a pooled support system where members contribute small amounts to collectively support families 
            during difficult times, particularly with funeral expenses and related needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Our Team in Action Section */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
            Our Team in Action
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group cursor-pointer">
              <div className="overflow-hidden rounded-xl shadow-medium group-hover:shadow-large transition-all duration-300">
                <img 
                  src="/lovable-uploads/2b896dec-cf05-49e1-adf4-2812daf80b94.png" 
                  alt="Team No Struggle members gathering together for community support" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">Our dedicated team members</p>
            </div>
            <div className="group cursor-pointer">
              <div className="overflow-hidden rounded-xl shadow-medium group-hover:shadow-large transition-all duration-300">
                <img 
                  src="/lovable-uploads/72c12052-4bfc-47e0-83da-a8ab3a74fc60.png" 
                  alt="Team No Struggle community volunteers in their signature uniforms" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">Community volunteers united</p>
            </div>
            <div className="group cursor-pointer md:col-span-2 lg:col-span-1">
              <div className="overflow-hidden rounded-xl shadow-medium group-hover:shadow-large transition-all duration-300">
                <img 
                  src="/lovable-uploads/5799a3f3-3192-499e-9b94-50df16c3444a.png" 
                  alt="Team No Struggle members providing support and care to community members in need" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">Supporting those in need</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                How Our Pooled Support Works
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Our benevolent welfare system operates on the principle of collective responsibility. 
                When a member or their family faces a bereavement, our community comes together to 
                provide immediate financial support through our pooled contribution system.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Ksh 100 contribution per occurrence</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Ksh 50 for children under 10</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Ksh 1000 one-time registration fee</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Transparent community-driven process</span>
                </li>
              </ul>
            </div>
            <div className="lg:text-right">
              <div className="inline-block bg-white rounded-2xl p-8 shadow-soft">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">3,500+</div>
                <div className="text-muted-foreground mb-4">Target Members</div>
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">Ksh 300K</div>
                <div className="text-muted-foreground mb-4">Max Payout</div>
                <div className="text-4xl md:text-5xl font-bold text-success mb-2">Ksh 1000</div>
                <div className="text-muted-foreground">Registration Fee</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
