import { useEffect, useMemo, useState } from "react";
import { createInvoice, loadInvoices, updateInvoice } from "./api";

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
            onClick={(e) => { e.preventDefault(); setView('dashboard'); }}
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
            onClick={(e) => { e.preventDefault(); setView('dashboard'); }}
            style={{
              ...navLinkStyle,
              ...(currentView === 'dashboard' ? navLinkActiveStyle : {})
            }}
          >
            Dashboard
          </a>
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
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setView('profile'); }}
            style={{ ...navLinkStyle, padding: '0.5rem', marginLeft: '0.5rem' }}
            title="User Profile"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style={{ width: 24, height: 24, display: 'block' }}
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
            </svg>
            <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>User Profile</span>
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

function UserProfileView() {
  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>User Profile</h1>
      </header>
      <div style={cardStyle}>
        <div style={{ padding: '2rem' }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Username</label>
            <input type="text" value="testuser" style={disabledInputStyle} readOnly />
          </div>
          <div style={{ ...formGroupStyle, marginTop: '1rem' }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value="password" style={disabledInputStyle} readOnly />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * A modal for displaying invoice details.
 */
function InvoiceDetailView({ invoice, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customerName: invoice.customerName,
    issueDate: invoice.issueDate,
    paid: invoice.paid,
    tjm: 0,
    numDays: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fmt = useMemo(() => getCurrencyFormatter("fr-FR", "EUR"), []);

  const calculatedValues = useMemo(() => {
    if (!isEditing) return null;
    const tjm = Number(editData.tjm) || 0;
    const numDays = Number(editData.numDays) || 0;
    const amountExcl = tjm * numDays;
    const vat = amountExcl * 0.2;
    const taxe = amountExcl * 0.73;
    const total = amountExcl * 1.2;
    return { amountExcl, vat, taxe, total };
  }, [editData.tjm, editData.numDays, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setError("");
    setIsSaving(true);
    try {
      const updatedInvoice = {
        ...invoice,
        ...editData,
        ...(calculatedValues || {}),
      };
      await onUpdate(updatedInvoice);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "1.5rem", color: colors.textPrimary }}>
            Invoice Details <span style={{ color: colors.textSecondary, fontWeight: 500 }}>({invoice.id})</span>
          </h2>
          {error && <div style={{ color: colors.danger, marginBottom: "1rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>{error}</div>}
          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Customer Name</label>
              {isEditing ? (
                <input type="text" name="customerName" value={editData.customerName} onChange={handleChange} style={inputStyle} />
              ) : (
                <input type="text" value={invoice.customerName} style={disabledInputStyle} readOnly />
              )}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Issue Date</label>
              {isEditing ? (
                <input type="date" name="issueDate" value={editData.issueDate} onChange={handleChange} style={inputStyle} />
              ) : (
                <input type="text" value={formatDate(invoice.issueDate)} style={disabledInputStyle} readOnly />
              )}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Status</label>
              {isEditing ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0' }}>
                  <input type="checkbox" name="paid" checked={editData.paid} onChange={handleChange} />
                  <span style={{ fontSize: '0.9375rem' }}>Paid</span>
                </label>
              ) : (
                <span style={{...inputStyle, background: colors.background}}><span style={invoice.paid ? statusPaid : statusUnpaid}>{invoice.paid ? "Paid" : "Unpaid"}</span></span>
              )}
            </div>
            {isEditing && (
              <>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>TJM (Daily Rate)</label>
                  <input type="number" name="tjm" value={editData.tjm} onChange={handleChange} style={inputStyle} step="0.01" min="0" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Number of days</label>
                  <input type="number" name="numDays" value={editData.numDays} onChange={handleChange} style={inputStyle} step="0.1" min="0" />
                </div>
              </>
            )}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Amount (excl. tax)</label>
              <input type="text" value={isEditing && calculatedValues ? calculatedValues.amountExcl.toFixed(2) : fmt.format(invoice.amountExcl)} style={disabledInputStyle} readOnly />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>VAT</label>
              <input type="text" value={isEditing && calculatedValues ? calculatedValues.vat.toFixed(2) : fmt.format(invoice.vat)} style={disabledInputStyle} readOnly />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Total</label>
              <input type="text" value={isEditing && calculatedValues ? calculatedValues.total.toFixed(2) : fmt.format(getTotal(invoice))} style={{...disabledInputStyle, fontWeight: 'bold'}} readOnly />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
            <div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={buttonSecondaryStyle}>Edit</button>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {isEditing ? (
                <>  
                  <button onClick={() => setIsEditing(false)} style={buttonSecondaryStyle} disabled={isSaving}>Cancel</button>
                  <button onClick={handleSave} style={buttonPrimaryStyle} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={onClose} style={buttonPrimaryStyle}>Close</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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

function DashboardView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'descending' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fmt = useMemo(() => getCurrencyFormatter("fr-FR", "EUR"), []);
  const currentQuarter = useMemo(() => getQuarter(new Date().toISOString()), []);

  const handleUpdateInvoice = async (updatedInvoice) => {
    // Call the API to update the invoice on the backend
    const savedInvoice = await updateInvoice(updatedInvoice.id, updatedInvoice);

    // Update the local state to reflect the changes in the UI
    setRows(prevRows => prevRows.map(row => 
      row.id === savedInvoice.id ? savedInvoice : row
    ));
    
    setSelectedInvoice(savedInvoice); // Keep the modal open with the latest data
  };

  async function reload() {
    setErr("");
    setLoading(true);
    try {
      const data = await loadInvoices();
      const quarterlyInvoices = data.filter(inv => getQuarter(inv.issueDate) === currentQuarter);
      setRows(quarterlyInvoices);
    } catch (e) {
      console.error(e);
      setErr("Failed to load invoices for the current quarter.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedRows = useMemo(() => {
    let sortableItems = [...rows];
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
  }, [rows, sortConfig]);

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
        <h1 style={h1Style}>Dashboard - Invoices for {currentQuarter}</h1>
      </header>

      {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdate={handleUpdateInvoice} />}
      {err && <div style={errorBannerStyle}>{err}</div>}

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead style={{ background: colors.background }}>
            <tr>
              <th style={th} onClick={() => requestSort('id')}>Invoice{getSortIndicator('id')}</th>
              <th style={th} onClick={() => requestSort('customerName')}>Customer{getSortIndicator('customerName')}</th>
              <th style={th} onClick={() => requestSort('issueDate')}>Date issued{getSortIndicator('issueDate')}</th>
              <th style={th} onClick={() => requestSort('paid')}>Paid{getSortIndicator('paid')}</th>
              <th style={thRight} onClick={() => requestSort('amountExcl')}>Amount (excl.){getSortIndicator('amountExcl')}</th>
              <th style={thRight} onClick={() => requestSort('vat')}>VAT{getSortIndicator('vat')}</th>
              <th style={thRight} onClick={() => requestSort('taxe')}>TAXE{getSortIndicator('taxe')}</th>
              <th style={thRight} onClick={() => requestSort('total')}>Total{getSortIndicator('total')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: "1.25rem", textAlign: "center", color: colors.textSecondary }}>Loading…</td></tr>}
            {!loading && sortedRows.map((inv) => (
              <tr key={inv.id} style={trStyle} onClick={() => setSelectedInvoice(inv)}>
                <td style={tdMono}>{inv.id}</td>
                <td style={td}>{inv.customerName}</td>
                <td style={td}>{formatDate(inv.issueDate)}</td>
                <td style={td}><span style={inv.paid ? statusPaid : statusUnpaid}>{inv.paid ? "Paid" : "Unpaid"}</span></td>
                <td style={tdRight}>{fmt.format(Number(inv.amountExcl) || 0)}</td>
                <td style={tdRight}>{fmt.format(Number(inv.vat) || 0)}</td>
                <td style={tdRight}>{fmt.format(Number(inv.taxe) || 0)}</td>
                <td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(getTotal(inv))}</td>
              </tr>
            ))}
            {!loading && sortedRows.length === 0 && <tr><td colSpan={8} style={{ padding: "1.25rem", textAlign: "center", color: colors.textSecondary }}>No invoices for the current quarter.</td></tr>}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${colors.border}`, fontWeight: 'bold', background: colors.background }}><td style={{ ...td, textAlign: 'right' }} colSpan={4}>Total</td><td style={tdRight}>{fmt.format(totals.amountExcl)}</td><td style={tdRight}>{fmt.format(totals.vat)}</td><td style={tdRight}>{fmt.format(totals.taxe)}</td><td style={{ ...tdRight, fontWeight: 600 }}>{fmt.format(totals.total)}</td></tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}

function InvoicesView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'issueDate', direction: 'descending' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fmt = useMemo(() => getCurrencyFormatter("fr-FR", "EUR"), []);

  const handleUpdateInvoice = async (updatedInvoice) => {
    // Call the API to update the invoice on the backend
    const savedInvoice = await updateInvoice(updatedInvoice.id, updatedInvoice);

    // Update the local state to reflect the changes in the UI
    setRows(prevRows => prevRows.map(row => 
      row.id === savedInvoice.id ? savedInvoice : row
    ));
    
    setSelectedInvoice(savedInvoice); // Keep the modal open with the latest data
  };

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

      {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdate={handleUpdateInvoice} />}
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
            <tr>
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
                <tr key={inv.id} style={trStyle} onClick={() => setSelectedInvoice(inv)}>
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
              <td style={{ ...td, textAlign: 'right' }} colSpan={5}>Total</td>
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
  const [view, setView] = useState('dashboard');

  return (
    <div style={{ paddingTop: '4rem', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={animatedBackgroundStyle}>
        <div className="light-orb" style={{ ...lightOrbStyle, top: '20%', left: '10%', animationDelay: '0s' }}></div>
        <div className="light-orb" style={{ ...lightOrbStyle, top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="light-orb" style={{ ...lightOrbStyle, top: '40%', left: '50%', animationDelay: '4s' }}></div>
        <div className="light-orb" style={{ ...lightOrbStyle, top: '80%', left: '30%', animationDelay: '1s' }}></div>
        <div className="light-orb" style={{ ...lightOrbStyle, top: '15%', left: '70%', animationDelay: '3s' }}></div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar setView={setView} currentView={view} />
        {view === 'dashboard' && <DashboardView />}
        {view === 'invoices' && <InvoicesView />}
        {view === 'clients' && <ClientsView />}
        {view === 'profile' && <UserProfileView />}
      </div>
    </div>
  );
}

// Enhanced Color Palette
const colors = {
  primary: '#f472b6', // Pastel Pink
  primaryHover: '#ec4899', // Slightly darker pink for hover
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
  minWidth: 520,
    margin: "0 auto",
  padding: "2rem 1.5rem",
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
  backgroundColor: "rgba(244, 114, 182, 0.1)",
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

const animatedBackgroundStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 50%, #fce7f3 100%)',
  backgroundSize: '200% 200%',
  animation: 'gradientShift 15s ease infinite',
  zIndex: 0,
};

const lightOrbStyle = {
  position: 'absolute',
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(244, 114, 182, 0.3) 0%, rgba(244, 114, 182, 0.1) 40%, transparent 70%)',
  filter: 'blur(20px)',
  animation: 'floatOrb 20s ease-in-out infinite',
  pointerEvents: 'none',
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
    box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.1) !important;
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
  
  tbody tr {
    cursor: pointer;
  }

  a:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(styleSheet);