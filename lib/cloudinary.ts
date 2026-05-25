const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
if (!CLOUD_NAME) throw new Error('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured');
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
if (!UPLOAD_PRESET) throw new Error('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured');

/**
 * Upload an image to Cloudinary and return the secure URL.
 */
export async function uploadImage(uri: string): Promise<string> {
  const formData = new FormData();
  
  // Create file object
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
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Error:', error);
    throw new Error('Failed to upload image. Please check your internet connection.');
  }
}
