import { apiUrl } from "@/lib/api";

export type UploadImagePurpose =
  | "post-image"
  | "project-logo"
  | "project-image";

type UploadImageResponse = {
  upload: {
    id: string;
    purpose: UploadImagePurpose;
    url: string;
    secureUrl: string;
    isActive: boolean;
  };
};

type ApiEnvelope<T> = {
  data: T | null;
  error: string;
  status: boolean;
};

export async function uploadImageAsset(
  file: File,
  purpose: UploadImagePurpose,
): Promise<UploadImageResponse["upload"]> {
  const body = new FormData();
  body.append("file", file);
  body.append("purpose", purpose);

  const response = await fetch(apiUrl("/api/v1/uploads/image"), {
    method: "POST",
    credentials: "include",
    body,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<UploadImageResponse> | null;

  if (!response.ok || !payload?.status || !payload.data?.upload) {
    throw new Error(payload?.error || "Image upload failed.");
  }

  return payload.data.upload;
}
