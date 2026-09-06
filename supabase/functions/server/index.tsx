import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-cfaf14f7/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Midtrans: Create BCA Virtual Account Charge ─────────────────────────────
// Calls Midtrans Charge API server-side to generate a real VA number
app.post("/make-server-cfaf14f7/midtrans/create-va", async (c) => {
  try {
    const body = await c.req.json();
    const { order_id, gross_amount, customer_name, customer_email } = body;

    if (!order_id || !gross_amount) {
      return c.json({ error: "order_id and gross_amount are required" }, 400);
    }

    // Read server key from env
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-vEMbsCww0P09UoUR3HE5olTR";
    const encodedKey = btoa(`${serverKey}:`);

    const chargePayload = {
      payment_type: "bank_transfer",
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount),
      },
      bank_transfer: {
        bank: "bca",
      },
      customer_details: {
        first_name: customer_name || "UMKM",
        email: customer_email || "umkm@bzr.app",
      },
    };

    // Call Midtrans Charge API (Sandbox)
    const response = await fetch("https://api.sandbox.midtrans.com/v2/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${encodedKey}`,
      },
      body: JSON.stringify(chargePayload),
    });

    const data = await response.json();

    if (!response.ok || (data.status_code && data.status_code !== "201")) {
      console.error("Midtrans Charge Error:", data);
      return c.json({
        error: data.status_message || "Midtrans charge failed",
        details: data,
      }, 400);
    }

    // Extract VA number from response
    const vaNumbers = data.va_numbers || [];
    const bcaVA = vaNumbers.find((v: any) => v.bank === "bca") || vaNumbers[0];

    return c.json({
      success: true,
      order_id: data.order_id,
      transaction_id: data.transaction_id,
      transaction_status: data.transaction_status,
      va_number: bcaVA?.va_number || null,
      bank: bcaVA?.bank || "bca",
      gross_amount: data.gross_amount,
      expiry_time: data.expiry_time,
      raw: data,
    });
  } catch (e: any) {
    console.error("Midtrans create-va error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// ─── Midtrans: Check Transaction Status ───────────────────────────────────────
app.get("/make-server-cfaf14f7/midtrans/status/:order_id", async (c) => {
  try {
    const orderId = c.req.param("order_id");
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-vEMbsCww0P09UoUR3HE5olTR";
    const encodedKey = btoa(`${serverKey}:`);

    const response = await fetch(
      `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`,
      {
        headers: {
          "Authorization": `Basic ${encodedKey}`,
          "Accept": "application/json",
        },
      }
    );

    const data = await response.json();

    return c.json({
      success: true,
      order_id: data.order_id,
      transaction_status: data.transaction_status,
      payment_type: data.payment_type,
      gross_amount: data.gross_amount,
      va_numbers: data.va_numbers || [],
      raw: data,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── Midtrans: Create QRIS Charge ─────────────────────────────────────────────
app.post("/make-server-cfaf14f7/midtrans/create-qris", async (c) => {
  try {
    const body = await c.req.json();
    const { order_id, gross_amount, customer_name, customer_email } = body;

    if (!order_id || !gross_amount) {
      return c.json({ error: "order_id and gross_amount are required" }, 400);
    }

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-vEMbsCww0P09UoUR3HE5olTR";
    const encodedKey = btoa(`${serverKey}:`);

    const chargePayload = {
      payment_type: "qris",
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount),
      },
      customer_details: {
        first_name: customer_name || "UMKM",
        email: customer_email || "umkm@bzr.app",
      },
      qris: {
        acquirer: "gopay",
      },
    };

    const response = await fetch("https://api.sandbox.midtrans.com/v2/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${encodedKey}`,
      },
      body: JSON.stringify(chargePayload),
    });

    const data = await response.json();

    if (!response.ok || (data.status_code && data.status_code !== "201")) {
      console.error("Midtrans QRIS Charge Error:", data);
      return c.json({
        error: data.status_message || "Midtrans QRIS charge failed",
        details: data,
      }, 400);
    }

    return c.json({
      success: true,
      order_id: data.order_id,
      transaction_id: data.transaction_id,
      transaction_status: data.transaction_status,
      qr_string: data.qr_string || null,
      actions: data.actions || [],
      gross_amount: data.gross_amount,
      expiry_time: data.expiry_time,
      raw: data,
    });
  } catch (e: any) {
    console.error("Midtrans create-qris error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// ─── Midtrans: Create Snap Token ──────────────────────────────────────────────
app.post("/make-server-cfaf14f7/midtrans/create-snap", async (c) => {
  try {
    const body = await c.req.json();
    const { order_id, gross_amount, customer_name, customer_email } = body;

    if (!order_id || !gross_amount) {
      return c.json({ error: "order_id and gross_amount are required" }, 400);
    }

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "Mid-server-vEMbsCww0P09UoUR3HE5olTR";
    const encodedKey = btoa(`${serverKey}:`);

    const snapPayload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount),
      },
      customer_details: {
        first_name: customer_name || "UMKM",
        email: customer_email || "umkm@bzr.app",
      },
      enabled_payments: ["qris", "gopay", "shopeepay", "other_qris"],
    };

    // Call Midtrans Snap Transactions API (Sandbox)
    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${encodedKey}`,
      },
      body: JSON.stringify(snapPayload),
    });

    const data = await response.json();
    console.log("Midtrans Snap response:", JSON.stringify(data));

    if (!data.token) {
      return c.json({
        error: data.error_messages?.join(", ") || data.status_message || "Gagal membuat Snap token",
        details: data,
      }, 400);
    }

    return c.json({
      success: true,
      token: data.token,
      redirect_url: data.redirect_url || "",
    });
  } catch (e: any) {
    console.error("Midtrans create-snap error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Setup endpoint — run once to create tables
app.post("/make-server-cfaf14f7/setup-db", async (c) => {
  const sql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      icon text,
      created_at timestamptz DEFAULT now()
    );

    -- Profiles (extends auth.users)
    CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'umkm',
      full_name text,
      business_name text,
      phone text,
      city text,
      avatar_url text,
      bio text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Events
    CREATE TABLE IF NOT EXISTS events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      host_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
      title text NOT NULL,
      description text,
      cover_image text,
      city text,
      location text,
      address text,
      start_date date NOT NULL,
      end_date date NOT NULL,
      start_time time,
      end_time time,
      total_slots int DEFAULT 0,
      available_slots int DEFAULT 0,
      price numeric DEFAULT 0,
      status text DEFAULT 'pending',
      admin_notes text,
      tags text[],
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Registrations
    CREATE TABLE IF NOT EXISTS registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid REFERENCES events(id) ON DELETE CASCADE,
      umkm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      business_name text,
      phone text,
      product_type text,
      notes text,
      status text DEFAULT 'pending',
      host_notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(event_id, umkm_id)
    );
  `;

  try {
    const { createClient } = await import("npm:@supabase/supabase-js");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: "Database setup complete!" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);