import { getTopicMeta } from "@/utils/curriculum";

type Props = {
  studentName: string;
  weeklySelectedTopics: string[];
};

export default function WeeklyPlanPrintView({
  studentName,
  weeklySelectedTopics,
}: Props) {
  const selectedTopics = weeklySelectedTopics
    .map((id) => getTopicMeta(id))
    .filter(Boolean);

  const grouped = selectedTopics.reduce<
    Record<string, NonNullable<(typeof selectedTopics)[number]>[]>
  >((acc, topic) => {
    if (!topic) return acc;
    const key = `${topic.exam} - ${topic.course}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(topic);
    return acc;
  }, {});

  return (
    <div className="hidden print:block">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-black mb-1">
          Haftalık Çalışma Programı
        </h1>
        <p className="text-gray-600 mb-6">{studentName}</p>

        {selectedTopics.length === 0 ? (
          <p className="text-gray-500">Bu hafta için konu seçilmedi.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([group, groupTopics]) => (
              <div key={group}>
                <h2 className="text-lg font-semibold text-black border-b border-gray-300 pb-1 mb-3">
                  {group}
                </h2>
                <ul className="space-y-3">
                  {groupTopics.map((topic) => (
                    <li key={topic.id} className="flex items-center gap-3">
                      <span className="inline-block w-4 h-4 border-2 border-black shrink-0" />
                      <span className="text-black">{topic.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          YKS Takip Çizelgesi —{" "}
          {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
