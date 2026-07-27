"use client";

import { useEffect, useRef } from "react";

const PARALLAX = {
  radius: 162,
  smoothing: 0.16,
  strength: 14,
  tilt: 10,
} as const;

type TeamCardProps = {
  alt: string;
  variant: "nazry" | "yvonne";
};

const cardDetails = {
  yvonne: {
    background: "#5c3e34",
    inner: { x: 20.1758, y: 96.0932 },
    name: "Yvonne Kan",
    namePosition: { x: 20.1746, y: 115.7426 },
    role: "Co-Founder :: CEO",
    rolePosition: { x: 20.1752, y: 143.8738 },
    education: "Masters in Digital Design",
    educationPosition: { x: 20.1746, y: 229.65 },
    institution: "@/- Royal Melbourne Institute of Technology",
    institutionPosition: { x: 20.1746, y: 258.2301 },
    tag: { color: "#d58977", x: 360.1754, text: "CEO", textX: 373.0433 },
    outerTransform: "translate(403.447 -46.9037) rotate(90)",
    viewBox: "0 0 507.6 372.6",
  },
  nazry: {
    background: "#403d2b",
    inner: { x: 86.5, y: 96.0932 },
    name: "Nazry Yazid",
    namePosition: { x: 86.5002, y: 113.5235 },
    role: "Founder :: CTO",
    rolePosition: { x: 86.5002, y: 143.8738 },
    education: "Bachelor in Industrial Design (Honours)",
    educationPosition: { x: 86.5002, y: 229.65 },
    institution: "@/- Royal Melbourne Institute of Technology",
    institutionPosition: { x: 86.5002, y: 258.2301 },
    tag: { color: "#ccc199", x: 426.5, text: "CTO", textX: 440.088 },
    outerTransform: "translate(469.7717 -113.2284) rotate(90)",
    viewBox: "0 0 534.6 372.6",
  },
} as const;

export function TeamCard({ alt, variant }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const card = cardDetails[variant];

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const target = { x: 0, y: 0, rotateX: 0, rotateY: 0 };
    const current = { ...target };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const render = () => {
      frame = 0;
      const moving = Object.entries(target).some(([key, value]) =>
        Math.abs(value - current[key as keyof typeof current]) > 0.01,
      );

      if (reducedMotion.matches) {
        current.x = 0;
        current.y = 0;
        current.rotateX = 0;
        current.rotateY = 0;
      } else {
        current.x += (target.x - current.x) * PARALLAX.smoothing;
        current.y += (target.y - current.y) * PARALLAX.smoothing;
        current.rotateX += (target.rotateX - current.rotateX) * PARALLAX.smoothing;
        current.rotateY += (target.rotateY - current.rotateY) * PARALLAX.smoothing;
      }

      card.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) rotateX(${current.rotateX}deg) rotateY(${current.rotateY}deg)`;

      if (moving && !reducedMotion.matches) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const reset = () => {
      target.x = 0;
      target.y = 0;
      target.rotateX = 0;
      target.rotateY = 0;
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;

      const bounds = card.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const offsetX = event.clientX - centerX;
      const offsetY = event.clientY - centerY;
      const distance = Math.hypot(offsetX, offsetY);

      if (distance >= PARALLAX.radius) {
        reset();
        return;
      }

      const falloff = 1 - distance / PARALLAX.radius;
      const normalizedX = offsetX / PARALLAX.radius;
      const normalizedY = offsetY / PARALLAX.radius;
      target.x = normalizedX * PARALLAX.strength * falloff;
      target.y = normalizedY * PARALLAX.strength * falloff;
      target.rotateY = normalizedX * PARALLAX.tilt * falloff;
      target.rotateX = -normalizedY * PARALLAX.tilt * falloff;
      requestRender();
    };

    const onMotionChange = () => reset();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", reset);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", reset);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <figure className="team-card">
      <div ref={cardRef} className="team-card__surface">
        <svg aria-label={alt} role="img" viewBox={card.viewBox} xmlns="http://www.w3.org/2000/svg">
          <rect
            fill={card.background}
            height="430"
            transform={card.outerTransform}
            width="184.3566"
            x={variant === "yvonne" ? "132.9971" : "199.3217"}
            y="-36.7284"
          />
          <rect fill={card.background} height="164.3564" width="410" x={card.inner.x} y={card.inner.y} />
          <text className="team-card__name" x={card.namePosition.x} y={card.namePosition.y}>{card.name}</text>
          <text className="team-card__body" x={card.rolePosition.x} y={card.rolePosition.y}>{card.role}</text>
          <text className="team-card__title" x={card.educationPosition.x} y={card.educationPosition.y}>{card.education}</text>
          <text className="team-card__body" x={card.institutionPosition.x} y={card.institutionPosition.y}>{card.institution}</text>
          <rect fill={card.tag.color} height="60" width="80" x={card.tag.x} y="86.0933" />
          <text className="team-card__tag" x={card.tag.textX} y="123.713">{card.tag.text}</text>
        </svg>
      </div>
    </figure>
  );
}
