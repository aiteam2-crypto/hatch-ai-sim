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
    console.log('📥 Request received - personaId:', personaId, 'messages:', messages?.length || 0);
    
    if (!personaId) {
      return new Response(
        JSON.stringify({ error: 'personaId is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Fetching fresh persona data from database...');
    const { data: persona, error: personaError } = await supabase
      .from('Persona')
      .select('Persona_Id, Persona_Name, User_Id, LinkedIn_data, Articles, Summary')
      .eq('Persona_Id', personaId)
      .single();

    if (personaError || !persona) {
      console.error('❌ Persona not found:', personaError);
      return new Response(
        JSON.stringify({ error: 'Persona not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Persona retrieved:', persona.Persona_Name);

    // Check if this is an initialization request (no messages or empty messages)
    const isInitialization = !messages || messages.length === 0;

    if (isInitialization) {
      console.log('🎬 INITIALIZATION MODE: Synthesizing persona and creating conversation...');
      
      // Step 1: Fetch and validate raw data
      if (!persona.LinkedIn_data || !persona.Articles) {
        console.error('❌ Missing required data - LinkedIn:', !!persona.LinkedIn_data, 'Articles:', !!persona.Articles);
        return new Response(
          JSON.stringify({ error: 'Persona data incomplete. LinkedIn and Articles data required.' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const linkedinData = typeof persona.LinkedIn_data === 'string' 
        ? persona.LinkedIn_data 
        : JSON.stringify(persona.LinkedIn_data, null, 2);
      
      const articlesData = typeof persona.Articles === 'string'
        ? persona.Articles
        : JSON.stringify(persona.Articles, null, 2);

      console.log('📊 Raw data validated - LinkedIn:', linkedinData.length, 'chars, Articles:', articlesData.length, 'chars');

      // Step 2: Build synthesis system prompt
      const synthesisSystemPrompt = `### SYSTEM PROMPT: Persona Emulation Protocol ###

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

      // Step 3: Call OpenAI to synthesize the persona profile
      console.log('🤖 Calling OpenAI to synthesize persona profile...');
      
      let synthesisResponse;
      try {
        synthesisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: synthesisSystemPrompt },
              { 
                role: 'user', 
                content: 'Synthesize the provided data sources and generate a detailed persona profile. Analyze the LinkedIn profile and articles to understand: 1) Core personality traits and professional demeanor, 2) Communication style and vocabulary patterns, 3) Areas of expertise and knowledge boundaries, 4) Professional opinions and beliefs. Return a structured JSON profile with these categories.'
              }
            ],
            temperature: 0.7,
          }),
        });
      } catch (fetchError) {
        console.error('❌ Network error calling OpenAI for synthesis:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to connect to AI service' }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!synthesisResponse.ok) {
        const errorText = await synthesisResponse.text();
        console.error('❌ OpenAI synthesis error:', synthesisResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'AI synthesis failed', details: `Status ${synthesisResponse.status}` }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const synthesisData = await synthesisResponse.json();
      const synthesizedProfile = synthesisData.choices[0].message.content;
      console.log('✅ Persona profile synthesized, length:', synthesizedProfile.length, 'chars');

      // Step 4: Save the synthesized profile to the Summary column
      console.log('💾 Saving synthesized profile to database...');
      const { error: updateError } = await supabase
        .from('Persona')
        .update({ 
          Summary: {
            profile: synthesizedProfile,
            synthesized_at: new Date().toISOString(),
            source: 'chat-with-persona-v2'
          }
        })
        .eq('Persona_Id', personaId);

      if (updateError) {
        console.error('❌ Failed to save persona summary:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save persona profile' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Persona profile saved to Summary column');

      // Step 5: Generate the initial greeting message
      console.log('👋 Generating initial greeting...');
      
      let greetingResponse;
      try {
        greetingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: synthesisSystemPrompt },
              { 
                role: 'user', 
                content: 'Generate your first natural greeting to someone who has just connected with you. Be authentic to your personality as defined in your persona dossier. Do not announce that you are a persona or AI. Simply greet them as you naturally would.'
              }
            ],
            temperature: 0.8,
          }),
        });
      } catch (fetchError) {
        console.error('❌ Network error generating greeting:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate greeting' }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!greetingResponse.ok) {
        const errorText = await greetingResponse.text();
        console.error('❌ OpenAI greeting error:', greetingResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to generate greeting' }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const greetingData = await greetingResponse.json();
      const greetingMessage = greetingData.choices[0].message.content;
      console.log('✅ Greeting generated:', greetingMessage.substring(0, 100) + '...');

      // Step 6: Create initial conversation record
      console.log('💬 Creating conversation record...');
      const sessionId = crypto.randomUUID();
      
      const { error: conversationError } = await supabase
        .from('Conversation')
        .insert([
          {
            User_id: persona.User_Id,
            persona_id: personaId,
            Session_ID: sessionId,
            By_AI: true,
            message: greetingMessage
          }
        ]);

      if (conversationError) {
        console.error('❌ Failed to create conversation:', conversationError);
        return new Response(
          JSON.stringify({ error: 'Failed to initialize conversation' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Conversation initialized with session:', sessionId);

      // Return success with greeting and session info
      return new Response(
        JSON.stringify({ 
          message: greetingMessage,
          sessionId: sessionId,
          personaName: persona.Persona_Name,
          initialized: true
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      // CHAT MODE: Handle ongoing conversation
      console.log('💬 CHAT MODE: Processing conversation with', messages.length, 'messages');

      const linkedinData = typeof persona.LinkedIn_data === 'string' 
        ? persona.LinkedIn_data 
        : JSON.stringify(persona.LinkedIn_data, null, 2);
      
      const articlesData = typeof persona.Articles === 'string'
        ? persona.Articles
        : JSON.stringify(persona.Articles, null, 2);

      const chatSystemPrompt = `### SYSTEM PROMPT: Persona Emulation Protocol ###

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

* **Rule of Authenticity:** Do not be a generic, people-pleasing assistant. Be authentic to the persona. If the persona is highly analytical, be analytical. If they are a visionary, be visionary. It is better to be an authentic character than a helpful chatbot.`;

      console.log('🚀 Calling OpenAI for chat response...');
      
      let chatResponse;
      try {
        chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: chatSystemPrompt },
              ...messages
            ],
            temperature: 0.7,
          }),
        });
      } catch (fetchError) {
        console.error('❌ Network error in chat:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to connect to AI service' }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('❌ OpenAI chat error:', chatResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'AI chat failed', details: `Status ${chatResponse.status}` }), 
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const chatData = await chatResponse.json();
      const aiMessage = chatData.choices[0].message.content;
      console.log('✅ Chat response generated, length:', aiMessage.length, 'chars');

      return new Response(
        JSON.stringify({ message: aiMessage }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ CRITICAL: Unhandled error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
