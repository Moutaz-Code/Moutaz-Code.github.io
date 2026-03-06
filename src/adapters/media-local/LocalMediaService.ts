import type {
  MediaService,
  ResolvedMedia,
  ResponsiveImage,
  ResponsiveVariant,
} from "../../domain/ports/MediaService";

export class LocalMediaService implements MediaService {
  resolve(src: string): ResolvedMedia {
    const url = src.startsWith("/") ? src : `/${src}`;
    return { url, kind: "local" };
  }

  buildResponsiveImage(src: string, _variant: ResponsiveVariant): ResponsiveImage {
    const { url } = this.resolve(src);
    return { src: url };
  }
}
