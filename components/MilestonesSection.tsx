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
    <section id="milestones" className="relative mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(88,104,234,0.14),_transparent_58%),radial-gradient(circle_at_80%_10%,_rgba(45,212,191,0.12),_transparent_42%)]" />

      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-aurora-400">
          {milestonesText.eyebrow}
        </p>
        <h2 className="section-title mt-3">{milestonesText.title}</h2>
        <p className="section-subtitle mt-4">{milestonesText.subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#334052] bg-[#10151d]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9d2df] backdrop-blur">
            Grant-ready
          </span>
          <span className="rounded-full border border-[#334052] bg-[#10151d]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9d2df] backdrop-blur">
            Mobile-first
          </span>
          <span className="rounded-full border border-[#334052] bg-[#10151d]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9d2df] backdrop-blur">
            Public roadmap
          </span>
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-4 md:mx-0 md:overflow-visible md:px-0">
        <div className="relative flex min-w-max gap-4 pb-2 md:min-w-0 md:grid md:grid-cols-6 md:gap-5">
          <div className="absolute left-4 right-4 top-7 h-px bg-gradient-to-r from-[#5868ea] via-aurora-500/70 to-[#334052] md:left-8 md:right-8 md:top-[2.15rem]" />
          <div className="absolute right-1 top-0 hidden rounded-full border border-[#334052] bg-[#10151d]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9baac0] backdrop-blur md:block">
            {milestonesText.scrollHint}
          </div>
          <div className="relative flex gap-4 md:grid md:grid-cols-6 md:gap-5">
            {milestonesText.items.map((milestone, index) => {
              const Icon = milestoneIcons[index] ?? Rocket;
              const statusClass =
                milestone.status === "complete"
                  ? "border-[#5868ea] bg-[#5868ea] text-white"
                  : milestone.status === "current"
                    ? "border-aurora-400 bg-[#142c2b] text-aurora-300 shadow-[0_0_0_6px_rgba(45,212,191,0.08)]"
                    : "border-[#405066] bg-[#10151d] text-[#9baac0]";

              return (
                <article
                  key={milestone.title}
                  className="group relative flex w-[min(84vw,19rem)] shrink-0 snap-start flex-col rounded-[1.75rem] border border-white/5 bg-[#10151d]/80 p-5 shadow-[0_20px_80px_rgba(7,14,22,0.22)] backdrop-blur md:w-auto md:shrink md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
                >
                  <div className="absolute inset-0 -z-10 rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] md:hidden" />
                  <div className={`relative z-10 grid h-14 w-14 place-items-center rounded-[1.25rem] border ${statusClass} shadow-[0_10px_30px_rgba(7,14,22,0.18)] transition-transform duration-300 group-hover:-translate-y-0.5`}>
                    <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#aeb8ff]">
                    {milestone.phase}
                  </p>
                  <h3 className="mt-2 min-h-[3.25rem] text-lg font-semibold tracking-tight text-white">
                    {milestone.title}
                  </h3>
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
