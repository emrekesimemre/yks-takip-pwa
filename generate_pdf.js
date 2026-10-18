const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function createCalistayPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Fonts
  const fontRegular = fs.readFileSync('/System/Library/Fonts/Supplemental/Arial.ttf');
  const fontBold = fs.readFileSync('/System/Library/Fonts/Supplemental/Arial Bold.ttf');

  doc.addFileToVFS('Arial-Regular.ttf', fontRegular.toString('binary'));
  doc.addFont('Arial-Regular.ttf', 'Arial', 'normal');

  doc.addFileToVFS('Arial-Bold.ttf', fontBold.toString('binary'));
  doc.addFont('Arial-Bold.ttf', 'Arial', 'bold');

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);

  // Decorative top bar
  doc.setFillColor(30, 58, 138); // Navy blue
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(59, 130, 246); // Accent blue
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Header
  let currentY = 14;

  // Category Pill / Badge
  const badgeText = 'MİLLÎ EĞİTİM BAKANLIĞI • SOSYAL ETKİNLİKLER VE KULÜP ÇALIŞMALARI';
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  const badgeX = (pageWidth - badgeWidth) / 2;
  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.setDrawColor(191, 219, 254); // #bfdbfe
  doc.roundedRect(badgeX, currentY - 3.5, badgeWidth, 5.5, 2.5, 2.5, 'FD');
  doc.text(badgeText, pageWidth / 2, currentY + 0.3, { align: 'center' });

  currentY += 8;

  // Main Title
  doc.setFont('Arial', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('MEDENİYET VE DÜŞÜNCE KULÜBÜ ÇALIŞTAYI', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5.5;

  // Subtitle
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text('Çalıştay Planlama, Uygulama ve Raporlama Süreç Rehberi (7 Adım)', pageWidth / 2, currentY, { align: 'center' });

  currentY += 4.5;

  // Header Divider
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 5;

  // Steps Data
  const steps = [
    {
      num: 1,
      title: 'Danışma ve Değerlendirme Komisyonunun Kurulması',
      desc: 'Okul müdürünün onayıyla, İHL Meslek Dersleri zümresindeki öğretmenler bu üst komisyonu oluşturur.'
    },
    {
      num: 2,
      title: 'Kulüp ve Yürütme Kurulunun Oluşturulması',
      desc: 'Zümre öğretmenleri, her sınıf seviyesinden (Hazırlık, 9, 10, 11) en az birer öğrenci seçerek Medeniyet ve Düşünce Kulübünü ve işleri yürütecek öğrenci kurulunu kurar.'
    },
    {
      num: 3,
      title: 'Tema ve Formatın Belirlenmesi',
      desc: 'Sadece kendi okulunuzun öğrencileriyle ve tek bir masa etrafında (örneğin sadece Fıkıh komitesinde "Helal Gıda" konusu) toplanılmasına karar verilir.'
    },
    {
      num: 4,
      title: 'Resmî İzinlerin Alınması',
      desc: 'Hazırlanan taslak okul müdürüne sunulur; müdürlük etkinliği okulun sosyal etkinlik planına işleyip onay sürecini tamamlar.'
    },
    {
      num: 5,
      title: 'Duyuru ve Başvuruların Alınması',
      desc: 'Kulüp öğrencileri sınıflarda çalıştayı duyurur. Katılmak isteyen delegeler, "motivasyon mektubu" ve konuyla ilgili kısa bir metin yazarak yürütme kuruluna başvurur.'
    },
    {
      num: 6,
      title: 'Veli İzin Evraklarının Toplanması',
      desc: 'Başvurusu kabul edilen öğrencilerden etkinlik öncesinde EK-1, EK-2, EK-3 ve EK-4 formları ıslak imzalı olarak eksiksiz alınır.'
    },
    {
      num: 7,
      title: 'Çalıştay ve Raporlama',
      desc: 'Etkinlik günü öğrenciler masada konularını tartışır; öğretmenler komisyonu öğrencileri değerlendirir. Günün sonunda öğrencilerin yazdığı sonuç raporu okul idaresine teslim edilerek arşivlenir.'
    }
  ];

  // Render Steps Cards
  steps.forEach((step) => {
    // Calculate card height dynamically
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.8);
    const textLines = doc.splitTextToSize(step.desc, contentWidth - 19);
    const textHeight = textLines.length * 4.1;
    const cardHeight = Math.max(18, 9 + textHeight);

    // Card background
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

    // Accent left stripe
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.roundedRect(marginX, currentY, 2.5, cardHeight, 1, 1, 'F');

    // Number circle badge
    const circleX = marginX + 8.5;
    const circleY = currentY + (cardHeight / 2);
    doc.setFillColor(37, 99, 235);
    doc.circle(circleX, circleY, 4.2, 'F');

    // Number text
    doc.setFont('Arial', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(String(step.num), circleX, circleY + 1.2, { align: 'center' });

    // Step Title
    const contentX = marginX + 16;
    doc.setFont('Arial', 'bold');
    doc.setFontSize(9.8);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text(step.title, contentX, currentY + 5.5);

    // Step Description
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.7);
    doc.setTextColor(51, 65, 85); // #334155
    let descY = currentY + 10;
    textLines.forEach(line => {
      doc.text(line, contentX, descY);
      descY += 4.1;
    });

    currentY += cardHeight + 2.4;
  });

  currentY += 1.5;

  // Informational Callout Box
  const noteBoxHeight = 11.5;
  doc.setFillColor(254, 252, 232); // #fefce8 amber tint
  doc.setDrawColor(254, 240, 138); // #fef08a
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, noteBoxHeight, 2, 2, 'FD');

  doc.setFillColor(217, 119, 6); // amber accent
  doc.rect(marginX, currentY, 2.5, noteBoxHeight, 'F');

  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(146, 64, 14);
  doc.text('NOT:', marginX + 5, currentY + 4.5);

  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(113, 63, 18);
  const noteText = 'Çalıştay süreci boyunca toplanan izin belgeleri (EK-1, EK-2, EK-3, EK-4) ve çalıştay sonuç bildirisi okul idaresi sosyal etkinlikler dosyasında muhafaza edilir.';
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 17);
  let noteLineY = currentY + 4.5;
  noteLines.forEach((line, idx) => {
    doc.text(line, marginX + 14, noteLineY);
    noteLineY += 3.6;
  });

  currentY += noteBoxHeight + 5;

  // Signatures Section
  const sigColWidth = contentWidth / 3;
  
  const signers = [
    { title: 'Kulüp Danışman Öğretmeni', name: 'Adı Soyadı / İmza' },
    { title: 'Zümre Başkanı', name: 'Adı Soyadı / İmza' },
    { title: 'Okul Müdürü', name: 'UYGUNDUR\nOnay / Mühür / İmza' }
  ];

  signers.forEach((signer, index) => {
    const colCenterX = marginX + (index * sigColWidth) + (sigColWidth / 2);
    
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(signer.title, colCenterX, currentY, { align: 'center' });

    // Signature line
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(colCenterX - 22, currentY + 12, colCenterX + 22, currentY + 12);

    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const subLines = signer.name.split('\n');
    subLines.forEach((sline, sidx) => {
      doc.text(sline, colCenterX, currentY + 16 + (sidx * 3.5), { align: 'center' });
    });
  });

  // Footer bar
  const footerY = pageHeight - 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

  doc.setFont('Arial', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Medeniyet ve Düşünce Kulübü • Çalıştay Süreç ve Uygulama Dokümanı', marginX, footerY);
  
  const today = new Date().toLocaleDateString('tr-TR');
  doc.text(`Tarih: ${today} | Doküman Kodu: MDK-CLST-01`, pageWidth - marginX, footerY, { align: 'right' });

  // Output
  const outputPath = path.join(__dirname, 'Medeniyet_ve_Dusunce_Kulubu_Calistay_Rehberi.pdf');
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, buffer);

  console.log(`PDF successfully created at: ${outputPath}`);
  console.log(`File size: ${fs.statSync(outputPath).size} bytes`);
}

createCalistayPdf();
