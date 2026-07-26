"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GlassPanel } from "./components/GlassPanel";
import korvesaLogo from "C:/Users/yee/Downloads/LANDrop/Asset 2.svg";

const sections = ["The Gap", "Our Mission", "Advantage", "Economics", "The Team"] as const;
type SectionName = (typeof sections)[number];

const sectionId = (section: string) => section.toLowerCase().replaceAll(" ", "-");

const sectionContent: Record<SectionName, readonly string[]> = {
  "The Gap": [
    "Four years after Malaysia's national drone plan (MDTAP30, 2022), every approved operator faces the same wall. DHL partnerships and Zipline-clone startups fly past the residential tower, or not at all.",
    "But not by choice. The proven architecture (hover + winch drop) physically can't serve a locked 25-floor condo. No drop zone.",
    "Hover acoustics in concrete canyons. Wind envelopes that exclude tall structures.",
    "The buildings where consumers actually live are an empty layer, unharnessed to its potential.",
  ],
  "Our Mission": [
    "Korvesa is network-first by design. The doctrine has always been vertical integration, end-to-end.",
    "Every flight generates training data, compounding into better autonomous sortie performance over time.",
    "Each hub doubles as a commercial chokepoint. Think drone postbox: a shared utility other logistics providers can plug into, alongside Korvesa's own network.",
    "The drone itself is a clean sheet design, built from first principles around the use case, not adapted from an existing airframe. That keeps the downstream network a variable we control, not one we inherit.",
    "The team's internationally exposed local talent matters more than it sounds. Cultural fluency is what actually removes friction with the public and regulators, more than any technical spec.",
    "That's also why Korvesa skips the sandbox-abroad playbook other operators rely on when their home market is too restrictive to test in. Malaysia's regulatory environment is already open enough that Korvesa goes straight from first hub to live operations, no proxy market required.",
  ],
  Advantage: [
    "Korvesa's edge comes from timing and architecture, not just tech.",
    "Regulation first. Malaysia's low altitude economy has shifted from pushback to active encouragement, a 5 year swing that didn't exist for earlier drone entrants. With a CPL holder as advisor, we design against metrics tied to CAAM's approval criteria, not longshot permissions.",
    "Competitors next. Rivals aren't just facing the same open door. Most have baked winch and pulley delivery into their roadmap. Pivoting to dense urban ops means re engineering their core system and spending capital already committed elsewhere.",
    "Then structure. Korvesa isn't hardware first. As a design led robotics team, we invest in landmarking: staking physical hub presence ahead of hardware, from day one. We build fit for mission systems around current operability, not a bet on future capability. Sketch to fabrication to operation as one continuous line, not a hardware company retrofitting a use case.",
    "Regulation opened. Competitors are structurally too slow to pivot into it. Korvesa designed for exactly this window, sketch to fabrication to operation, with CAAM's approval criteria.",
  ],
  Economics: [
    "Verticalisation is Korvesa's doctrine, because demand and utilization move on different timescales, and that gap only breaks the model when it's structural, not seasonal.",
    "Driving adoption is a marketing problem. Driving infrastructure is a usage problem. Owning the end-to-end journey lets Korvesa capture the market and mature it at once.",
    "We build the hub, the drone, and the platform. The only variable outside our control is what's being sent, and to which hub. That verticalisation unlocks multiple revenue streams from one operation:",
    "Consumers subscribe for flight credits, or pay per flight.",
    "Businesses pay per delivery for hub access, upkeep first, margin after.",
    "The hub itself is a postbox any delivery operator can integrate into, for a fee. And the AI handshake between every drone and hub generates airspace analytics, sellable as its own API.",
    "Korvesa unifies the timescale by owning the machine layer that moves both demand and utilization, a system built once, but portable to any market running its own low-altitude economy.",
  ],
  "The Team": [
    "Korvesa's team is design-led and technically self-sufficient at the development stage. The team that sketches the drone is the same team that organises fabrication and flies it, day zero. No outsourced build, no gap between intent and execution.",
    "Nazry builds the system that executes the build itself, keeping operations lean so the focus stays on hyperscaling the landmarking. As a trained industrial designer, he's the first layer of designer-fabricator, condensing turnaround time and keeping the hub-drone handshake clean sheet, without overreliance on outsourced technology.",
    "Yvonne owns go-to-market, onboarding users from the first trial sortie. As a trained digital designer working both a local and UI/UX lens, she's the first layer between customer locale and Korvesa's operations, reducing friction on cultural acceptance and adoption alike.",
    "Advising the team is a Commercial Pilot License holder trained under Australia's CASA and licensed under Malaysia's CAAM. That cross-jurisdiction grounding gives Korvesa a working read on CAAM's actual approval criteria, not a longshot bet on permissions. Putra is a core part of the team, currently in an advisory capacity due to his aviation commitments.",
  ],
};

const gapStories = [
  {
    category: "NATION",
    title: "Drone industry set to soar with action plan as national agenda, says PM",
    meta: "Tuesday, 6 Sept 2022 | 13:20 AM MYT @ New Straits Times",
    body: "KUALA LUMPUR: The government wants to tap into the huge potential of unmanned aircraft systems (UAS) by developing a blueprint aimed at supporting the drone industry ecosystem, said Prime Minister Datuk Seri Ismail Sabri Yaakob.",
  },
  {
    category: "SCIENCE",
    title: "Flying into new horizons",
    meta: "Monday 28 Aug 2023 | 08:00 AM MYT @ The Edge",
    body: "To harness and realise the full potential of DroneTech, Malaysian Research Accelerator for Technology and Innovation (MRANTI) has developed the Malaysia Drone Technology Action Plan 2022–2030 (MDTAP30).",
  },
  {
    category: "TRANSPORT",
    title: "Blueprint for low-altitude economy expected by year-end, says Loke",
    meta: "Wednesday, 24 Jun 2026 | 11:17 AM MYT @ The Sun",
    body: "PUTRAJAYA: Malaysia is expected to unveil its blueprint for the low-altitude economy (LAE) by the end of the year, providing a clear framework to regulate and support the emerging sector, says Transport Minister Anthony Loke.",
  },
  {
    category: "NATION",
    title: "Government eyes RM50.7bil drone industry by 2030",
    meta: "Tuesday, 14 Jul 2026 | 10:00 AM MYT @ The Star",
    body: "KUALA LUMPUR: The government is hoping to turn Malaysia's drone sector into a RM50.7bil industry by expanding the use of the technology across public services, says the Science, Technology and Innovation Ministry.",
  },
] as const;

function GapSlide() {
  return (
    <div className="gap-evidence">
      <div className="gap-news">
        {gapStories.map((story) => (
          <article className="gap-story" key={story.title}>
            <p className="gap-category">{story.category}</p>
            <h2>{story.title}</h2>
            <p className="gap-meta">{story.meta}</p>
            <p className="gap-body">{story.body}</p>
          </article>
        ))}
      </div>
      <div className="gap-timeline">
        <div className="timeline-entry">
          <strong>2022</strong>
          <p>MDTAP 2030 announced;<br />the Malaysia Drone Tech Action Plan.</p>
        </div>
        <div className="timeline-entry">
          <strong>4 <small>years</small></strong>
          <p>Of lagging low altitude economy with<br />no innovation and movement.</p>
        </div>
        <div className="timeline-entry">
          <strong>2026</strong>
          <p>Government push to bolster LAE with<br />fast-track blueprints across public sectors.</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionName>("The Gap");
  const activeIndex = sections.indexOf(activeSection);
  const [railProgress, setRailProgress] = useState(0);
  const railProgressRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = railProgressRef.current;
    const to = activeIndex;

    if (reduceMotion || from === to) {
      railProgressRef.current = to;
      setRailProgress(to);
      return;
    }

    const duration = 2000;
    const startedAt = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = (1 - Math.cos(Math.PI * elapsed)) / 2;
      const next = from + (to - from) * eased;
      railProgressRef.current = next;
      setRailProgress(next);
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  return (
    <main>
      <div className="grain-overlay" aria-hidden="true">
        <div className="grain-overlay__texture" />
      </div>
      <div className="canvas">
        <GlassPanel className="intro-tile" aria-labelledby="intro-title" restingX={0.433}>
          <div className="intro-copy intro-brand">
            <img className="intro-logo" src={korvesaLogo.src} alt="Korvesa" />
            <p id="intro-title" className="intro-tagline">Low Altitude Economy Autonomous Network</p>
          </div>

          <nav className="section-nav" aria-label="Page sections">
            <ol>
              <span className="nav-marker" aria-hidden="true" style={{ "--active-index": activeIndex } as CSSProperties}>{"{{ You’re Here }}"}</span>
              {sections.map((section) => {
                const active = activeSection === section;
                return (
                  <li className={active ? "is-active" : ""} key={section}>
                    <a
                      href={`#${sectionId(section)}`}
                      aria-current={active ? "location" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveSection(section);
                      }}
                    >
                      {section}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </GlassPanel>

        <section className="tile statement-tile" aria-label="Korvesa section slides">
          <div className="why-stage" style={{ "--active-slide": railProgress, "--slide-count": sections.length } as CSSProperties}>
            <div className="why-track">
              {sections.map((section, index) => {
                const offset = index - railProgress;
                const dropDistance = offset < 0
                  ? Math.min(-offset, 1)
                  : offset > 1
                    ? Math.min(offset - 1, 1)
                    : 0;

                return (
                  <article
                    className="why-scene"
                    aria-hidden={section !== activeSection}
                    key={section}
                    style={{ transform: `translateY(${dropDistance * 100}%)`, zIndex: sections.length - index }}
                  >
                    {section === "The Gap" ? <GapSlide /> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <GlassPanel className="brand-tile" aria-labelledby="brand-title" restingX={-0.433}>
          <header>
            <h2 id="brand-title">{activeSection}</h2>
          </header>
          <div className="brand-section-copy">
            {sectionContent[activeSection].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="network-graphic">
            <img src="/korvesa-network.svg" alt="Korvesa autonomous network diagram" />
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
