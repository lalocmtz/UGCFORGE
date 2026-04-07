import { KieAIClient } from './kieai';
import { buildSeedancePrompt } from './promptEngine';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineStep } from '@/store/ugcStore';

interface PipelineConfig {
  productName: string;
  productImage: File;
  persona: string;
  script: string;
  pipelineMode: 'quick' | 'full';
  apiKey: string;
  videoStyle?: string;
  hookType?: string;
  keyBenefit?: string;
  cta?: string;
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

// Helper to persist progress without blocking pipeline
async function updateProject(projectId: string | null, update: Partial<{
  current_step: string;
  steps_data: any[];
  product_image_url: string;
  persona_image_url: string;
  scene_clips: any;
  opening_video_url: string;
  status: string;
  error_message: string;
}>) {
  if (!projectId) return;
  try {
    await supabase.from('ugc_projects').update(update as any).eq('id', projectId);
  } catch {
    // Silent — persistence should never block the pipeline
  }
}

async function createProject(config: PipelineConfig): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('ugc_projects')
      .insert({
        user_id: user.id,
        product_name: config.productName || 'Sin nombre',
        product_image_url: '', // Will be updated after upload
        persona_type: config.persona || 'everyday_person',
        video_style: config.videoStyle || 'testimonial',
        hook_type: config.hookType || 'question',
        key_benefit: config.keyBenefit || '',
        cta: config.cta || '',
        script: config.script || '',
        pipeline_mode: config.pipelineMode,
        status: 'running',
        current_step: 'initializing',
        steps_data: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function runPipeline(config: PipelineConfig): Promise<{ label: string; url: string }[]> {
  const client = new KieAIClient(config.apiKey);
  const { onStepUpdate } = config;
  const prompt = buildSeedancePrompt(config.productName, config.script, config.persona);

  const projectId = await createProject(config);

  try {
    if (config.pipelineMode === 'quick') {
      return await runQuickPipeline(client, config, prompt, onStepUpdate, projectId);
    }
    return await runFullPipeline(client, config, prompt, onStepUpdate, projectId);
  } catch (err: any) {
    await updateProject(projectId, {
      status: 'failed',
      error_message: err.message || 'Unknown error',
      current_step: 'failed',
    });
    throw err;
  }
}

async function runQuickPipeline(
  client: KieAIClient,
  config: PipelineConfig,
  prompt: string,
  onUpdate: PipelineConfig['onStepUpdate'],
  projectId: string | null,
) {
  const stepsLog: any[] = [];

  // Step 1: Upload
  onUpdate('upload', { status: 'active' });
  await updateProject(projectId, { current_step: 'upload' });
  const productUrl = await client.uploadFile(config.productImage);
  onUpdate('upload', { status: 'completed' });
  stepsLog.push({ step: 'upload', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'upload_complete', steps_data: stepsLog, product_image_url: productUrl });

  // Step 2: Preview (fast)
  onUpdate('preview', { status: 'active' });
  await updateProject(projectId, { current_step: 'preview' });
  const previewTaskId = await client.generateUGCVideoSeedanceFast({
    prompt,
    product_image_url: productUrl,
    duration: 10,
  });
  await client.pollUntilComplete(previewTaskId);
  onUpdate('preview', { status: 'completed' });
  stepsLog.push({ step: 'preview', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'preview_complete', steps_data: stepsLog });

  // Step 3: Final video
  onUpdate('final', { status: 'active' });
  await updateProject(projectId, { current_step: 'final' });
  const finalTaskId = await client.generateUGCVideoSeedance({
    prompt,
    product_image_url: productUrl,
    duration: 15,
  });
  const result = await client.pollUntilComplete(finalTaskId);
  onUpdate('final', { status: 'completed' });
  stepsLog.push({ step: 'final', status: 'completed', ts: new Date().toISOString() });

  // Step 4: Download
  onUpdate('download', { status: 'active' });
  const videoUrl = result.videoUrl!;
  const downloadUrl = await client.getDownloadUrl(videoUrl);
  onUpdate('download', { status: 'completed' });
  stepsLog.push({ step: 'download', status: 'completed', ts: new Date().toISOString() });

  await updateProject(projectId, {
    status: 'completed',
    current_step: 'done',
    opening_video_url: downloadUrl,
    steps_data: stepsLog,
  });

  return [{ label: 'Video UGC Final (15s)', url: downloadUrl }];
}

async function runFullPipeline(
  client: KieAIClient,
  config: PipelineConfig,
  prompt: string,
  onUpdate: PipelineConfig['onStepUpdate'],
  projectId: string | null,
) {
  const stepsLog: any[] = [];

  // Step 1: Upload
  onUpdate('upload', { status: 'active' });
  await updateProject(projectId, { current_step: 'upload' });
  const productUrl = await client.uploadFile(config.productImage);
  onUpdate('upload', { status: 'completed' });
  stepsLog.push({ step: 'upload', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'upload_complete', steps_data: stepsLog, product_image_url: productUrl });

  // Step 2: Generate persona
  onUpdate('persona', { status: 'active' });
  await updateProject(projectId, { current_step: 'persona' });
  const { PERSONA_PROMPTS } = await import('./promptEngine');
  const personaPrompt = PERSONA_PROMPTS[config.persona] || PERSONA_PROMPTS.everyday_person;
  const personaTaskId = await client.generateImageNanoBanana({ prompt: personaPrompt });
  const personaResult = await client.pollUntilComplete(personaTaskId);
  const personaImageUrl = personaResult.imageUrls?.[0];
  onUpdate('persona', { status: 'completed' });
  stepsLog.push({ step: 'persona', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'persona_complete', steps_data: stepsLog, persona_image_url: personaImageUrl });

  // Step 3: Opening video
  onUpdate('opening', { status: 'active' });
  await updateProject(projectId, { current_step: 'opening' });
  const openingTaskId = await client.generateUGCVideoSeedance({
    prompt,
    image_url: personaImageUrl,
    product_image_url: productUrl,
    duration: 15,
  });
  const openingResult = await client.pollUntilComplete(openingTaskId);
  onUpdate('opening', { status: 'completed' });
  stepsLog.push({ step: 'opening', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'opening_complete', steps_data: stepsLog });

  // Step 4: Storyboard
  onUpdate('storyboard', { status: 'active' });
  await updateProject(projectId, { current_step: 'storyboard' });
  const { STORYBOARD_SCENES } = await import('./promptEngine');
  onUpdate('storyboard', { status: 'completed' });
  stepsLog.push({ step: 'storyboard', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'storyboard_complete', steps_data: stepsLog });

  // Step 5: Scene images
  onUpdate('scenes', { status: 'active' });
  await updateProject(projectId, { current_step: 'scenes' });
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
  stepsLog.push({ step: 'scenes', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'scenes_complete', steps_data: stepsLog, scene_clips: sceneImageUrls });

  // Step 6: Animate scenes
  onUpdate('animate', { status: 'active' });
  await updateProject(projectId, { current_step: 'animate' });
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
  stepsLog.push({ step: 'animate', status: 'completed', ts: new Date().toISOString() });
  await updateProject(projectId, { current_step: 'animate_complete', steps_data: stepsLog });

  // Step 7: Package
  onUpdate('package', { status: 'active' });
  await updateProject(projectId, { current_step: 'package' });
  const openingUrl = await client.getDownloadUrl(openingResult.videoUrl!);
  const clips = [
    { label: 'Video de Apertura (15s)', url: openingUrl },
    ...await Promise.all(clipUrls.map(async (url, i) => ({
      label: `Clip B-roll ${i + 1}`,
      url: await client.getDownloadUrl(url),
    }))),
  ];
  onUpdate('package', { status: 'completed' });
  stepsLog.push({ step: 'package', status: 'completed', ts: new Date().toISOString() });

  await updateProject(projectId, {
    status: 'completed',
    current_step: 'done',
    opening_video_url: openingUrl,
    steps_data: stepsLog,
  });

  return clips;
}
