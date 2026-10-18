import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { denemeCoursesByType, getDenemeCourseDef } from "@/data/denemeCourses";
import { findCurriculumMatch } from "@/utils/topicMatcher";

// Örnek test karnesi (Kafa Dengi TYT karne görseli verisi)
const DEMO_EXAM_DATA = {
  examName: "Kafa Dengi TYT Deneme Sınavı",
  examType: "TYT",
  date: new Date().toISOString().split("T")[0],
  studentName: "Aleyna Akan",
  schoolName: "Manyas Anadolu İmam Hatip Lisesi",
  courses: [
    { courseKey: "TYT-Turkce", courseName: "Türkçe", correct: 23, wrong: 14, empty: 3 },
    { courseKey: "TYT-Tarih", courseName: "Tarih", correct: 1, wrong: 3, empty: 1 },
    { courseKey: "TYT-Cografya", courseName: "Coğrafya", correct: 0, wrong: 1, empty: 4 },
    { courseKey: "TYT-Felsefe", courseName: "Felsefe", correct: 3, wrong: 1, empty: 1 },
    { courseKey: "TYT-Din", courseName: "Din Kültürü", correct: 3, wrong: 1, empty: 1 },
    { courseKey: "TYT-Matematik", courseName: "Matematik", correct: 18, wrong: 5, empty: 17 },
    { courseKey: "TYT-Fen", courseName: "Fen Bilimleri", correct: 8, wrong: 4, empty: 8 },
  ],
  wrongTopics: [
    { courseName: "Türkçe", topicName: "Sözcükte Anlam", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "İki Cümleyi Karşılaştırma", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Cümlede Kavramlar", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Deyimler ve Atasözleri", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Fiillerde Kip - Kişi - Zaman", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Büyük Harflerin Yazılışı", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Noktalama İşaretleri - Karma", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafta Anlatım Akışını Bozan Cümle", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafı İkiye Ayırma", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafa Cümle Yerleştirme", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafın Konusu", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafta Ana Düşünce (Ana Fikir)", questionCount: 6, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Paragrafa Özgü Soru Kökü", questionCount: 3, wrongCount: 1, emptyCount: 0 },
    { courseName: "Türkçe", topicName: "Bir Paragrafa Bağlı Çoklu Sorular", questionCount: 7, wrongCount: 3, emptyCount: 2 },
    { courseName: "Sosyal Bilimler", topicName: "Boylardan Devlete (Tarih)", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "İstanbul'un Türk Devleti ve Toplum Yapısına Etkisi", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Osmanlı Devleti'nde Demokratikleşme Hareketleri", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Büyük Millet Meclisinin Açılması", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Doğa ve İnsan Etkileşimi (Coğrafya)", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Türkiye'de İklim (Coğrafya)", questionCount: 2, wrongCount: 2, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Nüfus Piramitleri (Coğrafya)", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "İslam Felsefesi", questionCount: 1, wrongCount: 1, emptyCount: 0 },
    { courseName: "Sosyal Bilimler", topicName: "Gönül Coğrafyamız (Din)", questionCount: 1, wrongCount: 1, emptyCount: 0 },
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/ı/g, "i").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").trim();
}

function mapCourseNameToKey(courseName: string, examType: string): string {
  const norm = normalizeText(courseName);
  const defs = denemeCoursesByType[examType] || denemeCoursesByType.TYT || [];

  for (const def of defs) {
    const defNorm = normalizeText(def.name);
    if (defNorm.includes(norm) || norm.includes(defNorm)) {
      return def.key;
    }
  }

  // Özel eşleştirmeler
  if (examType === "TYT") {
    if (norm.includes("turk") || norm.includes("edeb")) return "TYT-Turkce";
    if (norm.includes("mat") || norm.includes("geom")) return "TYT-Matematik";
    if (norm.includes("tar")) return "TYT-Tarih";
    if (norm.includes("cog")) return "TYT-Cografya";
    if (norm.includes("fel")) return "TYT-Felsefe";
    if (norm.includes("din") || norm.includes("ahlak")) return "TYT-Din";
    if (norm.includes("fiz")) return "TYT-Fizik";
    if (norm.includes("kim")) return "TYT-Kimya";
    if (norm.includes("biy")) return "TYT-Biyoloji";
    if (norm.includes("sos")) return "TYT-Sosyal";
    if (norm.includes("fen")) return "TYT-Fen";
  }

  return defs[0]?.key || "GENEL";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";
    let mimeType = "image/jpeg";
    let userApiKey = "";
    let grade = "12";
    let field = "sayisal";
    let isDemo = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      userApiKey = (formData.get("apiKey") as string) || "";
      grade = (formData.get("grade") as string) || "12";
      field = (formData.get("field") as string) || "sayisal";
      isDemo = formData.get("isDemo") === "true";

      if (file) {
        mimeType = file.type || "image/jpeg";
        const arrayBuffer = await file.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString("base64");
      }
    } else {
      const body = await req.json();
      base64Data = body.base64Data || "";
      mimeType = body.mimeType || "image/jpeg";
      userApiKey = body.apiKey || "";
      grade = body.grade || "12";
      field = body.field || "sayisal";
      isDemo = Boolean(body.isDemo);
    }

    // Demo modu istenmişse doğrudan örnek veriyi döndür
    if (isDemo) {
      const mappedWrongTopics = DEMO_EXAM_DATA.wrongTopics.map((topic) => {
        const match = findCurriculumMatch(topic.topicName, topic.courseName, grade, field);
        return {
          ...topic,
          matchedTopicId: match?.id,
          matchedTopicTitle: match?.title,
          matchedCourseName: match?.courseName,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          ...DEMO_EXAM_DATA,
          wrongTopics: mappedWrongTopics,
        },
      });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API_KEY_REQUIRED",
          message:
            "Karne tarama için Google Gemini API anahtarı gereklidir. Lütfen API anahtarınızı girin veya 'Örnek Karne ile Test Et' seçeneğini kullanın.",
        },
        { status: 400 },
      );
    }

    if (!base64Data) {
      return NextResponse.json(
        { success: false, error: "NO_FILE", message: "Yüklenecek karne dosyası bulunamadı." },
        { status: 400 },
      );
    }

    // Google Gemini API çağrısı
    const systemPrompt = `
Sen Türkiye'deki MEB ve ÖSYM deneme sınavları karnelerini (Kafa Dengi, Özdebir, 3D, Bilgi Sarmal vb. Konu Analizli Sınav Karnesi) okuyan yapay zeka asistanısın.
Eklenen görsel/PDF bir deneme sınavı konu analiz karnesidir.

Görevin:
1. Sınav Adını ("KAFA DENGİ TYT DENEME SINAVI..." vb.) bul.
2. Sınav Türünü bul: TYT, AYT, DENEME_9, DENEME_10, DENEME_11_SAY, DENEME_11_EA, DENEME_11_SOZ, DENEME_11_DIL veya KDS.
3. Öğrenci adını ve okulunu bul.
4. Sınavdaki derslerin doğru (D), yanlış (Y), boş sayılarını tespit et.
5. Konu analiz tablosundaki TÜM SATIRLARI (istisnasız her bir konuyu; öğrencinin doğru yaptığı, yanlış yaptığı ve boş bıraktığı tüm satırları) eksiksiz olarak listele.
   Her satır için:
   - courseName: Ait olduğu ders adı (örneğin "Türkçe", "Tarih-1", "Coğrafya-1", "Felsefe", "Din Kültürü", vb.)
   - topicName: Karnede yazan konu adı (örneğin "Metne Sözcük Yerleştirme", "Sözcükte Anlam", vb.)
   - questionCount: Soru sayısı (S sütunu)
   - correctCount: Doğru sayısı (D sütunu)
   - wrongCount: Yanlış sayısı (Y sütunu)
   - emptyCount: Boş sayısı (Soru - Doğru - Yanlış)

ÖNEMLİ: Tablodaki hiçbir konuyu atlama, doğru yapılanlar dahil tüm konuları sırasıyla JSON içinde döndür. SADECE aşağıdaki JSON formatında yanıt ver:
{
  "examName": "Örnek TYT Deneme",
  "examType": "TYT",
  "date": "2026-10-17",
  "studentName": "Öğrenci Adı",
  "schoolName": "Okul Adı",
  "courses": [
    { "courseName": "Türkçe", "correct": 23, "wrong": 14, "empty": 3 }
  ],
  "topics": [
    { "courseName": "Türkçe", "topicName": "Metne Sözcük Yerleştirme", "questionCount": 1, "correctCount": 1, "wrongCount": 0, "emptyCount": 0 },
    { "courseName": "Türkçe", "topicName": "Sözcükte Anlam", "questionCount": 1, "correctCount": 0, "wrongCount": 1, "emptyCount": 0 }
  ]
}
`;

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    // Google API'nin kesinlikle kullanılmayacak eski/kapatılmış modelleri
    const DEPRECATED_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
      "gemini-1.5-pro",
    ];

    let availableModels: string[] = [];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        availableModels = (listData.models || [])
          .filter((m: any) =>
            Array.isArray(m.supportedGenerationMethods)
              ? m.supportedGenerationMethods.includes("generateContent")
              : true,
          )
          .map((m: any) => (m.name || "").replace(/^models\//, ""))
          .filter(Boolean);
      }
    } catch {
      // Listeleme başarısız olsa bile fallback listesini kullan
    }

    // Google'ın en yeni önerdiği 3.8-flash ilk sırada denenir:
    const modelsToTry: string[] = [
      "gemini-3.8-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-3.8-pro",
    ];

    // Eğer Google API listesinde başka geçerli flash/pro modeller varsa ekle (deprecated olmayanlar)
    for (const m of availableModels) {
      if (
        !DEPRECATED_MODELS.includes(m) &&
        !modelsToTry.includes(m) &&
        (m.includes("flash") || m.includes("pro") || m.includes("3.8") || m.includes("2.0"))
      ) {
        modelsToTry.push(m);
      }
    }

    let geminiRes: Response | null = null;
    let lastErrorText = "";
    let successfulModel = "";

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      // 503 (anlık talep yoğunluğu) durumunda aynı modelde 1 kez kısa aralıkla tekrar dene
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload),
          });

          if (res.ok) {
            geminiRes = res;
            successfulModel = modelName;
            break;
          }

          lastErrorText = await res.text();

          // Eğer Google hata mesajında başka bir model öneriyorsa:
          const allMatches = Array.from(
            lastErrorText.matchAll(/models\/([a-zA-Z0-9.-]+)/g),
          ).map((m) => m[1]);
          const suggested = allMatches.find(
            (m) => m !== modelName && !DEPRECATED_MODELS.includes(m),
          );
          if (suggested && !modelsToTry.includes(suggested)) {
            modelsToTry.push(suggested);
          }

          // 503 durumunda 1.2 saniye bekleyip aynı modelde tekrar dene (spikes in demand geçicidir)
          if (res.status === 503 && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }

          // 404, 429, 500, 502, 503, 504 durumunda sıradaki alternatif modele geç
          if ([404, 429, 500, 502, 503, 504].includes(res.status)) {
            await new Promise((r) => setTimeout(r, 500));
            break;
          }

          // 400, 401, 403 (Geçersiz API key vb.) ise döngüyü tamamen sonlandır
          geminiRes = res;
          break;
        } catch (err: any) {
          lastErrorText = err?.message || "Bağlantı hatası";
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          break;
        }
      }

      if (geminiRes?.ok) {
        break;
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      let friendlyMessage = `Yapay zeka okuma hatası: ${lastErrorText.slice(0, 200)}`;
      if (
        lastErrorText.includes("503") ||
        lastErrorText.includes("high demand") ||
        lastErrorText.includes("UNAVAILABLE")
      ) {
        friendlyMessage =
          "Google Gemini yapay zeka sunucularında anlık yoğunluk yaşanıyor (503). Lütfen birkaç saniye bekleyip tekrar deneyiniz.";
      } else if (
        lastErrorText.includes("429") ||
        lastErrorText.includes("RESOURCE_EXHAUSTED")
      ) {
        friendlyMessage =
          "Gemini API dakikalık istek limitine ulaşıldı (429). Lütfen 1 dakika bekleyip tekrar deneyiniz.";
      } else if (
        lastErrorText.includes("API_KEY_INVALID") ||
        lastErrorText.includes("API key not valid")
      ) {
        friendlyMessage =
          "Girdiğiniz Gemini API anahtarı geçersiz veya yetkisiz. Lütfen kontrol ediniz.";
      }

      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_ERROR",
          message: friendlyMessage,
        },
        { status: 500 },
      );
    }

    const geminiData = await geminiRes.json();
    const rawContent =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // JSON temizliği
    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanJson);
    const examType = parsed.examType || "TYT";

    // Karneden okunan alt dersleri (Tarih-1, Coğrafya-1, Felsefe vb.) orijinal isimleriyle aktar
    const mappedCourses =
      parsed.courses && parsed.courses.length > 0
        ? parsed.courses.map((c: any) => {
            const key = mapCourseNameToKey(c.courseName, examType);
            const def = getDenemeCourseDef(examType, key);
            return {
              courseKey: key,
              courseName: c.courseName || def?.name || key,
              correct: Number(c.correct || 0),
              wrong: Number(c.wrong || 0),
              empty: Number(c.empty || 0),
            };
          })
        : (denemeCoursesByType[examType] || denemeCoursesByType.TYT || []).map(
            (def) => ({
              courseKey: def.key,
              courseName: def.name,
              correct: 0,
              wrong: 0,
              empty: 0,
            }),
          );

    // Konuları müfredatla eşleştir (Doğru, yanlış, boş tüm konular)
    const rawTopics = parsed.topics || parsed.wrongTopics || [];
    const mappedTopics = rawTopics.map((wt: any) => {
      const match = findCurriculumMatch(wt.topicName, wt.courseName, grade, field);
      const q = Number(wt.questionCount || 0);
      const c = Number(
        wt.correctCount !== undefined
          ? wt.correctCount
          : wt.correct !== undefined
            ? wt.correct
            : 0,
      );
      const w = Number(
        wt.wrongCount !== undefined
          ? wt.wrongCount
          : wt.wrong !== undefined
            ? wt.wrong
            : 0,
      );
      const e = Number(
        wt.emptyCount !== undefined ? wt.emptyCount : Math.max(0, q - c - w),
      );

      return {
        courseName: wt.courseName || "",
        courseKey: mapCourseNameToKey(wt.courseName || "", examType),
        topicName: wt.topicName || "",
        questionCount: q,
        correctCount: c,
        wrongCount: w,
        emptyCount: e,
        matchedTopicId: match?.id,
        matchedTopicTitle: match?.title,
        matchedCourseName: match?.courseName,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        examName: parsed.examName || "Deneme Sınavı",
        examType,
        date: parsed.date || new Date().toISOString().split("T")[0],
        studentName: parsed.studentName || "",
        schoolName: parsed.schoolName || "",
        courses: mappedCourses,
        topics: mappedTopics,
        wrongTopics: mappedTopics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Karne okunurken bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
