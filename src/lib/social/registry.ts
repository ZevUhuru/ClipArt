import type { SocialProvider } from "./types";
import { youtubeProvider } from "./providers/youtube";

const providers: Record<string, SocialProvider> = {
  youtube: youtubeProvider,
};

export function getProvider(id: string): SocialProvider | null {
  return providers[id] || null;
}

export function getAllProviders(): SocialProvider[] {
  return Object.values(providers);
}

export function getProviderIds(): string[] {
  return Object.keys(providers);
}
