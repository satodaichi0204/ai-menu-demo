// 献立づくりで使うコードと表示名、データの型。

export const AGE_GROUPS = {
  toddler: { label: "幼児（1〜5歳）", short: "幼児", portion: 0.5 },
  child: { label: "小学生", short: "小学生", portion: 0.7 },
  teen: { label: "中高生", short: "中高生", portion: 1.1 },
  adult: { label: "大人", short: "大人", portion: 1 },
  senior: { label: "高齢者（70歳〜）", short: "高齢者", portion: 0.8 },
} as const;
export type AgeGroup = keyof typeof AGE_GROUPS;
export const AGE_GROUP_CODES = Object.keys(AGE_GROUPS) as AgeGroup[];

export const GOALS = {
  low_salt: "減塩",
  low_carb: "糖質ひかえめ",
  high_protein: "たんぱく質をしっかり",
  weight: "体重管理",
  vegetables: "野菜をしっかり",
  iron: "鉄分をとる",
  calcium: "カルシウムをとる",
  soft: "やわらかめ",
} as const;
export type Goal = keyof typeof GOALS;
export const GOAL_CODES = Object.keys(GOALS) as Goal[];

/** 食品表示で義務がある特定原材料8品目と、大豆 */
export const ALLERGENS = {
  egg: "卵",
  milk: "乳",
  wheat: "小麦",
  shrimp: "えび",
  crab: "かに",
  walnut: "くるみ",
  buckwheat: "そば",
  peanut: "落花生",
  soy: "大豆",
} as const;
export type Allergen = keyof typeof ALLERGENS;
export const ALLERGEN_CODES = Object.keys(ALLERGENS) as Allergen[];

export const COURSES = { main: "主菜", side: "副菜", soup: "汁物" } as const;
export type Course = keyof typeof COURSES;

export const CUISINES = { wa: "和食", yo: "洋食", chu: "中華" } as const;
export type Cuisine = keyof typeof CUISINES;

export const PROTEINS = {
  chicken: "鶏肉",
  pork: "豚肉",
  beef: "牛肉",
  fish: "魚",
  seafood: "えび・貝",
  egg: "卵",
  soy: "大豆製品",
  none: "なし",
} as const;
export type Protein = keyof typeof PROTEINS;

export const ING_CATEGORIES = {
  veg: "野菜・きのこ・海藻",
  meat: "肉",
  fish: "魚介",
  dairy: "卵・乳製品・大豆製品",
  staple: "粉・乾物・その他の食材",
  seasoning: "調味料",
} as const;
export type IngCategory = keyof typeof ING_CATEGORIES;

export type Ingredient = { name: string; amount: number; unit: string; category: IngCategory };

export type Recipe = {
  id: string;
  name: string;
  course: Course;
  cuisine: Cuisine;
  protein: Protein;
  minutes: number;
  /** 大人1人分の栄養の目安 */
  kcal: number;
  proteinG: number;
  carbG: number;
  saltG: number;
  vegG: number;
  iron?: boolean;
  calcium?: boolean;
  soft?: boolean;
  kid?: boolean;
  allergens: Allergen[];
  /** 大人1人分の材料 */
  ingredients: Ingredient[];
  steps: string[];
};

export type Member = {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  goals: Goal[];
  allergens: Allergen[];
  dislikes: string[];
};

export type Household = {
  name: string;
  members: Member[];
  /** 平日の夕食にかけられる時間（主菜の調理時間の上限） */
  cookingMinutes: 15 | 20 | 30 | 45;
};

export type DayPlan = {
  date: string; // YYYY-MM-DD
  main: string;
  side: string;
  soup: string;
  reasons: string[];
};

export type Plan = {
  createdAt: string;
  seed: number;
  /** rules = ルールで組み立て、ai = Claude が選択、ai-fallback = AI が使えずルールで組み立て */
  mode: "rules" | "ai" | "ai-fallback";
  days: DayPlan[];
  summary: string[];
};

export type Rating = "good" | "bad";

/** モニター検証のための記録（料理ごとの評価、日ごとの「作った」とメモ） */
export type Feedback = {
  ratings: Record<string, Rating>;
  cooked: Record<string, boolean>;
  notes: Record<string, string>;
};
