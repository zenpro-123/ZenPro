"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { OptionGrid } from "@/components/onboarding/OptionGrid";
import { TopicTagInput } from "@/components/onboarding/TopicTagInput";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { INTERESTS, COMPANIES, CREATORS } from "@/config/interests";
import { buildInterestVector } from "@/lib/personalization/vectors";
import { slideVariants } from "@/lib/motion";

const STEPS = ["welcome", "interests", "topics", "companies", "creators", "complete"] as const;
const MIN_INTERESTS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [creators, setCreators] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex];

  function go(delta: number) {
    setDirection(delta);
    setStepIndex((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  }

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleComplete() {
    setSubmitting(true);
    setError(null);

    try {
      const interestVector = buildInterestVector(interests);
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          favoriteTopics: topics,
          favoriteCompanies: companies,
          favoriteCreators: creators,
          interestVector,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const canContinue = step !== "interests" || interests.length >= MIN_INTERESTS;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <OnboardingProgress step={stepIndex} total={STEPS.length} />
        </div>

        <GlassCard strong className="overflow-hidden p-8 md:p-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === "welcome" && <WelcomeStep />}

              {step === "interests" && (
                <StepShell
                  title="What are you into?"
                  description={`Pick at least ${MIN_INTERESTS} — this shapes everything ZenPro shows you.`}
                >
                  <OptionGrid
                    options={INTERESTS}
                    selected={interests}
                    onToggle={(v) => toggle(interests, setInterests, v)}
                  />
                </StepShell>
              )}

              {step === "topics" && (
                <StepShell
                  title="Anything specific you're tracking?"
                  description="Add your own topics — niche, broad, anything. Optional."
                >
                  <TopicTagInput tags={topics} onChange={setTopics} />
                </StepShell>
              )}

              {step === "companies" && (
                <StepShell
                  title="Companies you want to keep an eye on"
                  description="We'll surface news, launches, and signals about these. Optional."
                >
                  <OptionGrid
                    options={COMPANIES}
                    selected={companies}
                    onToggle={(v) => toggle(companies, setCompanies, v)}
                  />
                </StepShell>
              )}

              {step === "creators" && (
                <StepShell
                  title="Creators you follow"
                  description="ZenPro will track their uploads, collabs, and milestones. Optional."
                >
                  <OptionGrid
                    options={CREATORS}
                    selected={creators}
                    onToggle={(v) => toggle(creators, setCreators, v)}
                  />
                </StepShell>
              )}

              {step === "complete" && (
                <CompleteStep
                  interestsCount={interests.length}
                  companiesCount={companies.length}
                  creatorsCount={creators.length}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => go(-1)}
              disabled={stepIndex === 0 || submitting}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step === "complete" ? (
              <Button type="button" onClick={handleComplete} disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Enter ZenPro <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={() => go(1)} disabled={!canContinue} className="gap-1.5">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center py-6">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Welcome to ZenPro
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Your daily intelligence companion. Five minutes each morning to know
        what happened, what changed, what matters — and what to do about it.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Let&apos;s personalize it. Takes about a minute.
      </p>
    </div>
  );
}

function CompleteStep({
  interestsCount,
  companiesCount,
  creatorsCount,
}: {
  interestsCount: number;
  companiesCount: number;
  creatorsCount: number;
}) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-positive/15 text-positive">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">You&apos;re all set</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        ZenPro is calibrated to {interestsCount} interest
        {interestsCount === 1 ? "" : "s"}
        {companiesCount > 0 && `, ${companiesCount} compan${companiesCount === 1 ? "y" : "ies"}`}
        {creatorsCount > 0 && `, and ${creatorsCount} creator${creatorsCount === 1 ? "" : "s"}`}.
        Your dashboard is being prepared.
      </p>
    </div>
  );
}
