// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const { url, anonKey } = getSupabaseConfig()
        const supabase = createClient(
            url,
            anonKey
        );

        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(new URL('/dashboard', request.url));
}
