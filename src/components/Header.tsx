import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Users, Phone, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'About Us', href: '#about' },
    { name: 'Requirements', href: '#requirements' },
    { name: 'Rights & Responsibilities', href: '#rights' },
    { name: 'Register as a Member', href: '#register' },
    { name: 'Register as an Admin', href: '/adminregistration', route: true },
    // { name: 'Registered Members', href: '/viewmems', route: true },
    { name: user ? 'Dashboard' : 'Staff Portal', href: user ? '/dashboard' : '/auth', route: true },
    { name: 'Portal Login', href: '/portal-login', route: true }
  ];

  const handleNavigation = (item: { href: string; route?: boolean }) => {
    if (item.route) {
      navigate(item.href);
    } else {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed w-full top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/4a4961c3-bc53-48f7-a650-4dc70fb40614.png" 
              alt="Team No Struggle - making things easier" 
              className="h-12 w-auto"
            />
            <h4><b>TEAM NO STRUGGLE</b></h4>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" onClick={() => handleNavigation({ href: '#register' })}>
              <User className="h-4 w-4 mr-2" />
              Join Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <nav className="flex flex-col gap-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium py-2"
                >
                  {item.name}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button size="sm" onClick={() => handleNavigation({ href: '#register' })}>
                  <User className="h-4 w-4 mr-2" />
                  Join Now
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
