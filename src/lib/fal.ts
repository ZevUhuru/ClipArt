import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export type AnimationModel = "kling-2.5-turbo" | "kling-3.0-standard" | "kling-3.0-pro";

const MODEL_ENDPOINTS: Record<AnimationModel, string> = {
  "kling-2.5-turbo": "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  "kling-3.0-standard": "fal-ai/kling-video/v3/standard/image-to-video",
  "kling-3.0-pro": "fal-ai/kling-video/v3/pro/image-to-video",
};

const BASE_CREDITS_PER_SEC: Record<AnimationModel, number> = {
  "kling-2.5-turbo": 1,
  "kling-3.0-standard": 1.6,
  "kling-3.0-pro": 2.4,
};

export const MAX_DURATION: Record<AnimationModel, number> = {
  "kling-2.5-turbo": 10,
  "kling-3.0-standard": 15,
  "kling-3.0-pro": 15,
};

export const AUDIO_SUPPORTED: Record<AnimationModel, boolean> = {
  "kling-2.5-turbo": false,
  "kling-3.0-standard": true,
  "kling-3.0-pro": true,
};

export function calculateCredits(
  model: AnimationModel,
  duration: number,
  audio: boolean,
): number {
  const base = Math.round(BASE_CREDITS_PER_SEC[model] * duration);
  const safeAudio = audio && AUDIO_SUPPORTED[model];
  return safeAudio ? Math.round(base * 1.5) : base;
}

export const MODEL_LABELS: Record<AnimationModel, string> = {
  "kling-2.5-turbo": "Kling 2.5 Fast",
  "kling-3.0-standard": "Kling 3.0",
  "kling-3.0-pro": "Kling 3.0 Pro",
};

function getEndpoint(model: AnimationModel): string {
  return MODEL_ENDPOINTS[model] || MODEL_ENDPOINTS["kling-3.0-standard"];
}

function buildInput(
  imageUrl: string,
  prompt: string,
  model: AnimationModel,
  duration: number,
  audio: boolean,
) {
  if (model === "kling-2.5-turbo") {
    return {
      prompt,
      image_url: imageUrl,
      duration: String(Math.min(duration, 10)) as "5" | "10",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5,
    };
  }

  return {
    prompt,
    start_image_url: imageUrl,
    duration: String(duration),
    generate_audio: audio && AUDIO_SUPPORTED[model],
    negative_prompt: "blur, distort, and low quality",
    cfg_scale: 0.5,
  };
}

export async function submitAnimation(
  imageUrl: string,
  prompt: string,
  model: AnimationModel,
  duration: number = 5,
  audio: boolean = false,
): Promise<{ requestId: string }> {
  const endpoint = getEndpoint(model);
  const input = buildInput(imageUrl, prompt, model, duration, audio);

  const { request_id } = await fal.queue.submit(endpoint, { input });

  return { requestId: request_id };
}

export interface AnimationStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  videoUrl?: string;
  logs?: string[];
}

export async function checkAnimationStatus(
  model: AnimationModel,
  requestId: string,
): Promise<AnimationStatus> {
  const endpoint = getEndpoint(model);

  const status = await fal.queue.status(endpoint, {
    requestId,
    logs: true,
  });

  const rawStatus = status.status as string;

  if (rawStatus === "COMPLETED") {
    const result = await fal.queue.result(endpoint, { requestId });
    const data = result.data as { video?: { url?: string } };
    return {
      status: "COMPLETED",
      videoUrl: data?.video?.url,
    };
  }

  if (rawStatus === "FAILED") {
    return { status: "FAILED" };
  }

  const logs = (status as { logs?: { message: string }[] }).logs;

  return {
    status: rawStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "IN_QUEUE",
    logs: logs?.map((l: { message: string }) => l.message),
  };
}
