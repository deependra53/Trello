# IndiHive

## Performance rules

### Never use `backdrop-blur` (or `backdrop-filter: blur(...)`) on large, fullscreen, or scrollable surfaces

Backdrop blur forces the browser to re-rasterize everything behind the blurred surface on every paint. On a `fixed inset-0` overlay (dialogs, sticky bars, full-screen scrims), this means a full re-paint on every scroll frame, every transition, every drag — and the modal feels laggy.

We hit this on the card modal: `backdrop-blur-sm` on the dialog overlay made scrolling stutter. Removing it made the modal smooth.

**Rules:**
- Do not add `backdrop-blur*` to dialog overlays, modal scrims, sticky topbars on long-scrolling pages, or anything that covers the whole viewport.
- If you want the "frosted glass" feel, use a slightly darker/lighter solid color with opacity (e.g. `bg-black/70`) — it costs the GPU nothing.
- Small static chrome (a tiny chip, a toolbar that doesn't sit over scrolling content) can use blur if it's clearly worth it, but default to no blur.
- The same rule applies to CSS `filter: blur(...)`, `box-shadow` on huge surfaces, and any other compositing-heavy effect on large or moving elements.

Speed and smoothness matter more than the visual flourish.
