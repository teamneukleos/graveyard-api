# Facilitator guide — A Day in the Life of a Software Developer

**Audience:** High school bootcamp  
**Length:** 60 minutes  
**Deck file:** `Day-in-the-Life-Software-Developer.pptx`

## Open in Google Slides

1. Upload `Day-in-the-Life-Software-Developer.pptx` to [Google Drive](https://drive.google.com)
2. Right‑click → **Open with → Google Slides**
3. **File → Save as Google Slides** (optional)
4. End the student presentation on the **thank-you** slide — everything after **“FACILITATOR ONLY / Stop presenting here”** is for you
5. Turn on **View → Show speaker notes** for cues on each teaching slide
6. Edit your name/project line on the “Meet the job” slide

## Student deck vs facilitator section

| For students | For you only |
|--------------|--------------|
| Title through thank-you | Divider + run-of-show |
| Includes “What’s open on my screen” tools | Mission facilitation notes |
| Missions, story, Q&A | Pre-present checklist |
| | Speaker notes on each slide |

## Tools slide (what you show them)

Cursor · VS Code · Google Chrome · Docker · pgAdmin · Figma · GitHub · Terminal  

Plain-English “what it’s for” — not a product tour. ~2 minutes; name 3–4 if short on time.

## Materials

- Visible countdown timer
- Stickies / paper OR phone Notes
- Whiteboard for icebreaker ideas
- Optional: laptop for Chrome / Swagger / Docker peek
- One pre-written **broken recipe** for Mission 2

## Mission cheat sheet

### Mission 1 — Feature Translator (pairs, 4 min)
Lost & Found: Who / what happens on “I found it” / what the computer remembers.

### Mission 2 — Write the recipe (groups of 3, 6 min)
5–7 steps. One group gets a missing step (notify or save). Class finds the gap.

### Mission 3 — Bug hunt (whole class, 5 min)

| Case | Likely | Point |
|------|--------|--------|
| A — Found but no message | Code | Forgot notify |
| B — Wrong email | User / UX | Not every complaint is a bug |
| C — Vague “Submit” | Unclear | Button words matter |
| D — Upload fails on mobile data | Code / env | Real world ≠ perfect wifi |

## Rebuild the PPTX

```bash
cd session-deck
npm run build
```
