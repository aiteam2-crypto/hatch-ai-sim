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

    // Build the three prompts using the provided templates
    const aboutPrompt = `You are a professional biographer tasked with writing a concise, single-paragraph introduction for a detailed character summary. Your output must be professional, focused, and not exceed 75 words.\n\nBased on the following persona summary, write a concise, compelling 'About' section that captures their core identity, primary role, and key life context.\n\nPersona Summary:\n---\n${personaSummary}\n---`;

    const interestsPrompt = `You are a behavioral analyst. Your task is to analyze the following persona summary and identify exactly 4 distinct and highly relevant key interests, hobbies, or professional focus areas.\n\nFormat the response STRICTLY as a JSON array of strings. Do not include any introductory or concluding text.\n\nExample output: ["Interest 1", "Interest 2", "Interest 3", "Interest 4"]\n\nPersona Summary:\n---\n${personaSummary}\n---`;

    const questionsPrompt = `You are an expert interviewer and conversation starter. Based on the background and details in the persona summary below, generate exactly 3 highly specific, insightful, and open-ended questions that would lead to a deep, meaningful conversation with this person.\n\nFormat the response STRICTLY as a numbered list (1., 2., 3.) without any surrounding or concluding text.\n\nPersona Summary:\n---\n${personaSummary}\n---`;

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


