import { supabase } from './supabase'
import type { Payment, PaymentStatus } from './types'

// Midtrans client key (untuk Snap.js di browser)
const CLIENT_KEY =
  import.meta.env.VITE_MIDTRANS_CLIENT_KEY ||
  'Mid-client-8Ca3Y3ldEF3mpM4m'

// Supabase project ref — ambil dari VITE_SUPABASE_URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || ''

// Base URL Supabase Edge Function (sudah di-deploy, tidak ada CORS karena server-side)
const EDGE_FN_BASE = `${SUPABASE_URL}/functions/v1/server/make-server-cfaf14f7`

const SNAP_SCRIPT_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'
export const MIDTRANS_SIMULATOR_URL = 'https://simulator.sandbox.midtrans.com/'

let snapLoaded = false

export function getMidtransClientKey(): string {
  return CLIENT_KEY
}

export function loadSnapScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (snapLoaded || (window as any).snap) {
      snapLoaded = true
      return resolve(true)
    }
    const existingScript = document.getElementById('midtrans-snap-script')
    if (existingScript) { snapLoaded = true; return resolve(true) }
    const script = document.createElement('script')
    script.id = 'midtrans-snap-script'
    script.src = SNAP_SCRIPT_URL
    script.setAttribute('data-client-key', CLIENT_KEY)
    script.async = true
    script.onload = () => { snapLoaded = true; resolve(true) }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Cache VA number agar tidak double-charge ke Midtrans */
function cacheVANumber(orderId: string, vaData: { va_number: string; expiry_time?: string }) {
  try {
    localStorage.setItem(`bzr_va_${orderId}`, JSON.stringify({ ...vaData, cached_at: Date.now() }))
  } catch (_) {}
}

function getCachedVANumber(orderId: string): { va_number: string; expiry_time?: string } | null {
  try {
    const item = localStorage.getItem(`bzr_va_${orderId}`)
    if (!item) return null
    const parsed = JSON.parse(item)
    const MAX_AGE = 23 * 60 * 60 * 1000
    if (Date.now() - parsed.cached_at > MAX_AGE) {
      localStorage.removeItem(`bzr_va_${orderId}`)
      return null
    }
    return parsed
  } catch (_) { return null }
}

function cacheQRIS(baseOrderId: string, data: { qris_order_id: string; qr_string?: string; actions?: any[] }) {
  try {
    localStorage.setItem(`bzr_qris_${baseOrderId}`, JSON.stringify({ ...data, cached_at: Date.now() }))
  } catch (_) {}
}

function getCachedQRIS(baseOrderId: string): { qris_order_id: string; qr_string?: string; actions?: any[] } | null {
  try {
    const item = localStorage.getItem(`bzr_qris_${baseOrderId}`)
    if (!item) return null
    const parsed = JSON.parse(item)
    const MAX_AGE = 23 * 60 * 60 * 1000
    if (Date.now() - parsed.cached_at > MAX_AGE) {
      localStorage.removeItem(`bzr_qris_${baseOrderId}`)
      return null
    }
    return parsed
  } catch (_) { return null }
}

function cacheSnapToken(orderId: string, data: { token: string; redirect_url: string }) {
  try {
    localStorage.setItem(`bzr_snap_${orderId}`, JSON.stringify({ ...data, cached_at: Date.now() }))
  } catch (_) {}
}

function getCachedSnapToken(orderId: string): { token: string; redirect_url: string } | null {
  try {
    const item = localStorage.getItem(`bzr_snap_${orderId}`)
    if (!item) return null
    const parsed = JSON.parse(item)
    // Snap token valid 24 jam
    const MAX_AGE = 23 * 60 * 60 * 1000
    if (Date.now() - parsed.cached_at > MAX_AGE) {
      localStorage.removeItem(`bzr_snap_${orderId}`)
      return null
    }
    return parsed
  } catch (_) { return null }
}

export function getLocalPaymentOverride(registrationId: string): Partial<Payment> | null {
  try {
    const item = localStorage.getItem(`bzr_pay_${registrationId}`)
    return item ? JSON.parse(item) : null
  } catch { return null }
}

/**
 * Membuat BCA Virtual Account melalui Supabase Edge Function → Midtrans Sandbox API.
 * Server Key disimpan di Edge Function (tidak bocor ke browser).
 */
export async function createRealBCAVirtualAccount(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string
): Promise<{ va_number: string; expiry_time?: string; error?: string } | null> {
  // Cek cache dulu agar tidak double-charge
  const cached = getCachedVANumber(orderId)
  if (cached?.va_number) {
    console.log('[Midtrans] Using cached VA:', cached.va_number)
    return cached
  }

  try {
    console.log('[Midtrans] POST proxy /midtrans-api/v2/charge, order:', orderId)

    const chargePayload = {
      payment_type: "bank_transfer",
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      bank_transfer: {
        bank: "bca",
      },
      customer_details: {
        first_name: customerName || "UMKM",
        email: customerEmail || "umkm@bzr.app",
      },
    };

    const res = await fetch(`/midtrans-api/v2/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload),
    })

    const data = await res.json()
    console.log('[Midtrans] BCA VA response:', data)

    if (data.status_code && data.status_code !== '201') {
      const errMsg = data.status_message || data.error_messages?.join(', ') || 'Gagal mendapatkan nomor VA'
      console.warn('[Midtrans] BCA VA failed:', errMsg)
      return { va_number: '', error: errMsg }
    }

    const vaNumbers = data.va_numbers || [];
    const bcaVA = vaNumbers.find((v: any) => v.bank === "bca") || vaNumbers[0];

    if (!bcaVA?.va_number) {
      return { va_number: '', error: 'VA number tidak ada di response' }
    }

    cacheVANumber(orderId, { va_number: bcaVA.va_number, expiry_time: data.expiry_time })

    return {
      va_number: bcaVA.va_number,
      expiry_time: data.expiry_time,
    }

  } catch (e: any) {
    console.error('[Midtrans] BCA VA fetch error:', e)
    return { va_number: '', error: e.message || 'Network error — cek koneksi internet' }
  }
}

/**
 * Membuat QRIS melalui Supabase Edge Function → Midtrans Sandbox API.
 * Selalu menggunakan Order ID unik berbasis timestamp agar tidak 409.
 */
export async function createRealQRIS(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  forceNew = false
): Promise<{ qris_order_id?: string; qr_string?: string; actions?: any[]; error?: string } | null> {
  // Cek cache dulu (kecuali forceNew)
  if (!forceNew) {
    const cached = getCachedQRIS(orderId)
    if (cached?.qris_order_id) {
      console.log('[Midtrans] Using cached QRIS order:', cached.qris_order_id)
      return cached
    }
  }

  // Gunakan timestamp unik agar tidak pernah 409
  const baseId = orderId.replace(/-Q[A-Z0-9]*$/i, '')
  const qrisOrderId = `${baseId}-Q${Date.now()}`

  try {
    console.log('[Midtrans] POST proxy /midtrans-api/v2/charge for QRIS, order:', qrisOrderId)

    const chargePayload = {
      payment_type: "qris",
      transaction_details: {
        order_id: qrisOrderId,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: customerName || "UMKM",
        email: customerEmail || "umkm@bzr.app",
      },
      qris: {
        acquirer: "gopay",
      },
    };

    const res = await fetch(`/midtrans-api/v2/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload),
    })

    const data = await res.json()
    console.log('[Midtrans] QRIS response:', data)

    if (data.status_code && data.status_code !== '201') {
      return { error: data.status_message || data.error_messages?.join(', ') || 'QRIS charge gagal' }
    }

    const result = {
      qris_order_id: qrisOrderId,
      qr_string: data.qr_string,
      actions: data.actions,
    }

    // Simpan ke cache
    cacheQRIS(orderId, result)

    return result
  } catch (e: any) {
    console.error('[Midtrans] QRIS fetch error:', e)
    return { error: e.message || 'Network error' }
  }
}

/**
 * Membuat Snap Token via Midtrans Snap Transactions API.
 * Snap popup support QRIS + semua e-wallet dan simulator sandbox yang berfungsi.
 */
export async function createSnapToken(
  baseOrderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  forceNew = false
): Promise<{ token: string; redirect_url: string; snap_order_id: string; error?: string } | null> {
  // Gunakan order_id khusus untuk Snap agar tidak conflict dengan VA order
  const snapOrderId = `${baseOrderId.replace(/-SNAP[0-9]*$/i, '')}-SNAP${Date.now()}`
  const cacheKey = baseOrderId

  if (!forceNew) {
    const cached = getCachedSnapToken(cacheKey)
    if (cached?.token) {
      console.log('[Midtrans] Using cached Snap token for:', cacheKey)
      return { ...cached, snap_order_id: cacheKey }
    }
  } else {
    try { localStorage.removeItem(`bzr_snap_${cacheKey}`) } catch (_) {}
  }

  try {
    console.log('[Midtrans] POST proxy /midtrans-snap/v1/transactions, order:', snapOrderId)
    
    const snapPayload = {
      transaction_details: {
        order_id: snapOrderId,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: customerName || "UMKM",
        email: customerEmail || "umkm@bzr.app",
      },
      enabled_payments: ["other_qris"],
    };

    const res = await fetch(`/midtrans-snap/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapPayload),
    })

    const data = await res.json()
    console.log('[Midtrans] Snap token response:', data)

    if (!data.token) {
      const errMsg = data.error_messages?.join(', ') || data.status_message || 'Gagal membuat Snap token'
      return { token: '', redirect_url: '', snap_order_id: snapOrderId, error: errMsg }
    }

    const result = { token: data.token, redirect_url: data.redirect_url || '' }
    cacheSnapToken(cacheKey, result)

    return { ...result, snap_order_id: snapOrderId }
  } catch (e: any) {
    console.error('[Midtrans] Snap token fetch error:', e)
    return { token: '', redirect_url: '', snap_order_id: snapOrderId, error: e.message || 'Network error' }
  }
}

/** Cek status pembayaran via Supabase Edge Function */
export async function checkPaymentStatus(orderId: string): Promise<any> {
  try {
    const res = await fetch(`/midtrans-api/v2/${encodeURIComponent(orderId)}/status`)
    const data = await res.json()
    return data
  } catch (e: any) {
    console.error('[Midtrans] Check status error:', e)
    return { error: e.message || 'Network error' }
  }
}

/**
 * Membuat atau mengambil record pembayaran dari Supabase.
 * Menggunakan order_id stabil berdasarkan registration_id.
 */
export async function getOrCreatePayment(
  registrationId: string,
  eventId: string,
  umkmId: string,
  amount: number
): Promise<Payment> {
  const localOverride = getLocalPaymentOverride(registrationId)

  try {
    const { data: existing } = await supabase
      .from('payments')
      .select('*')
      .eq('registration_id', registrationId)
      .maybeSingle()

    if (existing) {
      return localOverride ? { ...(existing as Payment), ...localOverride } : (existing as Payment)
    }
  } catch (e) {
    console.warn('[Midtrans] payments table might not exist:', e)
  }

  // Order ID stabil berdasarkan registration_id (tidak berubah setiap render)
  const shortId = registrationId.replace(/-/g, '').slice(0, 10).toUpperCase()
  const orderId = `BZR-${shortId}`

  const newPayment: Partial<Payment> = {
    registration_id: registrationId,
    event_id: eventId,
    umkm_id: umkmId,
    order_id: orderId,
    gross_amount: amount,
    payment_type: 'pending',
    transaction_status: (localOverride?.transaction_status || 'pending') as PaymentStatus,
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(newPayment)
      .select()
      .single()
    if (!error && data) return data as Payment
  } catch (_) {}

  return {
    id: `local-${shortId}`,
    ...newPayment,
    created_at: new Date().toISOString(),
  } as Payment
}

/** Update status pembayaran + status registrasi ke 'accepted' */
export async function updatePaymentAndRegistrationStatus(
  registrationId: string,
  paymentId: string,
  orderId: string,
  status: PaymentStatus = 'settlement',
  paymentType: string = 'midtrans'
): Promise<boolean> {
  try {
    localStorage.setItem(`bzr_pay_${registrationId}`, JSON.stringify({
      transaction_status: status,
      payment_type: paymentType,
      updated_at: new Date().toISOString(),
    }))
  } catch (_) {}

  try {
    await supabase
      .from('payments')
      .update({ transaction_status: status, payment_type: paymentType, updated_at: new Date().toISOString() })
      .or(`id.eq.${paymentId},order_id.eq.${orderId},registration_id.eq.${registrationId}`)
  } catch (_) {}

  if (status === 'settlement' && registrationId) {
    try {
      await supabase
        .from('registrations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', registrationId)
    } catch (_) {}
  }

  return true
}

export async function updatePaymentStatus(
  paymentId: string,
  orderId: string,
  status: PaymentStatus,
  paymentType: string = 'qris'
): Promise<boolean> {
  return updatePaymentAndRegistrationStatus('', paymentId, orderId, status, paymentType)
}

export async function openMidtransSnap(
  snapToken: string,
  callbacks: {
    onSuccess?: (result: any) => void
    onPending?: (result: any) => void
    onError?: (result: any) => void
    onClose?: () => void
  }
) {
  const isLoaded = await loadSnapScript()
  if (isLoaded && (window as any).snap) {
    try {
      ;(window as any).snap.pay(snapToken, {
        onSuccess: (r: any) => callbacks.onSuccess?.(r),
        onPending: (r: any) => callbacks.onPending?.(r),
        onError: (r: any) => callbacks.onError?.(r),
        onClose: () => callbacks.onClose?.(),
      })
      return true
    } catch (e) { console.warn('Snap pay error:', e) }
  }
  return false
}
