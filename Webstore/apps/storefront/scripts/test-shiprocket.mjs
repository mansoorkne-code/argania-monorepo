/* eslint turbo/no-undeclared-env-vars: off -- this diagnostic is run directly with Node, not through a Turbo task. */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, "../../..");
nextEnv.loadEnvConfig(workspaceRoot);

const email = process.env.SHIPROCKET_API_EMAIL?.trim();
const password = process.env.SHIPROCKET_API_PASSWORD?.trim();
const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE?.trim();
const deliveryPostcode =
  process.argv[2]?.trim() ||
  process.env.SHIPROCKET_TEST_DELIVERY_PINCODE?.trim() ||
  "110001";

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

if (!email || !password || !pickupPostcode) {
  fail(
    "Set SHIPROCKET_API_EMAIL, SHIPROCKET_API_PASSWORD, and SHIPROCKET_PICKUP_PINCODE in Webstore/.env.local.",
  );
} else if (!/^\d{6}$/.test(pickupPostcode) || !/^\d{6}$/.test(deliveryPostcode)) {
  fail("Pickup and delivery PIN codes must each contain six digits.");
} else {
  try {
    const authResponse = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const authBody = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || typeof authBody.token !== "string") {
      fail(`Authentication failed (HTTP ${authResponse.status}). Check the API user's email/password.`);
    } else {
      console.log("PASS Shiprocket authentication (token hidden).");

      const params = new URLSearchParams({
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        cod: "0",
        weight: process.env.SHIPROCKET_TEST_WEIGHT_KG?.trim() || "0.500",
        declared_value:
          process.env.SHIPROCKET_TEST_DECLARED_VALUE?.trim() || "1",
        length: process.env.SHIPROCKET_PARCEL_LENGTH_CM?.trim() || "20",
        breadth: process.env.SHIPROCKET_PARCEL_BREADTH_CM?.trim() || "15",
        height: process.env.SHIPROCKET_PARCEL_HEIGHT_CM?.trim() || "10",
      });
      const quoteResponse = await fetch(
        `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`,
        {
          headers: { authorization: `Bearer ${authBody.token}` },
          signal: AbortSignal.timeout(15_000),
        },
      );
      const quoteBody = await quoteResponse.json().catch(() => ({}));
      if (!quoteResponse.ok) {
        fail(`Courier serviceability request failed (HTTP ${quoteResponse.status}).`);
      } else {
        const returnedCouriers = quoteBody.data?.available_courier_companies;
        const courierRows = Array.isArray(returnedCouriers) ? returnedCouriers : [];
        const couriers = courierRows
          .filter((courier) => Number(courier.blocked ?? 0) === 0)
          .map((courier) => ({
            name: courier.courier_name || "Unnamed courier",
            rate: Number(
              (typeof courier.rate === "object"
                ? courier.rate?.rate ?? courier.rate?.total
                : courier.rate) ?? courier.freight_charge,
            ),
            days: courier.estimated_delivery_days,
          }))
          .filter((courier) => Number.isFinite(courier.rate) && courier.rate >= 0)
          .sort((a, b) => a.rate - b.rate);

        if (!couriers.length) {
          const sample = courierRows[0];
          console.log("Shiprocket serviceability response details:", {
            httpStatus: quoteResponse.status,
            apiStatus: quoteBody.status,
            message:
              typeof quoteBody.message === "string" ? quoteBody.message : undefined,
            responseKeys: Object.keys(quoteBody),
            dataKeys:
              quoteBody.data && typeof quoteBody.data === "object"
                ? Object.keys(quoteBody.data)
                : [],
            courierRowsReturned: courierRows.length,
            sampleCourier: sample
              ? {
                  keys: Object.keys(sample),
                  courier_company_id: sample.courier_company_id,
                  courier_name: sample.courier_name,
                  blocked: sample.blocked,
                  rate: sample.rate,
                  freight_charge: sample.freight_charge,
                  estimated_delivery_days: sample.estimated_delivery_days,
                }
              : undefined,
          });
          fail(
            `Authentication passed, but Shiprocket returned no available couriers for ${pickupPostcode} → ${deliveryPostcode}.`,
          );
        } else {
          console.log(
            `PASS Courier serviceability (${pickupPostcode} → ${deliveryPostcode}): ${couriers.length} available. Cheapest: ${couriers[0].name}, ₹${couriers[0].rate.toFixed(2)}${couriers[0].days ? `, ${couriers[0].days} days` : ""}.`,
          );
        }
      }
    }
  } catch (error) {
    fail(
      error instanceof Error
        ? `Request failed (${error.name}). Check network access and try again.`
        : "Request failed. Check network access and try again.",
    );
  }
}
