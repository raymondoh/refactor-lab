// src/utils/uploadFile.ts

interface UploadOptions {
  prefix?: string;
}

export async function uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  const MAX_FILE_SIZE_MB = 2;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
  }

  const { prefix } = options;
  const renamedFile = new File([file], `${prefix || "upload"}-${file.name}`, { type: file.type });

  const formData = new FormData();
  formData.append("file", renamedFile);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload failed");

  return result.url;
}
