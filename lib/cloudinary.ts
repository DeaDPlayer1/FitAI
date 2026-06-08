const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
if (!CLOUD_NAME) {
  console.warn('[cloudinary] CLOUD_NAME not configured — uploads will fail');
}
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
if (!UPLOAD_PRESET) {
  console.warn('[cloudinary] UPLOAD_PRESET not configured — uploads will fail');
}

function friendlyCloudinaryError(status: number, bodyMsg: string): string | null {
  if (status === 401 || status === 403) return 'Image upload limit reached on the free plan. Please try again later or use a different image.';
  if (status === 404) return 'Image upload service is not configured correctly. Please check your Cloudinary settings.';
  if (status === 420 || bodyMsg?.toLowerCase().includes('rate')) return 'You have exceeded the upload rate limit. Please wait a moment and try again.';
  if (bodyMsg?.toLowerCase().includes('quota') || bodyMsg?.toLowerCase().includes('exceed')) return 'Your free Cloudinary storage is full. Please free up space or try again later.';
  if (bodyMsg?.toLowerCase().includes('bandwidth')) return 'Your free bandwidth limit has been reached. Please try again later.';
  if (bodyMsg?.toLowerCase().includes('too large') || bodyMsg?.toLowerCase().includes('file size')) return 'The image is too large. Please use a smaller image.';
  return null;
}

/**
 * Upload an image to Cloudinary and return the secure URL.
 */
export async function uploadImage(uri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Image upload is not configured. Please try logging your meal manually.');
  }

  const formData = new FormData();
  
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMsg = errorData?.error?.message || '';
      const friendly = friendlyCloudinaryError(response.status, rawMsg);
      throw new Error(friendly || 'Image upload failed. Please try again or log your meal manually.');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error('[cloudinary] Upload error:', error);
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      throw new Error('Could not upload image due to network issues. Please check your connection.');
    }
    throw error;
  }
}
