let selfieSegmentation: any = null;

/**
 * Load the MediaPipe SelfieSegmentation model dynamically.
 * Prevents SSR import errors in Next.js.
 */
async function initModel() {
  if (selfieSegmentation) return selfieSegmentation;

  const mp = await import("@mediapipe/selfie_segmentation");
  selfieSegmentation = new mp.SelfieSegmentation({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
  });
  selfieSegmentation.setOptions({
    modelSelection: 1, // 0 = general, 1 = landscape/portrait
  });

  return selfieSegmentation;
}

/**
 * Remove background from an image using AI segmentation.
 * Returns a PNG Data URL with transparent background.
 */
export async function removeBackground(
  imageUrl: string,
  canvas: HTMLCanvasElement
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("removeBackground can only run in the browser.");
  }

  const model = await initModel();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");

        model.onResults((results: any) => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Apply segmentation mask to keep only the person
          ctx.globalCompositeOperation = "destination-in";
          ctx.drawImage(
            results.segmentationMask,
            0,
            0,
            canvas.width,
            canvas.height
          );
          ctx.globalCompositeOperation = "source-over";

          resolve(canvas.toDataURL("image/png"));
        });

        model.send({ image: img });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageUrl;
  });
}

/**
 * Change background color of an image using AI segmentation.
 * Returns a JPEG Data URL with the chosen background color.
 */
export async function changeBackground(
  imageUrl: string,
  backgroundColor: string,
  canvas: HTMLCanvasElement
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("changeBackground can only run in the browser.");
  }

  const model = await initModel();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");

        model.onResults((results: any) => {
          const mask = results.segmentationMask;

          // ---- Step 1: Create background layer ----
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // ---- Step 2: Create person layer ----
          const personCanvas = document.createElement("canvas");
          personCanvas.width = canvas.width;
          personCanvas.height = canvas.height;
          const personCtx = personCanvas.getContext("2d")!;

          // Draw mask first
          personCtx.drawImage(mask, 0, 0, canvas.width, canvas.height);
          personCtx.globalCompositeOperation = "source-in";
          // Then draw original image through the mask
          personCtx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // ---- Step 3: Composite person over background ----
          ctx.drawImage(personCanvas, 0, 0);

          resolve(canvas.toDataURL("image/jpeg", 0.9));
        });

        model.send({ image: img });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageUrl;
  });
}
