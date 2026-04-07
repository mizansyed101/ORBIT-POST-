"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn, PLATFORM_LABELS } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Link as LinkIcon,
  Check,
  Clock,
  Plus,
  Minus,
} from "lucide-react";
import type { Platform, CampaignType } from "@/lib/types";

const PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram", "facebook", "threads"];
const DEFAULT_TIMES = ["09:00", "13:00", "18:00"];

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("trend");
  const [inputText, setInputText] = useState("");
  const [url, setUrl] = useState("");

  // Step 2
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  // Step 3
  const [timesPerDay, setTimesPerDay] = useState(3);
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIMES);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const updateTimesPerDay = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setTimesPerDay(clamped);
    // Auto-generate evenly spaced times
    const slots = [];
    for (let i = 0; i < clamped; i++) {
      const hour = Math.round(8 + (i * 14) / Math.max(clamped - 1, 1));
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    setTimeSlots(slots);
  };

  const validateStep1 = () => {
    if (!name.trim()) { setError("Campaign name is required"); return false; }
    if (type === "trend" && inputText.length < 15) {
      setError("Give us more context — at least 15 characters so we can nail this.");
      return false;
    }
    if (type === "product" && !url.trim()) { setError("Product URL is required"); return false; }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (selectedPlatforms.length === 0) { setError("Select at least one platform"); return false; }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create campaign
    const { data: campaign, error: campError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name,
        type,
        input_text: type === "trend" ? inputText : null,
        url: type === "product" ? url : null,
        platforms: selectedPlatforms,
      })
      .select()
      .single();

    if (campError || !campaign) {
      setError(campError?.message || "Failed to create campaign");
      setLoading(false);
      return;
    }

    // Create schedule
    await supabase.from("schedules").insert({
      campaign_id: campaign.id,
      times_per_day: timesPerDay,
      time_slots: timeSlots,
      start_date: startDate,
      end_date: endDate || null,
    });

    router.push(`/campaigns/${campaign.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-cream font-[family-name:var(--font-playfair)]">
            New Campaign
          </h1>
          <p className="text-sm text-cream-muted mt-0.5">
            Step {step} of 3 — {step === 1 ? "Content Setup" : step === 2 ? "Platforms" : "Schedule"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              s <= step ? "bg-indigo" : "bg-obsidian-border"
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-6 text-sm text-error animate-scale-in">
          {error}
        </div>
      )}

      {/* Step 1: Content Setup */}
      {step === 1 && (
        <div className="space-y-6 animate-slide-in-up">
          <Input
            label="Campaign Name"
            placeholder="e.g., Q4 Product Launch, AI Trends Daily"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Type toggle */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-cream-muted uppercase tracking-wider">
              Campaign Type
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Card
                hover
                onClick={() => setType("trend")}
                className={cn(
                  "cursor-pointer",
                  type === "trend" && "border-mint/40 bg-mint/5"
                )}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    type === "trend" ? "bg-mint/20 text-mint" : "bg-obsidian-hover text-cream-faint"
                  )}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cream">Trend Mode</p>
                    <p className="text-xs text-cream-muted">Niche / keyword based</p>
                  </div>
                  {type === "trend" && <Check size={16} className="text-mint ml-auto" />}
                </CardContent>
              </Card>

              <Card
                hover
                onClick={() => setType("product")}
                className={cn(
                  "cursor-pointer",
                  type === "product" && "border-indigo/40 bg-indigo/5"
                )}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    type === "product" ? "bg-indigo/20 text-indigo" : "bg-obsidian-hover text-cream-faint"
                  )}>
                    <LinkIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cream">Product Mode</p>
                    <p className="text-xs text-cream-muted">URL / website based</p>
                  </div>
                  {type === "product" && <Check size={16} className="text-indigo ml-auto" />}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Input based on type */}
          {type === "trend" ? (
            <div className="space-y-1.5">
              <Input
                label="Niche / Topic / Keyword"
                placeholder="e.g., AI productivity tools for remote teams"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                hint={`${inputText.length}/15 minimum characters`}
              />
              {inputText.length > 0 && inputText.length < 15 && (
                <div className="h-1 bg-obsidian-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (inputText.length / 15) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Input
              label="Product / Website URL"
              type="url"
              placeholder="https://example.com/product"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              icon={<LinkIcon size={14} />}
            />
          )}
        </div>
      )}

      {/* Step 2: Platform Selection */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-in-up">
          <span className="block text-xs font-medium text-cream-muted uppercase tracking-wider">
            Select Target Platforms
          </span>
          <div className="grid grid-cols-1 gap-3">
            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatforms.includes(p);
              return (
                <Card
                  key={p}
                  hover
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "cursor-pointer",
                    isSelected && "border-indigo/40 bg-indigo/5"
                  )}
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    <PlatformIcon platform={p} size={22} className={cn(
                      isSelected ? "text-cream" : "text-cream-faint"
                    )} />
                    <span className="text-sm font-medium text-cream flex-1">
                      {PLATFORM_LABELS[p]}
                    </span>
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "border-indigo bg-indigo"
                        : "border-obsidian-border"
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Posts per day */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-cream-muted uppercase tracking-wider">
              Posts Per Day
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateTimesPerDay(timesPerDay - 1)}
                className="p-2 rounded-lg bg-obsidian-raised border border-obsidian-border hover:bg-obsidian-hover transition-all text-cream-muted hover:text-cream"
              >
                <Minus size={14} />
              </button>
              <span className="text-2xl font-bold text-cream font-mono w-12 text-center">
                {timesPerDay}
              </span>
              <button
                onClick={() => updateTimesPerDay(timesPerDay + 1)}
                className="p-2 rounded-lg bg-obsidian-raised border border-obsidian-border hover:bg-obsidian-hover transition-all text-cream-muted hover:text-cream"
              >
                <Plus size={14} />
              </button>
              <span className="text-xs text-cream-faint">times per day (1–10)</span>
            </div>
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-cream-muted uppercase tracking-wider">
              Posting Times
            </span>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((time, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Clock size={12} className="text-cream-faint" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newSlots = [...timeSlots];
                      newSlots[i] = e.target.value;
                      setTimeSlots(newSlots);
                    }}
                    className="bg-obsidian-raised border border-obsidian-border rounded-lg px-3 py-1.5 text-sm text-cream focus:outline-none focus:border-indigo"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Leave empty for ongoing"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-obsidian-border">
        <Button
          variant="ghost"
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
        >
          <ArrowLeft size={14} />
          {step > 1 ? "Back" : "Cancel"}
        </Button>

        {step < 3 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading}>
            <Check size={14} />
            Create Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
