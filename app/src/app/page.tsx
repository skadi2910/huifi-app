import { HeroSection } from '@/components/HeroSection'; // Adjust path if needed
import { FeaturesSection } from '@/components/FeaturesSection'; // Adjust path if needed
import { HowItWorksSection } from '@/components/HowItWorksSection'; // Adjust path if needed
import { StatsSection } from '@/components/StatsSection'; // Adjust path if needed
import { CTASection } from '@/components/CTASection'; // Adjust path if needed

// Note: Ensure these component files are moved to the `src/components` directory
// or update the import paths accordingly.

export default function Page() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
    </main>
  );
}