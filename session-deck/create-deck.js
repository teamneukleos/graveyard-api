/**
 * A Day in the Life of a Software Developer
 * 60-min interactive bootcamp session → PPTX (upload to Google Drive → Open with Google Slides)
 */
const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "Bootcamp Facilitator";
pptx.title = "A Day in the Life of a Software Developer";
pptx.subject = "60-minute interactive bootcamp session for high school students";

// ── Design system (bootcamp energy — not purple SaaS, not cream/serif newspaper) ──
const C = {
  bg: "0B1220",
  panel: "152033",
  panelAlt: "1A2A40",
  ink: "F5F7FA",
  muted: "9AADC2",
  accent: "FF6B35", // coral-orange
  teal: "2EC4B6",
  gold: "F4C95F",
  danger: "FF5C7A",
  white: "FFFFFF",
  soft: "E8EEF7",
  morning: "FF8A5B",
  midday: "2EC4B6",
  afternoon: "6C8CFF",
  night: "F4C95F",
};

const FONT = {
  display: "Georgia",
  body: "Arial",
};

function addBg(slide, color = C.bg) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color },
  });
}

function addAccentBar(slide, color = C.accent) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.12,
    h: 7.5,
    fill: { color },
  });
}

function pill(slide, { x, y, w, h = 0.36, text, fill, color = C.bg }) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    rectRadius: 0.1,
  });
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: FONT.body,
    fontSize: 11,
    bold: true,
    color,
    align: "center",
    valign: "middle",
  });
}

function timerBadge(slide, mins) {
  pill(slide, {
    x: 11.35,
    y: 0.28,
    w: 1.55,
    h: 0.38,
    text: `⏱ ${mins} min`,
    fill: C.gold,
    color: C.bg,
  });
}

function sectionChip(slide, label, color) {
  pill(slide, {
    x: 0.45,
    y: 0.28,
    w: 1.9,
    h: 0.38,
    text: label,
    fill: color,
    color: C.bg,
  });
}

function notes(slide, text) {
  slide.addNotes(text);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.bg },
  });
  // Atmosphere bands
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 5.9,
    w: 13.333,
    h: 1.6,
    fill: { color: "101A2C" },
  });
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.12,
    fill: { color: C.accent },
  });

  pill(s, {
    x: 0.7,
    y: 1.55,
    w: 2.4,
    h: 0.4,
    text: "BOOTCAMP SESSION",
    fill: C.accent,
    color: C.white,
  });

  s.addText("A Day in the Life of\na Software Developer", {
    x: 0.7,
    y: 2.15,
    w: 11.5,
    h: 2.2,
    fontFace: FONT.display,
    fontSize: 44,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  s.addText("60 minutes  ·  Interactive  ·  No coding experience required", {
    x: 0.7,
    y: 4.5,
    w: 10,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  s.addText("Today you don’t just hear about tech — you work like a developer.", {
    x: 0.7,
    y: 6.25,
    w: 11,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 15,
    color: C.soft,
  });

  notes(
    s,
    "Welcome energy high. Introduce yourself in one sentence after this slide. Promise: 3 hands-on missions, not a lecture."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — Today's mission
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s);

  s.addText("Today’s mission", {
    x: 0.55,
    y: 0.4,
    w: 10,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 32,
    color: C.ink,
    bold: true,
  });
  s.addText("By the end of this hour, you will be able to:", {
    x: 0.55,
    y: 1.1,
    w: 11,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  const goals = [
    { n: "01", t: "Translate a real idea into clear steps a computer can follow" },
    { n: "02", t: "See what a developer’s day actually looks like (it’s not just typing)" },
    { n: "03", t: "Practice the three superpowers: clarify → build → debug" },
    { n: "04", t: "Leave with one thing you can try tonight — for real" },
  ];

  goals.forEach((g, i) => {
    const y = 1.75 + i * 1.15;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.55,
      y,
      w: 12.2,
      h: 1.0,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addText(g.n, {
      x: 0.8,
      y: y + 0.25,
      w: 1.1,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 22,
      color: C.accent,
      bold: true,
    });
    s.addText(g.t, {
      x: 2.1,
      y: y + 0.28,
      w: 10.2,
      h: 0.5,
      fontFace: FONT.body,
      fontSize: 18,
      color: C.ink,
    });
  });

  notes(s, "Read the four goals quickly. Emphasize: interactive, not a TED talk.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3 — Icebreaker
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.teal);
  timerBadge(s, "3");

  pill(s, {
    x: 0.45,
    y: 0.28,
    w: 2.1,
    h: 0.38,
    text: "ICEBREAKER",
    fill: C.teal,
    color: C.bg,
  });

  s.addText("If you had one week\nand a laptop…", {
    x: 0.55,
    y: 1.4,
    w: 12,
    h: 1.8,
    fontFace: FONT.display,
    fontSize: 40,
    color: C.ink,
    bold: true,
  });

  s.addText("What app would you build for your school, friends, or community?", {
    x: 0.55,
    y: 3.5,
    w: 11.5,
    h: 0.5,
    fontFace: FONT.body,
    fontSize: 20,
    color: C.soft,
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 4.4,
    w: 12.2,
    h: 2.2,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });

  s.addText("How we’ll do this", {
    x: 0.9,
    y: 4.65,
    w: 11,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 14,
    color: C.teal,
    bold: true,
  });

  s.addText(
    [
      { text: "30 seconds alone — think of one idea\n", options: { breakLine: false } },
      { text: "Turn to a neighbor — share in one sentence\n", options: { breakLine: false } },
      { text: "We’ll hear 3–4 shout-outs out loud", options: { breakLine: false } },
    ],
    {
      x: 0.9,
      y: 5.15,
      w: 11.2,
      h: 1.2,
      fontFace: FONT.body,
      fontSize: 18,
      color: C.ink,
      paraSpacing: 8,
    }
  );

  notes(
    s,
    "Facilitator: start a visible timer. Collect 3–4 ideas and write them on a board — you’ll reuse one later as an example. Affirm every idea; no ‘that’s too hard’."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4 — Myths vs reality
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s);

  s.addText("What people think vs what it’s like", {
    x: 0.55,
    y: 0.35,
    w: 12,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });

  // Myth column
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.45,
    y: 1.2,
    w: 5.9,
    h: 5.6,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });
  s.addText("MYTH", {
    x: 0.75,
    y: 1.45,
    w: 5.3,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 13,
    color: C.danger,
    bold: true,
  });
  const myths = [
    "You sit alone and type all day",
    "You have to be a math genius",
    "One genius writes the whole app",
    "If it works once, you’re done",
    "It’s only for people who started coding at 10",
  ];
  myths.forEach((t, i) => {
    s.addText("✕  " + t, {
      x: 0.8,
      y: 2.1 + i * 0.8,
      w: 5.2,
      h: 0.6,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.soft,
    });
  });

  // Reality column
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.95,
    y: 1.2,
    w: 5.9,
    h: 5.6,
    fill: { color: "163528" },
    rectRadius: 0.14,
  });
  s.addText("REALITY", {
    x: 7.25,
    y: 1.45,
    w: 5.3,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 13,
    color: C.teal,
    bold: true,
  });
  const reals = [
    "You talk, sketch, ask questions, then code",
    "Curiosity + persistence beat ‘genius’",
    "Teams ship apps — like a film crew",
    "You fix, improve, and ship again",
    "Bootcamps & practice open the door",
  ];
  reals.forEach((t, i) => {
    s.addText("✓  " + t, {
      x: 7.3,
      y: 2.1 + i * 0.8,
      w: 5.2,
      h: 0.6,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.ink,
    });
  });

  notes(s, "Ask: which myth surprised you? Pick 1–2 students. Bridge: ‘Today you’ll feel the reality.’");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5 — Meet the developer / kitchen metaphor
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.accent);

  s.addText("Meet the job (in plain English)", {
    x: 0.55,
    y: 0.35,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });

  s.addText("Think of an app like a restaurant…", {
    x: 0.55,
    y: 1.0,
    w: 12,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.muted,
  });

  const cards = [
    {
      title: "Frontend",
      sub: "The dining room",
      body: "What you see and tap — buttons, screens, animations.",
      color: C.morning,
    },
    {
      title: "Backend",
      sub: "The kitchen",
      body: "Hidden logic — accounts, data, “save this,” “send that.”",
      color: C.teal,
    },
    {
      title: "API",
      sub: "The waiter",
      body: "Carries orders between the screen and the kitchen.",
      color: C.gold,
    },
  ];

  cards.forEach((c, i) => {
    const x = 0.45 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.7,
      w: 3.95,
      h: 3.6,
      fill: { color: C.panel },
      rectRadius: 0.14,
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 1.7,
      w: 3.95,
      h: 0.14,
      fill: { color: c.color },
    });
    s.addText(c.title, {
      x: x + 0.3,
      y: 2.15,
      w: 3.35,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 24,
      color: C.ink,
      bold: true,
    });
    s.addText(c.sub, {
      x: x + 0.3,
      y: 2.7,
      w: 3.35,
      h: 0.4,
      fontFace: FONT.body,
      fontSize: 15,
      color: c.color,
      bold: true,
    });
    s.addText(c.body, {
      x: x + 0.3,
      y: 3.4,
      w: 3.35,
      h: 1.5,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.soft,
    });
  });

  s.addText("I spend a lot of my days in the kitchen — building APIs that power real products.", {
    x: 0.55,
    y: 5.7,
    w: 12.2,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 15,
    color: C.muted,
    italic: true,
  });
  s.addText("Next: the apps that stay open on my screen all day.", {
    x: 0.55,
    y: 6.25,
    w: 12.2,
    h: 0.35,
    fontFace: FONT.body,
    fontSize: 14,
    color: C.teal,
  });

  notes(
    s,
    "FACILITATOR: Say your name + one sentence about your work (e.g. Graveyard). Keep under 90 seconds. Then advance to the tools slide."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE — Everyday tools (student-facing)
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.teal);

  s.addText("What’s open on my screen", {
    x: 0.55,
    y: 0.3,
    w: 12,
    h: 0.5,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });
  s.addText("A developer’s “desk” is mostly software. Here’s what I use almost every day:", {
    x: 0.55,
    y: 0.9,
    w: 12.2,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 15,
    color: C.muted,
  });

  const tools = [
    { name: "Cursor", job: "Where I write code with an AI teammate beside me", color: C.accent },
    { name: "VS Code", job: "A classic code editor — open files, edit, run projects", color: C.afternoon },
    { name: "Google Chrome", job: "Click through the app + DevTools when something looks wrong", color: C.gold },
    { name: "Docker", job: "Spin up databases & services on my laptop like mini computers", color: C.teal },
    { name: "pgAdmin", job: "Peek inside the database — see the real saved data", color: C.morning },
    { name: "Figma", job: "Check designs & screens before (and while) we build", color: "E85D8A" },
    { name: "GitHub", job: "Save history of the code and work with a team", color: "8B9BB4" },
    { name: "Terminal", job: "Type commands — install, run, migrate, deploy", color: C.night },
  ];

  tools.forEach((t, i) => {
    const r = Math.floor(i / 4);
    const c = i % 4;
    const x = 0.4 + c * 3.2;
    const y = 1.5 + r * 2.7;

    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 3.05,
      h: 2.45,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y,
      w: 3.05,
      h: 0.12,
      fill: { color: t.color },
    });
    s.addText(t.name, {
      x: x + 0.2,
      y: y + 0.4,
      w: 2.65,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 18,
      color: C.ink,
      bold: true,
    });
    s.addText(t.job, {
      x: x + 0.2,
      y: y + 1.05,
      w: 2.65,
      h: 1.1,
      fontFace: FONT.body,
      fontSize: 13,
      color: C.soft,
    });
  });

  notes(
    s,
    "FACILITATOR: Spend ~2 minutes. Point at 3–4 tools only if short on time (Cursor, Chrome, Docker, pgAdmin). Ask: ‘Which of these have you heard of?’ Optional later: flash Docker/pgAdmin if you demo."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE — The day timeline overview
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s);

  s.addText("One day. Four chapters.", {
    x: 0.55,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 32,
    color: C.ink,
    bold: true,
  });
  s.addText("We’re going to live this timeline together — with missions along the way.", {
    x: 0.55,
    y: 1.1,
    w: 12,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  const phases = [
    { t: "Morning", d: "A request lands.\nWe clarify the problem.", c: C.morning, time: "9:00" },
    { t: "Midday", d: "We break it down\nand build the recipe.", c: C.midday, time: "12:00" },
    { t: "Afternoon", d: "Something breaks.\nWe debug together.", c: C.afternoon, time: "3:00" },
    { t: "End of day", d: "We ship, learn,\nand plan tomorrow.", c: C.night, time: "5:30" },
  ];

  phases.forEach((p, i) => {
    const x = 0.45 + i * 3.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.0,
      w: 3.0,
      h: 4.4,
      fill: { color: C.panel },
      rectRadius: 0.14,
    });
    s.addShape(pptx.shapes.OVAL, {
      x: x + 1.05,
      y: 2.35,
      w: 0.9,
      h: 0.9,
      fill: { color: p.c },
    });
    s.addText(String(i + 1), {
      x: x + 1.05,
      y: 2.5,
      w: 0.9,
      h: 0.6,
      fontFace: FONT.display,
      fontSize: 22,
      color: C.bg,
      bold: true,
      align: "center",
    });
    s.addText(p.time, {
      x: x + 0.2,
      y: 3.45,
      w: 2.6,
      h: 0.35,
      fontFace: FONT.body,
      fontSize: 13,
      color: p.c,
      align: "center",
      bold: true,
    });
    s.addText(p.t, {
      x: x + 0.2,
      y: 3.9,
      w: 2.6,
      h: 0.45,
      fontFace: FONT.display,
      fontSize: 20,
      color: C.ink,
      align: "center",
      bold: true,
    });
    s.addText(p.d, {
      x: x + 0.25,
      y: 4.55,
      w: 2.5,
      h: 1.3,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.muted,
      align: "center",
    });
  });

  notes(s, "Point at the wall/timeline. ‘We’re starting in the morning.’");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7 — Morning story
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.morning);
  sectionChip(s, "MORNING", C.morning);

  s.addText("9:12 AM — A message lands", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 1.7,
    w: 12.2,
    h: 2.4,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });
  s.addText("Slack / WhatsApp energy", {
    x: 0.9,
    y: 1.95,
    w: 11.5,
    h: 0.35,
    fontFace: FONT.body,
    fontSize: 12,
    color: C.morning,
    bold: true,
  });
  s.addText(
    "“Hey — can students post lost items, and when someone finds one, the owner gets notified?”\n\nThat’s it. No fancy words. Just a human need.",
    {
      x: 0.9,
      y: 2.45,
      w: 11.5,
      h: 1.3,
      fontFace: FONT.body,
      fontSize: 20,
      color: C.ink,
    }
  );

  const steps = [
    { n: "1", t: "Who is this for?" },
    { n: "2", t: "What should happen when they tap a button?" },
    { n: "3", t: "What must the computer remember?" },
  ];
  steps.forEach((st, i) => {
    const x = 0.55 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 4.5,
      w: 3.95,
      h: 2.1,
      fill: { color: C.panelAlt },
      rectRadius: 0.12,
    });
    s.addText(st.n, {
      x: x + 0.3,
      y: 4.75,
      w: 1,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 28,
      color: C.morning,
      bold: true,
    });
    s.addText(st.t, {
      x: x + 0.3,
      y: 5.5,
      w: 3.35,
      h: 0.8,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.ink,
    });
  });

  notes(
    s,
    "Storytell: this is a real morning. Developers don’t start with code — they start with questions. Then launch Task 1."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8 — TASK 1
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "121A14" },
  });
  timerBadge(s, "4");

  pill(s, {
    x: 0.45,
    y: 0.28,
    w: 2.4,
    h: 0.38,
    text: "MISSION 01",
    fill: C.teal,
    color: C.bg,
  });

  s.addText("Feature Translator", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 34,
    color: C.ink,
    bold: true,
  });

  s.addText(
    "Your school wants Lost & Found: students report a lost item; others can mark “I found it.”",
    {
      x: 0.55,
      y: 1.6,
      w: 12.2,
      h: 0.7,
      fontFace: FONT.body,
      fontSize: 18,
      color: C.soft,
    }
  );

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 2.5,
    w: 12.2,
    h: 3.6,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });

  s.addText("In pairs — write on a phone note or sticky:", {
    x: 0.9,
    y: 2.75,
    w: 11.5,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 15,
    color: C.teal,
    bold: true,
  });

  const prompts = [
    "A) Who uses this app?",
    "B) What happens when someone taps “I found it”?",
    "C) What should the computer remember? (name, photo, location…)",
  ];
  prompts.forEach((p, i) => {
    s.addText(p, {
      x: 0.9,
      y: 3.4 + i * 0.7,
      w: 11.5,
      h: 0.55,
      fontFace: FONT.body,
      fontSize: 22,
      color: C.ink,
      bold: true,
    });
  });

  s.addText("We’ll hear 2–3 pairs. Keep answers short.", {
    x: 0.55,
    y: 6.4,
    w: 12,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 14,
    color: C.muted,
  });

  notes(
    s,
    "Start 4:00 timer. Circulate. Call 2–3 pairs. Celebrate clarity over cleverness. Steal good phrases for the next slide."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9 — Midday: from idea to recipe
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.midday);
  sectionChip(s, "MIDDAY", C.midday);

  s.addText("From idea → recipe → code", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 30,
    color: C.ink,
    bold: true,
  });
  s.addText("Code is just a very picky recipe. Computers do exactly what you write — nothing more.", {
    x: 0.55,
    y: 1.55,
    w: 12.2,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  const flow = [
    { t: "Idea", d: "“Notify the owner”" },
    { t: "Steps", d: "Numbered human steps" },
    { t: "Code", d: "Steps the computer runs" },
  ];
  flow.forEach((f, i) => {
    const x = 0.55 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.3,
      w: 3.9,
      h: 2.0,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addText(f.t, {
      x: x + 0.25,
      y: 2.55,
      w: 3.4,
      h: 0.45,
      fontFace: FONT.display,
      fontSize: 22,
      color: C.midday,
      bold: true,
    });
    s.addText(f.d, {
      x: x + 0.25,
      y: 3.2,
      w: 3.4,
      h: 0.7,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.ink,
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.55,
        y: 2.95,
        w: 0.5,
        h: 0.5,
        fontFace: FONT.body,
        fontSize: 28,
        color: C.accent,
      });
    }
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 4.7,
    w: 12.2,
    h: 2.1,
    fill: { color: "0F241F" },
    rectRadius: 0.12,
  });
  s.addText("Example recipe (pseudocode)", {
    x: 0.9,
    y: 4.9,
    w: 11.5,
    h: 0.35,
    fontFace: FONT.body,
    fontSize: 13,
    color: C.teal,
    bold: true,
  });
  s.addText(
    "1. Show list of lost items\n2. Student taps “I found this”\n3. Ask where & when\n4. Save the find\n5. Notify the owner",
    {
      x: 0.9,
      y: 5.35,
      w: 11.5,
      h: 1.25,
      fontFace: "Consolas",
      fontSize: 15,
      color: C.soft,
    }
  );

  notes(s, "Ask: which step is easiest to forget? (Usually #5 notify.) That’s why we write recipes first.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10 — API as menu
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.gold);

  s.addText("APIs = the menu for the kitchen", {
    x: 0.55,
    y: 0.35,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });
  s.addText("You don’t walk into the kitchen — you order from the menu.", {
    x: 0.55,
    y: 1.0,
    w: 12,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  const menu = [
    { verb: "GET", dish: "/lost-items", meaning: "Show me what’s lost", color: "3DDC97" },
    { verb: "POST", dish: "/lost-items", meaning: "Report something new", color: C.gold },
    { verb: "POST", dish: "/lost-items/123/found", meaning: "I found item #123", color: C.accent },
    { verb: "GET", dish: "/me/notifications", meaning: "Any updates for me?", color: C.afternoon },
  ];

  menu.forEach((m, i) => {
    const y = 1.6 + i * 1.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.55,
      y,
      w: 12.2,
      h: 1.05,
      fill: { color: C.panel },
      rectRadius: 0.1,
    });
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8,
      y: y + 0.28,
      w: 1.4,
      h: 0.5,
      fill: { color: m.color },
      rectRadius: 0.08,
    });
    s.addText(m.verb, {
      x: 0.8,
      y: y + 0.28,
      w: 1.4,
      h: 0.5,
      fontFace: FONT.body,
      fontSize: 14,
      bold: true,
      color: C.bg,
      align: "center",
      valign: "middle",
    });
    s.addText(m.dish, {
      x: 2.5,
      y: y + 0.2,
      w: 5.5,
      h: 0.65,
      fontFace: "Consolas",
      fontSize: 18,
      color: C.ink,
      valign: "middle",
    });
    s.addText(m.meaning, {
      x: 8.2,
      y: y + 0.2,
      w: 4.2,
      h: 0.65,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.muted,
      valign: "middle",
    });
  });

  notes(
    s,
    "FACILITATOR (optional demo): Open Swagger or Chrome and hit GET something simple. Narrate: ‘This is me ordering from the kitchen.’ Skip if wifi is flaky."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 11 — TASK 2
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "0F1C24" },
  });
  timerBadge(s, "6");

  pill(s, {
    x: 0.45,
    y: 0.28,
    w: 2.4,
    h: 0.38,
    text: "MISSION 02",
    fill: C.accent,
    color: C.white,
  });

  s.addText("Write the recipe", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 34,
    color: C.ink,
    bold: true,
  });

  s.addText("Groups of 3 — turn Lost & Found into 5–7 numbered steps a computer could follow.", {
    x: 0.55,
    y: 1.55,
    w: 12.2,
    h: 0.55,
    fontFace: FONT.body,
    fontSize: 17,
    color: C.soft,
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 2.3,
    w: 7.6,
    h: 4.3,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });
  s.addText("Starter shape (you can change it)", {
    x: 0.9,
    y: 2.55,
    w: 7,
    h: 0.35,
    fontFace: FONT.body,
    fontSize: 13,
    color: C.accent,
    bold: true,
  });
  s.addText(
    "1. Student opens Lost & Found\n2. Sees a list of lost items\n3. Taps “I found this”\n4. App asks: where / when\n5. ???\n6. ???",
    {
      x: 0.9,
      y: 3.1,
      w: 6.9,
      h: 3.1,
      fontFace: "Consolas",
      fontSize: 18,
      color: C.ink,
    }
  );

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 8.4,
    y: 2.3,
    w: 4.35,
    h: 4.3,
    fill: { color: "2A1A12" },
    rectRadius: 0.14,
  });
  s.addText("TWIST", {
    x: 8.75,
    y: 2.6,
    w: 3.7,
    h: 0.4,
    fontFace: FONT.body,
    fontSize: 13,
    color: C.gold,
    bold: true,
  });
  s.addText(
    "One group gets a recipe with a missing step.\n\nThe class spots what’s wrong.\n\nThat’s debugging.",
    {
      x: 8.75,
      y: 3.2,
      w: 3.7,
      h: 3.0,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.soft,
    }
  );

  notes(
    s,
    "FACILITATOR: Whisper or hand a broken recipe to 1 group (skip notify OR skip save). After 6 min, 2 groups share. Then the broken group — class fixes it."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 12 — Afternoon bugs
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.afternoon);
  sectionChip(s, "AFTERNOON", C.afternoon);

  s.addText("3:40 PM — Something’s wrong", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });

  s.addText(
    "A huge part of the job isn’t writing new code — it’s figuring out why the old code misbehaved.",
    {
      x: 0.55,
      y: 1.6,
      w: 12.2,
      h: 0.55,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.muted,
    }
  );

  const roles = [
    { t: "Product brain", d: "What did the user expect?" },
    { t: "Detective", d: "What actually happened?" },
    { t: "Fixer", d: "What’s the smallest change?" },
  ];
  roles.forEach((r, i) => {
    const x = 0.55 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.5,
      w: 3.95,
      h: 2.4,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addText(r.t, {
      x: x + 0.3,
      y: 2.85,
      w: 3.35,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 20,
      color: C.afternoon,
      bold: true,
    });
    s.addText(r.d, {
      x: x + 0.3,
      y: 3.55,
      w: 3.35,
      h: 0.9,
      fontFace: FONT.body,
      fontSize: 17,
      color: C.ink,
    });
  });

  s.addText("Good developers aren’t people who never break things.\nThey’re people who stay calm and get curious.", {
    x: 0.55,
    y: 5.4,
    w: 12.2,
    h: 1.0,
    fontFace: FONT.display,
    fontSize: 20,
    color: C.gold,
  });

  notes(s, "Normalize struggle. Share a 20-second personal bug story if you have one.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 13 — TASK 3 Bug hunt
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "1A1424" },
  });
  timerBadge(s, "5");

  pill(s, {
    x: 0.45,
    y: 0.28,
    w: 2.4,
    h: 0.38,
    text: "MISSION 03",
    fill: C.afternoon,
    color: C.white,
  });

  s.addText("Bug hunt — vote with your hands", {
    x: 0.55,
    y: 0.85,
    w: 12,
    h: 0.5,
    fontFace: FONT.display,
    fontSize: 30,
    color: C.ink,
    bold: true,
  });

  s.addText("For each case, vote:   1️⃣ User mistake   2️⃣ Code mistake   3️⃣ Unclear instructions", {
    x: 0.55,
    y: 1.45,
    w: 12.2,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 15,
    color: C.muted,
  });

  const bugs = [
    {
      n: "A",
      t: "App says “Item found!” but the owner never gets a message.",
    },
    {
      n: "B",
      t: "Student typed their email wrong, then says “login is broken.”",
    },
    {
      n: "C",
      t: "Button says “Submit” — nobody knows if that reports a loss or a find.",
    },
    {
      n: "D",
      t: "Photo uploads work on Wi‑Fi but fail on school mobile data.",
    },
  ];

  bugs.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.45 + col * 6.4;
    const y = 2.15 + row * 2.25;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 6.15,
      h: 2.05,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.25,
      y: y + 0.35,
      w: 0.55,
      h: 0.55,
      fill: { color: C.accent },
    });
    s.addText(b.n, {
      x: x + 0.25,
      y: y + 0.4,
      w: 0.55,
      h: 0.45,
      fontFace: FONT.body,
      fontSize: 16,
      bold: true,
      color: C.white,
      align: "center",
    });
    s.addText(b.t, {
      x: x + 1.0,
      y: y + 0.45,
      w: 4.8,
      h: 1.2,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.ink,
    });
  });

  notes(
    s,
    "Reveal one at a time if energy is high (hide extras verbally). Suggested keys: A=2 code, B=1 user (or 3 if UX blame), C=3 unclear, D=2 code/environment. Debate is the point."
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 14 — End of day
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.night);
  sectionChip(s, "END OF DAY", C.night);

  s.addText("5:30 PM — Ship, learn, reset", {
    x: 0.55,
    y: 0.9,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });

  const end = [
    { t: "Share what you shipped", d: "Even a small fix counts." },
    { t: "Write down what broke", d: "Tomorrow-you will thank you." },
    { t: "Ask for feedback", d: "Users & teammates make you sharper." },
    { t: "Stop for the day", d: "Rested brains ship better code." },
  ];
  end.forEach((e, i) => {
    const y = 1.7 + i * 1.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.55,
      y,
      w: 12.2,
      h: 1.05,
      fill: { color: C.panel },
      rectRadius: 0.1,
    });
    s.addText(`${i + 1}`, {
      x: 0.85,
      y: y + 0.25,
      w: 0.6,
      h: 0.55,
      fontFace: FONT.display,
      fontSize: 22,
      color: C.night,
      bold: true,
    });
    s.addText(e.t, {
      x: 1.7,
      y: y + 0.15,
      w: 10.5,
      h: 0.4,
      fontFace: FONT.body,
      fontSize: 18,
      color: C.ink,
      bold: true,
    });
    s.addText(e.d, {
      x: 1.7,
      y: y + 0.55,
      w: 10.5,
      h: 0.35,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.muted,
    });
  });

  notes(s, "Humanize the job. Burnout prevention is part of professionalism.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 15 — Paths in / bootcamp angle
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.teal);

  s.addText("You don’t need a perfect origin story", {
    x: 0.55,
    y: 0.35,
    w: 12,
    h: 0.55,
    fontFace: FONT.display,
    fontSize: 28,
    color: C.ink,
    bold: true,
  });
  s.addText("Bootcamps exist because skills can be learned on purpose — with practice and projects.", {
    x: 0.55,
    y: 1.05,
    w: 12.2,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.muted,
  });

  const paths = [
    { t: "Build tiny things", d: "A calculator. A quiz. A Lost & Found list on paper first." },
    { t: "Explain out loud", d: "If you can teach the recipe, you can learn the code." },
    { t: "Get comfortable stuck", d: "Stuck ≠ failing. Stuck is the job description." },
    { t: "Ship in public", d: "Share projects. Ask for feedback. Repeat." },
  ];
  paths.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.45 + col * 6.4;
    const y = 1.8 + row * 2.4;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w: 6.15,
      h: 2.15,
      fill: { color: C.panel },
      rectRadius: 0.12,
    });
    s.addText(p.t, {
      x: x + 0.35,
      y: y + 0.35,
      w: 5.45,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 20,
      color: C.teal,
      bold: true,
    });
    s.addText(p.d, {
      x: x + 0.35,
      y: y + 1.0,
      w: 5.45,
      h: 0.8,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.soft,
    });
  });

  notes(s, "Connect to THIS bootcamp: ‘What you’re doing here is the real path.’");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 16 — Try tonight
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.accent);

  s.addText("Try this tonight (15 minutes)", {
    x: 0.55,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 30,
    color: C.ink,
    bold: true,
  });

  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.55,
    y: 1.3,
    w: 12.2,
    h: 5.4,
    fill: { color: C.panel },
    rectRadius: 0.14,
  });

  const todos = [
    { n: "1", t: "Pick an app you use daily" },
    { n: "2", t: "Write 5 steps for ONE button (what happens when you tap it?)" },
    { n: "3", t: "Circle the step that talks to a “kitchen” (login, save, send, pay…)" },
    { n: "4", t: "Bonus: invent one improvement — and the recipe for it" },
  ];
  todos.forEach((t, i) => {
    const y = 1.7 + i * 1.1;
    s.addShape(pptx.shapes.OVAL, {
      x: 1.0,
      y: y,
      w: 0.7,
      h: 0.7,
      fill: { color: C.accent },
    });
    s.addText(t.n, {
      x: 1.0,
      y: y + 0.1,
      w: 0.7,
      h: 0.5,
      fontFace: FONT.display,
      fontSize: 22,
      color: C.white,
      align: "center",
      bold: true,
    });
    s.addText(t.t, {
      x: 2.0,
      y: y + 0.1,
      w: 10,
      h: 0.55,
      fontFace: FONT.body,
      fontSize: 20,
      color: C.ink,
    });
  });

  notes(s, "This is the take-home. No laptop required. Builds the habit of thinking in systems.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 17 — Recap
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s);

  s.addText("What you practiced today", {
    x: 0.55,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontFace: FONT.display,
    fontSize: 30,
    color: C.ink,
    bold: true,
  });

  const recap = [
    { c: C.morning, t: "Clarify", d: "Turn fuzzy requests into clear questions" },
    { c: C.midday, t: "Build", d: "Write recipes before code" },
    { c: C.afternoon, t: "Debug", d: "Stay curious when things break" },
    { c: C.night, t: "Ship", d: "Share, learn, come back tomorrow" },
  ];
  recap.forEach((r, i) => {
    const x = 0.45 + i * 3.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.5,
      w: 3.0,
      h: 4.5,
      fill: { color: C.panel },
      rectRadius: 0.14,
    });
    s.addShape(pptx.shapes.RECTANGLE, {
      x,
      y: 1.5,
      w: 3.0,
      h: 0.18,
      fill: { color: r.c },
    });
    s.addText(r.t, {
      x: x + 0.2,
      y: 2.3,
      w: 2.6,
      h: 0.7,
      fontFace: FONT.display,
      fontSize: 24,
      color: r.c,
      bold: true,
      align: "center",
    });
    s.addText(r.d, {
      x: x + 0.25,
      y: 3.4,
      w: 2.5,
      h: 1.8,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.soft,
      align: "center",
    });
  });

  notes(s, "Rapid recap — 45 seconds. Then Q&A.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 18 — Q&A
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  addAccentBar(s, C.gold);

  s.addText("Ask me anything", {
    x: 0.55,
    y: 2.2,
    w: 12.2,
    h: 1.0,
    fontFace: FONT.display,
    fontSize: 48,
    color: C.ink,
    bold: true,
    align: "center",
  });
  s.addText("Apps · careers · bootcamp life · “is this for me?” · bugs · APIs · whatever", {
    x: 1.5,
    y: 3.5,
    w: 10.3,
    h: 0.6,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.muted,
    align: "center",
  });
  s.addText("No question is too basic. Basic questions are how developers start.", {
    x: 1.5,
    y: 4.5,
    w: 10.3,
    h: 0.5,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.gold,
    align: "center",
  });

  notes(s, "Have 2 planted answers ready if silence: salary curiosity → skills; ‘I’m bad at math’ → logic + practice.");
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 19 — Closing
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.12,
    fill: { color: C.accent },
  });

  s.addText("You’re closer than you think.", {
    x: 0.7,
    y: 2.0,
    w: 12,
    h: 0.8,
    fontFace: FONT.display,
    fontSize: 36,
    color: C.ink,
    bold: true,
    align: "center",
  });
  s.addText(
    "If you can explain a problem clearly,\nwrite steps, and stay curious when it breaks —\nyou’re already practicing the job.",
    {
      x: 1.5,
      y: 3.1,
      w: 10.3,
      h: 1.6,
      fontFace: FONT.body,
      fontSize: 20,
      color: C.soft,
      align: "center",
    }
  );
  s.addText("Thank you  ·  Now go build something tiny", {
    x: 0.7,
    y: 5.4,
    w: 12,
    h: 0.5,
    fontFace: FONT.body,
    fontSize: 16,
    color: C.accent,
    align: "center",
    bold: true,
  });

  notes(s, "One-word checkout optional: each student says one word about the session as they leave.");
}

// ═══════════════════════════════════════════════════════════════
// FACILITATOR-ONLY SECTION — do not present to students
// (In Google Slides: skip these, or File → move to end & don’t show)
// ═══════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s, "1A1208");
  s.addText("FACILITATOR ONLY", {
    x: 0.7,
    y: 2.4,
    w: 12,
    h: 0.6,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.gold,
    bold: true,
    align: "center",
  });
  s.addText("Stop presenting here", {
    x: 0.7,
    y: 3.1,
    w: 12,
    h: 0.8,
    fontFace: FONT.display,
    fontSize: 40,
    color: C.ink,
    bold: true,
    align: "center",
  });
  s.addText(
    "Everything after this slide is for you — timing, mission tips, personalization.\nStudent-facing deck ends on the thank-you slide.\n\nTip: In Google Speakers notes (View → Show speaker notes) each teaching slide also has cues.",
    {
      x: 1.5,
      y: 4.2,
      w: 10.3,
      h: 1.8,
      fontFace: FONT.body,
      fontSize: 15,
      color: C.muted,
      align: "center",
    }
  );
}

{
  const s = pptx.addSlide();
  addBg(s, "0E1218");
  s.addText("Run-of-show (60 min)", {
    x: 0.4,
    y: 0.25,
    w: 12.5,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.gold,
    bold: true,
  });

  const rows = [
    ["0–5", "Title + icebreaker", "Collect 3 app ideas on board"],
    ["5–14", "Myths + kitchen + tools", "Your intro + name 3–4 tools"],
    ["14–24", "Morning story + Mission 1", "Pairs, 4 min, 2–3 shares"],
    ["24–36", "Recipe + API + Mission 2", "Optional Chrome/Swagger demo"],
    ["36–48", "Debug mindset + Mission 3", "Hand-vote bug hunt"],
    ["48–55", "End of day + paths + tonight", "Bootcamp pep"],
    ["55–60", "Recap + Q&A + close", "One-word checkout optional"],
  ];

  rows.forEach((r, i) => {
    const y = 0.9 + i * 0.85;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.4,
      y,
      w: 12.5,
      h: 0.75,
      fill: { color: i % 2 === 0 ? C.panel : C.panelAlt },
      rectRadius: 0.08,
    });
    s.addText(r[0], {
      x: 0.55,
      y: y + 0.15,
      w: 1.5,
      h: 0.45,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.accent,
      bold: true,
    });
    s.addText(r[1], {
      x: 2.2,
      y: y + 0.15,
      w: 5.5,
      h: 0.45,
      fontFace: FONT.body,
      fontSize: 14,
      color: C.ink,
    });
    s.addText(r[2], {
      x: 7.8,
      y: y + 0.15,
      w: 4.8,
      h: 0.45,
      fontFace: FONT.body,
      fontSize: 13,
      color: C.muted,
    });
  });
}

{
  const s = pptx.addSlide();
  addBg(s, "0E1218");
  s.addText("Mission facilitation notes", {
    x: 0.4,
    y: 0.25,
    w: 12.5,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.gold,
    bold: true,
  });

  const missions = [
    {
      title: "Mission 1 — Feature Translator",
      body: "Pairs, 4 min. Circulate. Call 2–3 pairs. Celebrate clarity over cleverness. Steal good phrases for later.",
    },
    {
      title: "Mission 2 — Write the recipe",
      body: "Groups of 3, 6 min. Hand ONE group a broken recipe (missing notify or save). After shares, class finds the gap = debugging.",
    },
    {
      title: "Mission 3 — Bug hunt keys",
      body: "A → code (no notify). B → user / unclear UX. C → unclear instructions. D → code/environment. Debate is the win.",
    },
  ];

  missions.forEach((m, i) => {
    const y = 0.95 + i * 2.0;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.4,
      y,
      w: 12.5,
      h: 1.8,
      fill: { color: C.panel },
      rectRadius: 0.1,
    });
    s.addText(m.title, {
      x: 0.7,
      y: y + 0.25,
      w: 12,
      h: 0.4,
      fontFace: FONT.body,
      fontSize: 16,
      color: C.accent,
      bold: true,
    });
    s.addText(m.body, {
      x: 0.7,
      y: y + 0.75,
      w: 12,
      h: 0.8,
      fontFace: FONT.body,
      fontSize: 15,
      color: C.soft,
    });
  });
}

{
  const s = pptx.addSlide();
  addBg(s, "0E1218");
  s.addText("Before you present — checklist", {
    x: 0.4,
    y: 0.25,
    w: 12.5,
    h: 0.45,
    fontFace: FONT.body,
    fontSize: 18,
    color: C.gold,
    bold: true,
  });

  const checks = [
    "Edit the kitchen slide line with your name + one project sentence",
    "Decide: live demo (Chrome / Swagger / Docker) or story-only",
    "Print or save one broken recipe for Mission 2",
    "In Google Slides: end the slideshow on the thank-you slide (skip facilitator section)",
    "Open speaker notes panel — cues are already on each teaching slide",
    "Materials: timer, stickies/phones, whiteboard for icebreaker ideas",
  ];

  checks.forEach((c, i) => {
    const y = 1.0 + i * 0.95;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.4,
      y,
      w: 12.5,
      h: 0.8,
      fill: { color: i % 2 === 0 ? C.panel : C.panelAlt },
      rectRadius: 0.08,
    });
    s.addText(`${i + 1}.  ${c}`, {
      x: 0.7,
      y: y + 0.18,
      w: 12,
      h: 0.45,
      fontFace: FONT.body,
      fontSize: 15,
      color: C.ink,
    });
  });
}

async function main() {
  const out = path.join(__dirname, "Day-in-the-Life-Software-Developer.pptx");
  await pptx.writeFile({ fileName: out });
  console.log("Wrote:", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
