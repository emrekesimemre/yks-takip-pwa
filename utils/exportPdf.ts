import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export async function generateReportPdfBlob(
  element: HTMLElement,
  studentName: string,
): Promise<{ blob: Blob; file: File }> {
  // html-to-image uses native browser rendering via SVG foreignObject,
  // which natively supports Tailwind v4 modern color formats (oklch, lab, color-mix)
  const imgData = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2, // High resolution for crisp charts & text
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = imgData;
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  const imgWidth = pdfWidth;
  const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(
    imgData,
    "PNG",
    0,
    position,
    imgWidth,
    imgHeight,
    undefined,
    "FAST",
  );
  heightLeft -= pdfHeight;

  // Add overflow pages if report is long
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(
      imgData,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );
    heightLeft -= pdfHeight;
  }

  const safeName = studentName
    .replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const fileName = `${safeName || "Ogrenci"}_Gelisim_Raporu.pdf`;

  const blob = pdf.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  return { blob, file };
}

export function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
