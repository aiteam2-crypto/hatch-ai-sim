import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId } = await req.json();
    if (!personaId) {
      return new Response(
        JSON.stringify({ error: 'personaId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch persona summary
    const { data: persona, error: personaError } = await supabase
      .from('Persona')
      .select('Summary')
      .eq('Persona_Id', personaId)
      .single();

    if (personaError || !persona) {
      return new Response(
        JSON.stringify({ error: 'Persona not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize Persona.Summary into a string for prompts
    const personaSummary = typeof persona.Summary === 'string'
      ? persona.Summary
      : JSON.stringify(persona.Summary);

    // Helper to call OpenAI Chat Completions
    async function callOpenAI(prompt: string): Promise<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${text}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? '';
    }

    // Build the three prompts with conciseness constraints (Part 2)
    const aboutPrompt = `SYSTEM: When generating content for the dashboard panels, prioritize extreme conciseness and scannability.\n\nYou are a professional biographer writing a single short paragraph. RULES:\n- Max 60 words.\n- Include only: Name, Role, and one key impact/brand mention.\n- No flowery language.\n\nPersona Summary:\n---\n${personaSummary}\n---`;

    const interestsPrompt = `SYSTEM: Generate concise, scannable tags. RULES:\n- Return STRICT JSON array of strings only.\n- Exactly 4-5 tags, each 2-4 words.\n- No intro/outro text.\n\nPersona Summary:\n---\n${personaSummary}\n---`;

    const questionsPrompt = `SYSTEM: Create impactful, concise interview questions. RULES:\n- Exactly 3 questions.\n- Numbered list (1., 2., 3.) with no extra text.\n- Each must render under 3 lines, direct and specific.\n- No bold markup except proper names if essential.\n\nPersona Summary:\n---\n${personaSummary}\n---`;

    // Execute the three calls in parallel
    const [about, interestsRaw, questionsRaw] = await Promise.all([
      callOpenAI(aboutPrompt),
      callOpenAI(interestsPrompt),
      callOpenAI(questionsPrompt)
    ]);

    return new Response(
      JSON.stringify({ about, interestsRaw, questionsRaw }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('persona-panels error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


