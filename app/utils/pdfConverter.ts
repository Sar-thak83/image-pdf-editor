import jsPDF from "jspdf";

export async function convertImagesToPDF(files: File[]): Promise<Blob> {
  const pdf = new jsPDF();
  let isFirstPage = true;

  for (const file of files) {
    const imageDataUrl = await fileToDataURL(file);
    const img = await loadImage(imageDataUrl);

    if (!isFirstPage) {
      pdf.addPage();
    }

    // Calculate dimensions to fit page while maintaining aspect ratio
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    const maxWidth = pdfWidth - margin * 2;
    const maxHeight = pdfHeight - margin * 2;

    let { width, height } = calculateFitDimensions(
      img.width,
      img.height,
      maxWidth,
      maxHeight
    );

    // Center the image on the page
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;

    pdf.addImage(imageDataUrl, "JPEG", x, y, width, height);
    isFirstPage = false;
  }

  return pdf.output("blob");
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function calculateFitDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: originalWidth * ratio,
    height: originalHeight * ratio,
  };
}
