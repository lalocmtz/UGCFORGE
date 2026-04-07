import { KieAIClient } from './kieai';
import { buildSeedancePrompt } from './promptEngine';
import type { PipelineStep } from '@/store/ugcStore';

interface PipelineConfig {
  productName: string;
  productImage: File;
  persona: string;
  script: string;
  pipelineMode: 'quick' | 'full';
  apiKey: string;
  onStepUpdate: (id: string, update: Partial<PipelineStep>) => void;
}

export const QUICK_STEPS: PipelineStep[] = [
  { id: 'upload', label: 'Subiendo imagen del producto', status: 'pending' },
  { id: 'preview', label: 'Generando preview rápido', status: 'pending' },
  { id: 'final', label: 'Generando video final UGC', status: 'pending' },
  { id: 'download', label: 'Preparando descarga', status: 'pending' },
];

export const FULL_STEPS: PipelineStep[] = [
  { id: 'upload', label: 'Subiendo archivos', status: 'pending' },
  { id: 'persona', label: 'Creando persona influencer', status: 'pending' },
  { id: 'opening', label: 'Generando video de apertura (15s)', status: 'pending' },
  { id: 'storyboard', label: 'Creando storyboard', status: 'pending' },
  { id: 'scenes', label: 'Generando imágenes de escenas', status: 'pending' },
  { id: 'animate', label: 'Animando escenas con Kling', status: 'pending' },
  { id: 'package', label: 'Empaquetando clips', status: 'pending' },
];

export async function runPipeline(config: PipelineConfig): Promise<{ label: string; url: string }[]> {
  const client = new KieAIClient(config.apiKey);
  const { onStepUpdate } = config;
  const prompt = buildSeedancePrompt(config.productName, config.script, config.persona);

  if (config.pipelineMode === 'quick') {
    return runQuickPipeline(client, config, prompt, onStepUpdate);
  }
  return runFullPipeline(client, config, prompt, onStepUpdate);
}

async function runQuickPipeline(
  client: KieAIClient,
  config: PipelineConfig,
  prompt: string,
  onUpdate: PipelineConfig['onStepUpdate']
) {
  // Step 1: Upload
  onUpdate('upload', { status: 'active' });
  const productUrl = await client.uploadFile(config.productImage);
  onUpdate('upload', { status: 'completed' });

  // Step 2: Preview (fast)
  onUpdate('preview', { status: 'active' });
  const previewTaskId = await client.generateUGCVideoSeedanceFast({
    prompt,
    product_image_url: productUrl,
    duration: 10,
  });
  await client.pollUntilComplete(previewTaskId);
  onUpdate('preview', { status: 'completed' });

  // Step 3: Final video
  onUpdate('final', { status: 'active' });
  const finalTaskId = await client.generateUGCVideoSeedance({
    prompt,
    product_image_url: productUrl,
    duration: 15,
  });
  const result = await client.pollUntilComplete(finalTaskId);
  onUpdate('final', { status: 'completed' });

  // Step 4: Download
  onUpdate('download', { status: 'active' });
  const videoUrl = result.videoUrl!;
  const downloadUrl = await client.getDownloadUrl(videoUrl);
  onUpdate('download', { status: 'completed' });

  return [{ label: 'Video UGC Final (15s)', url: downloadUrl }];
}

async function runFullPipeline(
  client: KieAIClient,
  config: PipelineConfig,
  prompt: string,
  onUpdate: PipelineConfig['onStepUpdate']
) {
  // Step 1: Upload
  onUpdate('upload', { status: 'active' });
  const productUrl = await client.uploadFile(config.productImage);
  onUpdate('upload', { status: 'completed' });

  // Step 2: Generate persona
  onUpdate('persona', { status: 'active' });
  const { PERSONA_PROMPTS } = await import('./promptEngine');
  const personaPrompt = PERSONA_PROMPTS[config.persona] || PERSONA_PROMPTS.everyday_person;
  const personaTaskId = await client.generateImageNanoBanana({ prompt: personaPrompt });
  const personaResult = await client.pollUntilComplete(personaTaskId);
  const personaImageUrl = personaResult.imageUrls?.[0];
  onUpdate('persona', { status: 'completed' });

  // Step 3: Opening video
  onUpdate('opening', { status: 'active' });
  const openingTaskId = await client.generateUGCVideoSeedance({
    prompt,
    image_url: personaImageUrl,
    product_image_url: productUrl,
    duration: 15,
  });
  const openingResult = await client.pollUntilComplete(openingTaskId);
  onUpdate('opening', { status: 'completed' });

  // Step 4: Storyboard
  onUpdate('storyboard', { status: 'active' });
  const { STORYBOARD_SCENES } = await import('./promptEngine');
  onUpdate('storyboard', { status: 'completed' });

  // Step 5: Scene images
  onUpdate('scenes', { status: 'active' });
  const sceneImageUrls: string[] = [];
  for (const scene of STORYBOARD_SCENES) {
    const scenePrompt = `${scene.label}. Product: ${config.productName}. The person must look exactly like the attached reference image. ${personaPrompt}`;
    const taskId = await client.generateImageNanoBanana({
      prompt: scenePrompt,
      reference_image_url: personaImageUrl,
    });
    const result = await client.pollUntilComplete(taskId);
    sceneImageUrls.push(result.imageUrls?.[0] || '');
  }
  onUpdate('scenes', { status: 'completed' });

  // Step 6: Animate scenes
  onUpdate('animate', { status: 'active' });
  const clipUrls: string[] = [];
  for (let i = 0; i < STORYBOARD_SCENES.length; i++) {
    const taskId = await client.animateImageKling({
      prompt: STORYBOARD_SCENES[i].klingPrompt,
      image_url: sceneImageUrls[i],
      duration: 5,
    });
    const result = await client.pollUntilComplete(taskId);
    clipUrls.push(result.videoUrl || '');
  }
  onUpdate('animate', { status: 'completed' });

  // Step 7: Package
  onUpdate('package', { status: 'active' });
  const openingUrl = await client.getDownloadUrl(openingResult.videoUrl!);
  const clips = [
    { label: 'Video de Apertura (15s)', url: openingUrl },
    ...await Promise.all(clipUrls.map(async (url, i) => ({
      label: `Clip B-roll ${i + 1}`,
      url: await client.getDownloadUrl(url),
    }))),
  ];
  onUpdate('package', { status: 'completed' });

  return clips;
}
