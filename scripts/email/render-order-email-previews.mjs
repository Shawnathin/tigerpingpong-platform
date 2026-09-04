import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputDirectory = path.resolve(
  repositoryRoot,
  outputArgument?.slice("--output=".length) || "var/email-previews"
);
const templateModule = await import(
  pathToFileURL(path.join(repositoryRoot, "apps/api/dist/order-emails/order-email.templates.js"))
    .href
);

const sampleOrder = {
  currency: "CAD",
  customerEmail: "player@example.com",
  customerName: "Alex",
  items: [
    {
      lineTotalCents: 94900,
      name: "Tiger Portland Indoor PingPong Table",
      quantity: 1
    },
    {
      lineTotalCents: 4999,
      name: "Aqua 4-Pack w/ 3 Balls",
      quantity: 1
    }
  ],
  paidAt: new Date("2026-09-04T18:15:00.000Z"),
  publicReference: "TPP-PREVIEW-001",
  shipmentCarrier: "Canada Post",
  shipmentShippedAt: new Date("2026-09-05T00:00:00.000Z"),
  shipmentTrackingNumber: "PREVIEW-TRACK-001",
  shipmentTrackingUrl:
    "https://www.canadapost-postescanada.ca/track-reperage/en#/details/PREVIEW-TRACK-001",
  shippingName: "Alex",
  stripeAmountTotalCents: 99899,
  totalCents: 99899
};

const previews = [
  ["order-received.html", templateModule.renderOrderReceivedEmail(sampleOrder)],
  ["shipment.html", templateModule.renderShipmentEmail(sampleOrder)],
  ["staff-new-order.html", templateModule.renderStaffNewOrderEmail(sampleOrder)]
];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  previews.map(([filename, rendered]) =>
    writeFile(path.join(outputDirectory, filename), rendered.html, "utf8")
  )
);

console.log(`Rendered ${previews.length} email previews to ${outputDirectory}`);
