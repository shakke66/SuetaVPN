/**
 * Подготовка загруженной аватарки. Хранилище браузера рассчитано на мегабайты,
 * поэтому снимок с телефона сохранять нельзя: обрезаем по центру в квадрат
 * 256×256 и отдаём JPEG — это порядка 20 КБ вместо нескольких мегабайт.
 */

export const AVATAR_SIZE = 256;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export type AvatarError = 'type' | 'size' | 'decode';

export class AvatarFileError extends Error {
  readonly reason: AvatarError;

  constructor(reason: AvatarError) {
    super(reason);
    this.name = 'AvatarFileError';
    this.reason = reason;
  }
}

export async function readAvatarFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new AvatarFileError('type');
  if (file.size > MAX_FILE_BYTES) throw new AvatarFileError('size');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AvatarFileError('decode');
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new AvatarFileError('decode');

    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if (!dataUrl.startsWith('data:image/jpeg;base64,')) throw new AvatarFileError('decode');
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
