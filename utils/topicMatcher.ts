import { getCurriculumForStudent } from "@/data/subjects";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type TopicMatchResult = {
  id: string;
  title: string;
  courseName: string;
  examSection: string;
};

export function findCurriculumMatch(
  topicName: string,
  courseHint?: string,
  grade?: string,
  field?: string,
): TopicMatchResult | null {
  const normTarget = normalize(topicName);
  if (!normTarget) return null;

  const curriculumSections = getCurriculumForStudent(grade, field);
  const candidates: Array<TopicMatchResult & { score: number }> = [];

  for (const [sectionName, courses] of Object.entries(curriculumSections)) {
    for (const [courseName, topicList] of Object.entries(courses)) {
      const courseNorm = normalize(courseName);
      const hintNorm = courseHint ? normalize(courseHint) : "";
      const isSameCourse =
        hintNorm &&
        (courseNorm.includes(hintNorm) ||
          hintNorm.includes(courseNorm) ||
          (hintNorm.includes("turk") && courseNorm.includes("turk")) ||
          (hintNorm.includes("mat") && courseNorm.includes("mat")) ||
          (hintNorm.includes("fiz") && courseNorm.includes("fiz")) ||
          (hintNorm.includes("kim") && courseNorm.includes("kim")) ||
          (hintNorm.includes("biy") && courseNorm.includes("biy")) ||
          (hintNorm.includes("tar") && courseNorm.includes("tar")) ||
          (hintNorm.includes("cog") && courseNorm.includes("cog")) ||
          (hintNorm.includes("fel") && courseNorm.includes("fel")) ||
          (hintNorm.includes("din") && courseNorm.includes("din")));

      for (const t of topicList) {
        const titleNorm = normalize(t.title);
        let score = 0;

        if (titleNorm === normTarget) {
          score = 100;
        } else if (normTarget.includes(titleNorm)) {
          score = 80;
        } else if (titleNorm.includes(normTarget)) {
          score = 75;
        } else {
          // Token overlap
          const targetWords = normTarget.split(" ").filter((w) => w.length > 2);
          const titleWords = titleNorm.split(" ").filter((w) => w.length > 2);
          const common = targetWords.filter((w) => titleWords.includes(w));
          if (common.length > 0) {
            score = 30 * common.length;
          }
        }

        if (score > 0 && isSameCourse) {
          score += 25;
        }

        if (score >= 30) {
          candidates.push({
            id: t.id,
            title: t.title,
            courseName,
            examSection: sectionName,
            score,
          });
        }
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}
