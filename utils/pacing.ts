import { masterCurriculum, type Curriculum } from "@/data/subjects";
import type { TopicProgress } from "@/store/useStudentStore";
import { isTopicCompleted } from "@/utils/curriculum";

/** YKS hazırlık dönemindeki bir sonraki 31 Mart hedef tarihi */
export function getPacingTargetDate(from: Date = new Date()): Date {
  const year = from.getFullYear();
  const marchEnd = new Date(year, 2, 31, 23, 59, 59, 999);
  if (from.getTime() <= marchEnd.getTime()) {
    return marchEnd;
  }
  return new Date(year + 1, 2, 31, 23, 59, 59, 999);
}

export const PACING_TARGET_DATE = getPacingTargetDate();

export type CoursePacingKey = `${keyof Curriculum}-${string}`;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function getWeeksRemaining(
  from: Date = new Date(),
  to: Date = getPacingTargetDate(from),
): number {
  const diff = to.getTime() - from.getTime();
  if (diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / MS_PER_WEEK));
}

export function getWeeklyTargetPerCourse(
  incompleteCount: number,
  weeksRemaining: number,
): number {
  if (incompleteCount === 0) return 0;
  const pace = incompleteCount / weeksRemaining;
  // Haftalık tempo 1'in altındaysa hedefe göre öndesiniz; bu hafta zorunlu seçim yok.
  if (pace < 1) return 0;
  return Math.ceil(pace);
}

export type PacingWarning = {
  exam: keyof Curriculum;
  course: string;
  incompleteCount: number;
  weeklyTarget: number;
  selectedThisWeek: number;
  deficit: number;
  weeksRemaining: number;
  targetDate: Date;
};

export function getPacingWarnings(
  topics: TopicProgress[],
  weeklySelectedTopics: string[],
  from: Date = new Date(),
  targetDate: Date = getPacingTargetDate(from),
): PacingWarning[] {
  const weeksRemaining = getWeeksRemaining(from, targetDate);
  const warnings: PacingWarning[] = [];

  (["TYT", "AYT"] as const).forEach((exam) => {
    Object.entries(masterCurriculum[exam]).forEach(([course, courseTopics]) => {
      const incomplete = courseTopics.filter(
        (t) => !isTopicCompleted(t.id, topics),
      );
      if (incomplete.length === 0) return;

      const weeklyTarget = getWeeklyTargetPerCourse(
        incomplete.length,
        weeksRemaining,
      );
      const courseTopicIds = new Set(courseTopics.map((t) => t.id));
      const selectedThisWeek = weeklySelectedTopics.filter((id) =>
        courseTopicIds.has(id),
      ).length;

      const deficit = weeklyTarget - selectedThisWeek;
      if (deficit > 0) {
        warnings.push({
          exam,
          course,
          incompleteCount: incomplete.length,
          weeklyTarget,
          selectedThisWeek,
          deficit,
          weeksRemaining,
          targetDate,
        });
      }
    });
  });

  return warnings;
}

const TARGET_MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export function formatPacingTargetLabel(targetDate: Date): string {
  const month = TARGET_MONTH_NAMES[targetDate.getMonth()];
  return `${month} ${targetDate.getFullYear()}`;
}
