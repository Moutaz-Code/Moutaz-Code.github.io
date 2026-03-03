import { MdxContentSource } from "../adapters/content-mdx/MdxContentSource";
import type { ContentSource } from "../domain/ports/ContentSource";

export const contentSource: ContentSource = new MdxContentSource();
