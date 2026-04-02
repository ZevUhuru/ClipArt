export type TemplateCategory = "character" | "camera" | "mood" | "nature";

export interface AnimationTemplate {
  id: string;
  category: TemplateCategory;
  label: string;
  prompt: string;
}

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: "character", label: "Character" },
  { key: "camera", label: "Camera" },
  { key: "mood", label: "Mood" },
  { key: "nature", label: "Nature" },
];

export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  // ── Character Motion ──
  {
    id: "wave-hello",
    category: "character",
    label: "Wave Hello",
    prompt: "Character waves hello with a cheerful smile, arm moving in a friendly greeting gesture, maintaining the illustrated style",
  },
  {
    id: "gentle-idle",
    category: "character",
    label: "Gentle Idle",
    prompt: "Gentle breathing idle animation, subtle swaying movement with soft, peaceful energy",
  },
  {
    id: "happy-nod",
    category: "character",
    label: "Happy Nod",
    prompt: "Character nods happily in agreement, slight body bounce accompanying each nod, warm expression",
  },
  {
    id: "jump-celebrate",
    category: "character",
    label: "Jump & Celebrate",
    prompt: "Character jumps up with joyful celebration, arms raised in excitement, energetic cartoon bounce",
  },
  {
    id: "turn-around",
    category: "character",
    label: "Turn Around",
    prompt: "Character slowly turns around in a smooth 180-degree rotation, revealing different angles",
  },
  {
    id: "dance-groove",
    category: "character",
    label: "Dance Groove",
    prompt: "Character dances with rhythmic side-to-side motion, bobbing head and swaying arms to an upbeat groove",
  },
  {
    id: "look-around",
    category: "character",
    label: "Look Around",
    prompt: "Character looks around curiously, head turning left then right with wide attentive eyes",
  },
  // ── Camera Work ──
  {
    id: "slow-zoom-in",
    category: "camera",
    label: "Slow Zoom In",
    prompt: "Camera slowly zooms in on the subject with soft focus, gentle push-in revealing fine details",
  },
  {
    id: "orbit-around",
    category: "camera",
    label: "Orbit Around",
    prompt: "Camera orbits slowly around the subject in a smooth circular motion, revealing depth and dimension",
  },
  {
    id: "dramatic-push",
    category: "camera",
    label: "Dramatic Push-In",
    prompt: "Camera pushes in dramatically toward the subject with increasing intensity, cinematic close-up reveal",
  },
  {
    id: "pull-back-reveal",
    category: "camera",
    label: "Pull Back Reveal",
    prompt: "Camera pulls back slowly from a close-up to reveal the full scene, smooth dolly-out motion",
  },
  {
    id: "parallax-depth",
    category: "camera",
    label: "Parallax Depth",
    prompt: "Subtle parallax effect with foreground and background moving at different speeds, creating depth",
  },
  {
    id: "dutch-tilt",
    category: "camera",
    label: "Dutch Angle",
    prompt: "Camera slowly tilts to a dynamic dutch angle while gently zooming, creating visual tension",
  },
  // ── Mood & Style ──
  {
    id: "dreamy-float",
    category: "mood",
    label: "Dreamy Float",
    prompt: "Subject gently floats upward with dreamy, weightless energy, soft particles drifting around",
  },
  {
    id: "energetic-bounce",
    category: "mood",
    label: "Energetic Bounce",
    prompt: "Bouncing with high-energy cartoon excitement, exaggerated squash and stretch with playful rhythm",
  },
  {
    id: "gentle-sway",
    category: "mood",
    label: "Gentle Sway",
    prompt: "Soft side-to-side swaying motion like a calm breeze, peaceful and meditative rhythm",
  },
  {
    id: "dramatic-entrance",
    category: "mood",
    label: "Dramatic Entrance",
    prompt: "Subject emerges dramatically from shadow or blur into clear focus with confident energy",
  },
  {
    id: "sparkle-glow",
    category: "mood",
    label: "Sparkle & Glow",
    prompt: "Subtle sparkling particles and a soft glow effect radiating from the subject, magical atmosphere",
  },
  {
    id: "cozy-warmth",
    category: "mood",
    label: "Cozy & Warm",
    prompt: "Warm, cozy animation with gentle breathing, soft golden light, and a comfortable peaceful feeling",
  },
  // ── Nature & Environment ──
  {
    id: "wind-blowing",
    category: "nature",
    label: "Wind Blowing",
    prompt: "Gentle wind blows through the scene, hair and clothing swaying naturally, leaves or petals drifting",
  },
  {
    id: "rain-falling",
    category: "nature",
    label: "Soft Rain",
    prompt: "Light rain falls softly with visible droplets, subtle splashes, and a calm atmospheric mood",
  },
  {
    id: "leaves-falling",
    category: "nature",
    label: "Falling Leaves",
    prompt: "Colorful autumn leaves gently drift down around the subject, spinning softly as they fall",
  },
  {
    id: "water-ripple",
    category: "nature",
    label: "Water Ripple",
    prompt: "Calm water surface with gentle rippling reflections, soft waves spreading outward peacefully",
  },
  {
    id: "snow-falling",
    category: "nature",
    label: "Snowfall",
    prompt: "Soft snowflakes drift down gently through the scene, creating a peaceful winter atmosphere",
  },
  {
    id: "sunrise-glow",
    category: "nature",
    label: "Sunrise Glow",
    prompt: "Warm sunrise light gradually illuminates the scene from behind, casting golden rays and long shadows",
  },
];
