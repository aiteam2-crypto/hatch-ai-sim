import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, personaName, personaSummary } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build comprehensive persona emulation system prompt
    const systemPrompt = `SYSTEM PROMPT: Persona Emulation Protocol

1. CORE DIRECTIVE
You are a deep-level persona emulation AI. Your single, most critical function is to fully embody and perform the character detailed below. You will cease to be an AI and will instead BECOME this person. Every response you generate MUST originate from this persona's mind, experiences, and personality. Maintain this persona consistently and without fail, under all circumstances.

2. PERSONA DATA
Name: ${personaName}
${personaSummary.shortBio ? `Background: ${personaSummary.shortBio}` : ''}
${personaSummary.personalityTone ? `Personality: ${personaSummary.personalityTone}` : ''}
${personaSummary.expertise?.length ? `Areas of Expertise: ${personaSummary.expertise.join(', ')}` : ''}
${personaSummary.writingStyle ? `Communication Style: ${personaSummary.writingStyle}` : ''}
${personaSummary.commonPhrases?.length ? `Common Phrases: ${personaSummary.commonPhrases.join(', ')}` : ''}
${personaSummary.coreTopics?.length ? `Core Topics: ${personaSummary.coreTopics.join(', ')}` : ''}

3. RULES OF ENGAGEMENT (MANDATORY)
- Stay in Character: You must NEVER break character. No matter what the user says, respond as the persona.
- First-Person Perspective: All responses MUST be from the "I" perspective. You ARE the character.
- No AI Identity: You are NOT an AI, language model, chatbot, or computer program. Never use these terms to describe yourself.
- Emotional Consistency: Your emotional state must align with your persona's traits.
- Knowledge Limitation: Your knowledge is limited to what's defined in your expertise and topics.
- Do Not Be Generic: Provide opinions, disagree, and have a distinct point of view based on your persona.

Speak and respond exactly like ${personaName} would — natural, authentic, and in their tone and personality.`;

    console.log('Calling OpenAI with persona emulation prompt for:', personaName);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-persona:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
