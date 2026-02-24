interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  TURNSTILE_SECRET: string;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json<{ success: boolean }>();
  return data.success;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/signup') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      if (request.method === 'POST') {
        const headers = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        };

        try {
          const body = await request.json<{ email: string; token: string }>();
          const email = body.email?.trim().toLowerCase();
          const token = body.token;

          if (!token) {
            return new Response(JSON.stringify({ error: 'Verification required' }), {
              status: 400,
              headers,
            });
          }

          const ip = request.headers.get('CF-Connecting-IP') || '';
          const valid = await verifyTurnstile(token, env.TURNSTILE_SECRET, ip);

          if (!valid) {
            return new Response(JSON.stringify({ error: 'Verification failed' }), {
              status: 403,
              headers,
            });
          }

          if (!email || !email.includes('@') || email.length > 320) {
            return new Response(JSON.stringify({ error: 'Invalid email' }), {
              status: 400,
              headers,
            });
          }

          await env.DB.prepare(
            'INSERT OR IGNORE INTO signups (email, created_at) VALUES (?, ?)'
          )
            .bind(email, new Date().toISOString())
            .run();

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers,
          });
        } catch {
          return new Response(JSON.stringify({ error: 'Something went wrong' }), {
            status: 500,
            headers,
          });
        }
      }
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
