import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Requirements from '@/components/Requirements';
import RightsResponsibilities from '@/components/RightsResponsibilities';
import MultiStepRegistration from '@/components/MultiStepRegistration';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <About />
      <Requirements />
      <RightsResponsibilities />
      <MultiStepRegistration />
      <Footer />
    </div>
  );
};

export default Index;
