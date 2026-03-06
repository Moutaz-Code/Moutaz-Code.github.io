export type MediaKind = "local" | "cloudinary" | "external";
export type ResponsiveVariant = "card" | "hero" | "prose" | "gallery";

export interface ResolvedMedia {
  url: string;
  kind: MediaKind;
}

export interface ResponsiveImage {
  src: string;
  srcset?: string;
  sizes?: string;
}

export interface MediaService {
  resolve(src: string): ResolvedMedia;
  buildResponsiveImage(src: string, variant: ResponsiveVariant): ResponsiveImage;
}
