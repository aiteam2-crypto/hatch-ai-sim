import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://hatch-ai-sim.lovable.app";
const N8N_WEBHOOK_URL = "https://jags0101.app.n8n.cloud/webhook-test/f71075d7-ab4f-4242-92ad-a69c78d0f319";

serve(async (req) => {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { Persona_Name, LinkedIn_URL, User_Id } = await req.json();
    console.log('Received data:', { Persona_Name, LinkedIn_URL, User_Id });

    if (!Persona_Name || !LinkedIn_URL || !User_Id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 1️⃣ Insert into Persona table
    const { data, error } = await supabase
      .from("Persona")
      .insert([{ Persona_Name, LinkedIn_URL, User_Id }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Persona inserted successfully:', data);

    // 2️⃣ Trigger n8n webhook
    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Persona_Name,
          LinkedIn_URL,
          Persona_Id: data.Persona_ID,
          User_Id
        }),
      });
      
      if (!webhookResponse.ok) {
        console.error('n8n webhook failed:', await webhookResponse.text());
      } else {
        console.log('n8n webhook triggered successfully');
      }
    } catch (webhookError) {
      console.error('Error triggering n8n webhook:', webhookError);
      // Continue even if webhook fails
    }

    return new Response(
      JSON.stringify({ status: "ok", Persona_Id: data.Persona_ID, data }), 
      { 
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error('Error in insert-persona:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
