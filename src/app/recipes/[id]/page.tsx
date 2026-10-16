import { Suspense } from "react";
import RecipeView from "@/components/RecipeView";
import { Skeleton } from "@/components/ui";

export default function RecipePage() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96" />}>
      <RecipeView />
    </Suspense>
  );
}
