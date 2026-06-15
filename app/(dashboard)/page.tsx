import { GoodMorning } from "@/components/modules/morning/GoodMorning";
import { TechIntelligence } from "@/components/modules/tech/TechIntelligence";
import { GitHubRadar } from "@/components/modules/github/GitHubRadar";
import { MarketPulse } from "@/components/modules/market/MarketPulse";
import { CareerRadar } from "@/components/modules/career/CareerRadar";
import { SocialPulse } from "@/components/modules/social/SocialPulse";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="mx-auto w-full max-w-4xl">
        <GoodMorning />
      </div>
      <MarketPulse />
      <TechIntelligence />
      <GitHubRadar />
      <CareerRadar />
      <SocialPulse />
    </div>
  );
}
