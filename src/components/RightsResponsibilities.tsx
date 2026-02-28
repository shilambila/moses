import { Card, CardContent } from '@/components/ui/card';
import { Shield, Vote, FileText, Users, AlertTriangle, UserX } from 'lucide-react';

const RightsResponsibilities = () => {
  const memberRights = [
    {
      icon: FileText,
      title: 'Access to Welfare Records',
      description: 'Full transparency and access to all welfare group records and financial information',
    },
    {
      icon: Users,
      title: 'Participation in Decision-Making',
      description: 'Active participation in group decisions that affect the community and welfare policies',
    },
    {
      icon: Vote,
      title: 'Voting in Group Elections',
      description: 'Right to vote in elections for leadership positions and important community matters',
    },
    {
      icon: Shield,
      title: 'Attendance at AGMs',
      description: 'Attendance and participation rights in Annual General Meetings and special assemblies',
    },
  ];

  const dismissalConditions = [
    {
      icon: AlertTriangle,
      title: 'Fraud',
      description: 'Any fraudulent activities or misrepresentation of information',
    },
    {
      icon: UserX,
      title: 'Defaulting',
      description: 'Consistent failure to meet contribution obligations',
    },
    {
      icon: Users,
      title: 'Permanent Mental Illness',
      description: 'Permanent mental incapacity that prevents participation',
    },
    {
      icon: Shield,
      title: 'Death',
      description: 'Natural termination of membership upon death of member',
    },
  ];

  return (
    <section id="rights" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Rights & <span className="text-primary">Responsibilities</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Understanding your rights as a member and the conditions that govern 
            our community participation and welfare group membership.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Member Rights */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Your Rights as a Member
            </h3>
            <div className="space-y-6">
              {memberRights.map((right, index) => {
                const Icon = right.icon;
                return (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-foreground mb-2">{right.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{right.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Dismissal Conditions */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Dismissal Conditions
            </h3>
            <div className="space-y-6">
              {dismissalConditions.map((condition, index) => {
                const Icon = condition.icon;
                return (
                  <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-destructive/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                          <Icon className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-foreground mb-2">{condition.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{condition.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Responsibilities Summary */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Community Responsibilities
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
              As a member of Team No Struggle, you have both rights and responsibilities 
              that help maintain our strong, supportive community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-soft text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Stay Informed</h4>
              <p className="text-muted-foreground text-sm">Keep up with community updates and decisions</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft text-center">
              <Users className="h-8 w-8 text-secondary mx-auto mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Participate</h4>
              <p className="text-muted-foreground text-sm">Engage in meetings and decision-making</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft text-center">
              <Shield className="h-8 w-8 text-success mx-auto mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Contribute</h4>
              <p className="text-muted-foreground text-sm">Honor your financial commitments</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft text-center">
              <Vote className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Vote</h4>
              <p className="text-muted-foreground text-sm">Exercise your voting rights responsibly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RightsResponsibilities;