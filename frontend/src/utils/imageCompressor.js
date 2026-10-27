/**
 * Compresses and resizes an image file client-side using HTML5 Canvas.
 * Keeps payloads lightweight (~25-50KB) and lightning fast.
 *
 * @param {File|Blob} file - Image file from file input or clipboard paste
 * @param {number} maxWidth - Max width for resized image
 * @param {number} maxHeight - Max height for resized image
 * @param {number} quality - JPEG compression quality (0 to 1)
 * @returns {Promise<string>} - Resolves with compressed base64 data URL
 */
export const processAndCompressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
};
