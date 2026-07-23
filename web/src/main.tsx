import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./sales.css";

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
  products: { productId: string; quantity: number; productName: string; unitPriceCents: number }[];
};
type ProductItem = {
  id: string;
  name: string;
  brand: string;
  model: string;
  price_cents: number;
  cost_cents: number;
  stock_balance: number;
  active: boolean;
};
type FinanceSummary = {
  consolidated: {
    balance_cents: number;
    income_cents: number;
    expense_cents: number;
  };
  byAccount: {
    company_account_id: string;
    company_account_label: string;
    balance_cents: number;
    income_cents: number;
    expense_cents: number;
  }[];
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
  if (!response.ok) throw new Error(body.title ?? "Não foi possível concluir");
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

function GlobalPatientModal({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  if (!patientId) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 900px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>📋 Prontuário do Paciente</h2>
          <button className="secondary" onClick={onClose}>✕ Fechar Prontuário</button>
        </div>
        <PatientRecord id={patientId} onBack={onClose} />
      </div>
    </div>
  );
}

function PatientNameLink({ patientId, name, openGlobal }: { patientId: string; name: string; openGlobal: (id: string) => void }) {
  return (
    <button
      type="button"
      className="patient-link"
      onClick={(e) => {
        e.stopPropagation();
        openGlobal(patientId);
      }}
    >
      {name}
    </button>
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
    if (!selectedPatientId) { setError("Selecione um paciente para registrar o caixa."); return; }
    if (!companyAccountId) { setError("Selecione a conta/caixa responsável."); return; }
    if (cart.length === 0) { setError("Adicione ao menos um produto ou serviço ao carrinho."); return; }

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
            <PatientNameLink patientId={selectedPatientId} name="👉 Clique aqui para ver o prontuário deste paciente" openGlobal={openGlobalPatient} />
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

function Inventory({ user, openGlobalPatient }: { user: User; openGlobalPatient: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<"products" | "services" | "movements">("products");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<ProductItem | null>(null);

  const loadData = () => {
    api("/api/products").then((d) => setProducts(d?.products || [])).catch((e) => setError(e.message));
    api("/api/services").then((d) => setServices(d?.services || [])).catch(() => {});
    api("/api/inventory/movements").then((d) => setMovements(d?.movements || [])).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget,
      v = Object.fromEntries(new FormData(form));
    try {
      await api("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(v.name),
          brand: String(v.brand),
          model: String(v.model),
          priceCents: cents(String(v.price)),
          costCents: cents(String(v.cost || "0")),
        }),
      });
      setShowAddProduct(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget,
      v = Object.fromEntries(new FormData(form));
    try {
      await api("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(v.name),
          description: String(v.description),
          priceCents: cents(String(v.price)),
          cmvCents: cents(String(v.cmv || "0")),
          executionTimeMinutes: Number(v.executionTimeMinutes || 30),
        }),
      });
      setShowAddService(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget,
      v = Object.fromEntries(new FormData(form));
    try {
      await api("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(v.productId),
          movementType: String(v.movementType),
          quantity: Number(v.quantity),
          notes: String(v.notes),
        }),
      });
      setShowAddMovement(false);
      setSelectedProductForAdjustment(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>📦 Catálogo de Produtos, Serviços & Estoque</h2>
          <p>Gerencie aparelhos auditivos, exames fonoaudiológicos, insumos e movimentações auditadas.</p>
        </div>
        <div className="actions">
          {user.role === "admin" && (
            <>
              <button className="secondary" onClick={() => setShowAddProduct(!showAddProduct)}>+ Produto</button>
              <button className="secondary" onClick={() => setShowAddService(!showAddService)}>+ Serviço</button>
              <button onClick={() => setShowAddMovement(!showAddMovement)}>+ Ajuste Estoque</button>
            </>
          )}
        </div>
      </div>

      <div className="sub-tabs">
        <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>
          Aparelhos & Produtos ({products.length})
        </button>
        <button className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}>
          Serviços Fonoaudiológicos ({services.length})
        </button>
        <button className={activeTab === "movements" ? "active" : ""} onClick={() => setActiveTab("movements")}>
          Histórico de Estoque ({movements.length})
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {showAddProduct && (
        <form className="panel form" onSubmit={handleAddProduct} style={{ marginBottom: "1.5rem" }}>
          <h3>Cadastrar Produto / Aparelho Auditivo</h3>
          <div className="fields">
            <label>Nome <input name="name" required placeholder="Ex: Aparelho Charge&Go 7AX" /></label>
            <label>Marca <input name="brand" required placeholder="Ex: Audibel" /></label>
            <label>Modelo <input name="model" required placeholder="Ex: 7AX" /></label>
            <label>Preço de Venda (R$) <input name="price" required placeholder="Ex: 4500,00" /></label>
            <label>CMV / Custo da Mercadoria (R$) <input name="cost" placeholder="Ex: 1800,00" /></label>
          </div>
          <button disabled={loading}>{loading ? "Salvando..." : "Salvar Produto no Catálogo"}</button>
        </form>
      )}

      {showAddService && (
        <form className="panel form" onSubmit={handleAddService} style={{ marginBottom: "1.5rem" }}>
          <h3>Cadastrar Serviço Fonoaudiológico</h3>
          <div className="fields">
            <label>Nome do Serviço <input name="name" required placeholder="Ex: Audiometria Tonal e Vocal Completa" /></label>
            <label>Preço Sugerido (R$) <input name="price" required placeholder="Ex: 250,00" /></label>
            <label>CMV / Custo Estimado (R$) <input name="cmv" placeholder="Ex: 45,00" /></label>
            <label>Tempo de Execução (minutos) <input name="executionTimeMinutes" type="number" defaultValue={45} required /></label>
          </div>
          <label className="wide">Descrição do Atendimento <textarea name="description" rows={2} placeholder="Descreva os procedimentos fonoaudiológicos aplicados..." /></label>
          <button disabled={loading}>{loading ? "Salvando..." : "Salvar Serviço no Catálogo"}</button>
        </form>
      )}

      {(showAddMovement || selectedProductForAdjustment) && (
        <div className="modal-overlay" onClick={() => { setShowAddMovement(false); setSelectedProductForAdjustment(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddMovement} className="form">
              <h3>📦 Popup Modal de Ajuste de Estoque Auditado</h3>
              <label>
                Produto / Aparelho
                <select name="productId" defaultValue={selectedProductForAdjustment?.id || ""} required>
                  <option value="">-- Selecione o produto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand} {p.model}) [Atual: {p.stock_balance} un.]</option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de Ajuste
                <select name="movementType" required>
                  <option value="entry">Entrada (Adicionar Estoque)</option>
                  <option value="adjustment">Ajuste / Contagem / Perda Auditada</option>
                </select>
              </label>
              <label>
                Quantidade (Positivo para entrada, negativo para perda/baixa)
                <input name="quantity" type="number" required placeholder="Ex: 10 ou -2" />
              </label>
              <label>
                Justificativa / Observação do Ajuste
                <input name="notes" required placeholder="Ex: Nota fiscal 1234 ou contagem física de estoque" />
              </label>
              <div className="actions" style={{ marginTop: "1rem" }}>
                <button disabled={loading}>{loading ? "Registrando..." : "Confirmar Ajuste de Estoque"}</button>
                <button type="button" className="secondary" onClick={() => { setShowAddMovement(false); setSelectedProductForAdjustment(null); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Marca / Modelo</th>
                <th>Preço Venda</th>
                <th>CMV (Custo)</th>
                <th>Margem Bruta</th>
                <th>Estoque Atual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const marginCents = p.price_cents - (p.cost_cents || 0);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.brand} {p.model}</td>
                    <td>{money(p.price_cents)}</td>
                    <td>{money(p.cost_cents || 0)}</td>
                    <td style={{ color: marginCents > 0 ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
                      {money(marginCents)}
                    </td>
                    <td>
                      <span className={`badge ${p.stock_balance > 0 ? "success" : "danger"}`}>
                        {p.stock_balance} un.
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "auto" }}
                        onClick={() => setSelectedProductForAdjustment(p)}
                      >
                        ⚡ Ajustar Estoque (Modal)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "services" && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Serviço Fonoaudiológico</th>
                <th>Preço</th>
                <th>CMV</th>
                <th>Duração</th>
                <th>Insumos / Produtos Consumidos</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    {s.description && <small style={{ display: "block", color: "#64748b" }}>{s.description}</small>}
                  </td>
                  <td>{money(s.price_cents)}</td>
                  <td>{money(s.cmv_cents)}</td>
                  <td>⏱️ {s.execution_time_minutes} min</td>
                  <td>
                    {s.products && s.products.length > 0 ? (
                      s.products.map((p) => (
                        <span key={p.productId} className="badge info" style={{ marginRight: "0.3rem" }}>
                          {p.quantity}x {p.productName}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Nenhum insumo direto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "movements" && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Produto</th>
                <th>Tipo de Movimentação</th>
                <th>Qtd. Alterada</th>
                <th>Justificativa / Nota</th>
                <th>Operador Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{date(m.created_at)}</td>
                  <td><strong>{m.product_name}</strong></td>
                  <td>
                    <span className={`badge ${m.movement_type === "entry" ? "success" : m.movement_type === "sale_deduction" ? "info" : "warning"}`}>
                      {m.movement_type === "entry" ? "Entrada" : m.movement_type === "sale_deduction" ? "Baixa por Venda" : "Ajuste Auditado"}
                    </span>
                  </td>
                  <td style={{ fontWeight: "bold", color: m.quantity > 0 ? "#16a34a" : "#dc2626" }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td>{m.notes}</td>
                  <td>{m.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const operationIds = useRef(new Set<string>());

  const load = async () => {
    try {
      const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      const [accData, entriesData, recData] = await Promise.all([
        api("/api/company-accounts"),
        api(`/api/finance/entries?${q.toString()}`),
        api(`/api/finance/receivables?${q.toString()}`),
      ]);
      setAccounts(accData.accounts || []);
      setEntries(entriesData.entries || []);
      setReceivables(recData.receivables || []);
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

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>📊 Relatório & Balanço Financeiro Reformulado</h2>
          <p>Acompanhamento de DRE, fluxo de caixa, relatórios por CNPJ e previsão de recebimentos.</p>
        </div>
        <div className="actions">
          <button onClick={() => setShowForm(true)}>+ Novo Lançamento</button>
        </div>
      </div>

      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {user.role === "admin" && summary && (
        <div className="finance-summary">
          <div className="kpi-card">
            <span>Saldo Consolidado</span>
            <strong style={{ color: summary.consolidated.balance_cents >= 0 ? "#16a34a" : "#dc2626" }}>
              {money(summary.consolidated.balance_cents)}
            </strong>
          </div>
          <div className="kpi-card">
            <span>Entradas Realizadas</span>
            <strong style={{ color: "#16a34a" }}>+{money(summary.consolidated.income_cents)}</strong>
          </div>
          <div className="kpi-card">
            <span>Saídas Realizadas</span>
            <strong style={{ color: "#dc2626" }}>−{money(summary.consolidated.expense_cents)}</strong>
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
        <table>
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
                <td style={{ fontWeight: "bold", color: item.entry_type === "income" ? "#16a34a" : "#dc2626" }}>
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
        </table>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Vencimento</th>
              <th>Produto / Serviço</th>
              <th>Caixa</th>
              <th>Forma</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.patient_name}</strong></td>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {reversalModalEntry && (
        <div className="modal-overlay" onClick={() => setReversalModalEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Popup Modal de Estorno Financeiro Imutável</h3>
            <p>Os lançamentos no Fonolife são <strong>append-only</strong>. O estorno gerará um registro compensatório oposto vinculado a esta entrada.</p>
            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", margin: "1rem 0" }}>
              <strong>Item:</strong> {reversalModalEntry.description} — <strong>{money(reversalModalEntry.amount_cents)}</strong>
            </div>
            <label>
              Justificativa do Estorno (Mínimo 3 caracteres)
              <input value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} placeholder="Ex: Lançamento duplicado pelo operador" required />
            </label>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="danger" onClick={handleConfirmReversal}>Confirmar Estorno Auditado</button>
              <button type="button" className="secondary" onClick={() => setReversalModalEntry(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Patients({ initialPatientId, openGlobalPatient }: { initialPatientId?: string | null; openGlobalPatient: (id: string) => void }) {
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
        <PatientRecord id={selectedId} onBack={() => setSelectedId(null)} />
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
            <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <PatientForm onCancel={() => setShowAddForm(false)} onDone={(id) => { setShowAddForm(false); setSelectedId(id); }} />
              </div>
            </div>
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
                    <PatientNameLink patientId={p.id} name={p.name} openGlobal={openGlobalPatient} />
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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
          }),
        });
        load();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <h4>📄 Exames & Laudos Audiométricos</h4>
      {error && <p className="error" role="alert">{error}</p>}
      <label style={{ display: "block", margin: "0.5rem 0" }}>
        <span>+ Anexar Laudo (PDF / Imagem máx 10MB):</span>{" "}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} />
      </label>
      {uploading && <p>Enviando laudo...</p>}
      {attachments.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Nenhum laudo anexado a este paciente.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {attachments.map((a) => (
            <li key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📄 <strong>{a.original_name}</strong> <small>({(a.size_bytes / 1024).toFixed(1)} KB)</small></span>
              <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "bold" }}>
                📥 Baixar Laudo
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
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

function PatientRecord({ id, onBack }: { id: string; onBack: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [detail, history] = await Promise.all([
        api(`/api/patients/${id}`),
        api(`/api/patients/${id}/timeline`),
      ]);
      setPatient(detail.patient);
      setTimeline(history.items);
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
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SaleForm patientId={id} onDone={() => { setShowSaleModal(false); setMessage("Venda/Serviço registrado no prontuário!"); load(); }} />
          </div>
        </div>
      )}

      <section className="card record">
        <div className="section-title">
          <div>
            <h2>{patient.name}</h2>
            <p>{patient.phone} · <span className="badge info">{statuses[patient.journey_status]}</span></p>
          </div>
          <div className="actions">
            <button onClick={() => setShowSaleModal(true)}>🛒 Nova Venda / Serviço (Catálogo)</button>
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

        <PatientAttachments patientId={id} />
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
                  <PatientNameLink patientId={item.patient_id} name={item.patient_name} openGlobal={openGlobalPatient} />
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
          <strong style={{ color: "#dc2626" }}>{data.overdue}</strong>
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
          <strong style={{ color: "#16a34a" }}>{data.month_sales}</strong>
        </div>
      </div>

      {user.role === "admin" && data.financial && (
        <section className="card" style={{ margin: "1rem 0" }}>
          <h3>💵 Resumo Financeiro Realizado</h3>
          <div className="finance-summary">
            <div className="kpi-card"><span>Saldo Consolidado</span><strong>{money(data.financial.consolidated.balance_cents)}</strong></div>
            <div className="kpi-card"><span>Entradas no Mês</span><strong style={{ color: "#16a34a" }}>{money(data.financial.consolidated.month_income_cents)}</strong></div>
            <div className="kpi-card"><span>Saídas no Mês</span><strong style={{ color: "#dc2626" }}>{money(data.financial.consolidated.month_expense_cents)}</strong></div>
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

  return (
    <div className="login">
      <section style={{ width: "min(100%, 450px)" }}>
        <div className="brand" style={{ marginBottom: "0.5rem", textAlign: "center" }}>🦻 Fonolife CRM</div>
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
          <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#475569", marginBottom: "0.75rem", textAlign: "center" }}>
              ⚡ Acesso Rápido — Perfis de Demonstração (Demo):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => {
                  setEmail("admin@fonolife.com.br");
                  setPassword("admin123");
                  handleLogin("admin@fonolife.com.br", "admin123");
                }}
              >
                <span>👑 Entrar como <strong>Administrador</strong></span>
                <small style={{ opacity: 0.7 }}>Acesso Total</small>
              </button>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => {
                  setEmail("operador@fonolife.com.br");
                  setPassword("operador123");
                  handleLogin("operador@fonolife.com.br", "operador123");
                }}
              >
                <span>🛒 Entrar como <strong>Operador (Caixa / PDV)</strong></span>
                <small style={{ opacity: 0.7 }}>Atendimento & Vendas</small>
              </button>
              <button
                type="button"
                className="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                disabled={loading}
                onClick={() => {
                  setEmail("carlos.fonolife@gmail.com");
                  setPassword("medico123");
                  handleLogin("carlos.fonolife@gmail.com", "medico123");
                }}
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
  const [page, setPage] = useState("Início");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [globalPatientId, setGlobalPatientId] = useState<string | null>(null);

  useEffect(() => {
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center"><p>Carregando Fonolife…</p></div>;

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  const pages =
    user.role === "doctor"
      ? ["Minha Agenda", "Meus Pacientes", "Atendimento Clínico", "Pacientes"]
      : ["Início", "Caixa (PDV)", "Pacientes", "Acompanhamento", "Estoque & Catálogo", "Financeiro", "Importação CSV"];

  return (
    <div className="shell">
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="brand">🦻 Fonolife</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>| Clínica Fonoaudiológica</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>{user.name} ({user.role})</span>
          <button className="secondary" style={{ minHeight: "auto", padding: "0.3rem 0.6rem" }} onClick={() => api("/api/auth/logout", { method: "POST" }).then(() => setUser(null))}>
            Sair
          </button>
        </div>
      </header>

      <nav>
        {pages.map((item) => (
          <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>
            {item}
          </button>
        ))}
      </nav>

      <main>
        <div className="title">
          <div>
            <h1>{page}</h1>
          </div>
        </div>

        {page === "Caixa (PDV)" ? (
          <PosCheckout user={user} openGlobalPatient={setGlobalPatientId} />
        ) : page === "Pacientes" ? (
          <Patients initialPatientId={patientId} openGlobalPatient={setGlobalPatientId} />
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

      <GlobalPatientModal patientId={globalPatientId} onClose={() => setGlobalPatientId(null)} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
