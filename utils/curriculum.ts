import {
  masterCurriculum,
  getCurriculumForStudent,
  allCurriculums,
  type Course,
} from "@/data/subjects";
import type { TopicProgress } from "@/store/useStudentStore";

export type ExamType = string;

export type TopicMeta = {
  id: string;
  title: string;
  course: string;
  exam: string;
};

export function getAllTopics(): TopicMeta[] {
  const result: TopicMeta[] = [];
  const seenIds = new Set<string>();

  Object.entries(allCurriculums).forEach(([section, courses]) => {
    Object.entries(courses).forEach(([course, topics]) => {
      topics.forEach((topic) => {
        if (!seenIds.has(topic.id)) {
          seenIds.add(topic.id);
          result.push({
            id: topic.id,
            title: topic.title,
            course,
            exam: section.startsWith("11. Sınıf")
              ? "11. Sınıf"
              : section,
          });
        }
      });
    });
  });

  return result;
}

export function getStudentTopics(grade?: string, field?: string): TopicMeta[] {
  const studentCurriculum = getCurriculumForStudent(grade, field);
  const result: TopicMeta[] = [];
  const seenIds = new Set<string>();

  Object.entries(studentCurriculum).forEach(([section, courses]) => {
    Object.entries(courses).forEach(([course, topics]) => {
      topics.forEach((topic) => {
        if (!seenIds.has(topic.id)) {
          seenIds.add(topic.id);
          result.push({
            id: topic.id,
            title: topic.title,
            course,
            exam: section,
          });
        }
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
  exam: string,
  course: string,
  topics: TopicProgress[],
  grade?: string,
  field?: string,
): { completed: number; total: number; percentage: number } {
  const studentCurriculum = getCurriculumForStudent(grade, field);
  const courseTopics =
    studentCurriculum[exam]?.[course] ??
    allCurriculums[exam]?.[course] ??
    (masterCurriculum as unknown as Record<string, Course>)[exam]?.[course] ??
    [];
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

export function getOverallProgress(
  topics: TopicProgress[],
  grade?: string,
  field?: string,
): number {
  const studentTopics = grade ? getStudentTopics(grade, field) : getAllTopics();
  if (studentTopics.length === 0) return 0;
  const completed = studentTopics.filter((t) => isTopicCompleted(t.id, topics)).length;
  return Math.round((completed / studentTopics.length) * 100);
}

export function getExamProgress(
  exam: string,
  topics: TopicProgress[],
  grade?: string,
  field?: string,
): { completed: number; total: number; percentage: number } {
  const applicableTopics = grade
    ? getStudentTopics(grade, field).filter((t) => t.exam === exam)
    : getAllTopics().filter((t) => t.exam === exam);
  const total = applicableTopics.length;
  const completed = applicableTopics.filter((t) =>
    isTopicCompleted(t.id, topics),
  ).length;
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export type CourseProgressItem = {
  course: string;
  completed: number;
  total: number;
  percentage: number;
};

export function getCourseProgressList(
  exam: string,
  topics: TopicProgress[],
  grade?: string,
  field?: string,
): CourseProgressItem[] {
  const studentCurriculum = getCurriculumForStudent(grade, field);
  const courses =
    studentCurriculum[exam] ??
    allCurriculums[exam] ??
    (masterCurriculum as unknown as Record<string, Course>)[exam] ??
    {};

  return Object.keys(courses).map((course) => ({
    course,
    ...getCourseProgress(exam, course, topics, grade, field),
  }));
}

export function getIncompleteTopics(
  topics: TopicProgress[],
  grade?: string,
  field?: string,
): TopicMeta[] {
  const list = grade ? getStudentTopics(grade, field) : getAllTopics();
  return list.filter((t) => !isTopicCompleted(t.id, topics));
}

export function getCourseKey(exam: string, course: string): string {
  return `${exam.replace(/\./g, "")}-${course}`;
}

export function formatExamCourseLabel(exam: string, course: string): string {
  return `${exam} ${course}`;
}

export function parseCourseKey(key: string): { exam: string; course: string } {
  const [exam, ...rest] = key.split("-");
  return { exam, course: rest.join("-") };
}

export function getTopicSolvedCount(
  record: Record<string, number> | undefined,
  topicId: string,
): number {
  return record?.[topicId] ?? 0;
}

export function getCourseTopicSolvedSum(
  record: Record<string, number> | undefined,
  exam: string,
  course: string,
  grade?: string,
  field?: string,
): number {
  const studentCurriculum = getCurriculumForStudent(grade, field);
  const courseTopics =
    studentCurriculum[exam]?.[course] ??
    allCurriculums[exam]?.[course] ??
    (masterCurriculum as unknown as Record<string, Course>)[exam]?.[course] ??
    [];
  return courseTopics.reduce(
    (sum, topic) => sum + getTopicSolvedCount(record, topic.id),
    0,
  );
}

export function getCourseGeneralSolvedCount(
  courseRecord: Record<string, number> | undefined,
  exam: string,
  course: string,
): number {
  if (!courseRecord) return 0;
  return (
    courseRecord[getCourseKey(exam, course)] ??
    courseRecord[`${exam}-${course}`] ??
    0
  );
}

export function getCourseSolvedCount(
  courseRecord: Record<string, number> | undefined,
  exam: string,
  course: string,
  topicRecord?: Record<string, number> | undefined,
  grade?: string,
  field?: string,
): number {
  return (
    getCourseTopicSolvedSum(topicRecord, exam, course, grade, field) +
    getCourseGeneralSolvedCount(courseRecord, exam, course)
  );
}

export function getTotalSolvedQuestions(
  courseRecord: Record<string, number> | Map<string, number> | undefined,
  topicRecord?: Record<string, number> | Map<string, number> | undefined,
): number {
  const normalizedTopics =
    topicRecord instanceof Map
      ? Object.fromEntries(topicRecord)
      : (topicRecord ?? {});
  const normalizedCourses =
    courseRecord instanceof Map
      ? Object.fromEntries(courseRecord)
      : (courseRecord ?? {});

  const courseSum = Object.values(normalizedCourses).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0,
  );
  const topicSum = Object.values(normalizedTopics).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0,
  );

  return courseSum + topicSum;
}

