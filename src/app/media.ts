import type {
  MediaService,
  ResolvedMedia,
  ResponsiveImage,
  ResponsiveVariant,
} from "../domain/ports/MediaService";
import { LocalMediaService } from "../adapters/media-local/LocalMediaService";
import { CloudinaryMediaService } from "../adapters/media-cloudinary/CloudinaryMediaService";

const local = new LocalMediaService();
const cloudinary = new CloudinaryMediaService();

function isCloudinaryUrl(src: string): boolean {
  return src.includes("res.cloudinary.com/") && src.includes("/image/upload/");
}

class MediaRouter implements MediaService {
  resolve(src: string): ResolvedMedia {
    if (src.startsWith("http")) {
      if (isCloudinaryUrl(src)) return cloudinary.resolve(src);
      return { url: src, kind: "external" };
    }
    return local.resolve(src);
  }

  buildResponsiveImage(src: string, variant: ResponsiveVariant): ResponsiveImage {
    if (src.startsWith("http")) {
      if (isCloudinaryUrl(src)) return cloudinary.buildResponsiveImage(src, variant);
      return { src };
    }
    return local.buildResponsiveImage(src, variant);
  }
}

export const mediaService: MediaService = new MediaRouter();
