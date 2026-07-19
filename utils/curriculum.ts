import { masterCurriculum, type Curriculum } from "@/data/subjects";
import type { TopicProgress } from "@/store/useStudentStore";

export type ExamType = keyof Curriculum;

export type TopicMeta = {
  id: string;
  title: string;
  course: string;
  exam: ExamType;
};

export function getAllTopics(): TopicMeta[] {
  const result: TopicMeta[] = [];
  (["TYT", "AYT"] as const).forEach((exam) => {
    Object.entries(masterCurriculum[exam]).forEach(([course, topics]) => {
      topics.forEach((topic) => {
        result.push({ id: topic.id, title: topic.title, course, exam });
      });
    });
  });
  return result;
}

export function getTopicMeta(topicId: string): TopicMeta | undefined {
  return getAllTopics().find((t) => t.id === topicId);
}

export function isTopicCompleted(
  topicId: string,
  topics: TopicProgress[],
): boolean {
  return topics.find((t) => t.id === topicId)?.isCompleted ?? false;
}

export function getCourseProgress(
  exam: ExamType,
  course: string,
  topics: TopicProgress[],
): { completed: number; total: number; percentage: number } {
  const courseTopics = masterCurriculum[exam][course] ?? [];
  const total = courseTopics.length;
  const completed = courseTopics.filter((t) =>
    isTopicCompleted(t.id, topics),
  ).length;
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getOverallProgress(topics: TopicProgress[]): number {
  const all = getAllTopics();
  if (all.length === 0) return 0;
  const completed = all.filter((t) => isTopicCompleted(t.id, topics)).length;
  return Math.round((completed / all.length) * 100);
}

export function getIncompleteTopics(topics: TopicProgress[]): TopicMeta[] {
  return getAllTopics().filter((t) => !isTopicCompleted(t.id, topics));
}

export function getCourseKey(exam: ExamType, course: string): string {
  return `${exam}-${course}`;
}

export function formatExamCourseLabel(exam: ExamType, course: string): string {
  return `${exam} ${course}`;
}

export function parseCourseKey(key: string): { exam: ExamType; course: string } {
  const [exam, ...rest] = key.split("-");
  return { exam: exam as ExamType, course: rest.join("-") };
}

export function getCourseSolvedCount(
  record: Record<string, number> | undefined,
  exam: ExamType,
  course: string,
): number {
  return record?.[getCourseKey(exam, course)] ?? 0;
}
