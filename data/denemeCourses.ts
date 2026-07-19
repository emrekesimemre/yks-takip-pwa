export type DenemeExamType = "TYT" | "AYT";

export type DenemeCourseDef = {
  key: string;
  name: string;
  maxQuestions: number;
};

export const denemeCoursesByType: Record<DenemeExamType, DenemeCourseDef[]> = {
  TYT: [
    { key: "TYT-Turkce", name: "Türkçe", maxQuestions: 40 },
    { key: "TYT-Matematik", name: "Matematik", maxQuestions: 40 },
    { key: "TYT-Fen", name: "Fen Bilimleri", maxQuestions: 20 },
    { key: "TYT-Sosyal", name: "Sosyal Bilimler", maxQuestions: 20 },
  ],
  AYT: [
    { key: "AYT-Matematik", name: "Matematik", maxQuestions: 40 },
    { key: "AYT-Fizik", name: "Fizik", maxQuestions: 14 },
    { key: "AYT-Kimya", name: "Kimya", maxQuestions: 13 },
    { key: "AYT-Biyoloji", name: "Biyoloji", maxQuestions: 13 },
    { key: "AYT-Edebiyat", name: "Edebiyat", maxQuestions: 24 },
    { key: "AYT-Tarih1", name: "Tarih-1", maxQuestions: 10 },
    { key: "AYT-Cografya1", name: "Coğrafya-1", maxQuestions: 6 },
    { key: "AYT-Tarih2", name: "Tarih-2", maxQuestions: 11 },
    { key: "AYT-Cografya2", name: "Coğrafya-2", maxQuestions: 11 },
    { key: "AYT-Felsefe", name: "Felsefe Grubu", maxQuestions: 12 },
    { key: "AYT-Din", name: "Din Kültürü", maxQuestions: 6 },
  ],
};

export function getDenemeCourseDef(
  type: DenemeExamType,
  courseKey: string,
): DenemeCourseDef | undefined {
  return denemeCoursesByType[type].find((c) => c.key === courseKey);
}
