interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
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
          const body = await request.json<{ email: string }>();
          const email = body.email?.trim().toLowerCase();

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
