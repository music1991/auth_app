// helpers.ts
export default async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Configurar canvas con las dimensiones del crop
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Configurar contexto para buena calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar la parte recortada
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        // Convertir a JPEG para evitar problemas de transparencia
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        
        // Verificar que la imagen no esté vacía
        if (dataUrl.length < 1000) { // Data URL muy corta = imagen vacía
          reject(new Error('Cropped image is empty'));
          return;
        }
        
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
  });
}