import assert from "node:assert/strict";
import process from "node:process";
import { registerHooks } from "node:module";
import test from "node:test";

// Node tests run server utilities without the framework's server-only marker.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { getShiprocketQuote } = await import("../lib/checkout/shiprocket.ts");
const input = {
  deliveryPostalCode: "855107",
  weightKg: 0.6,
  declaredValueRupees: 1400,
};

function setup(t, responses) {
  const names = {
    SHIPROCKET_API_EMAIL: "api@example.test",
    SHIPROCKET_API_PASSWORD: "fixture-secret",
    SHIPROCKET_PICKUP_PINCODE: "201303",
  };
  const saved = Object.fromEntries(
    Object.keys(names).map((name) => [name, process.env[name]]),
  );
  Object.assign(process.env, names);
  t.after(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), options });
    const next = responses.shift();
    assert.ok(next, "Unexpected provider request");
    return Response.json(next.body, { status: next.status ?? 200 });
  });
  return calls;
}

test("quotes the requested PIN and authoritative parcel values, excluding blocked couriers", async (t) => {
  const calls = setup(t, [
    { body: { token: "fixture-token" } },
    {
      body: {
        data: {
          available_courier_companies: [
            {
              courier_company_id: 1,
              courier_name: "Blocked",
              blocked: 1,
              rate: "1",
            },
            {
              courier_company_id: 2,
              courier_name: "Surface",
              rate: { id: "quote-1", rate: "164.72" },
              estimated_delivery_days: "6",
            },
            {
              courier_company_id: 3,
              courier_name: "Air",
              freight_charge: "200",
            },
          ],
        },
      },
    },
  ]);
  const result = await getShiprocketQuote(input);
  assert.deepEqual(result, {
    amount: 164.72,
    reference: "quote-1",
    courierId: "2",
    courierName: "Surface",
    estimatedDays: "6",
  });
  const url = new URL(calls[1].url);
  assert.equal(url.searchParams.get("delivery_postcode"), "855107");
  assert.equal(url.searchParams.get("weight"), "0.600");
  assert.equal(url.searchParams.get("declared_value"), "1400");
  assert.equal(calls[1].options.headers.authorization, "Bearer fixture-token");
  for (const call of calls) {
    assert.equal(call.options.headers.accept, "application/json");
    assert.equal(
      call.options.headers["user-agent"],
      "ArganiaStorefront/1.0 (+https://arganiaprofessional.com)",
    );
  }
});

test("authentication failure preserves HTTP status without exposing credentials", async (t) => {
  setup(t, [
    {
      status: 401,
      body: { message: "provider detail that must stay private" },
    },
  ]);
  await assert.rejects(getShiprocketQuote(input), {
    message: "Shiprocket authentication failed (HTTP 401).",
  });
});

test("quote failure distinguishes provider status from missing courier coverage", async (t) => {
  setup(t, [{ body: { token: "fixture-token" } }, { status: 422, body: {} }]);
  await assert.rejects(getShiprocketQuote(input), {
    message: "Shiprocket delivery quote failed (HTTP 422).",
  });
});

test("malformed courier results fail safely", async (t) => {
  setup(t, [
    { body: { token: "fixture-token" } },
    { body: { data: { available_courier_companies: {} } } },
  ]);
  await assert.rejects(getShiprocketQuote(input), {
    message: "Shiprocket returned an invalid courier list.",
  });
});

test("an unavailable destination never gets a fabricated free delivery price", async (t) => {
  setup(t, [
    { body: { token: "fixture-token" } },
    { body: { data: { available_courier_companies: [] } } },
  ]);
  await assert.rejects(getShiprocketQuote(input), {
    message: "Shiprocket returned no eligible delivery rate (0 couriers).",
  });
});
