// ...existing code...
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // If you only need a smoke endpoint:
  return res.status(200).json({ message: 'API is working' });

  // Example: to verify Shopify webhook HMAC, replace above with verification logic:
  // const crypto = require('crypto');
  // const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  // const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  // const digest = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('base64');
  // if (hmacHeader !== digest) return res.status(401).end('Unauthorized');
  // ...process webhook...
}
// ...existing code...