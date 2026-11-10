import { getCurriculumForStudent, allCurriculums, type Course } from "@/data/subjects";

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

const SYNONYMS: Record<string, string[]> = {
  "cografyanin dogasi": ["doga ve insan", "dogal sistemler", "cografya bilimi", "doga"],
  "mekansal bilgi teknolojileri": ["harita bilgisi", "cografi konum", "harita"],
  "felsefenin dogasi": ["felsefeyi tanima", "felsefenin alani", "felsefe"],
  "felsefe mantik ve argumantasyon": ["akil yurutme", "mantik konulari", "mantik"],
  "turkistan dan turkiye ye": ["selcuklu turkiyesi", "ilk turk islam devletleri", "turkiye tarihi", "turk islam"],
  "islam da varlik ve bilgi": ["bilgi ve inanc", "inanc esaslari", "allah inanci", "inanc"],
  "etkilesim": ["kimyasal turler arasi etkilesimler", "kimyasal baglar", "etkilesimler"],
  "enerji": ["is guc ve enerji", "kimyasal tepkimelerde enerji", "canlilarda enerji", "enerji"],
  "okuma": ["paragrafta anlam", "sozcukte anlam", "anlam bilgisi", "paragraf", "okuma"],
  "dil bilgisi genel konular": ["sozcuk turleri", "dil bilgisi", "sozcugun yapisi"],
  "ses yazim noktalama": ["ses bilgisi", "yazim kurallari", "noktalama isaretleri"],
  "kuvvet ve hareket": ["hareket ve kuvvet", "kuvvet tork ve denge", "kuvvet"],
  "paragrafin yapisi": ["paragrafta yapi", "paragraf"],
  "cumlede anlam": ["cumlede anlam", "anlam bilgisi"],
};

function scoreTopicMatch(
  normTarget: string,
  title: string,
  courseName: string,
  courseHint?: string,
): number {
  const titleNorm = normalize(title);
  let score = 0;

  if (titleNorm === normTarget) {
    score = 100;
  } else if (normTarget.includes(titleNorm)) {
    score = 80;
  } else if (titleNorm.includes(normTarget)) {
    score = 75;
  } else {
    // 1. Eş anlamlı / Deneme ünite başlığı kontrolü
    for (const [key, synList] of Object.entries(SYNONYMS)) {
      if (normTarget.includes(key) || key.includes(normTarget)) {
        for (const syn of synList) {
          if (titleNorm.includes(syn) || syn.includes(titleNorm)) {
            score = Math.max(score, 85);
          }
        }
      }
    }

    // 2. Türkçe kök / ek esnekliği ile kelime kesişimi
    const targetWords = normTarget.split(" ").filter((w) => w.length > 2);
    const titleWords = titleNorm.split(" ").filter((w) => w.length > 2);
    let matchedCount = 0;

    for (const tw of targetWords) {
      const match = titleWords.some((w) => {
        if (w === tw) return true;
        // Türkçe yapım/çekim ekleri esnekliği: (örn: dogasi <-> doga, cografyanin <-> cografya, etkilesimler <-> etkilesim)
        if (tw.length >= 4 && w.length >= 4) {
          return tw.startsWith(w) || w.startsWith(tw);
        }
        return false;
      });
      if (match) matchedCount++;
    }

    if (matchedCount > 0) {
      score = Math.max(score, 30 * matchedCount);
    }
  }

  if (score > 0 && courseHint) {
    const courseNorm = normalize(courseName);
    const hintNorm = normalize(courseHint);

    const isSameCourse =
      courseNorm.includes(hintNorm) ||
      hintNorm.includes(courseNorm) ||
      // Edebiyat <-> Türkçe eşdeğerliği (denemelerde sıkça Edebiyat başlığı altında Türkçe konuları çıkar)
      ((hintNorm.includes("turk") || hintNorm.includes("ede")) &&
        (courseNorm.includes("turk") || courseNorm.includes("ede"))) ||
      ((hintNorm.includes("mat") || hintNorm.includes("geo")) &&
        (courseNorm.includes("mat") || courseNorm.includes("geo"))) ||
      (hintNorm.includes("fiz") && courseNorm.includes("fiz")) ||
      (hintNorm.includes("kim") && courseNorm.includes("kim")) ||
      (hintNorm.includes("biy") && courseNorm.includes("biy")) ||
      (hintNorm.includes("tar") && courseNorm.includes("tar")) ||
      (hintNorm.includes("cog") && courseNorm.includes("cog")) ||
      ((hintNorm.includes("fel") || hintNorm.includes("din")) &&
        (courseNorm.includes("fel") || courseNorm.includes("din")));

    if (isSameCourse) {
      score += 25;
    }
  }

  return score;
}

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

  // 1. Aşama: Öncelikle öğrencinin kendi sınıf müfredatında ara
  for (const [sectionName, courses] of Object.entries(curriculumSections)) {
    for (const [courseName, topicList] of Object.entries(courses)) {
      for (const t of topicList) {
        const score = scoreTopicMatch(normTarget, t.title, courseName, courseHint);
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

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  // 2. Aşama: Öğrencinin sınıf müfredatında bulunamadıysa (ör. 10. sınıf denemesinde TYT konuları varsa) tüm müfredatta ara
  for (const [sectionName, courses] of Object.entries(allCurriculums as Record<string, Course>)) {
    for (const [courseName, topicList] of Object.entries(courses)) {
      for (const t of topicList) {
        const score = scoreTopicMatch(normTarget, t.title, courseName, courseHint);
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

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  return null;
}
