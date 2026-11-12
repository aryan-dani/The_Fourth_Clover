import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // 5 MB aligned with Supabase storage RLS policy

function fileExtension(name: string, mime: string): string {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "jpg";
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // If SVG or cannot decode directly, fallback to natural measurement
    if (file.type === "image/svg+xml") {
      resolve({ width: 1200, height: 675 });
      return;
    }

    if (typeof window !== "undefined" && "createImageBitmap" in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          const width = bitmap.width;
          const height = bitmap.height;
          bitmap.close();
          resolve({ width, height });
        })
        .catch(() => {
          fallbackWithImgElement(file, resolve);
        });
    } else {
      fallbackWithImgElement(file, resolve);
    }
  });
}

function fallbackWithImgElement(
  file: File,
  resolve: (dims: { width: number; height: number }) => void,
) {
  if (typeof window === "undefined") {
    resolve({ width: 1200, height: 675 });
    return;
  }
  const url = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.onload = () => {
    resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 675 });
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    resolve({ width: 1200, height: 675 });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export type UploadedMediaResult = {
  url: string;
  width: number;
  height: number;
  alt: string;
  fileName: string;
  fileSize: number;
};

export async function uploadLosslessPostImage(
  file: File,
  options?: {
    customAlt?: string;
    prefix?: string;
    userId?: string | null;
  },
): Promise<UploadedMediaResult | null> {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    toast.error("Unsupported file type. Please choose a JPEG, PNG, WebP, GIF, or SVG.");
    return null;
  }

  if (file.size > MAX_MEDIA_BYTES) {
    toast.error(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 15 MB.`);
    return null;
  }

  // Get dimensions losslessly
  const dims = await getImageDimensions(file);

  // Determine user ID
  let authorId = options?.userId;
  if (!authorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorId = user?.id ?? "anonymous";
  }

  const ext = fileExtension(file.name, file.type);
  const rand = Math.random().toString(36).slice(2, 9);
  const prefix = options?.prefix ?? "inline";
  const filePath = `${authorId}/${prefix}/${Date.now()}-${rand}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "31536000", // 1 year immutable
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      toast.error(error.message || "Could not upload image to storage.");
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;
    const cleanAlt =
      options?.customAlt ||
      file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim() ||
      "Technical diagram";

    return {
      url: publicUrl,
      width: dims.width,
      height: dims.height,
      alt: cleanAlt,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err: unknown) {
    console.error("Image upload exception:", err);
    const msg = err instanceof Error ? err.message : "Upload failed";
    toast.error(`Image upload failed: ${msg}`);
    return null;
  }
}
