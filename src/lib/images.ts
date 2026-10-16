// 料理の写真（Figma の画像生成で作成したオリジナル。public/food/{id}.jpg）
// 写真がまだない料理は、DishImage が料理の種類に合わせた背景を表示する。
export const DISH_IMAGES = new Set([
  "m01",
  "m02",
  "m03",
  "m04",
  "m05",
  "m06",
  "m07",
  "m08",
  "m09",
  "m10",
  "m12",
  "m13",
  "m14",
  "m15",
  "m16",
]);

export const dishImageSrc = (id: string): string | null => (DISH_IMAGES.has(id) ? `/food/${id}.jpg` : null);
