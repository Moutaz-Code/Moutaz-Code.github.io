import type {
  MediaService,
  ResolvedMedia,
  ResponsiveImage,
  ResponsiveVariant,
} from "../../domain/ports/MediaService";

const VARIANT_WIDTHS: Record<ResponsiveVariant, number[]> = {
  card: [320, 480, 640, 800],
  prose: [480, 768, 1024, 1280],
  hero: [768, 1024, 1440, 1920],
  gallery: [480, 768, 1024, 1440],
};

const VARIANT_SIZES: Record<ResponsiveVariant, string> = {
  card: "(max-width: 768px) 100vw, 420px",
  prose: "(max-width: 768px) 100vw, 768px",
  hero: "100vw",
  gallery: "(max-width: 768px) 100vw, 900px",
};

const DEFAULT_WIDTH: Record<ResponsiveVariant, number> = {
  card: 800,
  prose: 1024,
  hero: 1440,
  gallery: 1024,
};

/**
 * Detects whether a URL is a Cloudinary delivery URL.
 */
function isCloudinaryUrl(src: string): boolean {
  return src.includes("res.cloudinary.com/") && src.includes("/image/upload/");
}

/**
 * Inserts transformation parameters after `/image/upload/` in a Cloudinary URL.
 * If transforms already exist (detected by `f_` or `q_` segments), appends to them.
 */
function buildTransformedUrl(src: string, width: number): string {
  const uploadMarker = "/image/upload/";
  const idx = src.indexOf(uploadMarker);
  if (idx === -1) return src;

  const before = src.slice(0, idx + uploadMarker.length);
  const after = src.slice(idx + uploadMarker.length);

  const transforms = `f_auto,q_auto,c_limit,w_${width}`;

  // Check if transforms already exist right after /upload/
  // Cloudinary transforms look like "v1234/..." or "f_auto,q_auto/..."
  // If the segment after /upload/ starts with a known transform prefix, chain ours
  if (/^[a-z]_/.test(after)) {
    // Already has transforms — insert ours before them with a slash separator
    return `${before}${transforms}/${after}`;
  }

  return `${before}${transforms}/${after}`;
}

export class CloudinaryMediaService implements MediaService {
  resolve(src: string): ResolvedMedia {
    if (!isCloudinaryUrl(src)) {
      return { url: src, kind: "external" };
    }
    return { url: src, kind: "cloudinary" };
  }

  buildResponsiveImage(src: string, variant: ResponsiveVariant): ResponsiveImage {
    if (!isCloudinaryUrl(src)) {
      return { src };
    }

    const widths = VARIANT_WIDTHS[variant];
    const defaultW = DEFAULT_WIDTH[variant];
    const sizes = VARIANT_SIZES[variant];

    const srcset = widths
      .map((w) => `${buildTransformedUrl(src, w)} ${w}w`)
      .join(", ");

    return {
      src: buildTransformedUrl(src, defaultW),
      srcset,
      sizes,
    };
  }
}
