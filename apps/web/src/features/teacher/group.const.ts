export const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function gradeFromName(name: string): number | null {
  const match = name.trim().match(/^(\d{1,2})/);
  if (!match) return null;
  const grade = Number(match[1]);
  return GRADE_OPTIONS.includes(grade) ? grade : null;
}
