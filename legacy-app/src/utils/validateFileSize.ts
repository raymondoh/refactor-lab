// utils/validateFileSize.ts
export function validateFileSize(file: File, minSizeKB = 10, maxSizeMB = 2): string | null {
  const size = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const minSizeBytes = minSizeKB * 1024;

  if (size < minSizeBytes) {
    return `Image too small. Minimum size is ${minSizeKB}KB.`;
  }

  if (size > maxSizeBytes) {
    return `Image too large. Max allowed size is ${maxSizeMB}MB.`;
  }

  return null;
}
