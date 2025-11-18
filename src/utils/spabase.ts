import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 新しいAPI Keys方式に対応
const supabasePublishableKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
	throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabasePublishableKey) {
	throw new Error(
		"Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for backward compatibility)",
	);
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		flowType: "pkce",
	},
});
