"use client";

import NextImage from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

type PixelBleedFrameProps = {
  alt: string;
  src: string;
};

type PixelFrameStyle = CSSProperties & {
  "--label-left": string;
  "--label-top": string;
  "--tag-height": string;
  "--tag-left": string;
  "--tag-top": string;
  "--tag-width": string;
};

const FRAME_RATIO_WIDTH = 3;
const FRAME_RATIO_HEIGHT = 4;
const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = Math.round(
  (IMAGE_WIDTH * FRAME_RATIO_HEIGHT) / FRAME_RATIO_WIDTH,
);

const TEST_PRESET = {
  cellSize: 20,
  erodeDepth: 92,
  bleedOut: 84,
  seed: 948,
  dither: 9,
  colorRandomize: 0,
} as const;

const TAG_PRESET = {
  scale: 40,
  x: 50,
  y: 45,
} as const;

const TAG_BOX = {
  x0: 139.995,
  y0: 99.995,
  x1: 359.005,
  y1: 399.995,
  view: 500,
} as const;

const CANVAS_WIDTH =
  Math.ceil(
    (IMAGE_WIDTH + TEST_PRESET.bleedOut * 2) / TEST_PRESET.cellSize,
  ) * TEST_PRESET.cellSize;
const CANVAS_HEIGHT =
  Math.ceil(
    (IMAGE_HEIGHT + TEST_PRESET.bleedOut * 2) / TEST_PRESET.cellSize,
  ) * TEST_PRESET.cellSize;
const IMAGE_X =
  Math.round(
    (CANVAS_WIDTH - IMAGE_WIDTH) / 2 / TEST_PRESET.cellSize,
  ) * TEST_PRESET.cellSize;
const IMAGE_Y =
  Math.round(
    (CANVAS_HEIGHT - IMAGE_HEIGHT) / 2 / TEST_PRESET.cellSize,
  ) * TEST_PRESET.cellSize;

const TAG_BOX_CENTER_X = (TAG_BOX.x0 + TAG_BOX.x1) / 2 / TAG_BOX.view;
const TAG_BOX_CENTER_Y = (TAG_BOX.y0 + TAG_BOX.y1) / 2 / TAG_BOX.view;
const TAG_BOX_HEIGHT_FRACTION = (TAG_BOX.y1 - TAG_BOX.y0) / TAG_BOX.view;
const TAG_SIZE =
  (IMAGE_HEIGHT * (TAG_PRESET.scale / 100)) / TAG_BOX_HEIGHT_FRACTION;
const TAG_LEFT =
  IMAGE_X +
  IMAGE_WIDTH * (TAG_PRESET.x / 100) -
  TAG_SIZE * TAG_BOX_CENTER_X;
const TAG_TOP =
  IMAGE_Y +
  IMAGE_HEIGHT * (TAG_PRESET.y / 100) -
  TAG_SIZE * TAG_BOX_CENTER_Y;
const LABEL_LEFT = TAG_LEFT + (TAG_SIZE * TAG_BOX.x0) / TAG_BOX.view;
const LABEL_TOP = TAG_TOP + (TAG_SIZE * TAG_BOX.y0) / TAG_BOX.view;

const FRAME_STYLE: PixelFrameStyle = {
  "--label-left": `${(LABEL_LEFT / CANVAS_WIDTH) * 100}%`,
  "--label-top": `${(LABEL_TOP / CANVAS_HEIGHT) * 100}%`,
  "--tag-height": `${(TAG_SIZE / CANVAS_HEIGHT) * 100}%`,
  "--tag-left": `${(TAG_LEFT / CANVAS_WIDTH) * 100}%`,
  "--tag-top": `${(TAG_TOP / CANVAS_HEIGHT) * 100}%`,
  "--tag-width": `${(TAG_SIZE / CANVAS_WIDTH) * 100}%`,
};

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((value) => value / 16 - 0.5));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const clampByte = (value: number) => clamp(Math.round(value), 0, 255);

function mulberry32(seed: number) {
  return () => {
    let nextSeed = (seed += 0x6d2b79f5);
    nextSeed = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
    nextSeed ^= nextSeed + Math.imul(nextSeed ^ (nextSeed >>> 7), nextSeed | 61);
    return ((nextSeed ^ (nextSeed >>> 14)) >>> 0) / 4294967296;
  };
}

function edgeWalk(steps: number, depth: number, random: () => number) {
  const values: number[] = [];
  let value = depth * (0.3 + random() * 0.3);

  for (let index = 0; index < steps; index += 1) {
    value += (random() - 0.5) * depth * 0.5;
    value = clamp(value, 0, depth);
    values.push(value);
  }

  return values;
}

function cellHash(gridX: number, gridY: number, seed: number) {
  const value =
    Math.sin(gridX * 127.1 + gridY * 311.7 + seed * 0.017) * 43758.5453;
  return value - Math.floor(value);
}

function applyDither(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number,
) {
  if (strength <= 0) return;

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      if (pixels[pixelIndex + 3] === 0) continue;

      const adjustment = BAYER_4[y & 3][x & 3] * strength;
      pixels[pixelIndex] = clampByte(pixels[pixelIndex] + adjustment);
      pixels[pixelIndex + 1] = clampByte(pixels[pixelIndex + 1] + adjustment);
      pixels[pixelIndex + 2] = clampByte(pixels[pixelIndex + 2] + adjustment);
    }
  }

  context.putImageData(imageData, 0, 0);
}

export function PixelBleedFrame({ alt, src }: PixelBleedFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new window.Image();
    let cancelled = false;

    image.onload = () => {
      if (cancelled) return;

      const {
        cellSize,
        colorRandomize,
        dither,
        erodeDepth,
        seed,
      } = TEST_PRESET;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = FRAME_RATIO_WIDTH / FRAME_RATIO_HEIGHT;
      let cropWidth = image.naturalWidth;
      let cropHeight = image.naturalHeight;
      let cropX = 0;
      let cropY = 0;

      if (sourceRatio > targetRatio) {
        cropWidth = image.naturalHeight * targetRatio;
        cropX = (image.naturalWidth - cropWidth) / 2;
      } else {
        cropHeight = image.naturalWidth / targetRatio;
        cropY = (image.naturalHeight - cropHeight) / 2;
      }

      const sampleWidth = 64;
      const sampleHeight = Math.max(
        1,
        Math.round((sampleWidth * FRAME_RATIO_HEIGHT) / FRAME_RATIO_WIDTH),
      );
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = sampleWidth;
      sampleCanvas.height = sampleHeight;
      const sampleContext = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sampleContext) return;

      sampleContext.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        sampleWidth,
        sampleHeight,
      );
      const samplePixels = sampleContext.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight,
      ).data;

      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const outputContext = canvas.getContext("2d");
      if (!outputContext) return;
      outputContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      outputContext.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        IMAGE_X,
        IMAGE_Y,
        IMAGE_WIDTH,
        IMAGE_HEIGHT,
      );

      const pixelCanvas = document.createElement("canvas");
      pixelCanvas.width = CANVAS_WIDTH;
      pixelCanvas.height = CANVAS_HEIGHT;
      const pixelContext = pixelCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!pixelContext) return;

      const paletteColorAt = (normalizedX: number, normalizedY: number) => {
        const sampleX = clamp(
          Math.round(normalizedX * (sampleWidth - 1)),
          0,
          sampleWidth - 1,
        );
        const sampleY = clamp(
          Math.round(normalizedY * (sampleHeight - 1)),
          0,
          sampleHeight - 1,
        );
        const pixelIndex = (sampleY * sampleWidth + sampleX) * 4;
        return [
          samplePixels[pixelIndex],
          samplePixels[pixelIndex + 1],
          samplePixels[pixelIndex + 2],
        ];
      };

      for (let y = 0; y < CANVAS_HEIGHT; y += cellSize) {
        for (let x = 0; x < CANVAS_WIDTH; x += cellSize) {
          const centerX = x + cellSize / 2;
          const centerY = y + cellSize / 2;
          const normalizedX = (centerX - IMAGE_X) / IMAGE_WIDTH;
          const normalizedY = (centerY - IMAGE_Y) / IMAGE_HEIGHT;
          const [baseRed, baseGreen, baseBlue] = paletteColorAt(
            clamp(normalizedX, 0, 1),
            clamp(normalizedY, 0, 1),
          );
          let red = baseRed;
          let green = baseGreen;
          let blue = baseBlue;

          if (colorRandomize > 0) {
            const gridX = Math.round(x / cellSize);
            const gridY = Math.round(y / cellSize);
            red +=
              (cellHash(gridX, gridY, seed) - 0.5) * colorRandomize * 2;
            green +=
              (cellHash(gridX, gridY, seed + 1000) - 0.5) *
              colorRandomize *
              2;
            blue +=
              (cellHash(gridX, gridY, seed + 2000) - 0.5) *
              colorRandomize *
              2;
          }

          pixelContext.fillStyle = `rgb(${clampByte(red)}, ${clampByte(green)}, ${clampByte(blue)})`;
          pixelContext.fillRect(x, y, cellSize, cellSize);
        }
      }

      applyDither(pixelContext, CANVAS_WIDTH, CANVAS_HEIGHT, dither);

      const random = mulberry32(seed);
      const stepsX = Math.round(CANVAS_WIDTH / cellSize);
      const stepsY = Math.round(CANVAS_HEIGHT / cellSize);
      const photoStepsX = Math.round(IMAGE_WIDTH / cellSize);
      const photoStepsY = Math.round(IMAGE_HEIGHT / cellSize);
      const topErode = edgeWalk(photoStepsX, erodeDepth, random);
      const bottomErode = edgeWalk(photoStepsX, erodeDepth, random);
      const leftErode = edgeWalk(photoStepsY, erodeDepth, random);
      const rightErode = edgeWalk(photoStepsY, erodeDepth, random);
      const topBleed = edgeWalk(
        photoStepsX,
        TEST_PRESET.bleedOut,
        random,
      );
      const bottomBleed = edgeWalk(
        photoStepsX,
        TEST_PRESET.bleedOut,
        random,
      );
      const leftBleed = edgeWalk(
        photoStepsY,
        TEST_PRESET.bleedOut,
        random,
      );
      const rightBleed = edgeWalk(
        photoStepsY,
        TEST_PRESET.bleedOut,
        random,
      );
      const rectangleLeft = IMAGE_X;
      const rectangleRight = IMAGE_X + IMAGE_WIDTH;
      const rectangleTop = IMAGE_Y;
      const rectangleBottom = IMAGE_Y + IMAGE_HEIGHT;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = CANVAS_WIDTH;
      maskCanvas.height = CANVAS_HEIGHT;
      const maskContext = maskCanvas.getContext("2d");
      if (!maskContext) return;
      maskContext.fillStyle = "#fff";

      for (let gridX = 0; gridX < stepsX; gridX += 1) {
        const x = gridX * cellSize;

        for (let gridY = 0; gridY < stepsY; gridY += 1) {
          const y = gridY * cellSize;
          const fullyInsidePhoto =
            x >= rectangleLeft &&
            x + cellSize <= rectangleRight &&
            y >= rectangleTop &&
            y + cellSize <= rectangleBottom;
          const photoGridX = clamp(
            Math.floor((x - IMAGE_X) / cellSize),
            0,
            photoStepsX - 1,
          );
          const photoGridY = clamp(
            Math.floor((y - IMAGE_Y) / cellSize),
            0,
            photoStepsY - 1,
          );

          if (fullyInsidePhoto) {
            const distanceTop = y - rectangleTop;
            const distanceBottom = rectangleBottom - (y + cellSize);
            const distanceLeft = x - rectangleLeft;
            const distanceRight = rectangleRight - (x + cellSize);
            const eroded =
              distanceTop < topErode[photoGridX] ||
              distanceBottom < bottomErode[photoGridX] ||
              distanceLeft < leftErode[photoGridY] ||
              distanceRight < rightErode[photoGridY];

            if (eroded) {
              maskContext.fillRect(x, y, cellSize, cellSize);
            }
            continue;
          }

          const outsideX =
            x < rectangleLeft
              ? rectangleLeft - x
              : x + cellSize > rectangleRight
                ? x + cellSize - rectangleRight
                : 0;
          const outsideY =
            y < rectangleTop
              ? rectangleTop - y
              : y + cellSize > rectangleBottom
                ? y + cellSize - rectangleBottom
                : 0;
          let covered = false;

          if (outsideX > 0 && outsideY > 0) {
            const verticalEdge =
              y < rectangleTop
                ? topBleed[photoGridX]
                : bottomBleed[photoGridX];
            const horizontalEdge =
              x < rectangleLeft
                ? leftBleed[photoGridY]
                : rightBleed[photoGridY];
            covered =
              Math.hypot(outsideX, outsideY) <
              (verticalEdge + horizontalEdge) / 2;
          } else if (outsideY > 0) {
            covered =
              outsideY <
              (y < rectangleTop
                ? topBleed[photoGridX]
                : bottomBleed[photoGridX]);
          } else if (outsideX > 0) {
            covered =
              outsideX <
              (x < rectangleLeft
                ? leftBleed[photoGridY]
                : rightBleed[photoGridY]);
          }

          if (covered) {
            maskContext.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      pixelContext.globalCompositeOperation = "destination-in";
      pixelContext.drawImage(maskCanvas, 0, 0);
      pixelContext.globalCompositeOperation = "source-over";
      outputContext.drawImage(pixelCanvas, 0, 0);
    };

    image.src = src;

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [src]);

  return (
    <figure className="pixel-frame" style={FRAME_STYLE}>
      <canvas
        ref={canvasRef}
        className="pixel-frame__canvas"
        role="img"
        aria-label={alt}
      />
      <NextImage
        className="pixel-frame__tag"
        src="/no_tag_frame.svg"
        alt=""
        aria-hidden="true"
        width={500}
        height={500}
      />
      <figcaption className="pixel-frame__label">{alt}</figcaption>
    </figure>
  );
}
