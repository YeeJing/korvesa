"use client";

import { useEffect, useRef } from "react";

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const chromaticMetalSource = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;

  float band(vec2 point, float phase, float scale) {
    float wave = point.x * 1.35 + point.y * 0.72;
    wave += sin(point.y * 5.0 + phase) * 0.16;
    wave += sin(point.x * 7.0 - phase * 0.7) * 0.08;
    return 0.5 + 0.5 * sin(wave * scale + phase);
  }

  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 point = (uv - 0.5) * aspect;
    float phase = u_time * 0.22;

    float metalBand = band(point, phase, 8.0);
    metalBand = smoothstep(0.18, 0.92, metalBand);

    float brushed = 0.5 + 0.5 * sin((uv.x + uv.y) * 55.0 + u_time * 0.16);
    vec3 neutralMetal = mix(vec3(0.48, 0.49, 0.50), vec3(0.94, 0.95, 0.96), uv.y);
    vec3 color = mix(neutralMetal * 0.82, neutralMetal * 1.12, metalBand);
    color += brushed * 0.025;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const liquidGlassSource = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_metalTexture;
  uniform vec2 u_resolution;
  uniform float u_time;

  float roundedBoxSdf(vec2 point, vec2 halfSize, float radius) {
    vec2 distanceToCorner = abs(point) - halfSize + radius;
    return length(max(distanceToCorner, 0.0))
      + min(max(distanceToCorner.x, distanceToCorner.y), 0.0)
      - radius;
  }

  vec3 sampleMetal(vec2 uv, vec2 offset) {
    return texture2D(u_metalTexture, uv + offset).rgb;
  }

  void main() {
    vec2 uv = v_uv;
    vec2 pixel = 1.0 / u_resolution;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    vec2 point = uv * u_resolution - u_resolution * 0.5;
    vec2 halfSize = u_resolution * 0.5 - vec2(7.0);
    float radius = 0.0;
    float signedDistance = roundedBoxSdf(point, halfSize, radius);
    float surfaceMask = 1.0 - smoothstep(-0.8, 1.3, signedDistance);
    float outerHalo = exp(-max(signedDistance, 0.0) * 0.19);
    float opticalBoundary = exp(-abs(signedDistance + 1.5) * 0.24);
    float innerBoundary = 1.0 - smoothstep(8.0, 48.0, max(-signedDistance, 0.0));

    float gradientX = roundedBoxSdf(point + vec2(1.0, 0.0), halfSize, radius)
      - roundedBoxSdf(point - vec2(1.0, 0.0), halfSize, radius);
    float gradientY = roundedBoxSdf(point + vec2(0.0, 1.0), halfSize, radius)
      - roundedBoxSdf(point - vec2(0.0, 1.0), halfSize, radius);
    vec2 edgeNormal = normalize(vec2(gradientX, gradientY) + vec2(0.0001));

    float liquidWave = sin((uv.y * 11.0 + uv.x * 7.0) + u_time * 0.34);
    liquidWave += sin((uv.x * 17.0 - uv.y * 5.0) - u_time * 0.21) * 0.5;
    vec2 refraction = edgeNormal * (0.040 + liquidWave * 0.004) * innerBoundary;

    vec3 refracted = sampleMetal(uv, refraction);
    vec2 frostRadius = pixel * 7.0;
    vec3 frost = texture2D(u_metalTexture, uv).rgb * 2.0;
    frost += texture2D(u_metalTexture, uv + vec2(frostRadius.x, 0.0)).rgb;
    frost += texture2D(u_metalTexture, uv - vec2(frostRadius.x, 0.0)).rgb;
    frost += texture2D(u_metalTexture, uv + vec2(0.0, frostRadius.y)).rgb;
    frost += texture2D(u_metalTexture, uv - vec2(0.0, frostRadius.y)).rgb;
    frost += texture2D(u_metalTexture, uv + frostRadius * 0.72).rgb;
    frost += texture2D(u_metalTexture, uv - frostRadius * 0.72).rgb;
    frost += texture2D(u_metalTexture, uv + vec2(frostRadius.x, -frostRadius.y) * 0.72).rgb;
    frost += texture2D(u_metalTexture, uv + vec2(-frostRadius.x, frostRadius.y) * 0.72).rgb;
    frost *= 0.1;

    float fresnel = pow(clamp(innerBoundary, 0.0, 1.0), 1.45);
    float directional = clamp(dot(edgeNormal, normalize(vec2(-0.55, 0.84))), 0.0, 1.0);
    float interiorDepth = smoothstep(22.0, 120.0, max(-signedDistance, 0.0));
    float frostStrength = mix(0.58, 0.9, interiorDepth);
    vec3 frostedCenter = mix(refracted, frost, frostStrength);
    frostedCenter = mix(frostedCenter, vec3(0.94, 0.95, 0.96), 0.5 + interiorDepth * 0.18);
    vec3 metallicRim = mix(sampleMetal(uv, refraction * 1.35), vec3(0.98), 0.18 + directional * 0.18);
    metallicRim *= 0.76 + directional * 0.3;
    vec3 glass = mix(frostedCenter, metallicRim, innerBoundary);
    glass += vec3(1.0) * fresnel * (0.12 + directional * 0.34);
    glass -= vec3(0.09) * opticalBoundary * (1.0 - directional);
    vec3 finalColor = mix(vec3(0.92), glass, surfaceMask);
    float frostedCenterAlpha = mix(0.66, 0.98, innerBoundary);
    float finalAlpha = max(surfaceMask * frostedCenterAlpha, outerHalo * 0.52);
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

type ProgramInfo = {
  program: WebGLProgram;
  position: number;
  resolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
  texture?: WebGLUniformLocation;
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertex: WebGLShader,
  fragmentSource: string,
  withTexture = false,
): ProgramInfo | null {
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const resolution = gl.getUniformLocation(program, "u_resolution");
  const time = gl.getUniformLocation(program, "u_time");
  const texture = withTexture ? gl.getUniformLocation(program, "u_metalTexture") : undefined;
  if (!resolution || !time || (withTexture && !texture)) {
    gl.deleteProgram(program);
    return null;
  }

  return {
    program,
    position: gl.getAttribLocation(program, "a_position"),
    resolution,
    time,
    texture,
  };
}

function createFramebufferTexture(gl: WebGLRenderingContext, width: number, height: number) {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer };
}

export function LiquidGlassLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanupRenderer: (() => void) | undefined;

    const initialise = () => {
      cleanupRenderer?.();
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
      if (!gl) return;

      const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
      if (!vertex) return;
      const metal = createProgram(gl, vertex, chromaticMetalSource);
      const liquid = createProgram(gl, vertex, liquidGlassSource, true);
      gl.deleteShader(vertex);
      if (!metal || !liquid) return;

      const buffer = gl.createBuffer();
      if (!buffer) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      let renderTarget: ReturnType<typeof createFramebufferTexture> = null;
      let frame = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        const density = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(bounds.width * density));
        const height = Math.max(1, Math.round(bounds.height * density));
        if (canvas.width === width && canvas.height === height) return;
        canvas.width = width;
        canvas.height = height;
        if (renderTarget) {
          gl.deleteTexture(renderTarget.texture);
          gl.deleteFramebuffer(renderTarget.framebuffer);
        }
        renderTarget = createFramebufferTexture(gl, width, height);
      };

      const useProgram = (info: ProgramInfo) => {
        gl.useProgram(info.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(info.position);
        gl.vertexAttribPointer(info.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(info.resolution, canvas.width, canvas.height);
      };

      const render = (now: number) => {
        resize();
        if (!renderTarget) return;
        const seconds = reducedMotion.matches ? 0 : now * 0.001;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.framebuffer);
        useProgram(metal);
        gl.uniform1f(metal.time, seconds);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        useProgram(liquid);
        gl.uniform1f(liquid.time, seconds);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderTarget.texture);
        gl.uniform1i(liquid.texture!, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!reducedMotion.matches && !disposed) frame = requestAnimationFrame(render);
      };

      const observer = new ResizeObserver(() => {
        resize();
        if (reducedMotion.matches) render(0);
      });
      observer.observe(canvas);
      resize();
      frame = requestAnimationFrame(render);

      cleanupRenderer = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        if (renderTarget) {
          gl.deleteTexture(renderTarget.texture);
          gl.deleteFramebuffer(renderTarget.framebuffer);
        }
        gl.deleteBuffer(buffer);
        gl.deleteProgram(metal.program);
        gl.deleteProgram(liquid.program);
      };
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cleanupRenderer?.();
    };
    const onContextRestored = () => initialise();
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    initialise();

    return () => {
      disposed = true;
      cleanupRenderer?.();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    };
  }, []);

  return <canvas ref={canvasRef} className="glass-panel__liquid" aria-hidden="true" />;
}
