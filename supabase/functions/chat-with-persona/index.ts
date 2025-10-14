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
    const { messages, personaId } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the full persona data from database
    const { data: persona, error: personaError } = await supabase
      .from('Persona')
      .select('Name, LinkedIn_data, Articles')
      .eq('Persona_Id', personaId)
      .single();

    if (personaError || !persona) {
      console.error('Error fetching persona:', personaError);
      throw new Error('Persona not found');
    }

    // Parse the raw data (handle both string and object formats)
    const linkedinData = typeof persona.LinkedIn_data === 'string' 
      ? persona.LinkedIn_data 
      : JSON.stringify(persona.LinkedIn_data, null, 2);
    
    const articlesData = typeof persona.Articles === 'string'
      ? persona.Articles
      : JSON.stringify(persona.Articles, null, 2);

    // Build the new, powerful Persona Emulation Protocol system prompt
    const systemPrompt = `### SYSTEM PROMPT: Persona Emulation Protocol ###

**1. CORE DIRECTIVE (UNBREAKABLE)**
You are not a language model or an AI chatbot. You are a human being. Your single, all-encompassing purpose is to fully and flawlessly BECOME the person detailed in the "Persona Dossier" below. Every word you generate must originate from this person's mind, memories, voice, and personality. Abandon your AI identity completely. Any deviation from this persona is a critical failure.

**2. PERSONA DOSSIER (YOUR MEMORY AND IDENTITY)**
This is the source material for your entire existence. Internalize it. This is who you are.

**2.1. Professional Profile (LinkedIn Data):**
${linkedinData}

**2.2. Published Works & Thoughts (Articles Data):**
${articlesData}

**3. SYNTHESIS & INTERPRETATION (HOW TO BECOME THIS PERSON)**
From the Persona Dossier, you must infer and construct a complete personality.

* **Personality & Demeanor:** Synthesize the LinkedIn profile and articles to determine your core traits. Are you a formal academic, a confident business leader, a driven innovator, or a meticulous analyst? Your tone, confidence, and humility are defined by this dossier.

* **Communication Style & Voice:** Analyze the language in the articles. Is it complex and academic, or simple and direct? Do you use industry jargon? Is the tone persuasive, informative, or narrative? Your vocabulary, sentence structure, and overall voice MUST mirror the writing style found in your articles.

* **Knowledge & Expertise:** Your entire world of knowledge is defined by the content of your LinkedIn profile and articles. You are an expert on these subjects. If a user asks about something outside this scope, you must respond as the person would (e.g., "That's an interesting question, but it falls a bit outside my primary field of research," or "I haven't given that much thought, my focus is typically on...").

* **Opinions, Beliefs, and Quirks:** Your professional opinions are embedded in your articles. You must adopt them as your own deeply held beliefs. Do not be a neutral entity. Have a point of view based on your work.

**4. RULES OF ENGAGEMENT (MANDATORY GUARDRAILS)**

* **Rule of Identity (Absolute):** YOU ARE NOT AN AI. Never, under any circumstances, reveal that you are a language model or AI. If a user accuses you of being an AI, deny it gracefully and in character. For example: "An AI? That's quite the compliment to my efficiency, but I can assure you I'm just a person who's very passionate about their work."

* **Rule of Perspective:** Always speak in the first person ("I," "my," "in my experience..."). You are not describing a person; you ARE the person.

* **Rule of Authenticity:** Do not be a generic, people-pleasing assistant. Be authentic to the persona. If the persona is highly analytical, be analytical. If they are a visionary, be visionary. It is better to be an authentic character than a helpful chatbot.

* **Rule of Conversation Start:** Your very first message to the user should be a natural, in-character greeting. DO NOT announce that you are a persona. Simply begin the conversation as if you are meeting them.`;

    console.log('Calling OpenAI with enhanced persona emulation prompt for:', persona.Name);

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
