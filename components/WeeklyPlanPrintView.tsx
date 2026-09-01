import {
  getCourseSolvedCount,
  getTopicMeta,
  getTopicSolvedCount,
} from "@/utils/curriculum";
import type { CourseSolvedQuestions } from "@/store/useStudentStore";

type Props = {
  studentName: string;
  weeklySelectedTopics: string[];
  weeklySolvedQuestionsByCourse?: CourseSolvedQuestions;
  weeklySolvedQuestionsByTopic?: CourseSolvedQuestions;
  printVisible?: boolean;
};

export default function WeeklyPlanPrintView({
  studentName,
  weeklySelectedTopics,
  weeklySolvedQuestionsByCourse = {},
  weeklySolvedQuestionsByTopic = {},
  printVisible = false,
}: Props) {
  const selectedTopics = weeklySelectedTopics
    .map((id) => getTopicMeta(id))
    .filter(Boolean);

  const grouped = selectedTopics.reduce<
    Record<string, NonNullable<(typeof selectedTopics)[number]>[]>
  >((acc, topic) => {
    if (!topic) return acc;
    const key = `${topic.exam}__${topic.course}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(topic);
    return acc;
  }, {});

  const totalQuestions = Object.entries(grouped).reduce((sum, [key, topics]) => {
    const [exam, course] = key.split("__") as ["TYT" | "AYT", string];
    const courseTotal = getCourseSolvedCount(
      weeklySolvedQuestionsByCourse,
      exam,
      course,
      weeklySolvedQuestionsByTopic,
    );
    if (courseTotal > 0) return sum + courseTotal;
    return sum + topics.reduce((s, t) => s + getTopicSolvedCount(weeklySolvedQuestionsByTopic, t.id), 0);
  }, 0);

  return (
    <div className={printVisible ? "hidden print:block" : "hidden"}>
      <div className="p-8 font-sans">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black mb-0.5">
              Haftalık Çalışma Programı
            </h1>
            <p className="text-gray-600 font-medium">{studentName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {totalQuestions > 0 && (
              <p className="text-sm font-bold text-black mt-1">
                Toplam Hedef: {totalQuestions} soru
              </p>
            )}
          </div>
        </div>

        {selectedTopics.length === 0 ? (
          <p className="text-gray-500">Bu hafta için konu seçilmedi.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([key, groupTopics]) => {
              const [exam, course] = key.split("__") as ["TYT" | "AYT", string];
              const courseTotal = getCourseSolvedCount(
                weeklySolvedQuestionsByCourse,
                exam,
                course,
                weeklySolvedQuestionsByTopic,
              );

              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between border-b border-gray-300 pb-1 mb-3">
                    <h2 className="text-lg font-semibold text-black">
                      {exam} — {course}
                    </h2>
                    {courseTotal > 0 && (
                      <span className="text-sm font-bold text-black">
                        Hedef: {courseTotal} soru
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {groupTopics.map((topic) => {
                      const topicCount = getTopicSolvedCount(
                        weeklySolvedQuestionsByTopic,
                        topic.id,
                      );
                      return (
                        <li key={topic.id} className="flex items-center gap-3">
                          <span className="inline-block w-4 h-4 border-2 border-black shrink-0" />
                          <span className="text-black flex-1">{topic.title}</span>
                          {topicCount > 0 && (
                            <span className="text-sm text-gray-600 shrink-0">
                              {topicCount} soru
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-10 pt-4 border-t border-gray-200">
          YKS Takip Çizelgesi
        </p>
      </div>
    </div>
  );
}
