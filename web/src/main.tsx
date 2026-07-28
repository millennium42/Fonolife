import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AppShell,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  PatientLink,
  Sidebar,
  TopBar,
} from "./components/ui";
import "./style.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "doctor";
  license_number?: string | null;
  specialty?: string | null;
};
type Patient = {
  id: string;
  name: string;
  phone: string;
  journey_status: string;
  contact_source: string;
  care_alert: string;
  next_contact_on: string | null;
  assigned_user_name: string;
  responsible_doctor_id?: string | null;
  responsible_doctor_name?: string | null;
  version: number;
  birth_date?: string | null;
  guardian_name?: string | null;
  notes?: string;
  archived_at?: string | null;
  anonymized_at?: string | null;
};
type TimelineItem = {
  id: string;
  kind: string;
  type: string;
  description: string;
  occurred_at: string;
  author: string;
};
type FollowUp = {
  patient_id: string;
  patient_name: string;
  phone: string;
  journey_status: string;
  task_id: string | null;
  title: string | null;
  due_on: string | null;
  timing: string;
  last_contact_at: string | null;
};
type CompanyAccount = {
  id: string;
  short_label: string;
  trade_name: string;
  active: boolean;
};
type FinancialEntry = {
  id: string;
  entry_type: "income" | "expense";
  category: string;
  description: string;
  amount_cents: number;
  occurred_on: string;
  payment_method: string;
  company_account_label: string;
  reversal_of_id: string | null;
  reversed: boolean;
};
type Receivable = {
  id: string;
  patient_id: string;
  amount_cents: number;
  due_on: string;
  payment_method: string;
  patient_name: string;
  product: string;
  company_account_label: string;
  status: "expected" | "received" | "cancelled";
  received_on: string | null;
};
type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  cmv_cents: number;
  execution_time_minutes: number;
  active: boolean;
  version?: number;
  products: { productId: string; quantity: number; productName: string; unitPriceCents: number }[];
};
type ProductItem = {
  id: string;
  name: string;
  brand: string;
  model: string;
  sku?: string | null;
  price_cents: number;
  cost_cents: number;
  min_stock?: number;
  stock_balance: number;
  active: boolean;
  version: number;
};
type FinanceSummary = {
  consolidated: {
    balance_cents: number;
    income_cents: number;
    expense_cents: number;
    sales_revenue_cents: number;
    cmv_cents: number;
    margin_cents: number;
  };
  byAccount: {
    company_account_id: string;
    company_account_label: string;
    balance_cents: number;
    income_cents: number;
    expense_cents: number;
    sales_revenue_cents: number;
    cmv_cents: number;
    margin_cents: number;
  }[];
};
type PatientCommercial = {
  sales: Array<{
    id: string;
    product: string;
    quantity: number;
    total_amount_cents: number;
    cost_amount_cents: number;
    sold_on: string;
    delivery_status: string;
    cancelled_at: string | null;
  }>;
  receivables: Array<{
    id: string;
    product: string;
    amount_cents: number;
    due_on: string;
    payment_method: string;
    status: "expected" | "received" | "cancelled";
  }>;
};
type DashboardData = {
  overdue: number;
  today: number;
  open_tasks: number;
  adaptation: number;
  month_sales: number;
  queue: Pick<FollowUp, "patient_id" | "patient_name" | "phone" | "task_id" | "title" | "due_on" | "timing">[];
  financial?: {
    consolidated: { balance_cents: number; month_income_cents: number; month_expense_cents: number };
    byAccount: { company_account_id: string; company_account_label: string; balance_cents: number; month_income_cents: number; month_expense_cents: number }[];
  };
};
const statuses: { [key: string]: string } = {
  new_lead: "Novo lead",
  screening: "Triagem",
  assessment_scheduled: "Avaliação marcada",
  proposal: "Em proposta",
  sale_completed: "Venda realizada",
  adaptation: "Adaptação",
  follow_up: "Acompanhamento",
  inactive: "Inativo",
};
const sources: { [key: string]: string } = {
  referral: "Indicação",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  google: "Google",
  walk_in: "Passou na clínica",
  other: "Outro",
};
const eventTypes: { [key: string]: string } = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  consultation: "Consulta",
  device_adjustment: "Ajuste de aparelho",
  cleaning: "Limpeza",
  maintenance: "Manutenção",
  exchange: "Troca",
  warranty: "Garantia",
  clinical_note: "Observação clínica",
  scheduled_return: "Retorno programado",
};
const categoryLabels: { [key: string]: string } = {
  hearing_aid_sale: "Venda de Aparelho Auditivo",
  consultation: "Consulta / Atendimento",
  maintenance: "Manutenção / Insumos",
  supplier: "Fornecedor / Peças",
  rent: "Aluguel / Condomínio",
  payroll: "Folha de Pagamento / Pró-labore",
  taxes: "Impostos / Taxas",
  utility: "Energia / Água / Telecom",
  other: "Outras Despesas/Receitas",
};
const paymentLabels: { [key: string]: string } = {
  cash: "Dinheiro",
  pix: "PIX",
  debit_card: "Cartão de Débito",
  credit_card: "Cartão de Crédito",
  bank_transfer: "Transferência / TED",
  boleto: "Boleto Bancário",
  other: "Outros",
};

const date = (value: string | null | undefined) => {
  if (!value) return "Não informado";
  const civil = value.slice(0, 10);
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(civil) ? `${civil}T12:00:00` : value);
  return Number.isNaN(parsed.valueOf()) ? "Não informado" : new Intl.DateTimeFormat("pt-BR").format(parsed);
};

const money = (centsValue: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((centsValue || 0) / 100);

async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const err = new Error(body.title ?? "Não foi possível concluir") as any;
    err.status = response.status;
    throw err;
  }
  return body;
}

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const cents = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

function monthly(total: number, count: number, first: string) {
  const [year, monthVal, dayVal] = first.split("-").map(Number),
    base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => {
    const target = monthVal - 1 + index,
      y = year + Math.floor(target / 12),
      m = target % 12,
      last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return {
      amountCents: index === count - 1 ? total - base * (count - 1) : base,
      dueOn: `${y}-${String(m + 1).padStart(2, "0")}-${String(Math.min(dayVal, last)).padStart(2, "0")}`,
    };
  });
}

function GlobalPatientModal({ user, patientId, onClose }: { user: User; patientId: string | null; onClose: () => void }) {
  if (!patientId) return null;
  return (
    <Drawer label="Prontuário do paciente" onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>📋 Prontuário do Paciente</h2>
          <button className="secondary" onClick={onClose}>✕ Fechar Prontuário</button>
        </div>
        <PatientRecord id={patientId} user={user} onBack={onClose} />
    </Drawer>
  );
}

function SaleForm({
  patientId,
  onDone,
}: {
  patientId: string;
  onDone: () => void;
}) {
  const requestId = useRef(crypto.randomUUID());
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedType, setSelectedType] = useState<"product" | "service">("product");
  const [selectedId, setSelectedId] = useState("");
  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/company-accounts")
      .then((x) => setAccounts(x.accounts.filter((a: CompanyAccount) => a.active)))
      .catch((e) => setError(e.message));
    api("/api/products").then((p) => setProducts(p.products || [])).catch(() => {});
    api("/api/services").then((s) => setServices(s.services || [])).catch(() => {});
  }, []);

  const handleSelectCatalogItem = (id: string, type: "product" | "service") => {
    setSelectedId(id);
    setSelectedType(type);
    if (type === "product") {
      const p = products.find((x) => x.id === id);
      if (p) {
        setProductName(`${p.name} (${p.brand} ${p.model})`);
        setUnitPrice((p.price_cents / 100).toFixed(2));
      }
    } else {
      const s = services.find((x) => x.id === id);
      if (s) {
        setProductName(s.name);
        setUnitPrice((s.price_cents / 100).toFixed(2));
      }
    }
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget,
      v = Object.fromEntries(new FormData(form)),
      total = cents(String(v.total)),
      received = v.received ? cents(String(v.received)) : total,
      count = Number(v.futureCount || 0),
      soldOn = String(v.soldOn),
      firstDue = String(v.firstDueOn || soldOn);
    const installments: any[] = [];
    if (received > 0)
      installments.push({
        amountCents: received,
        paymentMethod: v.receivedMethod,
        dueOn: soldOn,
        receivedOn: soldOn,
      });
    const future = total - received;
    if (future > 0 && count > 0)
      installments.push(
        ...monthly(future, count, firstDue).map((item) => ({
          ...item,
          paymentMethod: v.futureMethod,
        })),
      );
    if (
      total < 1 ||
      received > total ||
      installments.reduce((sum, item) => sum + item.amountCents, 0) !== total
    ) {
      setError("Confira o total, o valor recebido e a quantidade de parcelas.");
      setSaving(false);
      return;
    }
    try {
      await api("/api/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId.current,
          patientId,
          productId: selectedType === "product" ? selectedId || undefined : undefined,
          serviceId: selectedType === "service" ? selectedId || undefined : undefined,
          product: productName || String(v.product),
          quantity: Number(v.quantity),
          totalAmountCents: total,
          soldOn,
          companyAccountId: v.companyAccountId,
          notes: v.notes,
          warrantyUntil: v.warrantyUntil || undefined,
          deliveryStatus: v.deliveryStatus,
          installments,
        }),
      });
      form.reset();
      requestId.current = crypto.randomUUID();
      onDone();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>🛒 Nova Venda / Lançamento de Serviço no Prontuário</h2>
      {error && <p className="error" role="alert">{error}</p>}

      <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
        <h3>Escolher do Catálogo de Produtos & Serviços</h3>
        <div className="fields" style={{ marginBottom: "0.5rem" }}>
          <label>
            Tipo de Item
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as any)}>
              <option value="product">Produto / Aparelho Auditivo</option>
              <option value="service">Serviço / Atendimento Fonoaudiológico</option>
            </select>
          </label>
          <label>
            Item do Catálogo
            <select value={selectedId} onChange={(e) => handleSelectCatalogItem(e.target.value, selectedType)}>
              <option value="">-- Selecione do catálogo ou digite abaixo --</option>
              {selectedType === "product"
                ? products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand}) — {money(p.price_cents)} [Estoque: {p.stock_balance}]</option>
                  ))
                : services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {money(s.price_cents)} ({s.execution_time_minutes} min)</option>
                  ))}
            </select>
          </label>
        </div>
      </div>

      <div className="fields">
        <label className="wide">
          Descrição do Item Comercializado
          <input
            name="product"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            placeholder="Ex: Aparelho Auditivo Charge&Go 7AX ou Consulta Audiométrica"
          />
        </label>
        <label>
          Quantidade
          <input name="quantity" type="number" defaultValue={1} min={1} required />
        </label>
        <label>
          Valor Total Negociado (R$)
          <input name="total" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
        </label>
        <label>
          Data da Venda
          <input name="soldOn" type="date" defaultValue={today()} required />
        </label>
        <label>
          Caixa / CNPJ Emissor
          <select name="companyAccountId" required>
            <option value="">Selecione a Conta Jurídica</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.short_label} — {a.trade_name}</option>
            ))}
          </select>
        </label>
        <label>
          Status da Entrega / Procedimento
          <select name="deliveryStatus" defaultValue="completed">
            <option value="pending">Pendente de Entrega</option>
            <option value="delivered">Entregue ao Paciente</option>
            <option value="adaptation">Em Adaptação Fonoaudiológica</option>
            <option value="completed">Concluído / Atendido</option>
          </select>
        </label>
      </div>

      <h3>Recebimento e Condições de Pagamento</h3>
      <div className="fields">
        <label>
          Valor Entrada / À Vista (R$)
          <input name="received" placeholder="Ex: 1000,00" />
        </label>
        <label>
          Forma do Pagamento à Vista
          <select name="receivedMethod" defaultValue="pix">
            {Object.entries(paymentLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Qtd. de Parcelas Futuras
          <input name="futureCount" type="number" defaultValue={0} min={0} />
        </label>
        <label>
          Forma das Parcelas Futuras
          <select name="futureMethod" defaultValue="credit_card">
            {Object.entries(paymentLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          1ª Parcela Futura em
          <input name="firstDueOn" type="date" defaultValue={today()} />
        </label>
        <label>
          Garantia até (Opcional)
          <input name="warrantyUntil" type="date" />
        </label>
      </div>

      <label>
        Observações de Negociação
        <textarea name="notes" rows={2} placeholder="Descreva condições contratuais ou adaptação..." />
      </label>

      <div className="actions">
        <button disabled={saving}>{saving ? "Registrando Venda..." : "Concluir e Emitir Venda"}</button>
        <button type="button" className="secondary" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

function PosCheckout({ user, openGlobalPatient }: { user: User; openGlobalPatient: (id: string) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: string; name: string; priceCents: number; qty: number; type: "product" | "service" }[]>([]);
  const [companyAccountId, setCompanyAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const checkoutInFlight = useRef(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = () => {
    api("/api/patients").then((p) => setPatients(p.patients || [])).catch(() => {});
    api("/api/products").then((p) => setProducts(p.products || [])).catch(() => {});
    api("/api/services").then((s) => setServices(s.services || [])).catch(() => {});
    api("/api/company-accounts").then((a) => {
      const active = (a.accounts || []).filter((x: CompanyAccount) => x.active);
      setAccounts(active);
      if (active.length > 0) setCompanyAccountId(active[0].id);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (id: string, name: string, priceCents: number, type: "product" | "service") => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === id && item.type === type);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [...prev, { id, name, priceCents, qty: 1, type }];
    });
  };

  const updateQty = (id: string, type: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => !(i.id === id && i.type === type));
      return prev.map((i) => (i.id === id && i.type === type ? { ...i, qty } : i));
    });
  };

  const totalCents = cart.reduce((acc, item) => acc + item.priceCents * item.qty, 0);

  const handleCheckout = async () => {
    if (checkoutInFlight.current) return;
    if (!selectedPatientId) { setError("Selecione um paciente para registrar o caixa."); return; }
    if (!companyAccountId) { setError("Selecione a conta/caixa responsável."); return; }
    if (cart.length === 0) { setError("Adicione ao menos um produto ou serviço ao carrinho."); return; }

    checkoutInFlight.current = true;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      for (const item of cart) {
        const requestId = crypto.randomUUID();
        const itemTotal = item.priceCents * item.qty;
        const instList = monthly(itemTotal, installmentsCount, today()).map((i) => ({
          ...i,
          paymentMethod,
          receivedOn: installmentsCount === 1 ? today() : undefined,
        }));

        await api("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientRequestId: requestId,
            patientId: selectedPatientId,
            productId: item.type === "product" ? item.id : undefined,
            serviceId: item.type === "service" ? item.id : undefined,
            product: item.name,
            quantity: item.qty,
            totalAmountCents: itemTotal,
            soldOn: today(),
            companyAccountId,
            deliveryStatus: "completed",
            installments: instList,
          }),
        });
      }
      setSuccessMsg("🎉 Venda no Caixa realizada com sucesso! Comprovante emitido e estoque/financeiro atualizados.");
      setCart([]);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      checkoutInFlight.current = false;
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  const filteredServices = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>🏬 Terminal de Caixa & PDV Operador</h2>
          <p>Realize vendas diretas no balcão de produtos e serviços para os pacientes da clínica.</p>
        </div>
      </div>

      {successMsg && <p className="success" role="status">{successMsg}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="fields" style={{ margin: "1rem 0" }}>
        <label className="wide">
          1. Selecionar Paciente
          <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
            <option value="">-- Buscar Paciente Cadastrado --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.phone}) — {statuses[p.journey_status]}</option>
            ))}
          </select>
        </label>
        {selectedPatientId && (
          <div style={{ gridColumn: "1/-1" }}>
            <PatientLink patientId={selectedPatientId} name="👉 Clique aqui para ver o prontuário deste paciente" onOpen={openGlobalPatient} />
          </div>
        )}
      </div>

      <div className="pos-grid">
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <input
              placeholder="🔍 Buscar produto ou serviço por nome ou marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <h3>Catálogo de Produtos</h3>
          <div className="catalog-grid" style={{ marginBottom: "1.5rem" }}>
            {filteredProducts.map((p) => (
              <div key={p.id} className="catalog-card">
                <div>
                  <h4>{p.name}</h4>
                  <small style={{ color: "#64748b" }}>{p.brand} {p.model}</small>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0284c7", margin: "0.4rem 0" }}>
                    {money(p.price_cents)}
                  </div>
                  <span className={`badge ${p.stock_balance > 0 ? "success" : "danger"}`}>
                    Estoque: {p.stock_balance} un.
                  </span>
                </div>
                <button
                  type="button"
                  style={{ marginTop: "0.75rem", width: "100%" }}
                  disabled={p.stock_balance <= 0}
                  onClick={() => addToCart(p.id, `${p.name} (${p.brand})`, p.price_cents, "product")}
                >
                  + Adicionar ao Carrinho
                </button>
              </div>
            ))}
          </div>

          <h3>Catálogo de Serviços</h3>
          <div className="catalog-grid">
            {filteredServices.map((s) => (
              <div key={s.id} className="catalog-card">
                <div>
                  <h4>{s.name}</h4>
                  <small style={{ color: "#64748b" }}>⏱️ {s.execution_time_minutes} min</small>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0284c7", margin: "0.4rem 0" }}>
                    {money(s.price_cents)}
                  </div>
                  {s.products.length > 0 && (
                    <small style={{ display: "block", color: "#475569" }}>
                      Consome insumos: {s.products.map((x) => `${x.quantity}x ${x.productName}`).join(", ")}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  style={{ marginTop: "0.75rem", width: "100%" }}
                  onClick={() => addToCart(s.id, s.name, s.price_cents, "service")}
                >
                  + Adicionar Serviço
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-panel">
          <h3>🛒 Resumo do Carrinho</h3>
          {cart.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", margin: "2rem 0" }}>O carrinho está vazio.<br />Escolha produtos ou serviços ao lado.</p>
          ) : (
            <div>
              {cart.map((item) => (
                <div key={`${item.type}-${item.id}`} className="cart-item">
                  <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{money(item.priceCents)} un.</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <button type="button" className="secondary" style={{ padding: "2px 8px", minHeight: "auto" }} onClick={() => updateQty(item.id, item.type, item.qty - 1)}>-</button>
                    <span>{item.qty}</span>
                    <button type="button" className="secondary" style={{ padding: "2px 8px", minHeight: "auto" }} onClick={() => updateQty(item.id, item.type, item.qty + 1)}>+</button>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: "2px solid #e2e8f0", marginTop: "1rem", paddingTop: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "bold" }}>
                  <span>Total:</span>
                  <span style={{ color: "#0284c7" }}>{money(totalCents)}</span>
                </div>
              </div>

              <div className="fields" style={{ marginTop: "1rem" }}>
                <label>
                  Caixa Receptor
                  <select value={companyAccountId} onChange={(e) => setCompanyAccountId(e.target.value)} required>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.short_label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Forma de Pagamento
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {Object.entries(paymentLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Parcelamento
                  <select value={installmentsCount} onChange={(e) => setInstallmentsCount(Number(e.target.value))}>
                    <option value={1}>À Vista / 1x</option>
                    <option value={2}>2x Sem Juros</option>
                    <option value={3}>3x Sem Juros</option>
                    <option value={6}>6x Sem Juros</option>
                    <option value={10}>10x Sem Juros</option>
                    <option value={12}>12x Sem Juros</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                style={{ width: "100%", marginTop: "1.25rem" }}
                disabled={loading}
                onClick={handleCheckout}
              >
                {loading ? "Processando Caixa..." : "💳 Finalizar Venda no Caixa"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}



function Finance({ user, openGlobalPatient }: { user: User; openGlobalPatient: (id: string) => void }) {
  const [tab, setTab] = useState<"entries" | "receivables">("entries");
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reversalModalEntry, setReversalModalEntry] = useState<FinancialEntry | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [filters, setFilters] = useState({ from: "", to: "", companyAccountId: "", entryType: "", category: "", paymentMethod: "" });
  const [pageOffset, setPageOffset] = useState(0);
  const [entriesHasMore, setEntriesHasMore] = useState(false);
  const [receivablesHasMore, setReceivablesHasMore] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const operationIds = useRef(new Set<string>());

  const load = async () => {
    try {
      const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      q.set("limit", "25");
      q.set("offset", String(pageOffset));
      const [accData, entriesData, recData] = await Promise.all([
        api("/api/company-accounts"),
        api(`/api/finance/entries?${q.toString()}`),
        api(`/api/finance/receivables?${q.toString()}`),
      ]);
      setAccounts(accData.accounts || []);
      setEntries(entriesData.entries || []);
      setReceivables(recData.receivables || []);
      setEntriesHasMore(Boolean(entriesData.pagination?.hasMore));
      setReceivablesHasMore(Boolean(recData.pagination?.hasMore));
      if (user.role === "admin") {
        const sumData = await api(`/api/finance/summary?${q.toString()}`);
        setSummary(sumData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters, tab, pageOffset]);

  useEffect(() => {
    setPageOffset(0);
  }, [filters, tab]);

  async function createEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget, v = Object.fromEntries(new FormData(form));
    try {
      await api("/api/finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: crypto.randomUUID(),
          entryType: v.entryType,
          category: v.category,
          description: String(v.description),
          amountCents: cents(String(v.amount)),
          competenceOn: String(v.competenceOn),
          occurredOn: String(v.occurredOn),
          paymentMethod: v.paymentMethod,
          companyAccountId: v.companyAccountId,
          notes: String(v.notes || ""),
        }),
      });
      setShowForm(false);
      setMessage("Lançamento financeiro realizado com sucesso.");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleConfirmReversal() {
    if (!reversalModalEntry) return;
    if (!reversalReason.trim() || reversalReason.trim().length < 3) {
      setError("Escreva uma justificativa válida para o estorno.");
      return;
    }
    try {
      await api(`/api/admin/finance/entries/${reversalModalEntry.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reversalReason: reversalReason.trim(),
          occurredOn: today(),
        }),
      });
      setReversalModalEntry(null);
      setReversalReason("");
      setMessage("Lançamento estornado com sucesso (histórico append-only).");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const [settleReceivable, setSettleReceivable] = useState<Receivable | null>(null);

  async function handleConfirmSettle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settleReceivable) return;
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const receivedOn = String(formData.get("receivedOn"));
    const companyAccountId = String(formData.get("companyAccountId"));
    const paymentMethod = String(formData.get("paymentMethod"));

    try {
      await api(`/api/finance/receivables/${settleReceivable.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: crypto.randomUUID(),
          receivedOn,
          companyAccountId,
          paymentMethod,
        }),
      });
      setSettleReceivable(null);
      setMessage(`Baixa de parcela confirmada para ${settleReceivable.patient_name}.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function exportCsv() {
    setError("");
    const q = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const response = await fetch(`/api/finance/entries.csv?${q.toString()}`);
    if (!response.ok) {
      const problem = await response.json();
      setError(problem.title ?? "Não foi possível exportar o financeiro.");
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "fonolife-financeiro.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>📊 Relatório & Balanço Financeiro Reformulado</h2>
          <p>Acompanhamento de DRE, fluxo de caixa, relatórios por CNPJ e previsão de recebimentos.</p>
        </div>
        <div className="actions">
          <Button onClick={() => setShowForm(true)}>+ Novo Lançamento</Button>
          <Button variant="secondary" onClick={exportCsv}>Exportar CSV</Button>
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {user.role === "admin" && summary && (
        <div className="finance-summary">
          <div className="kpi-card">
            <span>Saldo Consolidado</span>
            <strong style={{ color: summary.consolidated.balance_cents >= 0 ? "var(--success)" : "var(--danger)" }}>
              {money(summary.consolidated.balance_cents)}
            </strong>
          </div>
          <div className="kpi-card">
            <span>Entradas Realizadas</span>
            <strong style={{ color: "var(--success)" }}>+{money(summary.consolidated.income_cents)}</strong>
          </div>
          <div className="kpi-card">
            <span>Saídas Realizadas</span>
            <strong style={{ color: "var(--danger)" }}>−{money(summary.consolidated.expense_cents)}</strong>
          </div>
          <div className="kpi-card">
            <span>Vendas por Competência</span>
            <strong>{money(summary.consolidated.sales_revenue_cents)}</strong>
          </div>
          <div className="kpi-card">
            <span>CMV Histórico</span>
            <strong>{money(summary.consolidated.cmv_cents)}</strong>
          </div>
          <div className="kpi-card">
            <span>Margem Bruta</span>
            <strong style={{ color: summary.consolidated.margin_cents >= 0 ? "var(--success)" : "var(--danger)" }}>
              {money(summary.consolidated.margin_cents)}
            </strong>
          </div>
        </div>
      )}

      {user.role === "admin" && summary && (
        <div className="finance-accounts" style={{ marginBottom: "1.5rem" }}>
          {summary.byAccount.map((account) => (
            <div key={account.company_account_id} className="panel">
              <strong>{account.company_account_label}</strong>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0.3rem 0" }}>
                Saldo: {money(account.balance_cents)}
              </div>
              <small style={{ color: "#64748b" }}>
                Entradas: {money(account.income_cents)} · Saídas: {money(account.expense_cents)}
              </small>
            </div>
          ))}
        </div>
      )}

      <div className="sub-tabs">
        <button className={tab === "entries" ? "active" : ""} onClick={() => setTab("entries")}>
          Lançamentos Realizados
        </button>
        <button className={tab === "receivables" ? "active" : ""} onClick={() => setTab("receivables")}>
          Previsão de Parcelas a Receber
        </button>
      </div>

      <div className="fields" style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <label>De <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
        <label>Até <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
        <label>
          Caixa / Empresa
          <select value={filters.companyAccountId} onChange={(e) => setFilters({ ...filters, companyAccountId: e.target.value })}>
            <option value="">Todas as Contas</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.short_label}</option>)}
          </select>
        </label>
        <label>
          Forma Pagamento
          <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}>
            <option value="">Todas</option>
            {Object.entries(paymentLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      {tab === "entries" ? (
        <DataTable aria-label="Lançamentos financeiros">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Caixa / Empresa</th>
              <th>Forma</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((item) => (
              <tr key={item.id}>
                <td>{date(item.occurred_on)}</td>
                <td><strong>{item.description}</strong></td>
                <td>{categoryLabels[item.category] || item.category}</td>
                <td>{item.company_account_label}</td>
                <td>{paymentLabels[item.payment_method]}</td>
                <td style={{ fontWeight: "bold", color: item.entry_type === "income" ? "var(--success)" : "var(--danger)" }}>
                  {item.entry_type === "income" ? "+" : "−"} {money(item.amount_cents)}
                </td>
                <td>
                  <span className={`badge ${item.reversed ? "danger" : item.reversal_of_id ? "warning" : "success"}`}>
                    {item.reversed ? "Estornado" : item.reversal_of_id ? "Compensatório" : "Ativo"}
                  </span>
                </td>
                <td>
                  {user.role === "admin" && !item.reversal_of_id && !item.reversed && (
                    <button type="button" className="danger" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => setReversalModalEntry(item)}>
                      Estornar (Modal)
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <DataTable aria-label="Parcelas a receber">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Vencimento</th>
              <th>Produto / Serviço</th>
              <th>Caixa Emissor</th>
              <th>Forma</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => (
              <tr key={r.id}>
                <td><PatientLink patientId={r.patient_id} name={r.patient_name} onOpen={openGlobalPatient} /></td>
                <td>{date(r.due_on)}</td>
                <td>{r.product}</td>
                <td>{r.company_account_label}</td>
                <td>{paymentLabels[r.payment_method]}</td>
                <td style={{ fontWeight: "bold" }}>{money(r.amount_cents)}</td>
                <td>
                  <span className={`badge ${r.status === "received" ? "success" : r.status === "expected" ? "warning" : "danger"}`}>
                    {r.status === "received" ? "Recebido" : r.status === "expected" ? "Previsto" : "Cancelado"}
                  </span>
                </td>
                <td>
                  {r.status === "expected" && (
                    <button type="button" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => setSettleReceivable(r)}>
                      💳 Baixar Parcela
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <nav className="pagination" aria-label={`Paginação de ${tab === "entries" ? "lançamentos" : "recebíveis"}`}>
        <Button variant="secondary" disabled={pageOffset === 0} onClick={() => setPageOffset(Math.max(0, pageOffset - 25))}>
          Anterior
        </Button>
        <span>Página {Math.floor(pageOffset / 25) + 1}</span>
        <Button
          variant="secondary"
          disabled={!(tab === "entries" ? entriesHasMore : receivablesHasMore)}
          onClick={() => setPageOffset(pageOffset + 25)}
        >
          Próxima
        </Button>
      </nav>

      {/* Modal de Baixa de Parcela */}
      {settleReceivable && (
        <Modal label="Baixar parcela" onClose={() => setSettleReceivable(null)} size="small">
            <h2>💳 Baixar Parcela — <PatientLink patientId={settleReceivable.patient_id} name={settleReceivable.patient_name} onOpen={openGlobalPatient} /></h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              Item: <strong>{settleReceivable.product}</strong> | Valor: <strong>{money(settleReceivable.amount_cents)}</strong>
            </p>

            <form onSubmit={handleConfirmSettle} className="form" style={{ marginTop: "1rem" }}>
              <label>
                Data do Recebimento Real
                <input name="receivedOn" type="date" defaultValue={today()} required />
              </label>

              <label>
                Caixa / Conta Receptora
                <select name="companyAccountId" defaultValue={accounts.find((a) => a.short_label === settleReceivable.company_account_label)?.id || accounts[0]?.id || ""} required>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.short_label} — {a.trade_name}</option>
                  ))}
                </select>
              </label>

              <label>
                Meio de Pagamento
                <select name="paymentMethod" defaultValue={settleReceivable.payment_method}>
                  {Object.entries(paymentLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" className="secondary" onClick={() => setSettleReceivable(null)}>Cancelar</button>
                <button type="submit">Confirmar Recebimento</button>
              </div>
            </form>
        </Modal>
      )}

      {showForm && (
        <Modal label="Novo lançamento financeiro" onClose={() => setShowForm(false)}>
            <form onSubmit={createEntry} className="form">
              <h3>💵 Lançamento no Fluxo de Caixa</h3>
              <div className="fields">
                <label>Tipo <select name="entryType" required><option value="income">Entrada / Receita</option><option value="expense">Saída / Despesa</option></select></label>
                <label>Categoria <select name="category" required>{Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>Valor (R$) <input name="amount" required placeholder="Ex: 250,00" /></label>
                <label>Data Competência <input name="competenceOn" type="date" defaultValue={today()} required /></label>
                <label>Data Pagamento <input name="occurredOn" type="date" defaultValue={today()} required /></label>
                <label>Forma <select name="paymentMethod" defaultValue="pix">{Object.entries(paymentLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="wide">Caixa / Empresa <select name="companyAccountId" required><option value="">Selecione</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.short_label} — {a.trade_name}</option>)}</select></label>
              </div>
              <label className="wide">Descrição <input name="description" required minLength={2} placeholder="Ex: Pagamento de insumos audiométricos" /></label>
              <label className="wide">Observações <textarea name="notes" rows={2} /></label>
              <div className="actions" style={{ marginTop: "1rem" }}>
                <button type="submit">Salvar Lançamento</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </form>
        </Modal>
      )}

      {reversalModalEntry && (
        <Modal label="Estornar lançamento financeiro" onClose={() => setReversalModalEntry(null)}>
            <h3>⚠️ Popup Modal de Estorno Financeiro Imutável</h3>
            <p>Os lançamentos no Fonolife são <strong>append-only</strong>. O estorno gerará um registro compensatório oposto vinculado a esta entrada.</p>
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", margin: "1rem 0" }}>
              <strong>Item:</strong> {reversalModalEntry.description} — <strong>{money(reversalModalEntry.amount_cents)}</strong>
            </div>
            <label>
              Justificativa do Estorno (Mínimo 3 caracteres)
              <input value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} placeholder="Ex: Lançamento duplicado pelo operador" required minLength={3} />
            </label>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="danger" onClick={handleConfirmReversal}>Confirmar Estorno Auditado</button>
              <button type="button" className="secondary" onClick={() => setReversalModalEntry(null)}>Cancelar</button>
            </div>
        </Modal>
      )}
    </section>
  );
}

function Patients({ initialPatientId, user, openGlobalPatient }: { initialPatientId?: string | null; user: User; openGlobalPatient: (id: string) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialPatientId || null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const loadPatients = () => {
    api(`/api/patients?search=${encodeURIComponent(search)}`).then((d) => setPatients(d.patients || [])).catch(() => {});
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  return (
    <div>
      {selectedId ? (
        <PatientRecord id={selectedId} user={user} onBack={() => setSelectedId(null)} />
      ) : (
        <section className="card">
          <div className="section-title">
            <div>
              <h2>👥 Cadastro de Pacientes & Prontuários</h2>
              <p>Gerencie informações clínicas, agendamentos e histórico de atendimentos.</p>
            </div>
            <button onClick={() => setShowAddForm(true)}>+ Novo Paciente</button>
          </div>

          <div style={{ margin: "1rem 0" }}>
            <input placeholder="🔍 Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {showAddForm && (
            <Modal label="Novo paciente" onClose={() => setShowAddForm(false)}>
                <PatientForm onCancel={() => setShowAddForm(false)} onDone={(id) => { setShowAddForm(false); setSelectedId(id); }} />
            </Modal>
          )}

          <table>
            <thead>
              <tr>
                <th>Nome do Paciente</th>
                <th>Telefone</th>
                <th>Jornada / Status</th>
                <th>Médico Responsável</th>
                <th>Próxima Ação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <PatientLink patientId={p.id} name={p.name} onOpen={openGlobalPatient} />
                  </td>
                  <td>{p.phone}</td>
                  <td><span className="badge info">{statuses[p.journey_status]}</span></td>
                  <td>{p.responsible_doctor_name || "Não informado"}</td>
                  <td>{date(p.next_contact_on)}</td>
                  <td>
                    <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => setSelectedId(p.id)}>
                      Abrir Ficha →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function PatientAttachments({ patientId }: { patientId: string }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [category, setCategory] = useState("audiometry");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

  const categoryLabels: Record<string, string> = {
    audiometry: "🎧 Audiometria",
    exam_report: "📋 Laudo de Exame",
    medical_request: "🩺 Solicitação Médica",
    other: "📁 Outros Documentos",
  };

  const load = () => {
    api(`/api/patients/${patientId}/attachments`)
      .then((d) => setAttachments(d?.attachments || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = (ev.target?.result as string).split(",")[1];
        await api(`/api/patients/${patientId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/pdf",
            contentBase64: base64,
            category,
            clinicalNotes,
          }),
        });
        setClinicalNotes("");
        load();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Deseja realmente arquivar este anexo clínico?")) return;
    try {
      await api(`/api/attachments/${id}/archive`, { method: "POST" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <h3>📄 Exames & Laudos Audiométricos</h3>
      {error && <p className="error" role="alert">{error}</p>}

      <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", margin: "0.75rem 0", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <label>
            Categoria do Documento:
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="audiometry">🎧 Audiometria Tonal/Vocal</option>
              <option value="exam_report">📋 Laudo de Exame</option>
              <option value="medical_request">🩺 Solicitação Médica</option>
              <option value="other">📁 Outros Documentos</option>
            </select>
          </label>
          <label>
            Observações Clínicas (Opcional):
            <input value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Ex: Audiograma com perda neurossensorial moderada" />
          </label>
        </div>
        <label style={{ display: "block", margin: "0.5rem 0" }}>
          <span>+ Anexar Laudo (PDF / Imagem máx 10MB):</span>{" "}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} />
        </label>
        {uploading && <p style={{ fontSize: "0.85rem", color: "#0284c7" }}>Enviando laudo e verificando quarentena/scanner de vírus...</p>}
      </div>

      {attachments.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Nenhum laudo anexado a este paciente.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {attachments.map((a) => (
            <li key={a.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{a.original_name}</strong>{" "}
                  <span className="badge info" style={{ fontSize: "0.75rem" }}>{categoryLabels[a.category] || a.category}</span>{" "}
                  <small style={{ color: "#64748b" }}>({(a.size_bytes / 1024).toFixed(1)} KB)</small>
                  {a.clinical_notes && (
                    <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.25rem" }}>
                      📝 <em>{a.clinical_notes}</em>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => setPreviewAttachment(a)}>
                    👁️ Visualizar Exame
                  </button>
                  <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noopener noreferrer" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", background: "#f1f5f9", borderRadius: "4px", textDecoration: "none", color: "#0f172a", fontWeight: "bold" }}>
                    📥 Baixar
                  </a>
                  <button type="button" className="danger" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => handleArchive(a.id)}>
                    🗑️ Arquivar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de Pré-visualização Segura */}
      {previewAttachment && (
        <Modal label={`Visualizar ${previewAttachment.original_name}`} onClose={() => setPreviewAttachment(null)} size="large">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>👁️ Visualizador Seguro: {previewAttachment.original_name}</h3>
              <button type="button" className="secondary" onClick={() => setPreviewAttachment(null)}>Fechar</button>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px", marginBottom: "1rem" }}>
              <small>Categoria: <strong>{categoryLabels[previewAttachment.category] || previewAttachment.category}</strong> | Observações: <em>{previewAttachment.clinical_notes || "Nenhuma"}</em></small>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", minHeight: "450px", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9" }}>
              {previewAttachment.mime_type.includes("pdf") ? (
                <iframe
                  src={`/api/attachments/${previewAttachment.id}/preview`}
                  title={previewAttachment.original_name}
                  style={{ width: "100%", height: "550px", border: "none" }}
                />
              ) : (
                <img
                  src={`/api/attachments/${previewAttachment.id}/preview`}
                  alt={previewAttachment.original_name}
                  style={{ maxWidth: "100%", maxHeight: "550px", objectFit: "contain" }}
                />
              )}
            </div>
        </Modal>
      )}
    </div>
  );
}

function PatientMedicalReports({ patientId, user }: { patientId: string; user: User }) {
  const [reports, setReports] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewReport, setViewReport] = useState<any | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    api(`/api/patients/${patientId}/medical-reports`)
      .then((d) => setReports(d?.reports || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handlePrint = async (reportId: string) => {
    try {
      await api(`/api/medical-reports/${reportId}/print-audit`, { method: "POST" });
    } catch {}
    window.print();
  };

  return (
    <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>🩺 Laudos Médicos & Avaliações Fonoaudiológicas</h3>
        <button type="button" onClick={() => setShowNewModal(true)}>+ Emitir Novo Laudo</button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {reports.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>Nenhum laudo médico/fonoaudiológico emitido para este paciente.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0 0" }}>
          {reports.map((r) => (
            <li key={r.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{r.title}</strong>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  Emitido em: {date(r.issued_at)} por <strong>{r.professional_name} ({r.professional_license})</strong>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Diagnóstico: <em>{r.diagnosis}</em>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }} onClick={() => setViewReport(r)}>
                  👁️ Visualizar Laudo Timbrado
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de Emissão de Laudo */}
      {showNewModal && (
        <NewMedicalReportModal
          patientId={patientId}
          user={user}
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); load(); }}
        />
      )}

      {/* Modal de Visualização & Impressão do Laudo Timbrado */}
      {viewReport && (
        <Modal label="Pré-visualização do laudo" onClose={() => setViewReport(null)} size="large">
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h3>👁️ Pré-visualização do Laudo Oficial Timbrado</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => handlePrint(viewReport.id)}>🖨️ Imprimir / Gerar PDF</button>
                <button type="button" className="secondary" onClick={() => setViewReport(null)}>Fechar</button>
              </div>
            </div>

            {/* Folha Oficial Timbrada */}
            <div id="printable-medical-report" style={{ background: "white", padding: "2rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontFamily: "Georgia, serif", color: "#0f172a", lineHeight: 1.6 }}>
              {/* Cabeçalho da Clínica */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #0284c7", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h2 style={{ color: "#0284c7", margin: 0, fontSize: "1.5rem", fontFamily: "sans-serif" }}>FONOLIFE</h2>
                <h3 style={{ margin: "0.2rem 0", fontSize: "1.1rem", fontWeight: "normal", color: "#334155" }}>Clínica Integrada de Fonoaudiologia & Saúde Auditiva</h3>
                <small style={{ color: "#64748b" }}>CNPJ: 12.345.678/0001-90 | Responsabilidade Técnica Fonoaudiológica</small>
              </div>

              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "6px", marginBottom: "1.5rem", border: "1px solid #e2e8f0", fontSize: "0.95rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div><strong>Paciente:</strong> {viewReport.patient_name || "Paciente Cadastrado"}</div>
                  <div><strong>Data de Emissão:</strong> {date(viewReport.issued_at)}</div>
                  <div><strong>Profissional Emissor:</strong> {viewReport.professional_name}</div>
                  <div><strong>Registro Profissional:</strong> {viewReport.professional_license}</div>
                </div>
              </div>

              <h2 style={{ textAlign: "center", fontSize: "1.3rem", margin: "1.5rem 0", color: "#0f172a", textTransform: "uppercase" }}>{viewReport.title}</h2>

              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ color: "#0284c7", marginBottom: "0.4rem" }}>1. Diagnóstico Clínico e Hipótese:</h4>
                <p style={{ margin: 0, textIndent: "1rem" }}>{viewReport.diagnosis}</p>
              </div>

              {viewReport.audiometric_findings && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <h4 style={{ color: "#0284c7", marginBottom: "0.4rem" }}>2. Achados Audiométricos & Limiares Tonais:</h4>
                  <p style={{ margin: 0, textIndent: "1rem" }}>{viewReport.audiometric_findings}</p>
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ color: "#0284c7", marginBottom: "0.4rem" }}>3. Conduta Recomendada & Reabilitação:</h4>
                <p style={{ margin: 0, textIndent: "1rem" }}>{viewReport.recommendation}</p>
              </div>

              {viewReport.conclusion && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#0284c7", marginBottom: "0.4rem" }}>4. Parecer Final & Aprazamento:</h4>
                  <p style={{ margin: 0, textIndent: "1rem" }}>{viewReport.conclusion}</p>
                </div>
              )}

              <div style={{ marginTop: "3.5rem", textAlign: "center" }}>
                <div style={{ width: "300px", margin: "0 auto", borderTop: "1px solid #0f172a", paddingTop: "0.5rem" }}>
                  <strong>{viewReport.professional_name}</strong>
                  <div style={{ fontSize: "0.9rem", color: "#475569" }}>{viewReport.professional_license}</div>
                </div>
              </div>
            </div>
        </Modal>
      )}
    </div>
  );
}

function NewMedicalReportModal({ patientId, user, onClose, onCreated }: { patientId: string; user: User; onClose: () => void; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget, v = Object.fromEntries(new FormData(form));

    try {
      await api(`/api/patients/${patientId}/medical-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(v.title),
          diagnosis: String(v.diagnosis),
          audiometricFindings: String(v.audiometricFindings || ""),
          recommendation: String(v.recommendation),
          conclusion: String(v.conclusion || ""),
        }),
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal label="Emitir laudo clínico" onClose={onClose}>
        <h3>🩺 Emissão Formal de Laudo Clínico / Audiométrico</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Emissor: <strong>{user.name}</strong> ({user.license_number || "Sem registro cadastrado"})
        </p>

        {error && <p className="error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="form" style={{ marginTop: "1rem" }}>
          <label>
            Título do Laudo / Documento
            <input name="title" required defaultValue="Laudo Audiométrico e Avaliação de Adaptação de Prótese Auditiva" placeholder="Ex: Avaliação Audiológica e Parecer de Reabilitação" />
          </label>

          <label>
            Diagnóstico Clínico / Fonoaudiológico
            <textarea name="diagnosis" rows={2} required placeholder="Ex: Perda auditiva neurossensorial bilateral de grau moderado a severo" />
          </label>

          <label>
            Achados Audiométricos (Limiares, Vocal, Imitanciometria)
            <textarea name="audiometricFindings" rows={3} placeholder="Ex: Rebaixamento em frequências agudas (3kHz-8kHz), SRT em 45dB, logoaudiometria com índice de percepção da fala em 88%" />
          </label>

          <label>
            Conduta Recomendada & Reabilitação
            <textarea name="recommendation" rows={2} required placeholder="Ex: Indicada adaptação de prótese auditiva digital com molde de silicone e acompanhamento mensal" />
          </label>

          <label>
            Parecer Final & Aprazamento
            <textarea name="conclusion" rows={2} placeholder="Ex: Paciente apto para uso contínuo do aparelho. Retorno em 30 dias para regulagem e verificação da resposta." />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={submitting}>{submitting ? "Gerando Laudo..." : "Emitir Laudo Oficial"}</button>
          </div>
        </form>
    </Modal>
  );
}

function PatientForm({ patient, onCancel, onDone }: { patient?: Patient; onCancel: () => void; onDone: (id: string, msg?: string) => void }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/doctors").then((d) => setDoctors(d.doctors || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = e.currentTarget, v = Object.fromEntries(new FormData(form));
    try {
      if (patient) {
        await api(`/api/patients/${patient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: patient.version,
            name: String(v.name),
            phone: String(v.phone),
            birthDate: v.birthDate || null,
            guardianName: String(v.guardianName || ""),
            contactSource: v.contactSource,
            status: v.status,
            notes: String(v.notes || ""),
            careAlert: String(v.careAlert || ""),
            responsibleDoctorId: v.responsibleDoctorId || null,
          }),
        });
        onDone(patient.id, "Prontuário do paciente atualizado com sucesso.");
      } else {
        const res = await api("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(v.name),
            phone: String(v.phone),
            birthDate: v.birthDate || null,
            guardianName: String(v.guardianName || ""),
            contactSource: v.contactSource,
            status: v.status,
            notes: String(v.notes || ""),
            careAlert: String(v.careAlert || ""),
            responsibleDoctorId: v.responsibleDoctorId || null,
          }),
        });
        onDone(res.id, "Paciente cadastrado com sucesso.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>{patient ? "Editar Paciente" : "Novo Paciente"}</h3>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="fields">
        <label>Nome Completo <input name="name" defaultValue={patient?.name} required /></label>
        <label>Telefone / Celular <input name="phone" defaultValue={patient?.phone} required placeholder="Ex: 11999999999" /></label>
        <label>Data de Nascimento <input name="birthDate" type="date" defaultValue={patient?.birth_date?.slice(0, 10)} /></label>
        <label>
          Médico Responsável (Opcional)
          <select name="responsibleDoctorId" defaultValue={patient?.responsible_doctor_id || ""}>
            <option value="">-- Nenhum Selecionado --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty || "Fonoaudiólogo"})</option>
            ))}
          </select>
        </label>
        <label>
          Origem do Contato
          <select name="contactSource" defaultValue={patient?.contact_source || "other"}>
            {Object.entries(sources).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          Status da Jornada
          <select name="status" defaultValue={patient?.journey_status || "new_lead"}>
            {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <label className="wide">Alerta de Cuidado <textarea name="careAlert" rows={2} defaultValue={patient?.care_alert} placeholder="Ex: Dificuldade motora, alérgico a silicone..." /></label>
      <label className="wide">Observações Clínicas <textarea name="notes" rows={3} defaultValue={patient?.notes} /></label>
      <div className="actions" style={{ marginTop: "1rem" }}>
        <button disabled={saving}>{saving ? "Salvando..." : "Salvar Prontuário"}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

function PatientRecord({ id, user, onBack }: { id: string; user: User; onBack: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [commercial, setCommercial] = useState<PatientCommercial>({ sales: [], receivables: [] });
  const [editing, setEditing] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [detail, history, commercialData] = await Promise.all([
        api(`/api/patients/${id}`),
        api(`/api/patients/${id}/timeline`),
        api(`/api/patients/${id}/commercial`),
      ]);
      setPatient(detail.patient);
      setTimeline(history.items);
      setCommercial(commercialData);
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    try {
      await api(`/api/patients/${id}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.reset();
      setMessage("Interação registrada.");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  if (!patient) return <section className="card">{error || "Carregando ficha…"}</section>;
  if (editing) return <PatientForm patient={patient} onCancel={() => setEditing(false)} onDone={async () => { setEditing(false); await load(); }} />;

  return (
    <>
      <button className="back" onClick={onBack} style={{ marginBottom: "1rem" }}>← Voltar</button>
      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {showSaleModal && (
        <Modal label="Nova venda ou serviço" onClose={() => setShowSaleModal(false)}>
            <SaleForm patientId={id} onDone={() => { setShowSaleModal(false); setMessage("Venda/Serviço registrado no prontuário!"); load(); }} />
        </Modal>
      )}

      <section className="card record">
        <div className="section-title">
          <div>
            <h2>{patient.name}</h2>
            <p>{patient.phone} · <span className="badge info">{statuses[patient.journey_status]}</span></p>
          </div>
          <div className="actions">
            {user.role !== "doctor" && (
              <button onClick={() => setShowSaleModal(true)}>🛒 Nova Venda / Serviço (Catálogo)</button>
            )}
            <button className="secondary" onClick={() => setEditing(true)}>Editar Prontuário</button>
          </div>
        </div>

        {patient.care_alert && (
          <p className="care-alert" style={{ margin: "1rem 0" }}>⚠️ <strong>Alerta:</strong> {patient.care_alert}</p>
        )}

        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", margin: "1rem 0" }}>
          <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
            <dt style={{ color: "#64748b", fontSize: "0.85rem" }}>Médico Responsável</dt>
            <dd style={{ margin: 0, fontWeight: "bold" }}>{patient.responsible_doctor_name || "Nenhum médico selecionado"}</dd>
          </div>
          <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
            <dt style={{ color: "#64748b", fontSize: "0.85rem" }}>Próximo Contato</dt>
            <dd style={{ margin: 0, fontWeight: "bold" }}>{date(patient.next_contact_on)}</dd>
          </div>
          <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
            <dt style={{ color: "#64748b", fontSize: "0.85rem" }}>Atendente Responsável</dt>
            <dd style={{ margin: 0, fontWeight: "bold" }}>{patient.assigned_user_name}</dd>
          </div>
          <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
            <dt style={{ color: "#64748b", fontSize: "0.85rem" }}>Origem do Lead</dt>
            <dd style={{ margin: 0, fontWeight: "bold" }}>{sources[patient.contact_source]}</dd>
          </div>
        </dl>

        {patient.notes && <p><strong>Observações Clínicas:</strong> {patient.notes}</p>}

        <h3>Vendas e Serviços</h3>
        {commercial.sales.length === 0 ? (
          <EmptyState>Nenhuma venda ou serviço registrado.</EmptyState>
        ) : (
          <DataTable aria-label="Vendas e serviços do paciente">
            <thead><tr><th>Data</th><th>Item</th><th>Qtd.</th><th>Total</th><th>CMV histórico</th><th>Status</th></tr></thead>
            <tbody>
              {commercial.sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{date(sale.sold_on)}</td>
                  <td>{sale.product}</td>
                  <td>{sale.quantity}</td>
                  <td>{money(sale.total_amount_cents)}</td>
                  <td>{money(sale.cost_amount_cents)}</td>
                  <td>{sale.cancelled_at ? "Cancelada" : sale.delivery_status}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        <h3>Financeiro do Paciente</h3>
        {commercial.receivables.length === 0 ? (
          <EmptyState>Nenhuma parcela registrada.</EmptyState>
        ) : (
          <DataTable aria-label="Financeiro do paciente">
            <thead><tr><th>Vencimento</th><th>Item</th><th>Forma</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {commercial.receivables.map((item) => (
                <tr key={item.id}>
                  <td>{date(item.due_on)}</td>
                  <td>{item.product}</td>
                  <td>{paymentLabels[item.payment_method]}</td>
                  <td>{money(item.amount_cents)}</td>
                  <td>{item.status === "received" ? "Recebida" : item.status === "cancelled" ? "Cancelada" : "Prevista"}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}

        <PatientAttachments patientId={id} />
        <PatientMedicalReports patientId={id} user={user} />
      </section>

      <div className="record-grid" style={{ marginTop: "1.5rem" }}>
        <div>
          <form className="panel form" onSubmit={addEvent}>
            <h3>Registrar Nova Interação Clínica</h3>
            <label>Tipo <select name="eventType" defaultValue="consultation">{Object.entries(eventTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="wide">Descrição da Interação <textarea name="description" rows={3} required placeholder="Descreva os exames, regulagem ou observações do atendimento..." /></label>
            <button style={{ marginTop: "0.75rem" }}>Salvar Interação</button>
          </form>
        </div>

        <div>
          <h3>Histórico da Linha do Tempo (Append-Only)</h3>
          {timeline.length === 0 ? (
            <p style={{ color: "#64748b" }}>Nenhum evento registrado ainda.</p>
          ) : (
            <ul className="timeline">
              {timeline.map((item) => (
                <li key={item.id}>
                  <strong>{eventTypes[item.type] || item.type}</strong> — <small>{date(item.occurred_at)} ({item.author})</small>
                  <p style={{ margin: "0.2rem 0" }}>{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function FollowUps({ openGlobalPatient }: { openGlobalPatient: (id: string) => void }) {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/follow-ups")
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando fila de acompanhamento…</p>;

  return (
    <section className="card">
      <h2>📞 Fila Acionável de Pós-Atendimento & Retornos</h2>
      <p>Acompanhe e entre em contato com pacientes que necessitam de retorno fonoaudiológico.</p>
      {items.length === 0 ? (
        <p style={{ color: "#64748b", margin: "1rem 0" }}>Parabéns! Não há contatos pendentes para hoje.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Telefone / WhatsApp</th>
              <th>Status Jornada</th>
              <th>Ação Pendente</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.task_id || item.patient_id}>
                <td>
                  <PatientLink patientId={item.patient_id} name={item.patient_name} onOpen={openGlobalPatient} />
                </td>
                <td>
                  <WhatsAppButton patientId={item.patient_id} phone={item.phone} patientName={item.patient_name} defaultMessage={`Olá, ${item.patient_name}! Como está a adaptação do seu aparelho auditivo?`} />
                </td>
                <td><span className="badge info">{statuses[item.journey_status]}</span></td>
                <td>{item.title || "Retorno Periódico"}</td>
                <td>
                  <span className={`badge ${item.timing === "overdue" ? "danger" : item.timing === "today" ? "warning" : "success"}`}>
                    {item.timing === "overdue" ? "Atrasado" : item.timing === "today" ? "Hoje" : date(item.due_on)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

type DoctorSchedule = {
  tasks: Array<{ task_id: string; patient_id: string; patient_name: string; title: string; due_on: string; status: string }>;
  events: Array<{ event_id: string; patient_id: string; patient_name: string; event_type: string; description: string; created_at: string }>;
};

function DoctorAgenda({ openGlobalPatient }: { openGlobalPatient: (id: string) => void }) {
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const current = new Date();
    api(`/api/doctor/schedule?year=${current.getFullYear()}&month=${current.getMonth() + 1}`)
      .then(setSchedule)
      .catch((reason) => setError((reason as Error).message));
  }, []);

  if (error) return <ErrorState>{error}</ErrorState>;
  if (!schedule) return <LoadingState label="Carregando agenda médica…" />;
  const rows = [
    ...schedule.tasks.map((item) => ({
      id: item.task_id,
      patientId: item.patient_id,
      patientName: item.patient_name,
      when: item.due_on,
      kind: item.status === "overdue" ? "Retorno atrasado" : "Retorno",
      description: item.title,
    })),
    ...schedule.events.map((item) => ({
      id: item.event_id,
      patientId: item.patient_id,
      patientName: item.patient_name,
      when: item.created_at,
      kind: "Atendimento",
      description: item.description,
    })),
  ].sort((left, right) => left.when.localeCompare(right.when));

  return (
    <Card>
      <h2>Agenda médica do mês</h2>
      {rows.length === 0 ? (
        <EmptyState>Nenhum retorno ou atendimento neste mês.</EmptyState>
      ) : (
        <DataTable aria-label="Agenda médica">
          <thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Descrição</th></tr></thead>
          <tbody>
            {rows.map((item) => (
              <tr key={`${item.kind}-${item.id}`}>
                <td>{date(item.when)}</td>
                <td><PatientLink patientId={item.patientId} name={item.patientName} onOpen={openGlobalPatient} /></td>
                <td>{item.kind}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </Card>
  );
}

function Dashboard({ user, openPatient, openFollowUps }: { user: User; openPatient: (id: string) => void; openFollowUps: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard").then(setData).catch((reason) => setError((reason as Error).message));
  }, []);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p>Carregando resumo…</p>;

  return (
    <>
      <div className="dashboard-cards">
        <div className="dashboard-card" onClick={openFollowUps} style={{ cursor: "pointer" }}>
          <span>Contatos Atrasados</span>
          <strong style={{ color: "var(--danger)" }}>{data.overdue}</strong>
        </div>
        <div className="dashboard-card" onClick={openFollowUps} style={{ cursor: "pointer" }}>
          <span>Retornos Hoje</span>
          <strong style={{ color: "#d97706" }}>{data.today}</strong>
        </div>
        <div className="dashboard-card" onClick={openFollowUps} style={{ cursor: "pointer" }}>
          <span>Tarefas Abertas</span>
          <strong>{data.open_tasks}</strong>
        </div>
        <div className="dashboard-card" onClick={openFollowUps} style={{ cursor: "pointer" }}>
          <span>Em Adaptação</span>
          <strong>{data.adaptation}</strong>
        </div>
        <div className="dashboard-card">
          <span>Vendas no Mês</span>
          <strong style={{ color: "var(--success)" }}>{data.month_sales}</strong>
        </div>
      </div>

      {user.role === "admin" && data.financial && (
        <section className="card" style={{ margin: "1rem 0" }}>
          <h2>💵 Resumo Financeiro Realizado</h2>
          <div className="finance-summary">
            <div className="kpi-card"><span>Saldo Consolidado</span><strong>{money(data.financial.consolidated.balance_cents)}</strong></div>
            <div className="kpi-card"><span>Entradas no Mês</span><strong style={{ color: "var(--success)" }}>{money(data.financial.consolidated.month_income_cents)}</strong></div>
            <div className="kpi-card"><span>Saídas no Mês</span><strong style={{ color: "var(--danger)" }}>{money(data.financial.consolidated.month_expense_cents)}</strong></div>
          </div>
        </section>
      )}
    </>
  );
}

function WhatsAppButton({ patientId, phone, patientName, defaultMessage }: { patientId: string; phone: string; patientName: string; defaultMessage?: string }) {
  const handleOpen = async () => {
    const text = defaultMessage || `Olá, ${patientName}! Passando da clínica Fonolife para acompanhar seu atendimento.`;
    try {
      await api(`/api/patients/${patientId}/whatsapp-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: text }),
      });
    } catch (_) {}
    const e164 = phone.replace(/\D/g, "");
    const fullPhone = e164.length === 11 ? `55${e164}` : e164;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" className="secondary" onClick={(e) => { e.stopPropagation(); handleOpen(); }} style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem", minHeight: "auto" }}>
      💬 WhatsApp
    </button>
  );
}

type InventoryMovementItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_sku?: string | null;
  movement_type: "entry" | "sale_deduction" | "adjustment";
  quantity: number;
  notes: string;
  created_by_name: string;
  created_at: string;
};

function Inventory({ user }: { user: User; openGlobalPatient?: (id: string) => void }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovementItem[]>([]);
  const [subTab, setSubTab] = useState<"products" | "services" | "low_stock" | "movements">("products");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Controladores de Modais
  const [adjustProduct, setAdjustProduct] = useState<ProductItem | null>(null);
  const [editProduct, setEditProduct] = useState<ProductItem | null | "new">(null);
  const [editService, setEditService] = useState<ServiceItem | null | "new">(null);

  const loadData = () => {
    setError("");
    api("/api/products")
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message));
    api("/api/services")
      .then((data) => setServices(data.services || []))
      .catch((err) => setError(err.message));
    api("/api/inventory/movements")
      .then((data) => setMovements(data.movements || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockProducts = products.filter((p) => p.stock_balance <= (p.min_stock ?? 0));
  const totalStockValue = products.reduce((acc, p) => acc + p.stock_balance * (p.cost_cents || 0), 0);

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.model.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  const filteredServices = services.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term);
  });

  // Ações dos Modais
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name")),
      brand: String(formData.get("brand")),
      model: String(formData.get("model")),
      sku: String(formData.get("sku") || ""),
      priceCents: cents(String(formData.get("price"))),
      costCents: cents(String(formData.get("cost") || "0")),
      minStock: Number(formData.get("minStock") || 0),
    };

    try {
      if (editProduct === "new") {
        await api("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setMessage("Produto criado com sucesso!");
      } else if (editProduct) {
        await api(`/api/admin/products/${editProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, version: editProduct.version }),
        });
        setMessage("Produto atualizado com sucesso!");
      }
      setEditProduct(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
      if (err.status === 409 || err?.message?.includes("alterado por outro usuário") || err?.message?.includes("Recarregue")) {
        loadData();
      }
    }
  };

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      priceCents: cents(String(formData.get("price"))),
      cmvCents: cents(String(formData.get("cmv") || "0")),
      executionTimeMinutes: Number(formData.get("executionTimeMinutes") || 0),
    };

    try {
      if (editService === "new") {
        await api("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setMessage("Serviço criado com sucesso!");
      } else if (editService) {
        await api(`/api/services/${editService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, version: editService.version }),
        });
        setMessage("Serviço atualizado com sucesso!");
      }
      setEditService(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustProduct) return;
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const movementType = String(formData.get("movementType"));
    let qty = Number(formData.get("quantity") || 0);
    const notes = String(formData.get("notes") || "").trim();

    if (!notes || notes.length < 2) {
      setError("Justificativa é obrigatória para qualquer ajuste de estoque.");
      return;
    }

    if (movementType === "sale_deduction") {
      qty = -Math.abs(qty);
    } else if (movementType === "adjustment") {
      const isNegative = formData.get("adjustmentDirection") === "decrease";
      qty = isNegative ? -Math.abs(qty) : Math.abs(qty);
    }

    try {
      const endpoint = user.role === "admin" ? "/api/admin/inventory/movements" : "/api/inventory/movements";
      await api(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustProduct.id,
          movementType,
          quantity: qty,
          notes,
          clientRequestId: crypto.randomUUID(),
        }),
      });
      setMessage(`Movimentação de estoque registrada para ${adjustProduct.name}.`);
      setAdjustProduct(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success" role="status">{message}</p>}

      {/* Resumo de Indicadores em Cards */}
      <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <h3>📦 Total de Produtos</h3>
          <p style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "0.25rem 0" }}>{products.length}</p>
          <small style={{ color: "#64748b" }}>Cadastrados no catálogo</small>
        </div>
        <div className="card">
          <h3>💰 Custo do Estoque</h3>
          <p style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "0.25rem 0", color: "var(--primary)" }}>{money(totalStockValue)}</p>
          <small style={{ color: "#64748b" }}>Valor acumulado em saldo</small>
        </div>
        <div className="card" style={{ borderColor: lowStockProducts.length > 0 ? "#ef4444" : undefined }}>
          <h3 style={{ color: lowStockProducts.length > 0 ? "var(--danger)" : undefined }}>⚠️ Baixo Estoque</h3>
          <p style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "0.25rem 0", color: lowStockProducts.length > 0 ? "var(--danger)" : "inherit" }}>
            {lowStockProducts.length}
          </p>
          <small style={{ color: "#64748b" }}>Itens no limite ou abaixo</small>
        </div>
        <div className="card">
          <h3>🩺 Serviços Ativos</h3>
          <p style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "0.25rem 0" }}>{services.filter((s) => s.active).length}</p>
          <small style={{ color: "#64748b" }}>Atendimentos e procedimentos</small>
        </div>
      </div>

      {/* Barra de Ações e Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div className="tabs">
          <button className={subTab === "products" ? "active" : ""} onClick={() => setSubTab("products")}>
            📦 Produtos ({filteredProducts.length})
          </button>
          <button className={subTab === "services" ? "active" : ""} onClick={() => setSubTab("services")}>
            🩺 Serviços ({filteredServices.length})
          </button>
          <button className={subTab === "low_stock" ? "active" : ""} onClick={() => setSubTab("low_stock")}>
            ⚠️ Baixo Estoque ({lowStockProducts.length})
          </button>
          <button className={subTab === "movements" ? "active" : ""} onClick={() => setSubTab("movements")}>
            📜 Histórico ({movements.length})
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="search"
            placeholder="Buscar por nome, marca, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "240px" }}
          />
          {user.role === "admin" && (
            <>
              <button type="button" onClick={() => setEditProduct("new")}>+ Novo Produto</button>
              <button type="button" className="secondary" onClick={() => setEditService("new")}>+ Novo Serviço</button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo das Sub-abas */}
      {subTab === "products" && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nome / Produto</th>
                <th>Marca / Modelo</th>
                <th>Estoque Atual</th>
                <th>Estoque Mín.</th>
                <th>Preço Venda</th>
                <th>Custo (CMV)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>Nenhum produto encontrado.</td></tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} style={{ backgroundColor: p.stock_balance <= (p.min_stock ?? 0) ? "#fef2f2" : undefined }}>
                    <td><code>{p.sku || "—"}</code></td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.brand} {p.model}</td>
                    <td>
                      <span className={`badge ${p.stock_balance <= (p.min_stock ?? 0) ? "error" : "success"}`}>
                        {p.stock_balance} un.
                      </span>
                    </td>
                    <td>{p.min_stock ?? 0} un.</td>
                    <td><strong>{money(p.price_cents)}</strong></td>
                    <td>{money(p.cost_cents)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem" }} onClick={() => setAdjustProduct(p)}>
                          ⚖️ Ajustar Estoque
                        </button>
                        {user.role === "admin" && (
                          <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem" }} onClick={() => setEditProduct(p)}>
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "services" && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Serviço / Atendimento</th>
                <th>Descrição</th>
                <th>Duração</th>
                <th>Preço Venda</th>
                <th>CMV Derivado</th>
                <th>Margem Estimada</th>
                <th>Insumos Consumidos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>Nenhum serviço cadastrado.</td></tr>
              ) : (
                filteredServices.map((s) => {
                  const cmv = s.cmv_cents || 0;
                  const margin = s.price_cents - cmv;
                  const marginPct = s.price_cents > 0 ? Math.round((margin / s.price_cents) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.description || "—"}</td>
                      <td>⏱️ {s.execution_time_minutes} min</td>
                      <td><strong>{money(s.price_cents)}</strong></td>
                      <td>{money(cmv)}</td>
                      <td>
                        <span className={`badge ${marginPct >= 50 ? "success" : marginPct > 0 ? "warning" : "error"}`}>
                          {money(margin)} ({marginPct}%)
                        </span>
                      </td>
                      <td>
                        {s.products && s.products.length > 0 ? (
                          <small>{s.products.map((sp) => `${sp.productName} (${sp.quantity}x)`).join(", ")}</small>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Nenhum insumo</span>
                        )}
                      </td>
                      <td>
                        {user.role === "admin" && (
                          <button type="button" className="secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem" }} onClick={() => setEditService(s)}>
                            ✏️ Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "low_stock" && (
        <div className="panel">
          <h3>⚠️ Produtos em Baixo Estoque (Estoque Atual ≤ Estoque Mínimo)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produto</th>
                <th>Marca / Modelo</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Necessidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--success)", padding: "2rem" }}>✅ Nenhum produto em baixo estoque! Todos os itens estão com estoque adequado.</td></tr>
              ) : (
                lowStockProducts.map((p) => (
                  <tr key={p.id} style={{ backgroundColor: "#fef2f2" }}>
                    <td><code>{p.sku || "—"}</code></td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.brand} {p.model}</td>
                    <td><span className="badge error">{p.stock_balance} un.</span></td>
                    <td>{p.min_stock ?? 0} un.</td>
                    <td><strong>+{Math.max(0, (p.min_stock ?? 0) - p.stock_balance)} un.</strong></td>
                    <td>
                      <button type="button" onClick={() => setAdjustProduct(p)}>⚖️ Registrar Entrada</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "movements" && (
        <div className="panel">
          <h3>📜 Histórico Imutável de Movimentações de Estoque (Append-only)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Produto</th>
                <th>Tipo de Movimento</th>
                <th>Qtd.</th>
                <th>Justificativa / Observação</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>Nenhuma movimentação registrada.</td></tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>{date(m.created_at)}</td>
                    <td><strong>{m.product_name}</strong> {m.product_sku ? `(${m.product_sku})` : ""}</td>
                    <td>
                      <span className={`badge ${m.movement_type === "entry" ? "success" : m.movement_type === "sale_deduction" ? "warning" : "info"}`}>
                        {m.movement_type === "entry" ? "📥 Entrada" : m.movement_type === "sale_deduction" ? "📤 Baixa Venda/Consumo" : "⚖️ Ajuste Manual"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: m.quantity > 0 ? "var(--success)" : "var(--danger)" }}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} un.
                      </strong>
                    </td>
                    <td>{m.notes || "—"}</td>
                    <td>{m.created_by_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Ajuste de Estoque */}
      {adjustProduct && (
        <Modal label={`Ajustar estoque de ${adjustProduct.name}`} onClose={() => setAdjustProduct(null)} size="small">
            <h2>⚖️ Ajustar Estoque — {adjustProduct.name}</h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              Estoque atual: <strong>{adjustProduct.stock_balance} un.</strong> | Estoque mínimo: <strong>{adjustProduct.min_stock ?? 0} un.</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="form" style={{ marginTop: "1rem" }}>
              <label>
                Tipo de Movimentação
                <select name="movementType" defaultValue="entry">
                  <option value="entry">📥 Entrada (Compra / Reposição de Estoque)</option>
                  <option value="sale_deduction">📤 Baixa / Consumo Manual</option>
                  <option value="adjustment">⚖️ Ajuste de Inventário</option>
                </select>
              </label>

              <label>
                Direção do Ajuste (apenas se Tipo = Ajuste)
                <select name="adjustmentDirection" defaultValue="increase">
                  <option value="increase">➕ Aumentar Estoque</option>
                  <option value="decrease">➖ Reduzir Estoque</option>
                </select>
              </label>

              <label>
                Quantidade (unidades)
                <input name="quantity" type="number" min={1} defaultValue={1} required />
              </label>

              <label>
                Justificativa Obrigatória (Auditoria)
                <input name="notes" required placeholder="Ex: Nota Fiscal 12345, Contagem física de inventário, etc." minLength={2} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" className="secondary" onClick={() => setAdjustProduct(null)}>Cancelar</button>
                <button type="submit">Confirmar Ajuste</button>
              </div>
            </form>
        </Modal>
      )}

      {/* Modal de Cadastro / Edição de Produto */}
      {editProduct && (
        <Modal label={editProduct === "new" ? "Novo produto" : `Editar ${editProduct.name}`} onClose={() => setEditProduct(null)}>
            <h2>{editProduct === "new" ? "📦 Novo Produto" : `✏️ Editar Produto — ${editProduct.name}`}</h2>

            <form onSubmit={handleSaveProduct} className="form" style={{ marginTop: "1rem" }}>
              <div className="fields">
                <label className="wide">
                  Nome do Produto / Aparelho Auditivo
                  <input name="name" defaultValue={editProduct !== "new" ? editProduct.name : ""} required placeholder="Ex: Pure Charge&Go 7AX" />
                </label>
                <label>
                  Marca / Fabricante
                  <input name="brand" defaultValue={editProduct !== "new" ? editProduct.brand : ""} required placeholder="Ex: Signia" />
                </label>
                <label>
                  Modelo / Código
                  <input name="model" defaultValue={editProduct !== "new" ? editProduct.model : ""} required placeholder="Ex: 7AX RIC" />
                </label>
                <label>
                  Código SKU
                  <input name="sku" defaultValue={editProduct !== "new" ? editProduct.sku || "" : ""} placeholder="Ex: SIG-P7AX-001" />
                </label>
                <label>
                  Preço de Venda (R$)
                  <input name="price" defaultValue={editProduct !== "new" ? (editProduct.price_cents / 100).toFixed(2) : ""} required placeholder="Ex: 4500,00" />
                </label>
                <label>
                  Custo Unitário / CMV (R$)
                  <input name="cost" defaultValue={editProduct !== "new" ? (editProduct.cost_cents / 100).toFixed(2) : "0.00"} placeholder="Ex: 2100,00" />
                </label>
                <label>
                  Estoque Mínimo Alerta (un.)
                  <input name="minStock" type="number" min={0} defaultValue={editProduct !== "new" ? editProduct.min_stock ?? 0 : 2} required />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" className="secondary" onClick={() => setEditProduct(null)}>Cancelar</button>
                <button type="submit">Salvar Produto</button>
              </div>
            </form>
        </Modal>
      )}

      {/* Modal de Cadastro / Edição de Serviço */}
      {editService && (
        <Modal label={editService === "new" ? "Novo serviço" : `Editar ${editService.name}`} onClose={() => setEditService(null)}>
            <h2>{editService === "new" ? "🩺 Novo Serviço Fonoaudiológico" : `✏️ Editar Serviço — ${editService.name}`}</h2>

            <form onSubmit={handleSaveService} className="form" style={{ marginTop: "1rem" }}>
              <div className="fields">
                <label className="wide">
                  Nome do Serviço / Procedimento
                  <input name="name" defaultValue={editService !== "new" ? editService.name : ""} required placeholder="Ex: Seleção e Adaptação de Aparelho Auditivo" />
                </label>
                <label className="wide">
                  Descrição / Protocolo Clínico
                  <input name="description" defaultValue={editService !== "new" ? editService.description : ""} placeholder="Ex: Consulta para molde auricular, testes e calibração de ganho" />
                </label>
                <label>
                  Preço do Serviço (R$)
                  <input name="price" defaultValue={editService !== "new" ? (editService.price_cents / 100).toFixed(2) : ""} required placeholder="Ex: 350,00" />
                </label>
                <label>
                  CMV Base (R$)
                  <input name="cmv" defaultValue={editService !== "new" ? (editService.cmv_cents / 100).toFixed(2) : "0.00"} placeholder="Ex: 50,00" />
                </label>
                <label>
                  Duração Estimada (minutos)
                  <input name="executionTimeMinutes" type="number" min={0} defaultValue={editService !== "new" ? editService.execution_time_minutes : 60} required />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" className="secondary" onClick={() => setEditService(null)}>Cancelar</button>
                <button type="submit">Salvar Serviço</button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
}

function CsvImport() {
  const [entityType, setEntityType] = useState<"patient" | "financial">("patient");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;
    setLoading(true);
    try {
      const res = await api("/api/admin/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, csvContent }),
      });
      setMessage({ type: "success", text: `Importação concluída com sucesso (${res.processedRows} processados).` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>📥 Importação de Dados via Planilha CSV</h2>
      <form onSubmit={handleUpload} className="form" style={{ maxWidth: "600px" }}>
        <label>Tipo de Planilha <select value={entityType} onChange={(e) => setEntityType(e.target.value as any)}><option value="patient">Pacientes</option><option value="financial">Lançamentos Financeiros</option></select></label>
        <label>Arquivo CSV <input type="file" accept=".csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setFileName(file.name); const r = new FileReader(); r.onload = (ev) => setCsvContent((ev.target?.result as string) || ""); r.readAsText(file); } }} required /></label>
        <button disabled={loading}>{loading ? "Importando..." : "Realizar Importação"}</button>
      </form>
      {message && <p className={message.type} style={{ marginTop: "1rem" }}>{message.text}</p>}
    </section>
  );
}

function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.demoMode) setDemoMode(true);
      })
      .catch(() => setDemoMode(false));
  }, []);

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || "Erro ao efetuar login");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "admin" | "operator" | "doctor") => {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || "Perfil demonstrativo indisponível");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <section style={{ width: "min(100%, 450px)" }}>
        <h1 className="brand" style={{ marginBottom: "0.5rem", textAlign: "center" }}>🦻 Fonolife CRM</h1>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Sistema de Gestão Clínica, Caixa & Prontuários
        </p>

        {error && <p className="error" role="alert">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
        >
          <label>E-mail Profissional <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="ex: admin@fonolife.com.br" /></label>
          <label>Senha <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></label>
          <button style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>{loading ? "Autenticando..." : "Entrar no Sistema"}</button>
        </form>

        {demoMode && (
          <div className="demo-panel" style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
            <p role="status" style={{ textAlign: "center" }}>AMBIENTE DE DEMONSTRAÇÃO — dados sintéticos e descartáveis</p>
            <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569", marginBottom: "0.75rem", textAlign: "center" }}>
              ⚡ Acesso Rápido — Perfis de Demonstração (Demo):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => handleDemoLogin("admin")}
              >
                <span>👑 Entrar como <strong>Administrador</strong></span>
                <small style={{ opacity: 0.7 }}>Acesso Total</small>
              </button>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => handleDemoLogin("operator")}
              >
                <span>🛒 Entrar como <strong>Operador (Caixa / PDV)</strong></span>
                <small style={{ opacity: 0.7 }}>Atendimento & Vendas</small>
              </button>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => handleDemoLogin("doctor")}
              >
                <span>🩺 Entrar como <strong>Médico Fonoaudiólogo</strong></span>
                <small style={{ opacity: 0.7 }}>Agenda & Prontuários</small>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [page, setPage] = useState("Início");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [globalPatientId, setGlobalPatientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setDemoMode(data?.environment === "demo"))
      .catch(() => setDemoMode(false));
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center"><LoadingState label="Carregando Fonolife…" /></div>;

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  const pages =
    user.role === "doctor"
      ? ["Minha Agenda", "Meus Pacientes", "Atendimento Clínico", "Pacientes"]
      : ["Início", "Caixa (PDV)", "Pacientes", "Acompanhamento", "Estoque & Catálogo", "Financeiro", "Importação CSV"];

  return (
    <AppShell>
      <TopBar>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="brand">🦻 Fonolife</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>| Clínica Fonoaudiológica</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>{user.name} ({user.role})</span>
          <Button variant="secondary" className="compact-button" onClick={() => api("/api/auth/logout", { method: "POST" }).then(() => setUser(null))}>
            Sair
          </Button>
        </div>
      </TopBar>
      {demoMode && (
        <aside className="demo-banner" aria-label="Ambiente atual">
          AMBIENTE DE DEMONSTRAÇÃO — dados sintéticos e descartáveis
        </aside>
      )}

      <Sidebar>
        {pages.map((item) => (
          <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>
            {item}
          </button>
        ))}
      </Sidebar>

      <main>
        <PageHeader title={page} />

        {page === "Minha Agenda" ? (
          <DoctorAgenda openGlobalPatient={setGlobalPatientId} />
        ) : page === "Meus Pacientes" || page === "Atendimento Clínico" ? (
          <Patients user={user} initialPatientId={patientId} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Caixa (PDV)" ? (
          <PosCheckout user={user} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Pacientes" ? (
          <Patients user={user} initialPatientId={patientId} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Acompanhamento" ? (
          <FollowUps openGlobalPatient={setGlobalPatientId} />
        ) : page === "Financeiro" ? (
          <Finance user={user} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Estoque & Catálogo" || page === "Estoque" ? (
          <Inventory user={user} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Importação CSV" ? (
          <CsvImport />
        ) : (
          <Dashboard user={user} openPatient={(id) => setGlobalPatientId(id)} openFollowUps={() => setPage("Acompanhamento")} />
        )}
      </main>

      <GlobalPatientModal user={user} patientId={globalPatientId} onClose={() => setGlobalPatientId(null)} />
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
