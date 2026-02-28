import { Users, Phone, Mail, MapPin, Heart, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Membership Plans', href: '#membership' },
    { name: 'Registration', href: '#register' },
    { name: 'Contact', href: '#contact' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '#' },
    { name: 'Emergency Support', href: '#' },
    { name: 'Member Portal', href: '#' },
    { name: 'Community Guidelines', href: '#' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Member Agreement', href: '/member-agreement' },
    { name: 'Complaint Resolution', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Team No Struggle</h3>
                <p className="text-sm text-background/70">Welfare Group</p>
              </div>
            </div>
            <p className="text-background/80 leading-relaxed">
              Building stronger communities through mutual support and financial assistance. 
              Together, we ensure no one faces life's challenges alone.
            </p>
            <div className="flex items-center gap-2 text-background/80">
              <Heart className="h-4 w-4 text-secondary" />
              <span className="text-sm">Supporting 3,500+ families since 2008</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-background/80 hover:text-background transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-background/80 hover:text-background transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-background/80">
                <Phone className="h-4 w-4 text-secondary" />
                <span>0798920754/0785854400</span>
              </div>
              <div className="flex items-center gap-3 text-background/80">
                <Mail className="h-4 w-4 text-secondary" />
                <span>support@teamnostruggle.org</span>
              </div>
              <div className="flex items-start gap-3 text-background/80">
                <MapPin className="h-4 w-4 text-secondary mt-1" />
                <span>Shianda<br />Mumias</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <h5 className="font-medium mb-3">Follow Us</h5>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors duration-200"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left text-background/70">
              <p>© {currentYear} Team No Struggle Welfare Group. All rights reserved.</p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {legalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-background/70 hover:text-background transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-background/20 text-center text-sm text-background/60">
            <p>
              Team No Struggle is a registered welfare organization dedicated to community support and mutual aid. 
              We operate with complete transparency and are committed to helping members during their time of need.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
