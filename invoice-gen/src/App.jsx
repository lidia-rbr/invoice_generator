import { useEffect, useMemo, useState } from "react";
import { createInvoice, loadInvoices } from "./api";

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

function NavBar({ setView, currentView }) {
  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        <div style={{ fontWeight: "bold", fontSize: "1.25rem", color: colors.primary }}>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setView('invoices'); }} 
            style={{ color: "inherit", textDecoration: "none", transition: "opacity 0.2s" }}
            onMouseEnter={(e) => e.target.style.opacity = "0.8"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            InvoiceApp
          </a>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setView('invoices'); }} 
            style={{
              ...navLinkStyle,
              ...(currentView === 'invoices' ? navLinkActiveStyle : {})
            }}
          >
            Invoices
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setView('clients'); }} 
            style={{
              ...navLinkStyle,
              ...(currentView === 'clients' ? navLinkActiveStyle : {})
            }}
          >
            Clients
          </a>
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()} 
            style={navLinkStyle}
          >
            Settings
          </a>
        </div>
      </div>
    </nav>
  );
}

/**
 * A modal for creating a new invoice.
 */
function InvoiceForm({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    customerName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    tjm: 0,
    numDays: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const calculatedValues = useMemo(() => {
    const tjm = Number(formData.tjm) || 0;
    const numDays = Number(formData.numDays) || 0;
    const amountExcl = tjm * numDays;
    const vat = amountExcl * 0.2;
    const taxe = amountExcl * 0.73;
    const total = amountExcl * 1.2;

    return { amountExcl, vat, taxe, total };
  }, [formData.tjm, formData.numDays]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        ...calculatedValues,
        paid: false,
        code: `INV-${Date.now()}`,
        invoiceUrl: "",
      });
    } catch (err) {
      setError(err.message || "Failed to save invoice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "1.5rem", color: colors.textPrimary }}>New Invoice</h2>
          {error && <div style={{ color: colors.danger, marginBottom: "1rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>{error}</div>}
          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Customer Name</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Issue Date</label>
              <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>TJM (Daily Rate)</label>
              <input type="number" name="tjm" value={formData.tjm} onChange={handleChange} style={inputStyle} step="0.01" min="0" />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Number of days</label>
              <input type="number" name="numDays" value={formData.numDays} onChange={handleChange} style={inputStyle} step="0.1" min="0" />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Amount (excl. tax)</label>
              <input type="text" value={calculatedValues.amountExcl.toFixed(2)} style={disabledInputStyle} disabled />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>VAT (20%)</label>
              <input type="text" value={calculatedValues.vat.toFixed(2)} style={disabledInputStyle} disabled />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Taxe (73%)</label>
              <input type="text" value={calculatedValues.taxe.toFixed(2)} style={disabledInputStyle} disabled />
            </div>
             <div style={formGroupStyle}>
              <label style={labelStyle}>Total</label>
              <input type="text" value={calculatedValues.total.toFixed(2)} style={disabledInputStyle} disabled />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} style={buttonSecondaryStyle}>Cancel</button>
            <button onClick={handleSubmit} disabled={isSaving} style={buttonPrimaryStyle}>
              {isSaving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Derives a calendar quarter label from an ISO date string.
 */
function getQuarter(isoDate) {
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/**
 * Formats an ISO date string to DD/MM/YYYY.
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function ClientsView() {
  const clients = [
    { id: 1, name: 'Client 1', address: '123 Main St, Anytown, USA', phone: '555-1234' },
    { id: 2, name: 'Client 2', address: '456 Oak Ave, Sometown, USA', phone: '555-5678' },
    { id: 3, name: 'Client 3', address: '789 Pine Ln, Othertown, USA', phone: '555-9012' },
  ];

  const showDetails = (client) => {
    alert(`Client Details:\n\nName: ${client.name}\nAddress: ${client.address}\nPhone: ${client.phone}`);
  };

  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>Clients</h1>
      </header>
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead style={{ background: colors.background }}>
            <tr>
              <th style={th}>Client Name</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} style={trStyle}>
                <td style={td}>{client.name}</td>
                <td style={tdRight}>
                  <button
                    onClick={() => showDetails(client)}
                    style={actionButtonStyle}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/**
 * Returns an Intl currency formatter.
 */
function getCurrencyFormatter(locale = "fr-FR", currency = "EUR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency });
}

/**
 * Filters invoices by id or customer name.
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
 */
function getTotal(inv) {
  return (Number(inv.amountExcl) || 0) + (Number(inv.vat) || 0) + (Number(inv.taxe) || 0);
}

function InvoicesView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'descending' });

  const fmt = useMemo(() => getCurrencyFormatter("fr-FR", "EUR"), []);

  async function reload() {
    setErr("");
    setLoading(true);
    try {
      const data = await loadInvoices(query);
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

  async function handleSaveInvoice(invoiceData) {
    setErr("");
    try {
      const created = await createInvoice(invoiceData);
      setRows((prev) => [created, ...prev]);
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      throw new Error("Failed to create invoice.");
    }
  }

  const filteredRows = useMemo(() => filterInvoices(rows, query), [rows, query]);

  const sortedRows = useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'total') {
          aValue = getTotal(a);
          bValue = getTotal(b);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRows, sortConfig]);

  const totals = useMemo(() => {
    return sortedRows.reduce((acc, inv) => {
        acc.amountExcl += Number(inv.amountExcl) || 0;
        acc.vat += Number(inv.vat) || 0;
        acc.taxe += Number(inv.taxe) || 0;
        acc.total += getTotal(inv);
        return acc;
    }, { amountExcl: 0, vat: 0, taxe: 0, total: 0 });
  }, [sortedRows]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>Invoices</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          style={buttonPrimaryStyle}
          disabled={loading}
        >
          + New invoice
        </button>
      </header>

      {err && <div style={errorBannerStyle}>{err}</div>}

      <div style={searchBarStyle}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID or customer"
          style={searchInputStyle}
        />
        <button
          onClick={() => setQuery("")}
          style={buttonSecondaryStyle}
        >
          Reset
        </button>
      </div>

      {isFormOpen && <InvoiceForm onClose={() => setIsFormOpen(false)} onSave={handleSaveInvoice} />}

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead style={{ background: colors.background }}>
            <tr style={{ cursor: 'pointer' }}>
              <th style={th} onClick={() => requestSort('id')}>Invoice{getSortIndicator('id')}</th>
              <th style={th} onClick={() => requestSort('customerName')}>Customer{getSortIndicator('customerName')}</th>
              <th style={th} onClick={() => requestSort('issueDate')}>Quarter{getSortIndicator('issueDate')}</th>
              <th style={th} onClick={() => requestSort('issueDate')}>Date issued{getSortIndicator('issueDate')}</th>
              <th style={th} onClick={() => requestSort('paid')}>Paid{getSortIndicator('paid')}</th>
              <th style={thRight} onClick={() => requestSort('amountExcl')}>Amount (excl.){getSortIndicator('amountExcl')}</th>
              <th style={thRight} onClick={() => requestSort('vat')}>VAT{getSortIndicator('vat')}</th>
              <th style={thRight} onClick={() => requestSort('taxe')}>TAXE{getSortIndicator('taxe')}</th>
              <th style={thRight} onClick={() => requestSort('total')}>Total{getSortIndicator('total')}</th>
              <th style={th}>Invoice URL</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr><td colSpan={11} style={{ padding: "1.25rem", textAlign: "center", color: colors.textSecondary }}>Loading…</td></tr>
            )}
            {!loading && sortedRows.map((inv) => {
              const total = getTotal(inv);
              const quarter = getQuarter(inv.issueDate);
              return (
                <tr key={inv.id} style={trStyle}>
                  <td style={tdMono}>{inv.id}</td>
                  <td style={td}>{inv.customerName}</td>
                  <td style={td}>{quarter}</td>
                  <td style={td}>{formatDate(inv.issueDate)}</td>
                  <td style={td}><span style={inv.paid ? statusPaid : statusUnpaid}>{inv.paid ? "Paid" : "Unpaid"}</span></td>
                  <td style={tdRight}>{fmt.format(Number(inv.amountExcl) || 0)}</td>
                  <td style={tdRight}>{fmt.format(Number(inv.vat) || 0)}</td>
                  <td style={tdRight}>{fmt.format(Number(inv.taxe) || 0)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(total)}</td>
                  <td style={td}>
                    {inv.invoiceUrl ? <a href={inv.invoiceUrl} target="_blank" rel="noreferrer" style={linkStyle}>Open</a> : <span style={{ color: colors.textSecondary }}>—</span>}
                  </td>
                  <td style={tdRight}>
                    <button
                      onClick={() => alert(`Open ${inv.id}`)}
                      style={actionButtonStyle}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && sortedRows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: "1.25rem", textAlign: "center", color: colors.textSecondary }}>
                  No invoices match your search.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${colors.border}`, fontWeight: 'bold', background: colors.background }}>
              <td style={{...td, textAlign: 'right'}} colSpan={5}>Total</td>
              <td style={tdRight}>{fmt.format(totals.amountExcl)}</td>
              <td style={tdRight}>{fmt.format(totals.vat)}</td>
              <td style={tdRight}>{fmt.format(totals.taxe)}</td>
              <td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(totals.total)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}

export default function App() {
  const [view, setView] = useState('invoices');

  return (
    <div style={{ paddingTop: '4rem', minHeight: '100vh', background: colors.pageBackground }}>
      <NavBar setView={setView} currentView={view} />
      {view === 'invoices' && <InvoicesView />}
      {view === 'clients' && <ClientsView />}
    </div>
  );
}

// Enhanced Color Palette
const colors = {
  primary: '#4a90e2',
  primaryHover: '#3a7bc8',
  background: '#f8fafc',
  pageBackground: '#f1f5f9',
  surface: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  danger: '#ef4444',
  paidBg: 'rgba(16, 185, 129, 0.1)',
  unpaidBg: 'rgba(239, 68, 68, 0.1)',
  hover: '#f8fafc',
};

// Enhanced Styles with Animations
const mainContainerStyle = {
  maxWidth: 1200,
  margin: "2rem auto",
  padding: "0 1.5rem",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  animation: "fadeIn 0.3s ease-in",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "1.5rem",
};

const h1Style = {
  fontSize: "1.875rem",
  margin: 0,
  color: colors.textPrimary,
  fontWeight: 700,
  letterSpacing: "-0.025em",
};

const cardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  overflow: "hidden",
  background: colors.surface,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  transition: "box-shadow 0.2s ease",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "1rem 0.75rem",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: colors.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  transition: "background-color 0.15s ease",
  userSelect: "none",
};

const thRight = {
  ...th,
  textAlign: "right",
};

const td = {
  padding: "1rem 0.75rem",
  color: colors.textPrimary,
  fontSize: "0.9375rem",
};

const tdMono = {
  ...td,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
  fontSize: "0.875rem",
  color: colors.textSecondary,
};

const tdRight = {
  ...td,
  textAlign: "right",
};

const trStyle = {
  borderTop: `1px solid ${colors.border}`,
  transition: "background-color 0.15s ease",
  cursor: "default",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  animation: "fadeIn 0.2s ease",
  backdropFilter: "blur(4px)",
};

const modalContentStyle = {
  background: colors.surface,
  padding: "2rem",
  borderRadius: 16,
  width: "100%",
  maxWidth: 600,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  animation: "slideUp 0.3s ease",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "1rem",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  marginBottom: "0.5rem",
  fontSize: "0.875rem",
  color: colors.textSecondary,
  fontWeight: 500,
};

const inputStyle = {
  padding: "0.625rem 0.875rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  width: "90%",
  fontSize: "0.9375rem",
  transition: "all 0.2s ease",
  outline: "none",
};

const disabledInputStyle = {
  ...inputStyle,
  backgroundColor: colors.background,
  color: colors.textSecondary,
  cursor: "not-allowed",
};

const baseButtonStyle = {
  padding: "0.625rem 1.25rem",
  borderRadius: 8,
  border: "1px solid transparent",
  cursor: "pointer",
  fontSize: "0.9375rem",
  fontWeight: 500,
  transition: "all 0.2s ease",
  outline: "none",
};

const buttonPrimaryStyle = {
  ...baseButtonStyle,
  backgroundColor: colors.primary,
  color: colors.surface,
  border: `1px solid ${colors.primary}`,
};

const buttonSecondaryStyle = {
  ...baseButtonStyle,
  backgroundColor: colors.surface,
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
};

const actionButtonStyle = {
  padding: "0.375rem 0.75rem",
  borderRadius: 6,
  border: `1px solid ${colors.border}`,
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  backgroundColor: colors.surface,
  color: colors.textPrimary,
  transition: "all 0.15s ease",
};

const statusBase = {
  padding: '0.375rem 0.75rem',
  borderRadius: '9999px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  display: "inline-block",
};

const statusPaid = {
  ...statusBase,
  color: colors.success,
  backgroundColor: colors.paidBg,
};

const statusUnpaid = {
  ...statusBase,
  color: colors.danger,
  backgroundColor: colors.unpaidBg,
};

const navStyle = {
  background: colors.surface,
  borderBottom: `1px solid ${colors.border}`,
  padding: '0 1.5rem',
  height: '4rem',
  display: 'flex',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
};

const navContainerStyle = {
  maxWidth: 1200,
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const navLinkStyle = {
  color: colors.textSecondary,
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  fontWeight: 500,
  borderRadius: 8,
  transition: "all 0.2s ease",
  display: "inline-block",
};

const navLinkActiveStyle = {
  color: colors.primary,
  backgroundColor: "rgba(74, 144, 226, 0.1)",
};

const linkStyle = {
  color: colors.primary,
  textDecoration: "none",
  fontWeight: 500,
  transition: "color 0.15s ease",
};

const searchBarStyle = {
  marginBottom: "1.5rem",
  display: "flex",
  gap: "0.75rem",
};

const searchInputStyle = {
  flex: 1,
  padding: "0.625rem 0.875rem",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  fontSize: "0.9375rem",
  transition: "all 0.2s ease",
  outline: "none",
};

const errorBannerStyle = {
  marginBottom: "1rem",
  color: colors.danger,
  padding: "0.875rem 1rem",
  background: "rgba(239, 68, 68, 0.1)",
  borderRadius: 8,
  border: `1px solid ${colors.danger}`,
  fontSize: "0.9375rem",
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  input:focus {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1) !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  tbody tr:hover {
    background-color: ${colors.hover};
  }
  
  thead th:hover {
    background-color: ${colors.hover};
  }
  
  a:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(styleSheet);