import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase client setup ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_ORIGIN = "https://hatch.ai.sim.lovable.app";

serve(async (req) => {
  console.log('insert-persona function called');
  
  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

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

    // Insert into Persona table
    const { data, error } = await supabase
      .from("Persona")
      .insert([{ Persona_Name, LinkedIn_URL, User_Id }])
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Persona inserted successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error('Error in insert-persona:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Content-Type": "application/json",
      },
    });
  }
});
