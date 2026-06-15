import { GoodMorning } from "@/components/modules/morning/GoodMorning";
import { ThingsYouShouldKnowToday } from "@/components/modules/intel/ThingsYouShouldKnowToday";
import { WhatChanged } from "@/components/modules/changed/WhatChanged";
import { MarketPulse } from "@/components/modules/market/MarketPulse";
import { TechIntelligence } from "@/components/modules/tech/TechIntelligence";
import { GitHubRadar } from "@/components/modules/github/GitHubRadar";
import { CareerRadar } from "@/components/modules/career/CareerRadar";
import { RecommendedForYou } from "@/components/modules/recommendations/RecommendedForYou";
import { SocialPulse } from "@/components/modules/social/SocialPulse";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="mx-auto w-full max-w-4xl">
        <GoodMorning />
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <ThingsYouShouldKnowToday />
      </div>
      <WhatChanged />
      <MarketPulse />
      <TechIntelligence />
      <GitHubRadar />
      <CareerRadar />
      <RecommendedForYou />
      <SocialPulse />
    </div>
  );
}
