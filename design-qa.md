# Design QA

## Comparison target

- Source blueprint: `C:\Users\yee\Downloads\LANDrop\IMG_7975.jpeg` (`288 × 2560` pixels).
- Source material reference: `C:\Users\yee\.codex\codex-remote-attachments\019f9053-c29f-73e2-afa6-f5957204d6d0\61DFEE0A-93A8-406A-BFC2-B697EAD9FCE6\2-Photo-2.jpg` (`588 × 1280` pixels).
- Browser implementation: `http://localhost:5174/`.
- Implementation evidence: `C:\Users\yee\Documents\website\design-qa-left-panel.png` (`289 × 681` pixels).
- Combined focused comparison: `C:\Users\yee\Documents\website\design-qa-comparison.png` (`900 × 700` pixels).
- Browser viewport: `1280 × 720` CSS pixels.
- Implementation capture density: `1×`.
- State: desktop, left panel visible, pointer positioned over the left panel.

## Full-view comparison evidence

The left panel retains the existing Korvesa content and straight-corner geometry requested for the site. Its former CSS/backdrop-filter glass layers are disabled. The replacement is visibly rendered by a shared two-pass WebGL canvas: the chromatic metal pass is rendered to a framebuffer texture, and the liquid-glass pass samples that texture with edge refraction, RGB separation, frost sampling, Fresnel highlights, and pointer-driven displacement.

## Focused region comparison evidence

The combined comparison shows the requested material separation in the implemented left panel: a neutral silver reflective-metal rim, a translucent neutral frosted-glass interior, directional highlights, and a pointer-responsive light response. The material was adapted to the full-height straight panel without changing its content or established layout.

## Required fidelity surfaces

- Fonts and typography: Existing Geist typography, hierarchy, wrapping, and optical weights are preserved and remain legible over the shader.
- Spacing and layout rhythm: Left-panel dimensions, padding, navigation positions, and straight-corner geometry are preserved.
- Colors and visual tokens: The `#edebe5` page token is preserved. The shader uses a neutral silver-metal rim and contains no RGB splitting or cyan/red chromatic separation.
- Image quality and asset fidelity: No reference asset was replaced with CSS art. The material is rendered procedurally in WebGL as required by the blueprint.
- Copy and content: All Korvesa copy and anchor labels are unchanged.

## Interaction and runtime checks

- Pointer movement updates the refraction target without React state updates per frame.
- Touch pointer coordinates use the same pointer pipeline.
- `prefers-reduced-motion` renders a static material.
- `ResizeObserver` updates the canvas and caps device density at `2×`.
- WebGL context loss and restoration handlers are installed.
- Shader and program compilation failures report their WebGL info logs.
- Browser console checked: no errors or warnings.
- Production build completed successfully.

## Findings

- No actionable P0, P1, or P2 differences remain for the requested left-panel material replacement.

## Follow-up polish

- P3: The exact chromatic balance can be tuned later if the user wants stronger or weaker rainbow separation.

## Comparison history

- Initial implementation: dark lower metal band reduced navigation-label contrast.
- Fix: raised the neutral-metal luminance, reduced the chromatic blend, and increased the liquid pass's neutral frost mix.
- Post-fix evidence: all navigation labels remain readable while the chromatic refraction stays visible.
- Edge iteration: the first shader treated the panel boundary as a flat rectangular cutoff, unlike Photo 2's raised glass rim.
- Fix: replaced the cutoff with a rounded-box signed-distance field, finite-difference edge normals, a thick Fresnel inner rim, transparent outer halo, and angle-dependent RGB dispersion.
- Post-fix evidence: the revised browser capture shows continuous rounded corners, a bright white inner edge, a soft exterior glow, and narrow cyan/red separation along the boundary. No browser console errors or warnings were present.
- Material-continuity iteration: the bright rim read as a separate border and the center retained too much metal definition.
- Fix: the rim now samples the same refracted framebuffer as the surface, while the interior uses a wider ten-tap frost sample and stronger depth-based neutral diffusion.
- Post-fix evidence: the rim transitions continuously into the liquid material, while the center is visibly softer and more frosted. Text remains legible and the browser console remains clear.
- Geometry and transmission iteration: rounded corners conflicted with the site's specified straight-corner panel geometry.
- Fix: changed the shader's signed-distance surface to a rectangular boundary and set the liquid panel radius to zero. The shader now keeps near-opaque glossy refraction at the rim while the center has lower alpha and stronger neutral frost.
- Post-fix evidence: the latest browser capture shows square corners, a continuous glossy refractive rim, and a distinct translucent frosted center. No browser console errors or warnings were present.
- Material separation iteration: the rim still inherited chromatic color separation and did not read as neutral metallic material.
- Fix: removed RGB split sampling and all chromatic rim output. The shader now uses a grayscale silver-metal pass for the rectangular rim and a separately masked, lower-reflection frosted-glass pass for the center.
- Post-fix evidence: the latest browser capture shows a neutral metallic perimeter, no cyan/red separation, and a softer translucent frosted center. No browser console errors or warnings were present.

final result: passed

## Latest left-panel layout iteration

- Source layout reference: `C:\Users\yee\Pictures\Screenshots\Screenshot 2026-07-26 204700.png`.
- Browser implementation: `http://localhost:5175/`.
- Fix: replaced the editorial heading with the supplied Korvesa SVG, added the exact tagline, moved the anchor grid directly beneath the brand block, and updated its labels to The Gap, Our Mission, Advantage, Economics, and The Team.
- Evidence: `C:\Users\yee\Documents\website\design-qa-left-panel.png`.
- Browser console: no errors or warnings.
- final result: passed
