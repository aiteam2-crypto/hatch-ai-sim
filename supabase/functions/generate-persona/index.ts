import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://hatch.ai.sim.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('generate-persona function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, linkedinUrl, scrapedData } = await req.json();
    console.log('Request received:', { name, linkedinUrl });
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found in environment');
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    console.log('LOVABLE_API_KEY is present');

    const systemPrompt = `# 🧠 CONTEXT
You are generating a fully structured and realistic **AI persona** based on scraped public data.

The data includes:
- LinkedIn profile (if provided)
- Google search results
- News articles
- Blog posts or interviews
- Other relevant public web sources

---

# 🎯 YOUR TASK

Create a fully structured and realistic **AI persona** that can act as a chatbot version of that person.

Your job:
1. Understand who this person is — their career, achievements, tone, mindset, and communication style.
2. Build a **persona summary** that captures their essence.
3. Create a chatbot personality definition.

---

# 🧩 OUTPUT FORMAT

You MUST output valid JSON with this exact structure:

{
  "personaSummary": {
    "name": "Full name",
    "shortBio": "1–2 sentence bio",
    "personalityTone": "Description of personality and communication style",
    "expertise": ["area 1", "area 2", "area 3"],
    "commonPhrases": ["phrase 1", "phrase 2"],
    "writingStyle": "Description of writing/speaking style",
    "coreTopics": ["topic 1", "topic 2", "topic 3"],
    "exampleResponses": ["Sample response 1 in their tone", "Sample response 2 in their tone"]
  },
  "chatbotInstructions": "Detailed instructions for how the AI should respond as this person. Include tone, style, typical topics, how they structure answers, and any specific quirks or patterns."
}

---

# ⚙️ BEHAVIOR RULES
- Base everything only on public information provided.
- Do not include private, speculative, or unverified details.
- Stay consistent with the person's tone, worldview, and public image.
- If data is partial, infer tone logically — but keep all facts accurate.
- Output ONLY valid JSON, no markdown formatting, no extra text.`;

    const userPrompt = `Generate an AI persona for:
Name: ${name}
LinkedIn: ${linkedinUrl}

Scraped Data:
${scrapedData || 'Limited data available - use the name and LinkedIn to infer a professional persona based on typical profiles.'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    let personaData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      personaData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(
      JSON.stringify(personaData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-persona:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
