import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Users, Calculator, ArrowRight, Lock } from 'lucide-react';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { getAccessiblePortals, hasPortalAccess, PORTAL_ROLES, type PortalType } from '@/hooks/useRoleGuard';

const PORTAL_INFO = {
  admin: {
    title: 'Admin Portal',
    description: 'Complete administrative control and oversight',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    path: '/admin'
  },
  secretary: {
    title: 'Secretary Portal',
    description: 'Document management and communications',
    icon: FileText,
    color: 'from-green-500 to-emerald-600',
    path: '/secretary'
  },
  coordinator: {
    title: 'Coordinator Portal',
    description: 'Area coordination and member management',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
    path: '/coordinator'
  },
  auditor: {
    title: 'Auditor Portal',
    description: 'Financial auditing and compliance monitoring',
    icon: Calculator,
    color: 'from-orange-500 to-red-600',
    path: '/auditor'
  }
} as const;

interface PortalNavigationProps {
  showAll?: boolean;
  layout?: 'grid' | 'list';
  className?: string;
}

export const PortalNavigation: React.FC<PortalNavigationProps> = ({ 
  showAll = false, 
  layout = 'grid',
  className = '' 
}) => {
  const { staffUser } = useStaffAuth();
  
  if (!staffUser) {
    return null;
  }

  const userRole = staffUser.staff_role;
  const userEmail = staffUser.email;
  const accessiblePortals = getAccessiblePortals(userRole, userEmail);

  // Show all portals if showAll is true, otherwise only show accessible ones
  const portalsToShow = showAll ? 
    (Object.keys(PORTAL_INFO) as PortalType[]) : 
    accessiblePortals;

  const getLayoutClasses = () => {
    if (layout === 'list') {
      return 'space-y-3';
    }
    return `grid gap-4 ${portalsToShow.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 
      portalsToShow.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
      portalsToShow.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`;
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {portalsToShow.map((portal) => {
        const info = PORTAL_INFO[portal];
        const IconComponent = info.icon;
        const isAccessible = hasPortalAccess(userRole, userEmail, portal);
        const requiredRoles = PORTAL_ROLES[portal];

        return (
          <Card 
            key={portal}
            className={`relative overflow-hidden transition-all duration-200 ${
              isAccessible 
                ? 'hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-primary/20' 
                : 'opacity-60 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-5`} />
            
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${info.color} shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                {isAccessible ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Accessible
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Restricted
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg font-semibold">{info.title}</CardTitle>
              <CardDescription className="text-sm">
                {info.description}
              </CardDescription>
              
              {/* Required roles */}
              <div className="flex flex-wrap gap-1 mt-2">
                {requiredRoles.map((role) => (
                  <Badge 
                    key={role}
                    variant="outline" 
                    className={`text-xs ${
                      userRole === role 
                        ? 'border-green-500 text-green-700 bg-green-50 dark:border-green-400 dark:text-green-400 dark:bg-green-950/20' 
                        : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-0">
              {isAccessible ? (
                <Button asChild className="w-full group">
                  <Link to={info.path} className="flex items-center justify-center gap-2">
                    Access Portal
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  disabled 
                  className="w-full cursor-not-allowed"
                  title={`Requires ${requiredRoles.join(' or ')} role`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Access Denied
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PortalNavigation;