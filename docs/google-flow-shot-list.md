# TrueFraction — Google Flow Shot List (v2)

Prompts for the cinematic background footage, for Google Flow (Veo).

**v2 changes two things after the first test round:**
1. **Anchor every clip to one reference still** using Frames to Video, instead
   of describing the building in words. This is the only real fix for "the
   building changes every time."
2. **No more night/black footage.** Golden hour and blue hour only. The site's
   dark look comes from a CSS overlay, not from dark video.

Read "The workflow" before generating anything.

---

## The workflow

### Why the building keeps changing

Text-to-video re-invents the subject on every generation. The "building bible"
paragraph narrows the range; it cannot lock geometry. Two takes of the same
prompt gave a squat bronze slab and a Burj-shaped supertall because both
satisfy the words.

**Fix: generate the tower once as a still image, then anchor every clip to it.**

1. **Make the reference still.** Use Flow's image generation (or any image
   model) with the Building bible prompt below. Iterate here — it's cheap and
   fast compared to video. You want: full tower visible, golden hour, clean
   3/4 angle, no text or logos anywhere, sharp.
   - You may already have this. The golden-hour frame from your first test
     round (bronze fins, travertine podium, city behind) is a strong
     candidate — grab a clean frame from that clip and use it.
2. **Anchor every clip to that still.** In Flow, use **Frames to Video** and
   set the still as the **first frame**. Every shot below assumes you've done
   this. Geometry, materials, and proportions then carry across clips.
3. **Chain state changes.** For shots that continue from another shot's
   end-state (wireframe, scattered panels), export the last frame of the
   previous clip and use *that* as the first frame. Noted per shot.
4. **Regenerate individually.** If one shot drifts or looks wrong, redo that
   shot only. Never regenerate the set.

### Lighting: no dark footage

Dark video compresses badly — Veo spends its bitrate on shadow noise and the
result looks low-quality, which is what happened to the black take. Every shot
is now **golden hour or blue hour**, well-exposed.

The site still reads as near-black. That's a CSS overlay on top of the video
(darkening layer + vignette + blend mode), which I control in code and can
tune per-section without touching the footage. Bright, clean source → dark,
premium page. Never the other way around.

### What NOT to prompt for

No text, numbers, UI panels, labels, counters, or checkmarks. Veo mangles text
near-100% of the time. Every label in the brief ("ASSET", "2,500 FRACTIONS",
"✓ Eligibility") is an HTML/CSS/GSAP overlay I build in code. Prompts stay
pure cinematography: camera, subject, light, atmosphere.

### Format

- **16:9**, all shots.
- ~8s per generation. Where a shot wants more, generate twice and I'll concat.
- **9 clips total** — Section 10 reuses earlier footage, Shot 09 does double
  duty via an ffmpeg reverse.

---

## Reference still prompt (generate this FIRST, as an image)

**Generate at 16:9 landscape.** The film is 16:9 — a portrait still forces Veo
to re-crop on every clip, which reintroduces the drift we're trying to kill.

**The tower must not resemble the Burj Khalifa.** No tapering spiral setbacks,
no needle spire, no buttressed three-wing plan. Those read as one specific
trademarked building, which the brief rules out and which would imply a
relationship with its owner that doesn't exist. Aim for a squarer, blunter,
distinctly institutional tower.

> Architectural photograph of a fictional 55-story commercial tower in a modern
> desert coastal city. Rectangular slab massing with a flat roof, squared-off
> crown, and a single clean vertical notch running up one face. Dark
> bronze-tinted glass curtain wall, vertical brushed-bronze structural fins
> evenly spaced up the full height, three-story travertine stone podium at the
> base. Constant width from base to crown — no tapering, no setbacks, no spire,
> no needle, no antenna. Three-quarter angle from ground level, full tower
> visible from podium to crown, tower positioned slightly left of center with
> open sky to the right. Golden hour, warm low sun raking across the glass,
> clear blue sky above with a warm haze glow at the horizon, modern low-rise
> city and coastline small and hazy in the far background. Photorealistic
> architectural photography, shot on medium format camera, physically accurate
> glass reflections, realistic material weight, natural lens characteristics,
> sharp focus throughout. No logos, no signage, no readable text anywhere.
> No people.

**Negative:** Burj Khalifa, spire, needle, antenna, tapering tower, stepped
setbacks, spiral setbacks, twisting tower, pointed crown, 3D render, CGI,
video game, cartoon, illustration, unreal engine, low-poly, matte painting,
plastic materials, text, logos, signage, watermark, portrait orientation

**Keep from the first attempt:** the golden-hour grade — warm horizon glow
under blue sky, tower bright against the sky, city small and hazy below,
clean bright exposure with no crushed blacks. That lighting was right. Only
the silhouette needs to change.

Iterate until you have one you're happy with. **That image is now the
building.** Everything else anchors to it.

---

## Building bible (fallback only)

If a shot won't take an anchor frame, paste this so the words at least stay
consistent:

> A fictional 55-story commercial tower with rectangular slab massing, constant
> width from base to crown, a flat squared-off roof, and a single clean vertical
> notch up one face. Dark bronze-tinted glass curtain wall, vertical
> brushed-bronze structural fins spaced evenly up the full height, a three-story
> travertine stone podium at the base. No tapering, no setbacks, no spire, no
> needle, no antenna. No visible logos, no signage, no readable text anywhere on
> the structure.

---

## Global appends (add to every prompt)

**Photorealism lock** — append to every prompt, including the VFX ones:

> Photorealistic, shot on real cinema camera, not 3D render, not CGI, not
> animation, not video game, not illustration — real-world architectural
> cinematography, physically accurate glass reflections, realistic material
> weight and imperfection, true film grain, natural lens characteristics.

**Universal negative prompt** — append to every shot's negatives:

> 3D render, CGI, video game, animation, cartoon, illustration, plastic
> materials, artificial look, unreal engine, low-poly, matte painting, text,
> logos, signage, watermark, dark underexposed footage, crushed blacks, noise

On the wireframe/VFX shots the *structure* is meant to look like glowing
digital geometry — that's intended. The photorealism lock governs the
**rendering style**: real camera photographing that effect, not a
motion-graphics template. Think Apple product film, not After Effects preset.

---

## Shot 01 — Hero: Approach

**Anchor:** reference still as first frame.
**Used for:** Section 01 (Hero).

**Prompt:**
> Cinematic architectural film, ground-level eye-line shot. Camera is fixed at
> ground level, eye height, looking straight ahead at the tower — the horizon
> line stays level and centered in frame for the entire shot. Camera performs a
> slow, straight-line dolly-in directly toward the tower, moving forward only —
> no vertical movement, no tilt up, no tilt down, no crane, no descent, no
> rise, camera height never changes. Golden hour, warm low sun raking across
> the bronze glass facade, clear warm sky, light atmospheric haze catching the
> sun. Extremely slow, heavy, premium camera movement — no handheld shake.
> Shot on 35mm anamorphic lens, shallow depth of field, warm cinematic color
> grade, bright and well-exposed. No text, no logos, no people.
> [Photorealism lock]

**Negative:** aerial view, drone shot, top-down, overhead, descending camera,
crane down, bird's eye, high angle, tilt, night, darkness, underexposed
+ [universal negative]

---

## Shot 02 — The Real Asset: Orbit

**Anchor:** reference still as first frame.
**Used for:** Section 02 (The Real Asset).

**Prompt:**
> Cinematic architectural film, eye-level exterior shot. Camera height is fixed
> at roughly one-third up the tower's total height and never changes — no rise,
> no descent, no crane, no tilt up or down. Camera performs a slow, continuous
> horizontal orbit only, circling roughly 45 degrees around the tower's corner
> at that fixed height, revealing the facade, the vertical bronze fins, and the
> travertine podium below, all in frame the whole time. Golden-hour daylight,
> warm sun raking across the glass causing soft moving reflections, light haze
> in the distance suggesting a coastal desert skyline just out of focus behind
> the tower. Static level horizon line. Shot on 35mm lens, smooth gimbal
> movement on a horizontal track, shallow depth of field, premium real estate
> cinematography, bright and well-exposed. No text, no logos, no people.
> [Photorealism lock]

**Negative:** aerial view, drone shot, top-down, overhead, bird's eye, high
angle, descending camera, crane shot, night, darkness, underexposed
+ [universal negative]

---

## Shot 03 — Tokenization: Scan & Dissolve

**Anchor:** reference still as first frame.
**Used for:** Section 03 (Tokenization).

**Prompt:**
> Cinematic VFX architectural film, eye-level shot. Camera height is fixed at
> the building's mid-height and never changes — no rise, no descent, no tilt,
> no crane. Camera slowly pushes straight in toward the facade, moving forward
> only, framing held level and centered. A thin horizontal band of bright
> champagne-gold light scans upward across the tower from base to crown, like a
> slow survey line. Directly behind the scan line the physical glass and bronze
> facade dissolves into a fine luminous golden wireframe mesh and floating
> geometric points, while the portion above the scan line remains fully
> physical and photoreal. Subtle golden particles drift upward off the
> wireframe surface. Blue-hour sky, soft ambient light, clean bright exposure,
> volumetric haze. No text, no numbers, no UI, no people.
> [Photorealism lock — the untouched facade must read as real photography;
> only the scanned portion is stylized geometry]

**Negative:** aerial view, drone shot, top-down, overhead, bird's eye, high
angle, crane shot, night, darkness, underexposed + [universal negative]

---

## Shot 04 — Tokenization Resolve: Wireframe Hold

**Anchor:** last frame of Shot 03.
**Used for:** Section 03 end-state; background for Section 07.

**Prompt:**
> Cinematic VFX architectural film. The tower now fully rendered as a glowing
> champagne-gold wireframe structure — clean geometric lines tracing the
> silhouette, vertical fins and floor plates — floating against a deep blue-hour
> sky with soft ambient light, no ground plane visible. Camera performs a slow,
> continuous horizontal orbit around the wireframe form at fixed height. Fine
> golden particles drift around the structure, soft volumetric glow along the
> lines. Pure luminous geometry, no glass, no stone. Clean bright exposure, not
> a black frame. No text, no numbers, no people.
> [Photorealism lock — photographed as a real practical light installation,
> real volumetric fog lit by real sources, true film grain]

**Negative:** night, darkness, underexposed, crushed blacks, flat shading,
toy-like, clip-art + [universal negative]

---

## Shot 05 — Fractionalization: Separate into Units

**Anchor:** last frame of Shot 04.
**Used for:** Section 04 (Fractionalization).

**Prompt:**
> Cinematic VFX architectural film, front-on view, camera static or barely
> drifting forward. The luminous wireframe tower slowly and elegantly separates
> into hundreds of thin flat rectangular panels — like fine architectural glass
> shingles, not coins, not spheres, not cubes — each panel drifting slightly
> apart from its neighbors in slow weightless zero-gravity motion while roughly
> holding the overall tower silhouette. Each panel has a thin bronze edge and a
> faint warm glow. Deep blue-hour ambient background, volumetric haze, shallow
> depth of field on the nearest panels, clean bright exposure. No text, no
> numbers, no coins, no spheres, no people.
> [Photorealism lock — photographed as real physical glass and metal panels on
> a real film set, physically accurate reflection and refraction]

**Negative:** coins, spheres, cubes, tokens, currency, night, darkness,
underexposed, flat shading, toy-like + [universal negative]

> **If this fails twice** (Veo tends to duplicate complex objects rather than
> separate them): generate the exploded state as a *still image* instead —
> image models handle exploded views well — and I'll slice it into strips and
> animate them apart with GSAP. Often looks better than the video anyway.

---

## Shot 06 — Marketplace: Panels Form a Grid

**Anchor:** last frame of Shot 05.
**Used for:** Section 05 (Marketplace).

**Prompt:**
> Cinematic VFX motion graphic. Hundreds of thin flat bronze-edged glass panels
> drift slowly through soft blue-hour ambient space and begin organizing
> themselves into a loose elegant floating grid formation, like cards arranging
> in mid-air, catching warm champagne-gold rim light as they turn. Camera slowly
> pulls back and rises slightly to reveal the forming grid. Soft volumetric
> haze, shallow depth of field, slow weightless motion, premium and restrained
> — not fast, not chaotic. Clean bright exposure. No text, no numbers, no UI,
> no people.
> [Photorealism lock — real physical glass and metal panels on a real film set]

**Negative:** coins, tokens, currency, night, darkness, underexposed, flat
shading, toy-like, chaotic motion + [universal negative]

---

## Shot 07 — Ownership: Panels Converge

**Anchor:** last frame of Shot 06.
**Used for:** Section 06 (User Ownership).

**Prompt:**
> Cinematic VFX motion graphic. A small cluster of thin flat bronze-edged glass
> panels drifts slowly and converges gently toward a single focal point at
> frame center, coming together into a tight orderly stack, softly illuminated
> by warm champagne-gold light with a subtle warm white rim light. Camera holds
> mostly static with a very slow push-in. Soft blue-hour ambient background,
> volumetric haze, shallow depth of field, calm deliberate motion, clean bright
> exposure. No text, no numbers, no UI, no people.
> [Photorealism lock — real physical glass and metal panels on a real film set]

**Negative:** coins, tokens, currency, night, darkness, underexposed, flat
shading, toy-like + [universal negative]

---

## Shot 08 — Compliance: Rings Around the Asset

**Anchor:** last frame of Shot 04 (wireframe tower).
**Used for:** Section 07 (ERC-3643 / Compliance).

**Prompt:**
> Cinematic VFX architectural film. The champagne-gold wireframe tower stands
> centered against a soft deep blue-hour ambient background. Four thin
> concentric ring-shaped light bands, each a slightly different warm tone
> (bronze, champagne, warm white, pale gold), slowly rotate around the tower at
> different heights and speeds, like architectural orbital rings — each ring a
> thin continuous line of light, no text or icons on them. Fine golden particles
> drift between the rings. Camera performs a slow horizontal orbit around the
> whole formation at fixed height. Volumetric haze, soft glow, clean bright
> exposure. No text, no numbers, no icons, no people.
> [Photorealism lock — real practical light installation, real volumetric fog]

**Negative:** night, darkness, underexposed, crushed blacks, flat shading,
toy-like, clip-art, halos, lens flare spam + [universal negative]

---

## Shot 09 — Redemption: Panels Return to the Tower

**Anchor:** last frame of Shot 05 (scattered panels) as first frame; the
**reference still as the LAST frame** if Flow lets you set both — that closes
the loop pixel-perfect on the original building.
**Used for:** Section 08 (Redemption); reversed for part of Section 12.

**Prompt:**
> Cinematic VFX architectural film. Hundreds of thin flat bronze-edged glass
> panels, scattered and drifting in soft ambient space, begin moving slowly
> back together, converging toward a central vertical silhouette and re-forming
> the outline of a tall tower, panels settling into place one by one from the
> base upward. As panels lock into place they turn from glowing wireframe into
> solid photoreal bronze glass and travertine — the complete physical tower.
> Warm golden light growing steadily brighter as the tower completes. Camera
> slowly pulls back to reveal the fully reformed physical tower standing
> complete. Background transitions from blue hour to warm golden dawn,
> volumetric haze, bright well-exposed finish. No text, no numbers, no people.
> [Photorealism lock — real architectural cinematography once the tower resolves]

**Negative:** aerial view, drone shot, top-down, overhead, bird's eye, high
angle, night, darkness, underexposed + [universal negative]

> **Bonus:** reverse this clip in ffmpeg and you get a free "tower dissolves
> into panels" shot — usable as an alternate for Shot 05 or the Section 12
> lifecycle recap. No extra generation.

---

## Shot 10 — Asset Ecosystem: Rise Above the City

**Anchor:** reference still as first frame (tower in foreground, then rise).
**Used for:** Section 09 (Asset Ecosystem).
**Aerial is intentional here.**

**Prompt:**
> Cinematic aerial architectural film. Camera rises slowly and steadily from
> rooftop height into a high aerial view above a fictional modern desert
> coastal city skyline at blue hour — a cluster of contemporary towers with one
> taller bronze-glass supertall slightly forward of the others, warm city
> lighting coming on, a wide coastline in the distance, desert horizon opposite.
> No recognizable real-world skyline or landmark silhouettes. Faint golden
> thread-thin lines of light connect the tallest tower to several smaller
> structures across the skyline, subtle and restrained. Warm blue-hour sky with
> plenty of ambient light, city lights beginning to glow, soft haze, clean
> bright exposure. No text, no logos, no people, no aircraft.
> [Photorealism lock — real aerial cinema camera, drone or helicopter plate]

**Negative:** night, darkness, underexposed, crushed blacks, toy city,
miniature effect, tilt-shift + [universal negative]

---

## Shot 11 — Dubai: Skyline & Coastline

**Anchor:** none needed (no hero tower close-up).
**Used for:** Section 11 (Dubai).
**Aerial is intentional here.**

**Prompt:**
> Cinematic aerial establishing shot. A slow majestic wide aerial drift over a
> fictional contemporary desert coastal skyline at golden hour — modern glass
> towers, a wide gulf coastline with calm water catching the sun, sand-toned
> low-rise development near the shore, clear warm sky with light haze at the
> horizon. Camera moves laterally and very slowly descends across the shot.
> Warm golden and champagne tones, bright and well-exposed, no recognizable
> real-world landmarks. No text, no logos, no people, no aircraft, no branded
> boats.
> [Photorealism lock — real aerial cinema camera, drone or helicopter plate]

**Negative:** night, darkness, underexposed, toy city, miniature effect,
tilt-shift, recognizable landmarks + [universal negative]

---

## Shot 12 — Final Reveal: Slow Orbit

**Anchor:** reference still as first frame — closes the film on the exact
building it opened with.
**Used for:** Section 12 (Final Reveal).

**Prompt:**
> Cinematic architectural film, eye-level shot. The complete physical tower at
> blue hour, facade lights on and glowing warm. Camera height is fixed at
> ground eye-level and never changes — no rise, no descent, no tilt, no crane.
> Camera performs one final slow continuous horizontal orbit around the tower
> at that fixed low height. Warm champagne-gold facade lighting, deep blue
> ambient sky with visible gradient, fine atmospheric haze, clean bright
> exposure with detail retained in the shadows. Ends on a still, quiet,
> composed frame. No text, no logos, no people.
> [Photorealism lock]

**Negative:** aerial view, drone shot, top-down, overhead, bird's eye, high
angle, pitch black, darkness, underexposed, crushed blacks
+ [universal negative]

> The "fade to black" ending in the original brief is done in **CSS**, not in
> the footage — I fade the canvas to the page background as scroll completes.
> Keep the clip bright.

---

## Section → Shot Map

| # | Section | Shot(s) |
|---|---|---|
| 01 | Hero | Shot 01 |
| 02 | The Real Asset | Shot 02 |
| 03 | Tokenization | Shot 03 → Shot 04 |
| 04 | Fractionalization | Shot 05 |
| 05 | Marketplace | Shot 06 |
| 06 | User Ownership | Shot 07 |
| 07 | ERC-3643 / Compliance | Shot 08 |
| 08 | Redemption | Shot 09 |
| 09 | Asset Ecosystem | Shot 10 |
| 10 | How TrueFraction Works | reuses 01–09 as loops — no new footage |
| 11 | Dubai | Shot 11 |
| 12 | Final Reveal | Shot 09 reversed → Shot 12 |

**Generation order:** reference still → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08
→ 09 → 10 → 11 → 12. Shots 04–09 chain off each other's last frames, so do
them in sequence.

---

## Send me

The 9 clips plus the reference still (folder path is fine). Then I:

1. QC each clip with an ffmpeg contact sheet — first/quarter/mid/three-quarter/
   last frame — to catch drift or artifacts before they reach the site.
2. Concat with crossfades, slice to scroll-scrubbed WebP frames.
3. Build the scroll site in this repo (Vite + React + GSAP), applying the dark
   grade in CSS, replacing `src/pages/LandingPage.jsx`.

Any single clip can be regenerated later without touching the others.
