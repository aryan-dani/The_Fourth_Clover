
// @ts-ignore - Deno remote import, not recognized by TypeScript in Node.js IDEs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ScheduledPost {
    id: string;
    title: string;
    scheduled_at: string;
}

// @ts-ignore - Deno.serve is a Deno runtime API
Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create Supabase client with service role key for admin access
        // @ts-ignore - Deno.env is a Deno runtime API
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        // @ts-ignore - Deno.env is a Deno runtime API
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date().toISOString();

        // Find all posts that are scheduled to be published and the time has passed
        const { data: scheduledPosts, error: fetchError } = await supabase
            .from("posts")
            .select("id, title, scheduled_at")
            .eq("status", "draft")
            .not("scheduled_at", "is", null)
            .lte("scheduled_at", now);

        if (fetchError) {
            throw fetchError;
        }

        if (!scheduledPosts || scheduledPosts.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No posts to publish",
                    published: 0,
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Publish each post
        const publishedPosts: string[] = [];
        const errors: { id: string; error: string }[] = [];

        for (const post of scheduledPosts as ScheduledPost[]) {
            const { error: updateError } = await supabase
                .from("posts")
                .update({
                    status: "published",
                    published_at: now,
                    scheduled_at: null, // Clear the scheduled time
                })
                .eq("id", post.id);

            if (updateError) {
                errors.push({ id: post.id, error: updateError.message });
            } else {
                publishedPosts.push(post.title);
                console.log(`✅ Published: "${post.title}" (ID: ${post.id})`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Published ${publishedPosts.length} posts`,
                published: publishedPosts.length,
                posts: publishedPosts,
                errors: errors.length > 0 ? errors : undefined,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error in publish-scheduled-posts:", err);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
