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

export const MODEL_CREDITS: Record<AnimationModel, number> = {
  "kling-2.5-turbo": 5,
  "kling-3.0-standard": 8,
  "kling-3.0-pro": 12,
};

export const MODEL_LABELS: Record<AnimationModel, string> = {
  "kling-2.5-turbo": "Kling 2.5 Fast",
  "kling-3.0-standard": "Kling 3.0",
  "kling-3.0-pro": "Kling 3.0 Pro",
};

function getEndpoint(model: AnimationModel): string {
  return MODEL_ENDPOINTS[model] || MODEL_ENDPOINTS["kling-3.0-standard"];
}

function buildInput(imageUrl: string, prompt: string, model: AnimationModel, duration: number) {
  if (model === "kling-2.5-turbo") {
    return {
      prompt,
      image_url: imageUrl,
      duration: String(duration) as "5" | "10",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5,
    };
  }

  return {
    prompt,
    start_image_url: imageUrl,
    duration: String(duration),
    generate_audio: false,
    negative_prompt: "blur, distort, and low quality",
    cfg_scale: 0.5,
  };
}

export async function submitAnimation(
  imageUrl: string,
  prompt: string,
  model: AnimationModel,
  duration: number = 5,
): Promise<{ requestId: string }> {
  const endpoint = getEndpoint(model);
  const input = buildInput(imageUrl, prompt, model, duration);

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
