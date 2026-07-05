import { uploadToStorage } from '../lib/supabase';

/**
 * Upload a file to Supabase Storage and return the public URL.
 * Falls back to a data URL if Supabase is not configured.
 */
export async function uploadMedia(file: File, folder: string = 'incidents'): Promise<string | null> {
  if (!file) return null;

  // Generate a unique path
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${timestamp}-${sanitizedName}`;

  // Try Supabase Storage
  const url = await uploadToStorage(file, path);
  if (url) return url;

  // Fallback: convert to data URL
  return prepareMediaDataUrl(file);
}

/**
 * Convert a file to a data URL for local/offline use
 */
export async function prepareMediaPayload(file?: File | null) {
  if (!file) return null;
  return new Promise<{ name: string; type: string; dataUrl: string; size: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      dataUrl: reader.result as string,
      size: file.size
    });
    reader.onerror = () => reject(new Error('Unable to read selected file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a file to data URL string
 */
export function prepareMediaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
