/** "350 קל׳ · 30 גר׳" — leaves out whatever wasn't entered; empty string if neither was. */
export function nutritionText(m: { calories: number; protein: number }, withProteinLabel = false): string {
  const parts: string[] = [];
  if (m.calories > 0) parts.push(`${m.calories} קל׳`);
  if (m.protein > 0) parts.push(withProteinLabel ? `${m.protein} גר׳ חלבון` : `${m.protein} גר׳`);
  return parts.join(' · ');
}
