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
    <div className="min-h-screen bg-base-100">
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
};
