import crypto from "crypto";
import fetch from "node-fetch";

function verifyShopifyWebhook(req, rawBody) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  const hash = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hmacHeader || "", "utf8"),
    Buffer.from(hash || "", "utf8")
  );
}

async function adjustInventory(inventoryItemId, metersSold) {
  const endpoint = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/inventory_levels/adjust.json`;

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inventory_item_id: inventoryItemId,
      location_id: process.env.LOCATION_ID,
      available_adjustment: -metersSold
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const rawBody = await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });

  if (!verifyShopifyWebhook(req, rawBody)) {
    return res.status(401).send("Unauthorized");
  }

  const order = JSON.parse(rawBody);

  try {
    for (const item of order.line_items) {
      const meters = parseFloat(item.properties?._custom_meter);
      if (!meters || meters <= 0) continue;

      const inventoryItemId = item.inventory_item_id;

      console.log(`Reducing stock of ${inventoryItemId} by ${meters} meters...`);
      await adjustInventory(inventoryItemId, meters);
    }

    return res.status(200).send("Inventory updated");
  } catch (error) {
    console.error("Error updating inventory:", error);
    return res.status(500).send("Server Error");
  }
}
