export type Topic = {
  id: string;
  title: string;
  order: number;
};

export type Course = {
  [key: string]: Topic[];
};

export type Curriculum = {
  TYT: Course;
  AYT: Course;
};

function topics(idPrefix: string, titles: string[]): Topic[] {
  return titles.map((title, index) => ({
    id: `${idPrefix}-${index + 1}`,
    title,
    order: index + 1,
  }));
}

// ÖSYM 2026 YKS müfredatına uygun konu listesi
// Kaynak: MEB/ÖSYM resmi konu-kazanım listesi (2026)
export const masterCurriculum: Curriculum = {
  TYT: {
    Türkçe: topics("tyt-tur", [
      "Sözcükte Anlam",
      "Cümlede Anlam",
      "Paragrafta Anlam",
      "Ses Bilgisi",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Sözcük Türleri",
      "Fiiller ve Fiilimsiler",
      "Cümle Ögeleri",
      "Cümle Türleri",
      "Anlatım Bozuklukları",
    ]),
    Matematik: topics("tyt-mat", [
      "Temel Kavramlar",
      "Sayı Basamakları",
      "Bölme ve Bölünebilme",
      "EBOB - EKOK",
      "Rasyonel Sayılar",
      "Basit Eşitsizlikler",
      "Mutlak Değer",
      "Üslü Sayılar",
      "Köklü Sayılar",
      "Çarpanlara Ayırma",
      "Oran - Orantı",
      "Birinci Dereceden Denklemler",
      "Sayı Problemleri",
      "Kesir Problemleri",
      "Yaş Problemleri",
      "Hareket Problemleri",
      "İşçi - Havuz Problemleri",
      "Yüzde Problemleri",
      "Kar - Zarar Problemleri",
      "Karışım Problemleri",
      "Kümeler",
      "Permütasyon",
      "Kombinasyon",
      "Olasılık",
      "Veri ve Grafik Yorumlama",
      "Doğruda ve Üçgende Açı",
      "Özel Üçgenler",
      "Çokgenler ve Dörtgenler",
      "Çember ve Daire",
      "Alan Hesapları",
    ]),
    Fizik: topics("tyt-fiz", [
      "Fizik Bilimine Giriş",
      "Madde ve Özellikleri",
      "Kuvvet ve Hareket",
      "İş, Güç ve Enerji",
      "Isı ve Sıcaklık",
      "Basınç",
      "Kaldırma Kuvveti",
      "Elektrik ve Manyetizma",
      "Dalgalar",
      "Optik",
    ]),
    Kimya: topics("tyt-kim", [
      "Kimya Bilimi",
      "Atom ve Periyodik Sistem",
      "Kimyasal Türler Arası Etkileşimler",
      "Maddenin Halleri",
      "Karışımlar",
      "Asit, Baz ve Tuz",
      "Kimya Her Yerde",
    ]),
    Biyoloji: topics("tyt-bio", [
      "Biyoloji Bilimi",
      "Canlıların Ortak Özellikleri",
      "Hücre ve Organeller",
      "Canlıların Temel Bileşenleri",
      "Hücre Bölünmeleri (Mitoz - Mayoz)",
      "Kalıtım",
      "Ekosistem Ekolojisi",
    ]),
    Tarih: topics("tyt-tar", [
      "Tarih Bilimi",
      "İlk Uygarlıklar",
      "İlk Türk Devletleri",
      "İslam Tarihi ve Uygarlığı",
      "Osmanlı Devleti (Kuruluş - Yükselme)",
      "Milli Mücadele",
      "Atatürk İlkeleri ve İnkılapları",
    ]),
    Coğrafya: topics("tyt-cog", [
      "Doğa ve İnsan",
      "Dünya'nın Şekli ve Hareketleri",
      "Harita Bilgisi",
      "İklim Bilgisi",
      "Yer Şekilleri",
      "Nüfus ve Göç",
      "Ekonomik Faaliyetler",
    ]),
    Felsefe: topics("tyt-fel", [
      "Felsefenin Alanı",
      "Bilgi Felsefesi",
      "Varlık Felsefesi",
      "Ahlak Felsefesi",
      "Siyaset Felsefesi",
      "Bilim Felsefesi",
    ]),
    "Din Kültürü": topics("tyt-din", [
      "İslam ve İbadet",
      "İnanç Esasları",
      "Hz. Muhammed'in Hayatı",
      "Kur'an ve Yorumu",
      "Din, Kültür ve Medeniyet",
      "Ahlak ve Değerler",
    ]),
  },
  AYT: {
    Matematik: topics("ayt-mat", [
      "Polinomlar",
      "İkinci Dereceden Denklemler",
      "Karmaşık Sayılar",
      "Parabol",
      "Trigonometri (Temel)",
      "Fonksiyonlar",
      "Fonksiyonlarda Dönüşümler",
      "Trigonometri (Toplam - Fark)",
      "Trigonometri (Dönüşümler)",
      "Logaritma",
      "Diziler",
      "Limit",
      "Türev",
      "Türev Uygulamaları",
      "Belirsiz İntegral",
      "Belirli İntegral",
      "Olasılık",
      "Permütasyon ve Kombinasyon",
    ]),
    Geometri: topics("ayt-geo", [
      "Doğrunun Analitiği",
      "Noktanın Analitiği",
      "Çemberin Analitiği",
      "Katı Cisimler (Prizma, Silindir)",
      "Katı Cisimler (Piramit, Koni, Küre)",
      "Vektörler",
    ]),
    Fizik: topics("ayt-fiz", [
      "Vektörler",
      "Kuvvet, Tork ve Denge",
      "Basit Makineler",
      "İtme ve Momentum",
      "Enerji",
      "Elektrik Alan",
      "Manyetizma",
      "İndüksiyon",
      "Modern Fizik",
      "Atom Fiziği",
      "Radyoaktivite",
      "Dalga Optiği",
    ]),
    Kimya: topics("ayt-kim", [
      "Modern Atom Teorisi",
      "Gazlar",
      "Sıvı Çözeltiler",
      "Kimya ve Enerji",
      "Tepkimelerde Hız",
      "Kimyasal Denge",
      "Asit - Baz Dengesi",
      "Elektrokimya",
      "Hidrokarbonlar",
      "Alkoller ve Eterler",
      "Aldehitler ve Ketonlar",
      "Karboksilik Asitler ve Esterler",
    ]),
    Biyoloji: topics("ayt-bio", [
      "Sinir Sistemi",
      "Endokrin Sistem",
      "Duyu Organları",
      "Destek ve Hareket Sistemi",
      "Sindirim Sistemi",
      "Dolaşım Sistemi",
      "Solunum Sistemi",
      "Boşaltım Sistemi",
      "Üreme ve Embriyoloji",
      "Kalıtım ve Biyoteknoloji",
      "Popülasyon Ekolojisi",
      "Komünite ve Ekosistem Ekolojisi",
    ]),
    Edebiyat: topics("ayt-ede", [
      "Güzel Sanatlar ve Edebiyat",
      "Şiir Bilgisi (Nazım Biçimleri, Ölçü, Kafiye)",
      "Edebi Sanatlar",
      "Metin Türleri",
      "İslamiyet Öncesi Türk Edebiyatı",
      "Divan Edebiyatı",
      "Halk Edebiyatı",
      "Tanzimat Edebiyatı",
      "Servet-i Fünun",
      "Fecr-i Ati",
      "Milli Edebiyat",
      "Cumhuriyet Dönemi Roman",
      "Cumhuriyet Dönemi Öykü",
      "Cumhuriyet Dönemi Şiir",
      "Cumhuriyet Dönemi Tiyatro",
      "Dünya Edebiyatından Örnekler",
    ]),
    "Tarih-1": topics("ayt-tar1", [
      "Osmanlı Kültür ve Medeniyeti",
      "Yeniçağ Avrupa Tarihi",
      "20. Yüzyıl Başlarında Dünya",
      "Mondros ve İşgaller",
      "Milli Mücadele",
      "Atatürk Dönemi İç Politika",
      "Atatürk Dönemi Dış Politika",
      "İnkılaplar",
      "Çağdaş Türk Tarihi",
      "Soğuk Savaş ve Küreselleşme",
    ]),
    "Coğrafya-1": topics("ayt-cog1", [
      "Doğal Sistemler (İklim)",
      "Doğal Sistemler (Yer Şekilleri)",
      "Beşeri Sistemler (Nüfus)",
      "Beşeri Sistemler (Göç ve Yerleşme)",
      "Ekonomik Faaliyetler",
      "Türkiye'nin Coğrafi Özellikleri",
    ]),
    "Tarih-2": topics("ayt-tar2", [
      "20. Yüzyıl Başlarında Osmanlı",
      "I. Dünya Savaşı",
      "Milli Mücadele Dönemi",
      "Atatürk Dönemi",
      "II. Dünya Savaşı",
      "Soğuk Savaş Dönemi",
      "Küreselleşen Dünya",
      "Türk Dış Politikası",
      "Çağdaş Türk ve Dünya Tarihi",
      "Günümüz Dünya Sorunları",
      "Türkiye'nin Yakın Tarihi",
    ]),
    "Coğrafya-2": topics("ayt-cog2", [
      "Küresel Ortam",
      "Doğal Kaynaklar",
      "Çevre ve Sürdürülebilirlik",
      "Bölgesel Kalkınma Projeleri",
      "Türkiye'nin Jeopolitiği",
      "Uluslararası Kuruluşlar",
      "Göçler ve Şehirleşme",
    ]),
    "Felsefe Grubu": topics("ayt-fel", [
      "Bilgi Felsefesi",
      "Varlık Felsefesi",
      "Ahlak Felsefesi",
      "Siyaset Felsefesi",
      "Din Felsefesi",
      "Sanat Felsefesi",
      "Öğrenme Psikolojisi",
      "Gelişim Psikolojisi",
      "Kişilik ve Ruh Sağlığı",
      "Toplum ve Kültür",
      "Toplumsal Kurumlar",
      "Toplumsal Değişim",
      "Mantık (Çıkarım)",
      "Mantık (Kavram ve Önerme)",
      "Sembolik Mantık",
    ]),
    "Din Kültürü": topics("ayt-din", [
      "İslam Düşüncesi",
      "Yorum Farklılıkları",
      "Çağdaş Dini Akımlar",
      "Din ve Laiklik",
      "Din ve Bilim",
      "Din ve Barış",
    ]),
  },
};

// MEB 9. Sınıf Müfredatı
export const grade9Curriculum: Course = {
  "Türk Dili ve Edebiyatı": topics("g9-tur", [
    "Giriş (Edebiyat, Dil, İletişim)",
    "Hikâye (Olay ve Durum Hikâyesi)",
    "Şiir (Nazım Birimi, Ölçü, Kafiye, Söz Sanatları)",
    "Masal ve Fabl",
    "Roman (Yapı Unsurları, Anlatıcı ve Bakış Açısı)",
    "Tiyatro (Trajedi, Komedi, Dram)",
    "Biyografi ve Otobiyografi",
    "Mektup ve E-Posta",
    "Günlük ve Blog",
  ]),
  Matematik: topics("g9-mat", [
    "Mantık ve Önermeler",
    "Kümeler ve Küme İşlemleri",
    "Bölünebilme Kuralları ve EBOB-EKOK",
    "Birinci Dereceden Denklem ve Eşitsizlikler",
    "Mutlak Değer",
    "Üslü ve Köklü Sayılar",
    "Oran ve Orantı",
    "Problemler (Sayı, Kesir, Yaş, İşçi, Yüzde, Hareket)",
    "Üçgende Açılar ve Açı-Kenar Bağıntıları",
    "Üçgende Eşlik ve Benzerlik",
    "Üçgenin Yardımcı Elemanları (Açıortay, Kenarortay, Yükseklik)",
    "Dik Üçgen ve Trigonometriye Giriş",
    "Üçgende Alan",
    "Veri ve İstatistik",
  ]),
  Fizik: topics("g9-fiz", [
    "Fizik Bilimine Giriş",
    "Madde ve Özellikleri (Özkütle, Dayanıklılık, Adezyon-Kohezyon)",
    "Hareket ve Kuvvet (Konum, Hız, İvme, Newton Kanunları)",
    "İş, Güç ve Enerji (Mekanik Enerjinin Korunumu)",
    "Isı ve Sıcaklık (Termometreler, Özısı, Isıl Denge)",
    "Elektrostatik (Elektrik Yükleri, Coulomb Kuvveti)",
  ]),
  Kimya: topics("g9-kim", [
    "Kimya Bilimi (Simyadan Kimyaya, Güvenlik Kuralları)",
    "Atom ve Periyodik Sistem (Modeller, Periyodik Özellikler)",
    "Kimyasal Türler Arası Etkileşimler (İyonik, Kovalent, Metalik, Zayıf)",
    "Maddenin Halleri (Katılar, Sıvılar, Gazlar, Plazma)",
    "Doğa ve Kimya (Su, Hayat, Çevre Kimyası)",
  ]),
  Biyoloji: topics("g9-biy", [
    "Yaşam Bilimi Biyoloji (Canlıların Ortak Özellikleri)",
    "Canlıların Temel Bileşenleri (Organik ve İnorganik Maddeler)",
    "Enzimler, Nükleik Asitler ve ATP",
    "Hücrenin Yapısı ve Organeller",
    "Hücre Zarı ve Madde Geçişleri",
    "Canlılar Dünyası ve Canlıların Sınıflandırılması",
  ]),
  Tarih: topics("g9-tar", [
    "Tarih ve Zaman",
    "İnsanlığın İlk Dönemleri",
    "Orta Çağ'da Dünya",
    "İlk ve Orta Çağlarda Türk Dünyası",
    "İslam Medeniyetinin Doğuşu",
    "Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri",
  ]),
  Coğrafya: topics("g9-cog", [
    "Doğa ve İnsan Etkileşimi",
    "Coğrafi Konum ve Koordinat Sistemi",
    "Harita Bilgisi ve Ölçekler",
    "Dünyanın Şekli ve Hareketleri",
    "İklim Elemanları (Sıcaklık, Basınç, Rüzgar, Nem)",
    "Türkiye'nin İklimi ve Bitki Örtüsü",
    "Yerleşme ve Nüfus",
  ]),
  "Din Kültürü": topics("g9-din", [
    "Bilgi ve İnanç",
    "Din ve İslam",
    "İslam ve İbadet",
    "Gençlik ve Değerler",
    "Gönül Coğrafyamız",
  ]),
};

export const grade9EnglishTopics = topics("g9-ing", [
  "Studying Abroad",
  "My Environment",
  "Movies and Entertainment",
  "Human in Nature",
  "Inspirational People",
  "Bridging Cultures",
  "World Heritage",
  "Emergency and Health",
]);

// MEB 10. Sınıf Müfredatı
export const grade10Curriculum: Course = {
  "Türk Dili ve Edebiyatı": topics("g10-tur", [
    "Giriş (Türkçenin Tarihi Gelişimi)",
    "Hikâye (Dede Korkut, Halk Hikâyesi, Tanzimat)",
    "Şiir (İslamiyet Öncesi, Divan ve Halk Şiiri)",
    "Destan ve Efsane",
    "Roman (Tanzimat, Servetifünun, Milli Edebiyat)",
    "Tiyatro (Geleneksel ve Modern Tiyatro)",
    "Anı (Hatıra)",
    "Haber Metni",
    "Gezi Yazısı",
  ]),
  Matematik: topics("g10-mat", [
    "Sıralama ve Sayma (Permütasyon, Kombinasyon)",
    "Binom Açılımı ve Olasılık",
    "Fonksiyon Kavramı ve Gösterimi",
    "Bileşke ve Ters Fonksiyon",
    "Polinom Kavramı ve Polinomlarda İşlemler",
    "Çarpanlara Ayırma",
    "İkinci Dereceden Bir Bilinmeyenli Denklemler",
    "Karmaşık Sayılar",
    "Çokgenler ve Dörtgenler",
    "Özel Dörtgenler (Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Deltoid, Yamuk)",
    "Katı Cisimler (Prizmalar ve Piramitler)",
  ]),
  Fizik: topics("g10-fiz", [
    "Elektrik Akımı, Direnç ve Ohm Kanunu",
    "Elektrik Devreleri ve Elektriksel Güç",
    "Mıknatıslar ve Manyetik Alan",
    "Katı, Sıvı ve Gaz Basıncı",
    "Sıvıların Kaldırma Kuvveti",
    "Dalgalar (Yay, Su, Ses ve Deprem)",
    "Optik (Aydınlanma, Düzlem ve Küresel Aynalar)",
    "Optik (Kırılma, Mercekler, Prizmalar ve Renk)",
  ]),
  Kimya: topics("g10-kim", [
    "Kimyanın Temel Kanunları (Kütle Korunumu, Sabit ve Katlı Oranlar)",
    "Mol Kavramı",
    "Kimyasal Tepkimeler ve Hesaplamalar",
    "Karışımlar ve Sınıflandırılması",
    "Çözünürlük ve Çözelti Derişimleri",
    "Karışımları Ayırma Yöntemleri",
    "Asitler, Bazlar ve Tuzlar",
    "Kimya Her Yerde (Temizlik, Polimer, İlaç, Kozmetik)",
  ]),
  Biyoloji: topics("g10-biy", [
    "Mitoz Bölünme ve Eşeysiz Üreme",
    "Mayoz Bölünme ve Eşeyli Üreme",
    "Kalıtımın Genel İlkeleri (Mendel Genetiği)",
    "Kan Grupları ve Cinsiyete Bağlı Kalıtım",
    "Soyağaçları ve Genetik Varyasyonlar",
    "Ekosistem Ekolojisi ve Madde Döngüleri",
    "Güncel Çevre Sorunları ve Biyolojik Çeşitlilik",
  ]),
  Tarih: topics("g10-tar", [
    "Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi",
    "Beylikten Devlete Osmanlı Siyaseti (1302-1453)",
    "Devletleşme Sürecinde Savaşçılar ve Askerler",
    "Beylikten Devlete Osmanlı Medeniyeti",
    "Dünya Gücü Osmanlı (1453-1595)",
    "Sultan ve Osmanlı Merkez Teşkilatı",
    "Klasik Çağda Osmanlı Toplum Düzeni",
  ]),
  Coğrafya: topics("g10-cog", [
    "Yerin Yapısı ve Levha Tektoniği (İç Kuvvetler)",
    "Dış Kuvvetler (Akarsu, Rüzgâr, Buzul, Dalgalar)",
    "Türkiye'de Su, Toprak ve Bitki Varlığı",
    "Nüfusun Gelişimi, Dağılışı ve Nüfus Piramitleri",
    "Göçler ve Göçlerin Mekânsal Etkileri",
    "Ekonomik Faaliyetlerin Sınıflandırılması",
    "Uluslararası Ulaşım Hatları ve Doğal Afetler",
  ]),
  Felsefe: topics("g10-fel", [
    "Felsefeyi Tanıma ve Akıl Yürütme",
    "Varlık Felsefesi (Ontoloji)",
    "Bilgi Felsefesi (Epistemoloji)",
    "Ahlak ve Siyaset Felsefesi",
    "Sanat ve Din Felsefesi",
    "Felsefi Okuma ve Yazma",
  ]),
  "Din Kültürü": topics("g10-din", [
    "Allah İnancı ve İnsan",
    "Hz. Muhammed ve Gençlik",
    "Din ve Hayat",
    "Ahlaki Tutum ve Davranışlar",
    "İslam Düşüncesinde Yorumlar (Mezhepler)",
  ]),
};

// 11. Sınıflar İçin Ortak Dersler (Zorunlu)
const grade11Common = {
  "Din Kültürü": topics("g11-din", [
    "Dünya ve Ahiret",
    "Kur'an'a Göre Hz. Muhammed",
    "Kur'an'da Bazı Kavramlar",
    "İnançla İlgili Meseleler",
    "Yahudilik ve Hristiyanlık",
  ]),
  İngilizce: topics("g11-ing-ortak", [
    "Future Jobs",
    "Hobbies and Skills",
    "Hard Times",
    "What a Life",
    "Back to the Past",
  ]),
};

// MEB 11. Sınıf Sayısal Müfredatı
export const grade11SayisalCurriculum: Course = {
  ...grade11Common,
  Matematik: topics("g11-mat", [
    "Yönlü Açılar ve Trigonometrik Fonksiyonlar",
    "Trigonometrik Bağıntılar ve Teoremler",
    "Doğrunun Analitik İncelenmesi",
    "Fonksiyonların Dönüşümleri ve İkinci Dereceden Fonksiyonlar",
    "İkinci Dereceden İki Bilinmeyenli Denklem Sistemleri",
    "İkinci Dereceden Eşitsizlikler ve Eşitsizlik Sistemleri",
    "Çemberde Açılar ve Teğet-Kiriş Özellikleri",
    "Dairede Çevre ve Alan",
    "Uzay Geometri (Küre ve Koni)",
    "Koşullu Olasılık ve Bağımsız Olaylar",
  ]),
  Fizik: topics("g11-fiz", [
    "Vektörler ve Bağıl Hareket",
    "Newton'ın Hareket Yasaları",
    "Bir Boyutta Sabit İvmeli Hareket",
    "İki Boyutta Hareket (Atışlar)",
    "İş, Güç ve Enerji",
    "İtme ve Çizgisel Momentum",
    "Tork, Denge ve Kütle Merkezi",
    "Basit Makineler",
    "Elektriksel Kuvvet ve Potansiyel",
    "Düzgün Elektrik Alan ve Sığa (Kapasitör)",
    "Manyetizma ve Elektromanyetik İndüksiyon",
    "Alternatif Akım ve Transformatörler",
  ]),
  Kimya: topics("g11-kim", [
    "Modern Atom Teorisi ve Kuantum Sayıları",
    "Periyodik Özellikler",
    "Gaz Yasaları ve İdeal Gaz Denklemi",
    "Gazlarda Kinetik Teori ve Gerçek Gazlar",
    "Sıvı Çözeltiler ve Derişim Birimleri",
    "Koligatif Özellikler ve Çözünürlük",
    "Kimyasal Tepkimelerde Enerji ve Entalpi",
    "Kimyasal Tepkimelerde Hız",
    "Kimyasal Denge ve Dengeyi Etkileyen Faktörler",
    "Asit-Baz Dengesi ve pH Hesaplamaları",
    "Çözünürlük Dengesi (KÇÇ)",
  ]),
  Biyoloji: topics("g11-biy", [
    "Denetleyici ve Düzenleyici Sistem (Sinir ve Endokrin Sistem)",
    "Duyu Organları",
    "Destek ve Hareket Sistemi",
    "Sindirim Sistemi",
    "Dolaşım ve Bağışıklık Sistemi",
    "Solunum Sistemi",
    "Boşaltım (Üriner) Sistemi",
    "Üreme Sistemi ve Embriyonik Gelişim",
    "Komünite Ekolojisi",
    "Popülasyon Ekolojisi",
  ]),
  "Türk Dili ve Edebiyatı": topics("g11-tur", [
    "Giriş (Edebiyat ve Toplum)",
    "Hikâye (Tanzimat'tan Cumhuriyete)",
    "Şiir (Tanzimat, Servetifünun, Fecriati, Milli Edebiyat)",
    "Makale, Sohbet ve Fıkra",
    "Roman (Milli Edebiyat ve Cumhuriyet Dönemi)",
    "Tiyatro (Cumhuriyet Dönemi)",
    "Eleştiri ve Mülakat/Röportaj",
  ]),
  Tarih: topics("g11-tar", [
    "Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti (1595-1774)",
    "Değişim Çağında Avrupa ve Osmanlı",
    "Uluslararası İlişkilerde Denge Stratejisi (1774-1914)",
    "Devrimler Çağında Değişen Devlet-Toplum İlişkileri",
    "Sermaye ve Emek",
    "XIX ve XX. Yüzyılda Değişen Gündelik Hayat",
  ]),
};

// MEB 11. Sınıf Eşit Ağırlık Müfredatı
export const grade11EsitAgirlikCurriculum: Course = {
  ...grade11Common,
  Matematik: grade11SayisalCurriculum.Matematik,
  "Türk Dili ve Edebiyatı": grade11SayisalCurriculum["Türk Dili ve Edebiyatı"],
  Tarih: grade11SayisalCurriculum.Tarih,
  Coğrafya: topics("g11-cog", [
    "Biyoçeşitlilik ve Ekosistemler",
    "Madde Döngüleri ve Enerji Akışı",
    "Nüfus Politikaları ve Şehirlerin Fonksiyonları",
    "Türkiye'de Nüfus ve Yerleşme",
    "Türkiye'de Tarım ve Hayvancılık",
    "Türkiye'de Madenler ve Enerji Kaynakları",
    "Türkiye'de Sanayi ve Ulaşım",
    "Küresel Ticaret ve Turizm",
    "Çevre ve Toplum",
  ]),
  Felsefe: topics("g11-fel", [
    "MÖ 6. Yüzyıl - MS 2. Yüzyıl Felsefesi (İlk Çağ)",
    "MS 2. Yüzyıl - MS 15. Yüzyıl Felsefesi (Orta Çağ)",
    "15. Yüzyıl - 17. Yüzyıl Felsefesi (Rönesans)",
    "18. Yüzyıl - 19. Yüzyıl Felsefesi (Aydınlanma)",
    "20. Yüzyıl Felsefesi",
  ]),
};

// MEB 11. Sınıf Sözel Müfredatı
export const grade11SozelCurriculum: Course = {
  ...grade11Common,
  "Türk Dili ve Edebiyatı": grade11SayisalCurriculum["Türk Dili ve Edebiyatı"],
  Tarih: grade11SayisalCurriculum.Tarih,
  Coğrafya: grade11EsitAgirlikCurriculum.Coğrafya,
  Felsefe: grade11EsitAgirlikCurriculum.Felsefe,
  Psikoloji: topics("g11-psi", [
    "Psikolojinin Temel Süreçleri",
    "Öğrenme, Bellek ve Düşünme",
    "Ruh Sağlığı ve Davranış Bozuklukları",
  ]),
  Sosyoloji: topics("g11-sos", [
    "Sosyolojiye Giriş",
    "Birey ve Toplum",
    "Toplumsal Yapı",
    "Toplumsal Değişme ve Gelişme",
    "Toplum ve Kurumlar",
  ]),
  Mantık: topics("g11-man", [
    "Mantığa Giriş",
    "Klasik Mantık (Kavram, Önerme, Çıkarım)",
    "Mantık ve Dil",
    "Sembolik Mantık",
  ]),
};

// MEB 11. Sınıf Dil Müfredatı
export const grade11DilCurriculum: Course = {
  ...grade11Common,
  İngilizce: topics("g11-ing-dil", [
    "Future Jobs and Career Paths",
    "Hobbies and Skills",
    "Hard Times and History",
    "What a Life! (Biographies)",
    "Back to the Past",
    "Open Your Heart (Feelings and Empathy)",
    "Facts Against Fiction",
    "Sports and Health",
  ]),
  "Türk Dili ve Edebiyatı": grade11SayisalCurriculum["Türk Dili ve Edebiyatı"],
  Tarih: grade11SayisalCurriculum.Tarih,
  Matematik: topics("g11-tmat", [
    "Sayılar ve Sayı Kümeleri",
    "Bölünebilme ve EBOB-EKOK",
    "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "Oran-Orantı ve Temel Problemler",
    "Veri ve Temel İstatistik",
  ]),
};

export function getCurriculumForStudent(
  grade?: string,
  field?: string,
): Record<string, Course> {
  const g = grade || "12";

  if (g === "9") {
    if (field === "dil") {
      return {
        "9. Sınıf": { ...grade9Curriculum, İngilizce: grade9EnglishTopics },
      };
    }
    return { "9. Sınıf": grade9Curriculum };
  }
  if (g === "10") {
    return { "10. Sınıf": grade10Curriculum };
  }
  if (g === "11") {
    const f = field || "sayisal";
    if (f === "esit-agirlik") {
      return { "11. Sınıf": grade11EsitAgirlikCurriculum };
    }
    if (f === "sozel") {
      return { "11. Sınıf": grade11SozelCurriculum };
    }
    if (f === "dil") {
      return { "11. Sınıf": grade11DilCurriculum };
    }
    return { "11. Sınıf": grade11SayisalCurriculum };
  }

  // 12 veya Mezun (YKS)
  return {
    TYT: masterCurriculum.TYT,
    AYT: masterCurriculum.AYT,
  };
}

export const allCurriculums: Record<string, Course> = {
  "9. Sınıf": grade9Curriculum,
  "9. Sınıf (Dil)": { ...grade9Curriculum, İngilizce: grade9EnglishTopics },
  "10. Sınıf": grade10Curriculum,
  "11. Sınıf (Sayısal)": grade11SayisalCurriculum,
  "11. Sınıf (Eşit Ağırlık)": grade11EsitAgirlikCurriculum,
  "11. Sınıf (Sözel)": grade11SozelCurriculum,
  "11. Sınıf (Dil)": grade11DilCurriculum,
  TYT: masterCurriculum.TYT,
  AYT: masterCurriculum.AYT,
};
