import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Korvesa site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Korvesa — Low Altitude Economy<\/title>/);
  assert.match(html, /Low Altitude Economy Autonomous Network/);
  assert.match(html, /aria-label="Page sections"/);
  assert.match(html, /href="#the-gap"/);
  assert.match(html, /href="#our-mission"/);
  assert.match(html, /href="#advantage"/);
  assert.match(html, /href="#economics"/);
  assert.match(html, /href="#the-team"/);
  assert.match(html, /src="\/korvesa-logo\.svg"/);
  assert.match(html, /src="\/drone-background\.svg"/);
  assert.match(html, /src="\/drone-floating\.svg"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps production assets and code project-local", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /C:[/\\]Users[/\\]/i);
  assert.doesNotMatch(page, /_sites-preview|grain-overlay/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(layout, /from "next\/font\/google"/);
  assert.match(layout, /fallback:\s*\["Geist Fallback"\]/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com/);
  assert.match(css, /size-adjust:\s*104\.76%/);
  assert.match(css, /ascent-override:\s*95\.94%/);
  assert.match(css, /descent-override:\s*28\.16%/);
  assert.match(css, /line-gap-override:\s*0%/);
  assert.doesNotMatch(css, /grain-dissolve/);
  assert.match(css, /\.canvas\s*\{[^}]*background:\s*var\(--paper\)/);
  assert.match(css, /\.canvas::before\s*\{[^}]*url\("\/noise\.svg"\)/);

  await Promise.all([
    access(new URL("../public/korvesa-logo.svg", import.meta.url)),
    assert.rejects(
      access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
    ),
    assert.rejects(
      access(new URL("../app/_sites-preview/preview.css", import.meta.url)),
    ),
  ]);
});
