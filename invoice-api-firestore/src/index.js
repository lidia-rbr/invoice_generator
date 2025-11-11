import express from "express";
import cors from "cors";
import { Firestore } from "@google-cloud/firestore";

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], methods: ["GET","POST"] }));
app.use(express.json());

const db = new Firestore();
const col = db.collection("invoices");

/** @param {string} isoDate */ function getQuarter(isoDate){
  const d = new Date(isoDate); const q = Math.floor(d.getMonth()/3)+1; return `Q${q} ${d.getFullYear()}`;
}

/** @param {string} [q] */ async function listInvoices(q=""){
  const snap = await col.orderBy("createdAt","desc").limit(200).get();
  let items = snap.docs.map(d=>({ id:d.id, ...d.data() }));
  if(q){ const s=q.toLowerCase(); items = items.filter(r =>
    String(r.code||"").toLowerCase().includes(s) ||
    String(r.customerName||"").toLowerCase().includes(s)); }
  return items;
}

/** @param {object} p */ async function createInvoice(p){
  const now = new Date().toISOString();
  const doc = {
    code:p.code, customerName:p.customerName, issueDate:p.issueDate,
    paid:!!p.paid, amountExcl:Number(p.amountExcl)||0, vat:Number(p.vat)||0, taxe:Number(p.taxe)||0,
    invoiceUrl:p.invoiceUrl||"", quarter:getQuarter(p.issueDate), createdAt:now, updatedAt:now
  };
  const ref = await col.add(doc); return { id:ref.id, ...doc };
}

app.get("/health",(_req,res)=>res.json({ok:true}));
app.get("/invoices", async (req,res)=>{ try{ res.json(await listInvoices((req.query.q||"").toString())); }catch(e){ console.error(e); res.status(500).json({error:"Failed to fetch invoices"});} });
app.post("/invoices", async (req,res)=>{ try{ res.status(201).json(await createInvoice(req.body)); }catch(e){ console.error(e); res.status(400).json({error:"Failed to create invoice"});} });

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log(`API on :${port}`));
