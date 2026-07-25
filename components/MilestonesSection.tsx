"use client";

import {
  BadgeCheck,
  Beaker,
  Globe2,
  Handshake,
  Rocket,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

const milestoneIcons: LucideIcon[] = [BadgeCheck, Beaker, Globe2, ShieldCheck, Handshake, Rocket];

export function MilestonesSection() {
  const { t } = useLanguage();
  const milestonesText = t.milestones;

  return (
    <section id="milestones" className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-aurora-400">
          {milestonesText.eyebrow}
        </p>
        <h2 className="section-title mt-3">{milestonesText.title}</h2>
        <p className="section-subtitle mt-4">{milestonesText.subtitle}</p>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8">
        <div className="relative min-w-[980px] pt-2">
          <div className="absolute left-8 right-8 top-[2.15rem] h-px bg-gradient-to-r from-[#5868ea] via-aurora-500/70 to-[#334052]" />
          <div className="relative grid grid-cols-6 gap-5">
            {milestonesText.items.map((milestone, index) => {
              const Icon = milestoneIcons[index] ?? Rocket;
              const statusClass =
                milestone.status === "complete"
                  ? "border-[#5868ea] bg-[#5868ea] text-white"
                  : milestone.status === "current"
                    ? "border-aurora-400 bg-[#142c2b] text-aurora-300 shadow-[0_0_0_6px_rgba(45,212,191,0.08)]"
                    : "border-[#405066] bg-[#10151d] text-[#9baac0]";

              return (
                <article key={milestone.title} className="relative flex min-w-0 flex-col">
                  <div className={`relative z-10 grid h-16 w-16 place-items-center rounded-2xl border ${statusClass}`}>
                    <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#aeb8ff]">
                    {milestone.phase}
                  </p>
                  <h3 className="mt-2 min-h-[3.5rem] text-lg font-semibold text-white">{milestone.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9baac0]">{milestone.description}</p>
                  <ul className="mt-4 space-y-2 text-xs leading-5 text-[#c9d2df]">
                    {milestone.deliverables.map((deliverable) => (
                      <li key={deliverable} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-aurora-500" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                  <span
                    className={`mt-5 inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      milestone.status === "complete"
                        ? "border-[#5868ea]/50 bg-[#20295b] text-[#c8d0ff]"
                        : milestone.status === "current"
                          ? "border-aurora-400/40 bg-aurora-400/10 text-aurora-300"
                          : "border-[#334052] bg-[#151d28] text-[#9baac0]"
                    }`}
                  >
                    {milestonesText.status[milestone.status]}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
