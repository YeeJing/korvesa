"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

const glassbezelProperties = {
  glassOpacity: 28,
  glassColor: "#0d0d0e",
  bezelColor: "#edebe5",
  glassBlur: 14,
  refraction: 0.55,
  edgeHighlight: 35,
  outlineStroke: 0.5,
  outlineBrightness: 3,
  shadowOpacity: 15,
  shadowSpread: 70,
  layerDepth: 50,
  parallaxRange: 16,
  lerpSpeed: 0.01,
  darkSideSaturation: 29,
  darkTealBrightness: 42,
  darkTealOpacity: 70,
  lightSideSaturation: 42,
  lightTealBrightness: 75.6,
  lightTealOpacity: 50,
  sideTransitionWidth: 0.05,
} as const;

const sourcePerspective = 1100;

type GlassStyle = CSSProperties & {
  "--glass-opacity": string;
  "--glass-color": string;
  "--glass-rgb": string;
  "--glass-blur": string;
  "--refraction-blur": string;
  "--refraction-saturation": string;
  "--outline-stroke": string;
  "--outline-color": string;
  "--shadow-opacity": string;
  "--shadow-spread": string;
  "--depth": string;
  "--front-scale": string;
};

type Point = { x: number; y: number };
type Hsl = { hue: number; saturation: number; lightness: number };

function hexToHsl(hex: string): Hsl {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;
  const delta = maximum - minimum;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (maximum === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    hue: (hue + 360) % 360,
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function cornerCenter(element: HTMLElement, boxBounds: DOMRect): Point {
  const bounds = element.getBoundingClientRect();
  return {
    x: bounds.left - boxBounds.left + bounds.width / 2,
    y: bounds.top - boxBounds.top + bounds.height / 2,
  };
}

export interface GlassPanelProps extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  children: ReactNode;
  restingX?: number;
}

export function GlassPanel({
  children,
  className = "",
  style,
  restingX = 0.64,
  ...sectionProps
}: GlassPanelProps) {
  const surfaceRef = useRef<HTMLElement>(null);
  const glassColor = hexToHsl(glassbezelProperties.bezelColor);
  const outlineOpacity = Math.min(0.85, glassbezelProperties.glassOpacity / 100 + 0.45);
  const panelStyle: GlassStyle = {
    ...style,
    "--glass-opacity": String(glassbezelProperties.glassOpacity / 100),
    "--glass-color": glassbezelProperties.glassColor,
    "--glass-rgb": "13 13 14",
    "--glass-blur": `${glassbezelProperties.glassBlur}px`,
    "--refraction-blur": `${glassbezelProperties.refraction * 8}px`,
    "--refraction-saturation": String(1 + glassbezelProperties.refraction * 0.2),
    "--outline-stroke": `${glassbezelProperties.outlineStroke}px`,
    "--outline-color": `hsla(${glassColor.hue}, ${glassColor.saturation}%, ${Math.min(100, glassColor.lightness + glassbezelProperties.outlineBrightness)}%, ${outlineOpacity})`,
    "--shadow-opacity": String(glassbezelProperties.shadowOpacity / 100),
    "--shadow-spread": `${glassbezelProperties.shadowSpread}px`,
    "--depth": `${glassbezelProperties.layerDepth}px`,
    "--front-scale": String(
      (sourcePerspective - glassbezelProperties.layerDepth) / sourcePerspective,
    ),
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const box = surface.querySelector<HTMLElement>(".glass-panel__box");
    const front = surface.querySelector<HTMLElement>(".glass-panel__front");
    const back = surface.querySelector<HTMLElement>(".glass-panel__back");
    const rightFace = surface.querySelector<SVGPolygonElement>('[data-face="right"]');
    const leftFace = surface.querySelector<SVGPolygonElement>('[data-face="left"]');
    const frontFace = surface.querySelector<SVGPolygonElement>('[data-face="front"]');
    const rightRim = surface.querySelector<SVGLineElement>('[data-rim="right"]');
    const leftRim = surface.querySelector<SVGLineElement>('[data-rim="left"]');
    const anchors = {
      a1: front?.querySelector<HTMLElement>('[data-corner="top-left"]'),
      a2: front?.querySelector<HTMLElement>('[data-corner="top-right"]'),
      a3: front?.querySelector<HTMLElement>('[data-corner="bottom-right"]'),
      a4: front?.querySelector<HTMLElement>('[data-corner="bottom-left"]'),
      b1: back?.querySelector<HTMLElement>('[data-corner="top-left"]'),
      b2: back?.querySelector<HTMLElement>('[data-corner="top-right"]'),
      b3: back?.querySelector<HTMLElement>('[data-corner="bottom-right"]'),
      b4: back?.querySelector<HTMLElement>('[data-corner="bottom-left"]'),
    };

    if (
      !box || !front || !back || !rightFace || !leftFace || !frontFace || !rightRim || !leftRim ||
      Object.values(anchors).some((anchor) => !anchor)
    ) {
      return;
    }

    const state = { targetX: restingX, currentX: restingX };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const drawFaces = () => {
      const boxBounds = box.getBoundingClientRect();
      const a1 = cornerCenter(anchors.a1!, boxBounds);
      const a2 = cornerCenter(anchors.a2!, boxBounds);
      const a3 = cornerCenter(anchors.a3!, boxBounds);
      const a4 = cornerCenter(anchors.a4!, boxBounds);
      const b1 = cornerCenter(anchors.b1!, boxBounds);
      const b2 = cornerCenter(anchors.b2!, boxBounds);
      const b3 = cornerCenter(anchors.b3!, boxBounds);
      const b4 = cornerCenter(anchors.b4!, boxBounds);
      const rightPoints = `${a2.x},${a2.y} ${b2.x},${b2.y} ${b3.x},${b3.y} ${a3.x},${a3.y}`;
      const leftPoints = `${a1.x},${a1.y} ${b1.x},${b1.y} ${b4.x},${b4.y} ${a4.x},${a4.y}`;

      rightFace.setAttribute("points", rightPoints);
      leftFace.setAttribute("points", leftPoints);
      rightRim.setAttribute("x1", String(a2.x));
      rightRim.setAttribute("y1", String(a2.y));
      rightRim.setAttribute("x2", String(b2.x));
      rightRim.setAttribute("y2", String(b2.y));
      leftRim.setAttribute("x1", String(a1.x));
      leftRim.setAttribute("y1", String(a1.y));
      leftRim.setAttribute("x2", String(b1.x));
      leftRim.setAttribute("y2", String(b1.y));

      const rawTransition = Math.max(
        0,
        Math.min(
          1,
          (state.currentX + glassbezelProperties.sideTransitionWidth / 2) /
            glassbezelProperties.sideTransitionWidth,
        ),
      );
      const transition = rawTransition * rawTransition * (3 - 2 * rawTransition);
      const viewingAngle = Math.abs(state.currentX);

      const sideColor = (amount: number) => {
        const configuredSaturation =
          glassbezelProperties.darkSideSaturation +
          (glassbezelProperties.lightSideSaturation - glassbezelProperties.darkSideSaturation) * amount;
        const saturation =
          configuredSaturation * (glassColor.saturation / 100);
        const baseLightness =
          glassbezelProperties.darkTealBrightness +
          (glassbezelProperties.lightTealBrightness - glassbezelProperties.darkTealBrightness) * amount;
        const lightness = baseLightness + (amount - 0.5) * viewingAngle * 12;
        const configuredOpacity =
          glassbezelProperties.darkTealOpacity / 100 +
          (glassbezelProperties.lightTealOpacity / 100 - glassbezelProperties.darkTealOpacity / 100) * amount;
        const opacity = Math.min(
          0.95,
          Math.max(configuredOpacity, glassbezelProperties.glassOpacity / 100 + 0.1),
        );
        return {
          fill: `hsla(${glassColor.hue}, ${saturation}%, ${lightness}%, ${opacity})`,
          outline: `hsla(${glassColor.hue}, ${saturation}%, ${Math.min(100, lightness + glassbezelProperties.outlineBrightness)}%, ${opacity})`,
        };
      };

      const rightColor = sideColor(transition);
      const leftColor = sideColor(1 - transition);
      rightFace.style.fill = rightColor.fill;
      rightFace.style.stroke = rightColor.outline;
      rightFace.style.strokeWidth = String(glassbezelProperties.outlineStroke);
      leftFace.style.fill = leftColor.fill;
      leftFace.style.stroke = leftColor.outline;
      leftFace.style.strokeWidth = String(glassbezelProperties.outlineStroke);

      const frontFaceIsRight = state.currentX < 0;
      const visibleFaceColor = frontFaceIsRight ? rightColor : leftColor;
      frontFace.setAttribute("points", frontFaceIsRight ? rightPoints : leftPoints);
      frontFace.style.fill = visibleFaceColor.fill;
      frontFace.style.stroke = visibleFaceColor.outline;
      frontFace.style.strokeWidth = String(glassbezelProperties.outlineStroke);

      const rimAlpha = Math.min(
        0.4,
        (0.04 + viewingAngle * 0.15) *
          (0.4 + (glassbezelProperties.edgeHighlight / 100) * 1.2),
      );
      const rimColor = `rgba(229, 255, 255, ${rimAlpha})`;
      rightRim.style.stroke = frontFaceIsRight ? rimColor : "transparent";
      leftRim.style.stroke = frontFaceIsRight ? "transparent" : rimColor;
      rightRim.style.strokeWidth = "1";
      leftRim.style.strokeWidth = "1";
    };

    const render = () => {
      if (reducedMotion.matches) {
        state.currentX = restingX;
      } else {
        state.currentX +=
          (state.targetX - state.currentX) * glassbezelProperties.lerpSpeed;
      }

      box.style.setProperty(
        "--front-x",
        `${state.currentX * glassbezelProperties.parallaxRange}px`,
      );
      box.style.setProperty(
        "--back-x",
        `${state.currentX * (glassbezelProperties.parallaxRange * -0.53)}px`,
      );
      box.style.setProperty("--rot-y", `${state.currentX * 10}deg`);
      drawFaces();

      if (!reducedMotion.matches) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = surface.getBoundingClientRect();
      const nearestX = Math.max(bounds.left, Math.min(event.clientX, bounds.right));
      const nearestY = Math.max(bounds.top, Math.min(event.clientY, bounds.bottom));
      const distance = Math.hypot(event.clientX - nearestX, event.clientY - nearestY);
      const proximityRadius = Math.min(bounds.width, bounds.height) / 2;

      if (distance > proximityRadius) {
        state.targetX = restingX;
        return;
      }

      const normalized = Math.max(
        -1,
        Math.min(1, (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2)),
      );
      const movementLimit = Math.abs(restingX);
      state.targetX = Math.max(
        -movementLimit,
        Math.min(movementLimit, normalized * movementLimit),
      );
    };
    const returnToRest = () => {
      state.targetX = restingX;
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) returnToRest();
    };
    const resizeObserver = new ResizeObserver(drawFaces);

    resizeObserver.observe(surface);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", returnToRest);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", returnToRest);
    };
  }, [glassColor.hue, glassColor.lightness, glassColor.saturation, restingX]);

  const corners = (
    <>
      <span className="glass-panel__corner glass-panel__corner--top-left" data-corner="top-left" />
      <span className="glass-panel__corner glass-panel__corner--top-right" data-corner="top-right" />
      <span className="glass-panel__corner glass-panel__corner--bottom-right" data-corner="bottom-right" />
      <span className="glass-panel__corner glass-panel__corner--bottom-left" data-corner="bottom-left" />
    </>
  );

  return (
    <section
      {...sectionProps}
      ref={surfaceRef}
      className={`tile glass-panel ${className}`.trim()}
      style={panelStyle}
    >
      <div className="glass-panel__box">
        <div className="glass-panel__layer glass-panel__back" aria-hidden="true">
          {corners}
        </div>
        <svg className="glass-panel__connector" aria-hidden="true">
          <polygon data-face="right" />
          <polygon data-face="left" />
          <line data-rim="right" />
          <line data-rim="left" />
        </svg>
        <svg className="glass-panel__front-overlay" aria-hidden="true">
          <polygon data-face="front" />
        </svg>
        <div className="glass-panel__layer glass-panel__front">
          {corners}
          <span className="glass-panel__noise" aria-hidden="true" />
          <div className="glass-panel__content">{children}</div>
        </div>
      </div>
    </section>
  );
}
