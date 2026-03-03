export type MediaType = "image" | "gif" | "video" | "embed";

export type Media = {
  type: MediaType;
  src: string;
  alt?: string;
  caption?: string;
};
