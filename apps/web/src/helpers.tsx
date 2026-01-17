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

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        
        if (dataUrl.length < 1000) {
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