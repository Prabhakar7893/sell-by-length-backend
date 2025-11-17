export default async function handler(req, res) {
  console.log("🔥 TEST: Webhook endpoint is working!");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const rawBody = await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });

  if (!verifyShopifyWebhook(req, rawBody)) {
    console.log("Webhook signature invalid!");
    return res.status(401).send("Unauthorized");
  }

  console.log("Webhook signature verified.");

  const order = JSON.parse(rawBody);
  return res.status(200).send("Test OK");
}
