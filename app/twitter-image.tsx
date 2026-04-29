import { createSocialCardImage, socialCardSize } from "./social-card-image";

export const alt = "clip.art AI Clip Art Generator — transparent clip art examples";
export const size = socialCardSize;
export const contentType = "image/png";

export default function Image() {
  return createSocialCardImage();
}
