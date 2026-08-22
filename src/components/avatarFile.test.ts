import { AvatarFileError, MAX_FILE_BYTES, readAvatarFile } from './avatarFile';

it('rejects anything that is not an image', async () => {
  const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

  await expect(readAvatarFile(file)).rejects.toMatchObject({ reason: 'type' });
});

it('rejects an image heavier than the storage budget', async () => {
  const file = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: MAX_FILE_BYTES + 1 });

  await expect(readAvatarFile(file)).rejects.toBeInstanceOf(AvatarFileError);
});
