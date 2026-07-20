import { getAllTopics } from "@/utils/curriculum";
import type {
  CourseSolvedQuestions,
  TopicProgress,
} from "@/store/useStudentStore";

/** DB'deki konu listesini güncel müfredatla birleştirir (eksik ID'ler tamamlanır). */
export function normalizeTopics(
  stored: TopicProgress[] | undefined,
): TopicProgress[] {
  const storedMap = new Map(
    (stored ?? []).map((topic) => [topic.id, topic.isCompleted]),
  );

  return getAllTopics().map((topic) => ({
    id: topic.id,
    isCompleted: storedMap.get(topic.id) ?? false,
  }));
}

export function normalizeSolvedQuestions(
  data: Record<string, number> | Map<string, number> | undefined,
): CourseSolvedQuestions {
  if (!data) return {};
  if (data instanceof Map) {
    return Object.fromEntries(data);
  }
  return data;
}
