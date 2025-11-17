export const config = {
  api: {
    bodyParser: false,
  },
};

const crypto = require("crypto");
const fetch = require("node-fetch");

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
  const endpoint = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/inventory_levels/adjust.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inventory_item_id: inventoryItemId,
      location_id: process.env.LOCATION_ID,
      available_adjustment: -metersSold,
    }),
  });

  const data = await response.text();
  console.log("Inventory API Response:", data);
}

export default async function handler(req, res) {
  console.log("Webhook hit!");
  console.log("API hit!");
  return res.status(200).json({ message: "API is working!" });

//   if (req.method !== "POST") {
//     return res.status(405).send("Method Not Allowed");
//   }

//   const rawBody = await new Promise((resolve) => {
//     let data = "";
//     req.on("data", (chunk) => (data += chunk));
//     req.on("end", () => resolve(data));
//   });

//   if (!verifyShopifyWebhook(req, rawBody)) {
//     console.log("Webhook signature invalid!");
//     return res.status(401).send("Unauthorized");
//   }

//   console.log("Webhook signature verified.");

//   const order = JSON.parse(rawBody);

//   try {
//     for (const item of order.line_items) {
//       const meters = parseFloat(item.properties?._custom_length);
//       if (!meters || meters <= 0) continue;

//       console.log("Meters:", meters);
//       console.log("Inventory Item:", item.inventory_item_id);

//       await adjustInventory(item.inventory_item_id, meters);
//     }

//     return res.status(200).send("Inventory updated");
//   } catch (error) {
//     console.error("Inventory update error:", error);
//     return res.status(500).send("Server Error");
//   }
}
