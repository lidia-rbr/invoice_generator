// invoice-gen/src/api.js

// Prefer an env var when you deploy the UI. Fallback to localhost in dev.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Load invoices from the backend, optionally filtered.
 * @param {string} [query] - Optional search substring.
 * @returns {Promise<Array<object>>} Invoice rows from the API.
 */
export async function loadInvoices(query = "") {
  const url = new URL("/invoices", BASE_URL);
  if (query) url.searchParams.set("q", query);
  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load invoices: ${res.status}`);
  return res.json();
}

/**
 * Create a new invoice row in the database via the API.
 * @param {object} payload - Invoice data to create.
 * @param {string} payload.code
 * @param {string} payload.customerName
 * @param {string} payload.issueDate - ISO date "YYYY-MM-DD".
 * @param {boolean} payload.paid
 * @param {number} payload.amountExcl
 * @param {number} payload.vat
 * @param {number} payload.taxe
 * @param {string} [payload.invoiceUrl]
 * @returns {Promise<object>} The created invoice.
 */
export async function createInvoice(payload) {
  const res = await fetch(`${BASE_URL}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create invoice: ${res.status}`);
  return res.json();
}

/**
 * Update an existing invoice via the API.
 * @param {string} id - The ID of the invoice to update.
 * @param {object} payload - The invoice data to update.
 * @returns {Promise<object>} The updated invoice.
 */
export async function updateInvoice(id, payload) {
  const allowedKeys = [
    "code",
    "customerName",
    "issueDate",
    "paid",
    "amountExcl",
    "vat",
    "taxe",
    "invoiceUrl",
  ];

  /** @type {Record<string, unknown>} */
  const cleanPayload = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) {
      cleanPayload[key] = payload[key];
    }
  }

  const res = await fetch(`${BASE_URL}/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanPayload),
  });

  if (!res.ok) throw new Error(`Failed to update invoice: ${res.status}`);
  return res.json();
}
