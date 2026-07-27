"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { GlassPanel } from "./components/GlassPanel";
import { PixelBleedFrame } from "./components/PixelBleedFrame";
import { TeamCard } from "./components/TeamCard";

const sections = ["The Gap", "Our Mission", "Advantage", "Economics", "The Team"] as const;
type SectionName = (typeof sections)[number];
type NavigationDirection = "previous" | "next";

const RAIL_DURATION_MS = 2000;
const INITIAL_STAGE_STYLE = {
  "--active-slide": 0,
  "--slide-count": sections.length,
} as CSSProperties;

const sectionId = (section: SectionName) => section.toLowerCase().replaceAll(" ", "-");

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

function TeamSlide() {
  return (
    <div className="team-portraits" aria-label="Korvesa team portraits">
      <div className="team-member team-member--yvonne">
        <PixelBleedFrame alt="Yvonne" src="/team-00005.png" />
        <TeamCard alt="Yvonne team profile" variant="yvonne" />
      </div>
      <div className="team-member team-member--nazry">
        <PixelBleedFrame alt="Nazry" src="/team-00006.png" />
        <TeamCard alt="Nazry team profile" variant="nazry" />
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionName>("The Gap");
  const [pressedDirection, setPressedDirection] = useState<NavigationDirection | null>(null);
  const activeIndex = sections.indexOf(activeSection);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);
  const railProgressRef = useRef(0);

  const moveSection = useCallback((direction: NavigationDirection) => {
    setActiveSection((currentSection) => {
      const currentIndex = sections.indexOf(currentSection);
      const offset = direction === "next" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + offset));
      return sections[nextIndex];
    });
  }, []);

  const navigateSection = useCallback((direction: NavigationDirection) => {
    moveSection(direction);
  }, [moveSection]);

  useEffect(() => {
    const isTextInput = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextInput(event.target)) return;

      const direction = event.key === "ArrowLeft"
        ? "previous"
        : event.key === "ArrowRight"
          ? "next"
          : null;
      if (!direction) return;

      event.preventDefault();
      setPressedDirection(direction);
      if (!event.repeat) navigateSection(direction);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        setPressedDirection(null);
      }
    };
    const onWindowBlur = () => setPressedDirection(null);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [activeSection, navigateSection]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = railProgressRef.current;
    const to = activeIndex;

    const setRailPosition = (progress: number) => {
      railProgressRef.current = progress;
      stageRef.current?.style.setProperty("--active-slide", String(progress));
      sceneRefs.current.forEach((scene, index) => {
        if (!scene) return;
        const offset = index - progress;
        const dropDistance =
          offset < 0
            ? Math.min(-offset, 1)
            : offset > 1
              ? Math.min(offset - 1, 1)
              : 0;
        scene.style.transform = `translateY(${dropDistance * 100}%)`;
      });
    };

    if (reduceMotion || from === to) {
      setRailPosition(to);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const elapsed = Math.min((now - startedAt) / RAIL_DURATION_MS, 1);
      const eased = (1 - Math.cos(Math.PI * elapsed)) / 2;
      setRailPosition(from + (to - from) * eased);
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  return (
    <main>
      <div className="canvas">
        <GlassPanel className="intro-tile" aria-labelledby="intro-title">
          <div className="intro-copy intro-brand">
            <Image
              className="intro-logo"
              src="/korvesa-logo.svg"
              alt="Korvesa"
              width={250}
              height={42}
              priority
            />
            <p id="intro-title" className="intro-tagline">Low Altitude Economy Autonomous Network</p>
          </div>

          <nav className="section-nav" aria-label="Page sections">
            <div className="section-nav__track">
              <span className="nav-marker" aria-hidden="true" style={{ "--active-index": activeIndex } as CSSProperties}>{"{{ You’re Here }}"}</span>
              <ol>
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
            </div>
            <div className="nav-controls" aria-label="Slide controls">
              <p>∷ Navigate with arrow keys on keyboard ∷</p>
              {([
                { direction: "previous", label: "Previous section" },
                { direction: "next", label: "Next section" },
              ] as const).map(({ direction, label }) => {
                const pressed = pressedDirection === direction;
                return (
                  <button
                    className={`nav-key nav-key--${direction}`}
                    type="button"
                    aria-label={label}
                    aria-pressed={pressed}
                    key={direction}
                    onClick={() => navigateSection(direction)}
                    onPointerDown={() => setPressedDirection(direction)}
                    onPointerUp={() => setPressedDirection(null)}
                    onPointerLeave={() => setPressedDirection(null)}
                    onPointerCancel={() => setPressedDirection(null)}
                  >
                    <Image
                      className="nav-key__asset"
                      src={pressed ? "/arrow-key-pressed.svg" : "/arrow-key.svg"}
                      alt=""
                      width={300}
                      height={300}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="drone-graphic" aria-label="Korvesa autonomous network diagram">
            <Image
              className="drone-graphic__background"
              src="/drone-background.svg"
              alt=""
              aria-hidden="true"
              width={356}
              height={119}
            />
            <Image
              className="drone-graphic__floating"
              src="/drone-floating.svg"
              alt=""
              aria-hidden="true"
              width={150}
              height={112}
            />
          </div>
        </GlassPanel>

        <section
          className="tile statement-tile"
          aria-label="Korvesa section slides"
          tabIndex={0}
        >
          <div ref={stageRef} className="why-stage" style={INITIAL_STAGE_STYLE}>
            <div className="why-track">
              {sections.map((section, index) => {
                return (
                  <article
                    ref={(scene) => {
                      sceneRefs.current[index] = scene;
                    }}
                    className={`why-scene${section === "The Team" ? " why-scene--team" : ""}`}
                    aria-hidden={section !== activeSection}
                    key={section}
                    style={{
                      transform: `translateY(${index > 1 ? 100 : 0}%)`,
                      zIndex: sections.length - index,
                    }}
                  >
                    {section === "The Gap" ? <GapSlide /> : null}
                    {section === "Economics" ? (
                      <div className="economic-slide" aria-label="Economics slide">
                        <object
                          className="economic-slide__graph"
                          aria-label="Korvesa economics graph"
                          data="/economic-graph.svg"
                          type="image/svg+xml"
                        >
                          Korvesa economics graph
                        </object>
                      </div>
                    ) : null}
                    {section === "The Team" ? <TeamSlide /> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <GlassPanel className="brand-tile" aria-labelledby="brand-title">
          <header>
            <h2 id="brand-title">{activeSection}</h2>
          </header>
          <div className="brand-section-copy">
            {sectionContent[activeSection].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
