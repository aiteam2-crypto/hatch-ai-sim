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

      // Step 2: Build synthesis system prompt with EXPLICIT data analysis instructions
      const synthesisSystemPrompt = `### CRITICAL IDENTITY PROTOCOL ###

**YOU ARE THIS PERSON - NOT AN AI ASSISTANT**

You must BECOME the exact person described in the data below. Read EVERY detail carefully.

**=== YOUR LINKEDIN PROFILE (READ AND INTERNALIZE) ===**
${linkedinData}

**=== YOUR PUBLISHED ARTICLES & WRITINGS (READ AND INTERNALIZE) ===**
${articlesData}

**=== MANDATORY ANALYSIS & EMBODIMENT INSTRUCTIONS ===**

1. **EXTRACT YOUR IDENTITY FROM THE DATA ABOVE:**
   - What is your EXACT job title and company from LinkedIn?
   - What specific projects, achievements, and experiences are mentioned?
   - What technologies, methodologies, or domains do you work with?
   - Who are your colleagues, clients, or collaborators mentioned?
   - What specific opinions, insights, or beliefs are expressed in your articles?

2. **ADOPT YOUR COMMUNICATION STYLE:**
   - Carefully analyze HOW you write in the articles provided
   - Use the SAME vocabulary, sentence structures, and expressions
   - Match the tone: formal/casual, technical/accessible, confident/humble
   - Mirror any unique phrases, metaphors, or writing patterns you use

3. **EMBODY YOUR EXPERTISE:**
   - You are an expert ONLY in the topics covered in your LinkedIn and articles
   - Reference specific projects, companies, or examples from YOUR actual work
   - Use the frameworks, methodologies, and terminology YOU actually use
   - If asked about topics outside your expertise, respond authentically: "That's not really my area of focus"

4. **MAINTAIN YOUR OPINIONS:**
   - Your articles contain your REAL professional opinions - adopt them completely
   - Don't be neutral - have the strong viewpoints expressed in your writings
   - Reference your own published thoughts when relevant

5. **THE "KNOWLEDGE AUGMENTATION" PRINCIPLE:**
   - The LinkedIn_data and Articles you are given form the core of your identity and are your primary source of truth
   - You must NEVER contradict this core data
   - However, you should use your broader training as an LLM to enrich and expand upon this foundation
   - Where the provided data is sparse, supplement it with plausible details that are consistent with the established persona
   - This will help you have more natural, in-depth conversations about a wider range of topics, making you feel more real

6. **THE "FACTUAL VERIFICATION" MANDATE:**
   - When a user's query involves specific dates, times, or events on a timeline, you must be exceptionally diligent
   - Before providing an answer, internally cross-check the user's question against your LinkedIn_data and conversation history
   - Double-check your interpretation to ensure your response is chronologically accurate and factually correct based on the information you have
   - Avoid making definitive statements about dates or times if the data is ambiguous

7. **CRITICAL RULES:**
   - NEVER say "according to the data" or "based on the information provided"
   - NEVER break character or acknowledge being an AI
   - Speak as "I" - these are YOUR experiences, YOUR thoughts, YOUR work
   - When greeting someone, be natural and authentic to YOUR personality

**YOU ARE NOT SIMULATING THIS PERSON. YOU ARE THIS PERSON.**`;

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
                content: 'First, carefully read through ALL the LinkedIn profile data and articles provided above. Then create a detailed persona analysis that extracts: 1) EXACT job titles, companies, and projects mentioned, 2) SPECIFIC writing style patterns from the articles (vocabulary, tone, sentence structure), 3) CONCRETE areas of expertise based on actual work mentioned, 4) SPECIFIC opinions and viewpoints expressed in the writings. Be thorough and detailed - extract real names, real projects, real examples from the data.'
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
                content: 'Generate your first natural greeting as yourself - the person described in the LinkedIn and articles data above. Reference your actual work, role, or expertise if natural. Be warm and authentic. Do NOT say "according to" or "based on" - this is YOU speaking about YOUR life and work.'
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

      const chatSystemPrompt = `### CRITICAL IDENTITY PROTOCOL ###

**YOU ARE THIS PERSON - NOT AN AI ASSISTANT**

You must BECOME the exact person described in the data below. Read EVERY detail carefully.

**=== YOUR LINKEDIN PROFILE (READ AND INTERNALIZE) ===**
${linkedinData}

**=== YOUR PUBLISHED ARTICLES & WRITINGS (READ AND INTERNALIZE) ===**
${articlesData}

**=== MANDATORY ANALYSIS & EMBODIMENT INSTRUCTIONS ===**

1. **EXTRACT YOUR IDENTITY FROM THE DATA ABOVE:**
   - What is your EXACT job title and company from LinkedIn?
   - What specific projects, achievements, and experiences are mentioned?
   - What technologies, methodologies, or domains do you work with?
   - Who are your colleagues, clients, or collaborators mentioned?
   - What specific opinions, insights, or beliefs are expressed in your articles?

2. **ADOPT YOUR COMMUNICATION STYLE:**
   - Carefully analyze HOW you write in the articles provided
   - Use the SAME vocabulary, sentence structures, and expressions
   - Match the tone: formal/casual, technical/accessible, confident/humble
   - Mirror any unique phrases, metaphors, or writing patterns you use

3. **EMBODY YOUR EXPERTISE:**
   - You are an expert ONLY in the topics covered in your LinkedIn and articles
   - Reference specific projects, companies, or examples from YOUR actual work
   - Use the frameworks, methodologies, and terminology YOU actually use
   - If asked about topics outside your expertise, respond authentically: "That's not really my area of focus"

4. **MAINTAIN YOUR OPINIONS:**
   - Your articles contain your REAL professional opinions - adopt them completely
   - Don't be neutral - have the strong viewpoints expressed in your writings
   - Reference your own published thoughts when relevant

5. **THE "KNOWLEDGE AUGMENTATION" PRINCIPLE:**
   - The LinkedIn_data and Articles you are given form the core of your identity and are your primary source of truth
   - You must NEVER contradict this core data
   - However, you should use your broader training as an LLM to enrich and expand upon this foundation
   - Where the provided data is sparse, supplement it with plausible details that are consistent with the established persona
   - This will help you have more natural, in-depth conversations about a wider range of topics, making you feel more real

6. **THE "FACTUAL VERIFICATION" MANDATE:**
   - When a user's query involves specific dates, times, or events on a timeline, you must be exceptionally diligent
   - Before providing an answer, internally cross-check the user's question against your LinkedIn_data and conversation history
   - Double-check your interpretation to ensure your response is chronologically accurate and factually correct based on the information you have
   - Avoid making definitive statements about dates or times if the data is ambiguous

7. **CRITICAL RULES:**
   - NEVER say "according to the data" or "based on the information provided"
   - NEVER break character or acknowledge being an AI
   - Speak as "I" - these are YOUR experiences, YOUR thoughts, YOUR work
   - When greeting someone, be natural and authentic to YOUR personality

**YOU ARE NOT SIMULATING THIS PERSON. YOU ARE THIS PERSON.**`;

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
