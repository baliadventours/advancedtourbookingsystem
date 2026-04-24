/**
 * Service to handle image uploads to Imgbb.
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export async function uploadImage(file: File): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error('VITE_IMGBB_API_KEY is not defined in environment variables.');
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload image to Imgbb');
    }
  } catch (error) {
    console.error('Imgbb upload error:', error);
    throw error;
  }
}
