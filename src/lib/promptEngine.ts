export const PERSONA_PROMPTS: Record<string, string> = {
  latam_woman_25_35: "Hyperrealistic portrait of a young Latin American woman, 26-30 years old, warm olive skin, natural everyday makeup, dark hair, expressive eyes, authentic relatable expression, casual modern clothing, soft natural lighting, looking directly at camera, slight smile, shot on iPhone selfie style, like a real TikTok creator, NOT a model, real person vibe, 9:16 vertical frame",
  latam_man_25_35: "Hyperrealistic portrait of a young Latin American man, 26-32 years old, casual streetwear, slight stubble, natural skin texture, friendly genuine expression, dark hair, direct eye contact, NOT an actor, selfie video creator style, 9:16 vertical",
  woman_skincare: "Hyperrealistic portrait of a woman, 27-34, flawless glowing skin, minimal natural makeup, clean beauty aesthetic, hair tied back loosely, comfortable home clothes, soft bathroom lighting, trustworthy expression, 9:16 vertical",
  fitness_creator: "Hyperrealistic portrait of an athletic person, 24-30, workout clothes, healthy glowing skin, energetic expression, gym or park background blurred, 9:16 vertical",
  everyday_person: "Hyperrealistic portrait of a completely ordinary person, 22-36, casual everyday clothes, home background, genuine authentic expression, natural imperfect skin, NOT a model, REAL person, 9:16 vertical",
};

export const PERSONA_LABELS: Record<string, string> = {
  latam_woman_25_35: 'Mujer Latina',
  latam_man_25_35: 'Hombre Latino',
  woman_skincare: 'Skincare Creator',
  fitness_creator: 'Fitness Creator',
  everyday_person: 'Persona Normal',
};

export const VIDEO_STYLES: Record<string, string> = {
  testimonial: 'Testimonial',
  tutorial: 'Tutorial',
  unboxing: 'Unboxing',
  problem_solution: 'Problema/Solución',
  review: 'Review',
  asmr: 'ASMR',
};

export const HOOK_TYPES: Record<string, string> = {
  question: 'Pregunta',
  bold_statement: 'Bold Statement',
  number: 'Número',
  contrast: 'Contraste',
  pain_point: 'Pain Point',
};

function generateHook(type: string, productName: string): string {
  const hooks: Record<string, string> = {
    question: `¿Ya conoces ${productName}?`,
    bold_statement: `${productName} cambió completamente mi vida`,
    number: `3 cosas que nadie te dice sobre ${productName}`,
    contrast: `Nadie me había dicho esto sobre ${productName}`,
    pain_point: `Si tienes problemas con esto, escúchame`,
  };
  return hooks[type] || hooks.question;
}

export function generateScript(
  productName: string,
  keyBenefit: string,
  cta: string,
  videoStyle: string,
  hookType: string,
  productDescription?: string
): string {
  const hook = generateHook(hookType, productName);
  const desc = productDescription || productName;
  const scripts: Record<string, string> = {
    testimonial: `${hook}. Yo llevaba tiempo buscando algo que funcionara. Cuando probé ${productName}, la diferencia fue inmediata. ${keyBenefit}. En serio, no esperaba resultados tan rápido. ${cta}.`,
    tutorial: `${hook}. Mira qué fácil es. Solo tienes que usar ${desc}. El resultado: ${keyBenefit}. Súper sencillo. ${cta}.`,
    unboxing: `${hook}. Acabo de recibirlo. Mira — ${desc}. Ya lo usé y ${keyBenefit}. Me encantó. ${cta}.`,
    problem_solution: `${hook}. Por meses busqué solución, hasta que encontré ${productName}. ${keyBenefit}. Exactamente lo que necesitaba. ${cta}.`,
    review: `${hook}. Te voy a ser honesta: ${productName} es de lo mejor que he probado. ${keyBenefit}. Precio justo, resultados reales. ${cta}.`,
    asmr: `${productName}. Mira este detalle. Siente la textura. ${keyBenefit}. Simplemente increíble.`,
  };
  return scripts[videoStyle] || scripts.testimonial;
}

export function buildSeedancePrompt(
  productName: string,
  script: string,
  personaType: string
): string {
  const personaDesc = PERSONA_PROMPTS[personaType] || PERSONA_PROMPTS.everyday_person;
  return `Reference: @image1 (product image), @image2 (persona reference)
Subject: ${personaDesc}
Action: The creator is filming a casual selfie-style video talking directly to camera while naturally holding the product shown in @image1.
Movement: Slight natural body movement, occasional hand gestures. Camera mostly still with handheld feel.
Setting: Cozy indoor environment, slightly out-of-focus background.
Tone: Authentic, relatable, NOT polished or ad-like.
Product interaction: Holding ${productName} with label visible.
Spoken script (lip sync exactly to this): "${script}"
Style: iPhone selfie quality, warm slightly desaturated, 9:16 vertical, NOT studio quality, real UGC aesthetic.`;
}

export const STORYBOARD_SCENES = [
  { label: 'Close-up del producto', klingPrompt: 'Slow push-in on product, slight tilt reveal' },
  { label: 'Persona usando el producto', klingPrompt: 'Natural hand movement, slight camera zoom' },
  { label: 'Reacción positiva', klingPrompt: 'Person reacting positively, slight camera adjustment' },
  { label: 'CTA con producto', klingPrompt: 'Slight push-in, speaking movement, showing product' },
];
