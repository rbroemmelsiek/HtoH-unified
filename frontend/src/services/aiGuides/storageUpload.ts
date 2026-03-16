import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseStorage } from '../../lib/firebase';

interface UploadPhotoOptions {
  file: File;
  guide: string;
  uniqueId: string;
  forceWebp?: boolean;
}

interface UploadPhotoResult {
  downloadUrl: string;
  storagePath: string;
  mimeType: string;
}

function requireStorage() {
  if (!firebaseStorage) {
    throw new Error(
      'Firebase Storage not configured. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseStorage;
}

function sanitizePathSegment(value: string): string {
  return String(value || '')
    .trim()
    .replace(/[\/\\?#\[\]]/g, '-')
    .replace(/\s+/g, '_');
}

async function toWebp(file: File): Promise<File> {
  if (file.type === 'image/webp') return file;

  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for image conversion.');
  }
  ctx.drawImage(imageBitmap, 0, 0);
  imageBitmap.close();

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Failed to convert image to webp.'));
          return;
        }
        resolve(result);
      },
      'image/webp',
      0.92
    );
  });

  const fileBase = file.name.replace(/\.[^/.]+$/, '');
  return new File([blob], `${fileBase}.webp`, { type: 'image/webp' });
}

export async function uploadAiGuidePhoto(options: UploadPhotoOptions): Promise<UploadPhotoResult> {
  const storage = requireStorage();
  const uploadFile = options.forceWebp === false ? options.file : await toWebp(options.file);
  const ext = uploadFile.type === 'image/webp' ? 'webp' : uploadFile.name.split('.').pop() || 'bin';
  const safeGuide = sanitizePathSegment(options.guide || 'unknown_guide');
  const safeId = sanitizePathSegment(options.uniqueId || 'unknown_id');
  const storagePath = `AiGuides/${safeGuide}/${safeId}/photo-${Date.now()}.${ext}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, uploadFile, {
    contentType: uploadFile.type || 'application/octet-stream',
    cacheControl: 'public,max-age=31536000,immutable',
  });
  const downloadUrl = await getDownloadURL(fileRef);
  return {
    downloadUrl,
    storagePath,
    mimeType: uploadFile.type || 'application/octet-stream',
  };
}
