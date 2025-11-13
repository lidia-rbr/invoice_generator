import express from "express";
import cors from "cors";
import { Firestore } from "@google-cloud/firestore";
import Joi from "joi";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"] }));
app.use(express.json());

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const db = new Firestore();
const col = db.collection("invoices");

/**
 * Compute "Qn YYYY" from an ISO date string.
 * @param {string} isoDate - Date string like "2025-11-01".
 * @returns {string} Quarter label.
 */
function getQuarter(isoDate) {
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/**
 * List invoices with optional search on code or customerName.
 * @param {string} [q] - Case-insensitive substring.
 * @returns {Promise<Array<object>>} Invoice docs (latest first).
 */
async function listInvoices(q = "") {
  let query = col.orderBy("createdAt", "desc");
  if (q) {
    // Firestore does not support case-insensitive `contains` or OR queries on different fields easily. 
    // For a scalable solution, you would typically use a search service like Algolia or Elasticsearch,
    // or duplicate data in lowercase fields to perform case-insensitive searches.
    // This implementation is a simplified version.
    query = query.where('customerName_lower', '>=', q.toLowerCase()).where('customerName_lower', '<=', q.toLowerCase() + '\uf8ff');
  }
  const snap = await query.limit(200).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Create an invoice document.
 * @param {object} payload
 * @param {string} payload.code
 * @param {string} payload.customerName
 * @param {string} payload.issueDate - "YYYY-MM-DD"
 * @param {boolean} payload.paid
 * @param {number} payload.amountExcl
 * @param {number} payload.vat
 * @param {number} payload.taxe
 * @param {string=} payload.invoiceUrl
 * @returns {Promise<object>} Created doc (with id).
 */
async function createInvoice(payload) {
  const schema = Joi.object({
    code: Joi.string().required(),
    customerName: Joi.string().required(),
    issueDate: Joi.string().isoDate().required(),
    paid: Joi.boolean().default(false),
    amountExcl: Joi.number().default(0),
    vat: Joi.number().default(0),
    taxe: Joi.number().default(0),
    invoiceUrl: Joi.string().uri().allow("").default(""),
  });
  
  const validatedPayload = await schema.validateAsync(payload);

  const now = new Date().toISOString();
  const doc = {
    code: validatedPayload.code,
    customerName: validatedPayload.customerName,
    customerName_lower: validatedPayload.customerName.toLowerCase(),
    issueDate: validatedPayload.issueDate,
    paid: validatedPayload.paid,
    amountExcl: validatedPayload.amountExcl,
    vat: validatedPayload.vat,
    taxe: validatedPayload.taxe,
    invoiceUrl: validatedPayload.invoiceUrl,
    quarter: getQuarter(validatedPayload.issueDate),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await col.add(doc);
  return { id: ref.id, ...doc };
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/invoices", async (req, res) => {
  try {
    const q = (req.query.q || "").toString();
    res.json(await listInvoices(q));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

app.post("/invoices", async (req, res) => {
  try {
    const row = await createInvoice(req.body);
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Failed to create invoice" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API on :${port}`));

