export type DenemeExamType =
  | "TYT"
  | "AYT"
  | "DENEME_9"
  | "DENEME_10"
  | "DENEME_11_SAY"
  | "DENEME_11_EA"
  | "DENEME_11_SOZ"
  | "DENEME_11_DIL"
  | "KDS";

export type DenemeCourseDef = {
  key: string;
  name: string;
  maxQuestions: number;
};

export const denemeCoursesByType: Record<string, DenemeCourseDef[]> = {
  TYT: [
    { key: "TYT-Turkce", name: "Türkçe", maxQuestions: 40 },
    { key: "TYT-Matematik", name: "Matematik", maxQuestions: 40 },
    { key: "TYT-Tarih", name: "Tarih", maxQuestions: 5 },
    { key: "TYT-Cografya", name: "Coğrafya", maxQuestions: 5 },
    { key: "TYT-Felsefe", name: "Felsefe", maxQuestions: 5 },
    { key: "TYT-Din", name: "Din Kültürü", maxQuestions: 5 },
    { key: "TYT-Fizik", name: "Fizik", maxQuestions: 7 },
    { key: "TYT-Kimya", name: "Kimya", maxQuestions: 7 },
    { key: "TYT-Biyoloji", name: "Biyoloji", maxQuestions: 6 },
    { key: "TYT-Sosyal", name: "Sosyal Bilimler", maxQuestions: 20 },
    { key: "TYT-Fen", name: "Fen Bilimleri", maxQuestions: 20 },
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
  DENEME_9: [
    { key: "G9-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 30 },
    { key: "G9-Matematik", name: "Matematik", maxQuestions: 30 },
    { key: "G9-Fizik", name: "Fizik", maxQuestions: 15 },
    { key: "G9-Kimya", name: "Kimya", maxQuestions: 15 },
    { key: "G9-Biyoloji", name: "Biyoloji", maxQuestions: 15 },
    { key: "G9-Tarih", name: "Tarih", maxQuestions: 10 },
    { key: "G9-Cografya", name: "Coğrafya", maxQuestions: 10 },
    { key: "G9-Din", name: "Din Kültürü", maxQuestions: 5 },
  ],
  DENEME_10: [
    { key: "G10-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 30 },
    { key: "G10-Matematik", name: "Matematik", maxQuestions: 30 },
    { key: "G10-Fizik", name: "Fizik", maxQuestions: 15 },
    { key: "G10-Kimya", name: "Kimya", maxQuestions: 15 },
    { key: "G10-Biyoloji", name: "Biyoloji", maxQuestions: 15 },
    { key: "G10-Tarih", name: "Tarih", maxQuestions: 10 },
    { key: "G10-Cografya", name: "Coğrafya", maxQuestions: 10 },
    { key: "G10-Felsefe", name: "Felsefe", maxQuestions: 5 },
    { key: "G10-Din", name: "Din Kültürü", maxQuestions: 5 },
  ],
  DENEME_11_SAY: [
    { key: "G11-Matematik", name: "Matematik", maxQuestions: 40 },
    { key: "G11-Fizik", name: "Fizik", maxQuestions: 14 },
    { key: "G11-Kimya", name: "Kimya", maxQuestions: 13 },
    { key: "G11-Biyoloji", name: "Biyoloji", maxQuestions: 13 },
    { key: "G11-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 25 },
    { key: "G11-Tarih", name: "Tarih", maxQuestions: 10 },
  ],
  DENEME_11_EA: [
    { key: "G11-Matematik", name: "Matematik", maxQuestions: 40 },
    { key: "G11-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 30 },
    { key: "G11-Tarih", name: "Tarih", maxQuestions: 15 },
    { key: "G11-Cografya", name: "Coğrafya", maxQuestions: 15 },
    { key: "G11-Felsefe", name: "Felsefe", maxQuestions: 10 },
  ],
  DENEME_11_SOZ: [
    { key: "G11-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 35 },
    { key: "G11-Tarih", name: "Tarih", maxQuestions: 20 },
    { key: "G11-Cografya", name: "Coğrafya", maxQuestions: 20 },
    { key: "G11-Felsefe", name: "Felsefe & Mantık", maxQuestions: 25 },
  ],
  DENEME_11_DIL: [
    { key: "G11-Ingilizce", name: "İngilizce", maxQuestions: 80 },
    { key: "G11-Turkce", name: "Türk Dili ve Edebiyatı", maxQuestions: 25 },
    { key: "G11-Tmat", name: "Temel Matematik", maxQuestions: 25 },
  ],
  KDS: [
    { key: "KDS-Ders1", name: "Ana Ders 1", maxQuestions: 20 },
    { key: "KDS-Ders2", name: "Ana Ders 2", maxQuestions: 20 },
    { key: "KDS-Ders3", name: "Ana Ders 3", maxQuestions: 20 },
  ],
};

export function getDenemeCourseDef(
  type: string,
  courseKey: string,
): DenemeCourseDef | undefined {
  return (denemeCoursesByType[type] ?? []).find((c) => c.key === courseKey);
}

function normalizeCourseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim();
}

export function getDenemeCourseDefByName(
  type: string,
  courseName: string,
): DenemeCourseDef | undefined {
  const norm = normalizeCourseName(courseName);
  const defs = denemeCoursesByType[type] ?? [];
  if (!norm) return undefined;

  const directMatch = defs.find((def) => {
    const defName = normalizeCourseName(def.name);
    return defName.includes(norm) || norm.includes(defName);
  });
  if (directMatch) return directMatch;

  const aliases: Array<[string[], string]> = [
    [["turkce", "turk dili", "edebiyat"], "turkce"],
    [["matematik", "mat"], "matematik"],
    [["temel matematik", "tmat"], "tmat"],
    [["tarih"], "tarih"],
    [["cografya", "cograf"], "cografya"],
    [["felsefe", "mantik"], "felsefe"],
    [["din", "ahlak", "din kult", "din kultur"], "din"],
    [["fizik"], "fizik"],
    [["kimya"], "kimya"],
    [["biyoloji", "biy"], "biyoloji"],
    [["fen"], "fen"],
    [["sosyal"], "sosyal"],
    [["ingilizce", "english"], "ingilizce"],
  ];

  for (const [patterns, suffix] of aliases) {
    if (!patterns.some((pattern) => norm.includes(pattern))) continue;
    const matches = defs.filter((def) =>
      normalizeCourseName(def.key).endsWith(`-${suffix}`),
    );
    if (matches.length === 1) return matches[0];
  }

  return undefined;
}

export function getDenemeExamTypesForStudent(
  grade?: string,
  field?: string,
): { type: string; label: string }[] {
  const g = grade || "12";

  if (g === "9") {
    return [
      { type: "DENEME_9", label: "9. Sınıf Genel Deneme" },
    ];
  }
  if (g === "10") {
    return [
      { type: "DENEME_10", label: "10. Sınıf Genel Deneme" },
    ];
  }
  if (g === "11") {
    const f = field || "sayisal";
    if (f === "esit-agirlik") {
      return [
        { type: "DENEME_11_EA", label: "11. Sınıf EA Deneme" },
      ];
    }
    if (f === "sozel") {
      return [
        { type: "DENEME_11_SOZ", label: "11. Sınıf Sözel Deneme" },
      ];
    }
    if (f === "dil") {
      return [
        { type: "DENEME_11_DIL", label: "11. Sınıf Dil Deneme" },
      ];
    }
    return [
      { type: "DENEME_11_SAY", label: "11. Sınıf Sayısal Deneme" },
    ];
  }

  // 12 veya Mezun (YKS)
  return [
    { type: "TYT", label: "TYT" },
    { type: "AYT", label: "AYT" },
  ];
}

export function getDenemeExamTypeLabel(type: string): string {
  switch (type) {
    case "TYT":
      return "TYT";
    case "AYT":
      return "AYT";
    case "DENEME_9":
      return "9. Sınıf Denemesi";
    case "DENEME_10":
      return "10. Sınıf Denemesi";
    case "DENEME_11_SAY":
      return "11. Sınıf Sayısal";
    case "DENEME_11_EA":
      return "11. Sınıf Eşit Ağırlık";
    case "DENEME_11_SOZ":
      return "11. Sınıf Sözel";
    case "DENEME_11_DIL":
      return "11. Sınıf Dil";
    case "KDS":
      return "KDS";
    default:
      return type;
  }
}

