import "server-only";

export interface ShippingQuote {
  amount: number;
  reference: string | null;
  courierId: string;
  courierName: string;
  estimatedDays: string | null;
}

interface ShiprocketCourier {
  blocked?: number | string;
  courier_company_id?: number | string;
  courier_name?: string;
  estimated_delivery_days?: string | number;
  rate?:
    | number
    | string
    | { id?: number | string; rate?: number | string; total?: number | string };
  freight_charge?: number | string;
}

function getCourierRate(courier: ShiprocketCourier) {
  const rate = courier.rate;
  const nestedRate =
    rate && typeof rate === "object" ? rate.rate ?? rate.total : rate;
  return Number(nestedRate ?? courier.freight_charge);
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function shiprocketToken() {
  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: requiredEnv("SHIPROCKET_API_EMAIL"),
      password: requiredEnv("SHIPROCKET_API_PASSWORD"),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("Shiprocket authentication failed.");

  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("Shiprocket did not return an API token.");
  return body.token;
}

export async function getShiprocketQuote(input: {
  deliveryPostalCode: string;
  weightKg: number;
  declaredValueRupees: number;
}): Promise<ShippingQuote> {
  const pickupPostcode = requiredEnv("SHIPROCKET_PICKUP_PINCODE");
  const token = await shiprocketToken();
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: input.deliveryPostalCode,
    cod: "0",
    weight: input.weightKg.toFixed(3),
    declared_value: String(Math.max(1, Math.ceil(input.declaredValueRupees))),
    length: process.env.SHIPROCKET_PARCEL_LENGTH_CM || "20",
    breadth: process.env.SHIPROCKET_PARCEL_BREADTH_CM || "15",
    height: process.env.SHIPROCKET_PARCEL_HEIGHT_CM || "10",
  });
  const response = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`,
    {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error("Shiprocket could not quote delivery for this address.");

  const body = (await response.json()) as {
    data?: { available_courier_companies?: ShiprocketCourier[] };
  };
  const candidates = (body.data?.available_courier_companies ?? [])
    .filter((courier) => Number(courier.blocked ?? 0) === 0 && courier.courier_company_id)
    .map((courier) => ({
      courier,
      amount: getCourierRate(courier),
    }))
    .filter((candidate) => Number.isFinite(candidate.amount) && candidate.amount >= 0)
    .sort((a, b) => a.amount - b.amount);

  const cheapest = candidates[0];
  if (!cheapest) throw new Error("Shiprocket does not serve this delivery postcode.");

  return {
    amount: Math.round(cheapest.amount * 100) / 100,
    reference:
      cheapest.courier.rate && typeof cheapest.courier.rate === "object" &&
      cheapest.courier.rate.id
        ? String(cheapest.courier.rate.id)
        : null,
    courierId: String(cheapest.courier.courier_company_id),
    courierName: cheapest.courier.courier_name || "Shiprocket courier",
    estimatedDays: cheapest.courier.estimated_delivery_days
      ? String(cheapest.courier.estimated_delivery_days)
      : null,
  };
}

export function getParcelWeight(variantRows: readonly {
  quantity: number;
  variant: { weight_kg: number | string };
}[]) {
  const productWeight = variantRows.reduce(
    (total, row) => total + Number(row.variant.weight_kg) * row.quantity,
    0,
  );
  const packagingWeight = Number(process.env.SHIPROCKET_PACKAGING_WEIGHT_KG || "0.100");
  const total = productWeight + packagingWeight;
  if (!Number.isFinite(total) || total <= 0) throw new Error("Parcel weight is invalid.");
  return Math.max(0.5, total);
}
