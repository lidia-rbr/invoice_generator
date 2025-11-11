import { useEffect, useMemo, useState } from "react";
import { loadInvoices, createInvoice } from "./api";

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} customerName
 * @property {string} issueDate
 * @property {boolean} paid
 * @property {number} amountExcl
 * @property {number} vat
 * @property {number} taxe
 * @property {string} invoiceUrl
 */

/**
 * Derives a calendar quarter label from an ISO date string.
 * @param {string} isoDate
 * @returns {string}
 */
function getQuarter(isoDate) {
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/**
 * Returns an Intl currency formatter.
 * @param {string} [locale="en-AU"]
 * @param {string} [currency="AUD"]
 * @returns {Intl.NumberFormat}
 */
function getCurrencyFormatter(locale = "en-AU", currency = "AUD") {
  return new Intl.NumberFormat(locale, { style: "currency", currency });
}

/**
 * Filters invoices by id or customer name.
 * @param {Invoice[]} invoices
 * @param {string} query
 * @returns {Invoice[]}
 */
function filterInvoices(invoices, query) {
  if (!query) return invoices;
  const q = query.toLowerCase();
  return invoices.filter(
    (inv) =>
      String(inv.id || "").toLowerCase().includes(q) ||
      String(inv.customerName || "").toLowerCase().includes(q)
  );
}

/**
 * Computes total amount incl. taxes.
 * @param {Invoice} inv
 * @returns {number}
 */
function getTotal(inv) {
  return (Number(inv.amountExcl) || 0) + (Number(inv.vat) || 0) + (Number(inv.taxe) || 0);
}

export default function App() {
  const [rows, setRows] = useState(/** @type {Invoice[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  const fmt = useMemo(() => getCurrencyFormatter("en-AU", "AUD"), []);

  /**
   * Loads invoices from backend and stores them in state.
   * @returns {Promise<void>}
   */
  async function reload() {
    setErr("");
    setLoading(true);
    try {
      const data = await loadInvoices(query); // server filters optional 'q'
      setRows(data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /**
   * Creates a sample invoice then refreshes the list.
   * @returns {Promise<void>}
   */
  async function addSample() {
    setErr("");
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const created = await createInvoice({
        code: `INV-${Date.now()}`,        // backend stores as "code"; it returns "id"
        customerName: "Sample Client",
        issueDate: today,
        paid: false,
        amountExcl: 100,
        vat: 10,
        taxe: 0,
        invoiceUrl: "",
      });
      // optimistic prepend
      setRows((prev) => [created, ...prev]);
    } catch (e) {
      console.error(e);
      setErr("Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => filterInvoices(rows, query), [rows, query]);

  return (
    <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, Arial, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Invoices</h1>
        <button
          onClick={addSample}
          disabled={loading}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
        >
          {loading ? "Working..." : "+ New invoice"}
        </button>
      </header>

      <div style={{ marginBottom: "0.5rem", color: "crimson", minHeight: 20 }}>{err}</div>

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
            {loading && rows.length === 0 && (
              <tr><td colSpan={11} style={{ padding: "1.25rem", textAlign: "center" }}>Loading…</td></tr>
            )}
            {!loading && filtered.map((inv) => {
              const total = getTotal(inv);
              const quarter = getQuarter(inv.issueDate);
              return (
                <tr key={inv.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={tdMono}>{inv.id}</td>
                  <td style={td}>{inv.customerName}</td>
                  <td style={td}>{quarter}</td>
                  <td style={td}>{inv.issueDate}</td>
                  <td style={td}>{inv.paid ? "✅" : "❌"}</td>
                  <td style={tdRight}>{fmt.format(Number(inv.amountExcl) || 0)}</td>
                  <td style={tdRight}>{fmt.format(Number(inv.vat) || 0)}</td>
                  <td style={tdRight}>{fmt.format(Number(inv.taxe) || 0)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(total)}</td>
                  <td style={td}>
                    {inv.invoiceUrl ? <a href={inv.invoiceUrl} target="_blank" rel="noreferrer">Open</a> : <span style={{ color:"#888" }}>—</span>}
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
            {!loading && filtered.length === 0 && (
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
