import React from 'react';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { BenefitsSection } from './BenefitsSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

/**
 * Landing Page principal do QA Agile Guide
 * Container que agrupa todas as seções da landing page
 */
export const LandingPage: React.FC = () => {
  return (
    <div className="app-page landing-neu-scope min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
};
