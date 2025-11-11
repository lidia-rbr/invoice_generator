import { useMemo, useState } from "react";

/**
 * @typedef {Object} Invoice
 * @property {string} id - Unique invoice code (e.g., "INV-001").
 * @property {string} customerName - Client display name.
 * @property {string} issueDate - ISO date string (YYYY-MM-DD).
 * @property {boolean} paid - Whether the invoice is paid.
 * @property {number} amountExcl - Amount excluding taxes.
 * @property {number} vat - VAT amount (absolute).
 * @property {number} taxe - Additional tax amount (absolute).
 * @property {string} invoiceUrl - Public/drive URL for the invoice PDF.
 */

/**
 * Derives the calendar quarter (e.g., "Q4 2025") from an ISO date string.
 * @param {string} isoDate - The issue date (YYYY-MM-DD).
 * @returns {string} Quarter label such as "Q1 2025".
 */
function getQuarter(isoDate) {
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/**
 * Returns an Intl currency formatter.
 * @param {string} [locale="en-AU"] - BCP47 locale for formatting.
 * @param {string} [currency="AUD"] - ISO 4217 currency code.
 * @returns {Intl.NumberFormat} A number formatter for currency.
 */
function getCurrencyFormatter(locale = "en-AU", currency = "AUD") {
  return new Intl.NumberFormat(locale, { style: "currency", currency });
}

/**
 * Returns a small in-memory dataset for initial UI development.
 * @returns {Invoice[]} An array of invoice objects.
 */
function useMockInvoices() {
  const data = useMemo(
    () => [
      {
        id: "INV-001",
        customerName: "Acme Pty Ltd",
        issueDate: "2025-10-01",
        paid: true,
        amountExcl: 1300,
        vat: 130,   // 10%
        taxe: 20,   // extra fee/tax if any
        invoiceUrl: "https://example.com/invoices/INV-001.pdf",
      },
      {
        id: "INV-002",
        customerName: "Blue Ocean Co",
        issueDate: "2025-10-05",
        paid: false,
        amountExcl: 745,
        vat: 74.5,
        taxe: 0,
        invoiceUrl: "https://example.com/invoices/INV-002.pdf",
      },
      {
        id: "INV-003",
        customerName: "Sunrise Retail",
        issueDate: "2025-07-10",
        paid: false,
        amountExcl: 270,
        vat: 27,
        taxe: 2,
        invoiceUrl: "https://example.com/invoices/INV-003.pdf",
      },
      {
        id: "INV-004",
        customerName: "Koala Care",
        issueDate: "2025-04-12",
        paid: true,
        amountExcl: 2000,
        vat: 200,
        taxe: 0,
        invoiceUrl: "https://example.com/invoices/INV-004.pdf",
      },
    ],
    []
  );
  return data;
}

/**
 * Filters invoices by a simple text query (id or customer).
 * @param {Invoice[]} invoices - The full list.
 * @param {string} query - Case-insensitive substring to match.
 * @returns {Invoice[]} Filtered invoices.
 */
function filterInvoices(invoices, query) {
  if (!query) return invoices;
  const q = query.toLowerCase();
  return invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q)
  );
}

/**
 * Computes the total amount including taxes.
 * @param {Invoice} inv - An invoice row.
 * @returns {number} Total including VAT and other taxes.
 */
function getTotal(inv) {
  return inv.amountExcl + inv.vat + inv.taxe;
}

export default function App() {
  const invoices = useMockInvoices();
  const [query, setQuery] = useState("");
  const fmt = useMemo(() => getCurrencyFormatter("en-AU", "AUD"), []);

  const filtered = useMemo(() => filterInvoices(invoices, query), [invoices, query]);

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Invoices</h1>
        <button
          onClick={() => alert("New invoice modal (coming soon)")}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          + New invoice
        </button>
      </header>

      <div style={{ marginBottom: "1rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr auto" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID or customer"
          style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          onClick={() => setQuery("")}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          Reset
        </button>
      </div>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={th}>Invoice</th>
              <th style={th}>Customer</th>
              <th style={th}>Quarter</th>
              <th style={th}>Date issued</th>
              <th style={th}>Paid</th>
              <th style={thRight}>Amount (excl.)</th>
              <th style={thRight}>VAT</th>
              <th style={thRight}>TAXE</th>
              <th style={thRight}>Total</th>
              <th style={th}>Invoice URL</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const total = getTotal(inv);
              const quarter = getQuarter(inv.issueDate);
              return (
                <tr key={inv.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={tdMono}>{inv.id}</td>
                  <td style={td}>{inv.customerName}</td>
                  <td style={td}>{quarter}</td>
                  <td style={td}>{inv.issueDate}</td>
                  <td style={td}>{inv.paid ? "✅" : "❌"}</td>
                  <td style={tdRight}>{fmt.format(inv.amountExcl)}</td>
                  <td style={tdRight}>{fmt.format(inv.vat)}</td>
                  <td style={tdRight}>{fmt.format(inv.taxe)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(total)}</td>
                  <td style={td}>
                    <a href={inv.invoiceUrl} target="_blank" rel="noreferrer">Open</a>
                  </td>
                  <td style={tdRight}>
                    <button
                      onClick={() => alert(`Open ${inv.id}`)}
                      style={{ padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: "1.25rem", textAlign: "center", color: "#666" }}>
                  No invoices match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: "left", padding: "0.75rem" };
const thRight = { textAlign: "right", padding: "0.75rem" };
const td = { padding: "0.75rem" };
const tdMono = { padding: "0.75rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const tdRight = { padding: "0.75rem", textAlign: "right" };
