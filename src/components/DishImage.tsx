import Image from "next/image";
import type { Recipe } from "@/lib/domain";
import { dishImageSrc } from "@/lib/images";

/** 料理の写真。写真がない料理は、副菜・汁物らしい色と器の絵で代わりに表す */
export default function DishImage({
  recipe,
  sizes,
  priority,
  className = "",
}: {
  recipe: Recipe;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const src = dishImageSrc(recipe.id);
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-kaki-50 ${className}`}>
        <Image src={src} alt={recipe.name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const tone =
    recipe.course === "soup"
      ? "from-kaki-100 via-kaki-50 to-paper text-kaki-500"
      : recipe.course === "side"
        ? "from-matcha-100 via-matcha-50 to-paper text-matcha-500"
        : "from-kaki-100 via-cream to-matcha-50 text-kaki-500";
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-gradient-to-br ${tone} ${className}`}
      role="img"
      aria-label={recipe.name}
    >
      {/* 器の線画 */}
      <svg
        viewBox="0 0 64 64"
        className="h-1/3 max-h-16 w-1/3 max-w-16 opacity-70"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        {recipe.course === "soup" ? (
          <>
            <path d="M8 30h48c0 12-10.7 20-24 20S8 42 8 30Z" />
            <path d="M22 56h20M26 24c0-3 3-4 3-7M34 24c0-3 3-4 3-7" />
          </>
        ) : (
          <>
            <path d="M10 34h44c-1.5 9-10 15-22 15s-20.5-6-22-15Z" />
            <path d="M24 29c2-5 6-7 8-7s6 2 8 7" />
            <path d="M24 53h16" />
          </>
        )}
      </svg>
    </div>
  );
}
