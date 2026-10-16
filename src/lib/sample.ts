import type { Feedback, Household } from "./domain.ts";

/** デモ用の架空の世帯。初めて開いたときに入っている */
export const SAMPLE_HOUSEHOLD: Household = {
  name: "山田家（デモ）",
  cookingMinutes: 30,
  members: [
    { id: "m1", name: "たかし", ageGroup: "adult", goals: ["low_salt", "weight"], allergens: [], dislikes: [] },
    { id: "m2", name: "みか", ageGroup: "adult", goals: ["iron"], allergens: [], dislikes: ["なす"] },
    { id: "m3", name: "はな", ageGroup: "child", goals: [], allergens: ["egg"], dislikes: ["ピーマン"] },
    { id: "m4", name: "ふみ", ageGroup: "senior", goals: ["soft", "low_salt", "calcium"], allergens: [], dislikes: [] },
  ],
};

export const EMPTY_FEEDBACK: Feedback = { ratings: {}, cooked: {}, notes: {} };
