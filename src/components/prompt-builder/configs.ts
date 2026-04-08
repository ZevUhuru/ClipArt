export interface ChipOption {
  key: string;
  label: string;
  emoji: string;
}

export interface BuilderCategory {
  id: string;
  label: string;
  question: string;
  chips: ChipOption[];
  showWhen?: { categoryId: string; keys: string[] };
}

export interface BuilderConfig {
  contentType: string;
  welcomeHeading: string;
  categories: BuilderCategory[];
  assembleDraft: (selections: Record<string, string>, extras: string) => string;
  extrasPlaceholder: string;
}

// ---------------------------------------------------------------------------
// Clip Art
// ---------------------------------------------------------------------------

const CLIPART_SUBJECTS: ChipOption[] = [
  { key: "animal", label: "Animals", emoji: "\uD83D\uDC3E" },
  { key: "person", label: "People", emoji: "\uD83D\uDC64" },
  { key: "food", label: "Food", emoji: "\uD83C\uDF55" },
  { key: "nature", label: "Nature", emoji: "\uD83C\uDF3F" },
  { key: "object", label: "Objects", emoji: "\uD83D\uDCE6" },
  { key: "vehicle", label: "Vehicles", emoji: "\uD83D\uDE97" },
  { key: "fantasy", label: "Fantasy", emoji: "\u2728" },
];

const CLIPART_ANIMALS: ChipOption[] = [
  { key: "cat", label: "Cat", emoji: "\uD83D\uDC31" },
  { key: "dog", label: "Dog", emoji: "\uD83D\uDC15" },
  { key: "bird", label: "Bird", emoji: "\uD83D\uDC26" },
  { key: "bunny", label: "Bunny", emoji: "\uD83D\uDC30" },
  { key: "bear", label: "Bear", emoji: "\uD83D\uDC3B" },
  { key: "fish", label: "Fish", emoji: "\uD83D\uDC20" },
  { key: "butterfly", label: "Butterfly", emoji: "\uD83E\uDD8B" },
  { key: "dinosaur", label: "Dinosaur", emoji: "\uD83E\uDD96" },
];

const CLIPART_PEOPLE: ChipOption[] = [
  { key: "child", label: "Child", emoji: "\uD83E\uDDD2" },
  { key: "woman", label: "Woman", emoji: "\uD83D\uDC69" },
  { key: "man", label: "Man", emoji: "\uD83D\uDC68" },
  { key: "baby", label: "Baby", emoji: "\uD83D\uDC76" },
  { key: "family", label: "Family", emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" },
  { key: "teacher", label: "Teacher", emoji: "\uD83D\uDC69\u200D\uD83C\uDFEB" },
  { key: "chef", label: "Chef", emoji: "\uD83D\uDC68\u200D\uD83C\uDF73" },
  { key: "astronaut", label: "Astronaut", emoji: "\uD83D\uDC68\u200D\uD83D\uDE80" },
];

const CLIPART_FOOD: ChipOption[] = [
  { key: "cake", label: "Cake", emoji: "\uD83C\uDF82" },
  { key: "pizza", label: "Pizza", emoji: "\uD83C\uDF55" },
  { key: "fruit", label: "Fruit", emoji: "\uD83C\uDF53" },
  { key: "ice cream", label: "Ice Cream", emoji: "\uD83C\uDF66" },
  { key: "coffee", label: "Coffee", emoji: "\u2615" },
  { key: "sushi", label: "Sushi", emoji: "\uD83C\uDF63" },
  { key: "cupcake", label: "Cupcake", emoji: "\uD83E\uDDC1" },
];

const CLIPART_NATURE: ChipOption[] = [
  { key: "tree", label: "Tree", emoji: "\uD83C\uDF33" },
  { key: "flower", label: "Flower", emoji: "\uD83C\uDF3B" },
  { key: "sun", label: "Sun", emoji: "\u2600\uFE0F" },
  { key: "mountain", label: "Mountain", emoji: "\u26F0\uFE0F" },
  { key: "cloud", label: "Cloud", emoji: "\u2601\uFE0F" },
  { key: "rainbow", label: "Rainbow", emoji: "\uD83C\uDF08" },
  { key: "ocean wave", label: "Wave", emoji: "\uD83C\uDF0A" },
];

const CLIPART_OBJECTS: ChipOption[] = [
  { key: "book", label: "Book", emoji: "\uD83D\uDCDA" },
  { key: "star", label: "Star", emoji: "\u2B50" },
  { key: "heart", label: "Heart", emoji: "\u2764\uFE0F" },
  { key: "gift box", label: "Gift", emoji: "\uD83C\uDF81" },
  { key: "balloon", label: "Balloon", emoji: "\uD83C\uDF88" },
  { key: "camera", label: "Camera", emoji: "\uD83D\uDCF7" },
  { key: "music note", label: "Music", emoji: "\uD83C\uDFB5" },
];

const CLIPART_VEHICLES: ChipOption[] = [
  { key: "car", label: "Car", emoji: "\uD83D\uDE97" },
  { key: "rocket", label: "Rocket", emoji: "\uD83D\uDE80" },
  { key: "airplane", label: "Airplane", emoji: "\u2708\uFE0F" },
  { key: "boat", label: "Boat", emoji: "\u26F5" },
  { key: "train", label: "Train", emoji: "\uD83D\uDE82" },
  { key: "bicycle", label: "Bicycle", emoji: "\uD83D\uDEB2" },
  { key: "fire truck", label: "Fire Truck", emoji: "\uD83D\uDE92" },
];

const CLIPART_FANTASY: ChipOption[] = [
  { key: "dragon", label: "Dragon", emoji: "\uD83D\uDC09" },
  { key: "unicorn", label: "Unicorn", emoji: "\uD83E\uDD84" },
  { key: "fairy", label: "Fairy", emoji: "\uD83E\uDDDA" },
  { key: "wizard", label: "Wizard", emoji: "\uD83E\uDDD9" },
  { key: "mermaid", label: "Mermaid", emoji: "\uD83E\uDDDC" },
  { key: "castle", label: "Castle", emoji: "\uD83C\uDFF0" },
  { key: "robot", label: "Robot", emoji: "\uD83E\uDD16" },
];

const CLIPART_ACTIONS: ChipOption[] = [
  { key: "standing", label: "Standing", emoji: "\uD83E\uDDCD" },
  { key: "sitting", label: "Sitting", emoji: "\uD83E\uDE91" },
  { key: "dancing", label: "Dancing", emoji: "\uD83D\uDC83" },
  { key: "waving", label: "Waving", emoji: "\uD83D\uDC4B" },
  { key: "running", label: "Running", emoji: "\uD83C\uDFC3" },
  { key: "sleeping", label: "Sleeping", emoji: "\uD83D\uDE34" },
  { key: "jumping", label: "Jumping", emoji: "\uD83E\uDD38" },
  { key: "smiling", label: "Smiling", emoji: "\uD83D\uDE0A" },
];

export const CLIPART_BUILDER: BuilderConfig = {
  contentType: "clipart",
  welcomeHeading: "Build your clip art",
  extrasPlaceholder: "e.g. wearing a party hat, holding balloons...",
  categories: [
    { id: "subject", label: "Subject", question: "What would you like to create?", chips: CLIPART_SUBJECTS },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_ANIMALS, showWhen: { categoryId: "subject", keys: ["animal"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_PEOPLE, showWhen: { categoryId: "subject", keys: ["person"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_FOOD, showWhen: { categoryId: "subject", keys: ["food"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_NATURE, showWhen: { categoryId: "subject", keys: ["nature"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_OBJECTS, showWhen: { categoryId: "subject", keys: ["object"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_VEHICLES, showWhen: { categoryId: "subject", keys: ["vehicle"] } },
    { id: "specific", label: "Pick one", question: "Which one?", chips: CLIPART_FANTASY, showWhen: { categoryId: "subject", keys: ["fantasy"] } },
    { id: "action", label: "Action", question: "What are they doing?", chips: CLIPART_ACTIONS },
  ],
  assembleDraft(selections, extras) {
    const specific = selections.specific;
    const subject = specific || selections.subject;
    const action = selections.action;
    if (!subject) return "";
    let draft = action ? `a ${subject} ${action}` : `a ${subject}`;
    if (extras.trim()) draft += `, ${extras.trim()}`;
    return draft;
  },
};

// ---------------------------------------------------------------------------
// Illustrations
// ---------------------------------------------------------------------------

const ILLUSTRATION_SCENES: ChipOption[] = [
  { key: "indoor", label: "Indoor", emoji: "\uD83C\uDFE0" },
  { key: "outdoor", label: "Outdoor", emoji: "\uD83C\uDF05" },
  { key: "fantasy", label: "Fantasy", emoji: "\uD83E\uDE84" },
  { key: "urban", label: "Urban", emoji: "\uD83C\uDFD9\uFE0F" },
  { key: "nature", label: "Nature", emoji: "\uD83C\uDF32" },
  { key: "space", label: "Space", emoji: "\uD83C\uDF0C" },
  { key: "underwater", label: "Underwater", emoji: "\uD83C\uDF0A" },
];

const ILLUSTRATION_MOODS: ChipOption[] = [
  { key: "cozy", label: "Cozy", emoji: "\u2615" },
  { key: "dramatic", label: "Dramatic", emoji: "\uD83C\uDFAD" },
  { key: "peaceful", label: "Peaceful", emoji: "\uD83E\uDD4A" },
  { key: "mysterious", label: "Mysterious", emoji: "\uD83D\uDD2E" },
  { key: "joyful", label: "Joyful", emoji: "\uD83C\uDF89" },
  { key: "epic", label: "Epic", emoji: "\u2694\uFE0F" },
  { key: "whimsical", label: "Whimsical", emoji: "\uD83E\uDEE7" },
];

const ILLUSTRATION_TIMES: ChipOption[] = [
  { key: "dawn", label: "Dawn", emoji: "\uD83C\uDF04" },
  { key: "day", label: "Day", emoji: "\u2600\uFE0F" },
  { key: "golden hour", label: "Sunset", emoji: "\uD83C\uDF07" },
  { key: "night", label: "Night", emoji: "\uD83C\uDF19" },
  { key: "stormy", label: "Stormy", emoji: "\u26C8\uFE0F" },
];

export const ILLUSTRATION_BUILDER: BuilderConfig = {
  contentType: "illustration",
  welcomeHeading: "Build your illustration",
  extrasPlaceholder: "e.g. a cottage with warm light, snow falling gently...",
  categories: [
    { id: "scene", label: "Scene", question: "Set the scene", chips: ILLUSTRATION_SCENES },
    { id: "mood", label: "Mood", question: "What\u2019s the mood?", chips: ILLUSTRATION_MOODS },
    { id: "time", label: "Time", question: "What time of day?", chips: ILLUSTRATION_TIMES },
  ],
  assembleDraft(selections, extras) {
    const parts: string[] = [];
    if (selections.mood) parts.push(`a ${selections.mood}`);
    if (selections.scene) parts.push(`${selections.scene} scene`);
    if (selections.time) parts.push(`at ${selections.time}`);
    let draft = parts.join(" ") || "";
    if (extras.trim()) draft += draft ? `, ${extras.trim()}` : extras.trim();
    return draft;
  },
};

// ---------------------------------------------------------------------------
// Coloring Pages
// ---------------------------------------------------------------------------

const COLORING_SUBJECTS: ChipOption[] = [
  { key: "animals", label: "Animals", emoji: "\uD83D\uDC3E" },
  { key: "princess", label: "Princesses", emoji: "\uD83D\uDC78" },
  { key: "dinosaurs", label: "Dinosaurs", emoji: "\uD83E\uDD95" },
  { key: "vehicles", label: "Vehicles", emoji: "\uD83D\uDE97" },
  { key: "nature", label: "Nature", emoji: "\uD83C\uDF3B" },
  { key: "fantasy creatures", label: "Fantasy", emoji: "\uD83E\uDD84" },
  { key: "ocean life", label: "Ocean Life", emoji: "\uD83D\uDC19" },
  { key: "space", label: "Space", emoji: "\uD83D\uDE80" },
];

const COLORING_COMPLEXITY: ChipOption[] = [
  { key: "simple, few large shapes, ages 3-5", label: "Simple (3\u20135)", emoji: "\uD83D\uDFE2" },
  { key: "medium detail, ages 6-8", label: "Medium (6\u20138)", emoji: "\uD83D\uDFE1" },
  { key: "highly detailed, intricate patterns, ages 9+", label: "Detailed (9+)", emoji: "\uD83D\uDD34" },
];

const COLORING_SCENE: ChipOption[] = [
  { key: "with a detailed background scene", label: "With background", emoji: "\uD83D\uDDBC\uFE0F" },
  { key: "character only, no background", label: "Character only", emoji: "\uD83E\uDDCD" },
];

export const COLORING_BUILDER: BuilderConfig = {
  contentType: "coloring",
  welcomeHeading: "Build your coloring page",
  extrasPlaceholder: "e.g. with flowers and butterflies around it...",
  categories: [
    { id: "subject", label: "Subject", question: "What\u2019s the subject?", chips: COLORING_SUBJECTS },
    { id: "complexity", label: "Complexity", question: "How detailed should it be?", chips: COLORING_COMPLEXITY },
    { id: "scene", label: "Scene", question: "Background or no?", chips: COLORING_SCENE },
  ],
  assembleDraft(selections, extras) {
    const parts: string[] = [];
    if (selections.subject) parts.push(selections.subject);
    if (selections.scene) parts.push(selections.scene);
    if (selections.complexity) parts.push(`(${selections.complexity})`);
    let draft = parts.join(" ") || "";
    if (extras.trim()) draft += draft ? `, ${extras.trim()}` : extras.trim();
    return draft;
  },
};
