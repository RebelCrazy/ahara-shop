/**
 * DARK REBEL SHOP — Cloudflare Pages Function
 * API para procesamiento de pagos con Stripe
 *
 * Variables de entorno (Cloudflare Dashboard → Pages → ahara-shop → Settings → Environment variables):
 *   STRIPE_SECRET_KEY      = sk_live_... (o sk_test_... para pruebas)
 *   STRIPE_WEBHOOK_SECRET  = whsec_...
 */

// CORS headers comunes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env } = context;

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // ── POST /api/create-payment-intent ──────────────────
    if (path === '/api/create-payment-intent' && request.method === 'POST') {
      const body = await request.json();
      const { amount, currency = 'mxn', metadata = {} } = body;

      if (!amount || amount < 50) {
        return jsonError('Importe inválido', 400);
      }

      if (!env.STRIPE_SECRET_KEY) {
        return jsonError('STRIPE_SECRET_KEY no configurada', 500);
      }

      const pi = await stripeRequest(env.STRIPE_SECRET_KEY, 'payment_intents', {
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata
      });

      return json({ clientSecret: pi.client_secret });
    }

    // ── POST /api/webhook (Stripe webhooks) ──────────────
    if (path === '/api/webhook' && request.method === 'POST') {
      const sig = request.headers.get('stripe-signature');
      const rawBody = await request.text();

      if (env.STRIPE_WEBHOOK_SECRET) {
        const isValid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
        if (!isValid) return jsonError('Firma inválida', 400);
      }

      const event = JSON.parse(rawBody);

      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Pago exitoso:', event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
          console.log('Pago fallido:', event.data.object.id);
          break;
      }

      return json({ received: true });
    }

    // ── GET /api/health ──────────────────────────────────
    if (path === '/api/health') {
      return json({ status: 'ok', time: new Date().toISOString() });
    }

    return jsonError('Ruta no encontrada', 404);

  } catch (err) {
    console.error(err);
    return jsonError('Error interno del servidor: ' + err.message, 500);
  }
}

// ── Stripe API helper ─────────────────────────────────────────
async function stripeRequest(secretKey, endpoint, data) {
  const body = Object.entries(data)
    .flatMap(([k, v]) => {
      if (typeof v === 'object' && v !== null) {
        return Object.entries(v).map(([sk, sv]) => 
          `${encodeURIComponent(k)}[${encodeURIComponent(sk)}]=${encodeURIComponent(sv)}`
        );
      }
      return [`${encodeURIComponent(k)}=${encodeURIComponent(v)}`];
    })
    .join('&');

  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body
  });

  const result = await res.json();
  if (result.error) throw new Error(result.error.message);
  return result;
}

// ── Stripe webhook signature verification ───────────────────
async function verifyStripeSignature(payload, sigHeader, secret) {
  try {
    const timestamp = sigHeader.match(/t=(\d+)/)?.[1];
    const signature = sigHeader.match(/v1=([a-f0-9]+)/)?.[1];
    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
    return computed === signature;
  } catch { return false; }
}

// ── Response helpers ─────────────────────────────────────────
function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
function jsonError(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
