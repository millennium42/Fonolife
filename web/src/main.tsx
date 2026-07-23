import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./sales.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
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
const date = (value: string | null | undefined) => {
  if (!value) return "Não informado";
  const civil = value.slice(0, 10);
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(civil) ? `${civil}T12:00:00` : value);
  return Number.isNaN(parsed.valueOf()) ? "Não informado" : new Intl.DateTimeFormat("pt-BR").format(parsed);
};
async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.title ?? "Não foi possível concluir");
  return body;
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
const cents = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};
function monthly(total: number, count: number, first: string) {
  const [year, month, day] = first.split("-").map(Number),
    base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => {
    const target = month - 1 + index,
      y = year + Math.floor(target / 12),
      m = target % 12,
      last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return {
      amountCents: index === count - 1 ? total - base * (count - 1) : base,
      dueOn: `${y}-${String(m + 1).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`,
    };
  });
}

function SaleForm({
  patientId,
  onDone,
}: {
  patientId: string;
  onDone: () => void;
}) {
  const requestId = useRef(crypto.randomUUID());
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    api("/api/company-accounts")
      .then((x) =>
        setAccounts(x.accounts.filter((a: CompanyAccount) => a.active)),
      )
      .catch((e) => setError(e.message));
  }, []);
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
          product: v.product,
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
    <form className="panel form compact" onSubmit={submit}>
      <h2>Registrar venda</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <label>
        Aparelho ou produto
        <input name="product" required minLength={2} />
      </label>
      <div className="fields">
        <label>
          Quantidade
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            required
          />
        </label>
        <label>
          Valor total (R$)
          <input name="total" inputMode="decimal" placeholder="0,00" required />
        </label>
        <label>
          Data da venda
          <input name="soldOn" type="date" defaultValue={today()} required />
        </label>
        <label>
          Vai para qual caixa/CNPJ?
          <select name="companyAccountId" required>
            <option value="">Escolha</option>
            {accounts.map((a) => (
              <option value={a.id} key={a.id}>
                {a.short_label} — {a.trade_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Garantia até
          <input name="warrantyUntil" type="date" />
        </label>
        <label>
          Entrega/adaptação
          <select name="deliveryStatus" defaultValue="pending">
            <option value="pending">Pendente</option>
            <option value="delivered">Entregue</option>
            <option value="adaptation">Adaptação</option>
            <option value="completed">Concluída</option>
          </select>
        </label>
      </div>
      <label>
        Observações
        <textarea name="notes" rows={2} />
      </label>
      <fieldset>
        <legend>Pagamento inicial</legend>
        <div className="fields">
          <label>
            Valor recebido agora (R$)
            <input
              name="received"
              inputMode="decimal"
              placeholder="Mesmo valor total"
              onBlur={(e) => {
                if (!e.currentTarget.value) {
                  e.currentTarget.value = (
                    e.currentTarget.form?.elements.namedItem(
                      "total",
                    ) as HTMLInputElement
                  )?.value;
                }
              }}
            />
          </label>
          <label>
            Forma
            <select name="receivedMethod" defaultValue="pix">
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
              <option value="debit_card">Débito</option>
              <option value="credit_card">Crédito</option>
              <option value="bank_transfer">Transferência</option>
              <option value="boleto">Boleto</option>
              <option value="other">Outro</option>
            </select>
          </label>
        </div>
      </fieldset>
      <details>
        <summary>Dividir ou parcelar pagamento</summary>
        <p className="hint">
          O restante do total será dividido nas parcelas futuras.
        </p>
        <div className="fields">
          <label>
            Quantidade de parcelas futuras
            <input
              name="futureCount"
              type="number"
              min="0"
              max="120"
              defaultValue="0"
            />
          </label>
          <label>
            Primeiro vencimento
            <input name="firstDueOn" type="date" />
          </label>
          <label>
            Forma das parcelas
            <select name="futureMethod" defaultValue="credit_card">
              <option value="credit_card">Crédito</option>
              <option value="boleto">Boleto</option>
              <option value="pix">PIX</option>
              <option value="bank_transfer">Transferência</option>
              <option value="other">Outro</option>
            </select>
          </label>
        </div>
      </details>
      <button disabled={saving}>
        {saving ? "Registrando…" : "Confirmar venda"}
      </button>
    </form>
  );
}

function PatientForm({
  patient,
  onDone,
  onCancel,
}: {
  patient?: Patient;
  onDone: (id: string, message?: string) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const payload = {
        ...values,
        version: patient?.version,
        birthDate: values.birthDate || null,
        guardianName: values.guardianName || null,
        nextContactOn: values.nextContactOn || null,
      };
      const body = await api(
        patient ? `/api/patients/${patient.id}` : "/api/patients",
        {
          method: patient ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      onDone(patient?.id ?? body.id, body?.warning ?? "Ficha salva.");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="panel form"
      onSubmit={submit}
      aria-label={patient ? "Editar paciente" : "Novo paciente"}
    >
      <div className="section-title">
        <h2>{patient ? "Editar ficha" : "Novo paciente"}</h2>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="fields">
        <label>
          Nome completo
          <input
            name="name"
            defaultValue={patient?.name}
            minLength={2}
            required
            autoFocus
          />
        </label>
        <label>
          Telefone ou WhatsApp
          <input
            name="phone"
            type="tel"
            defaultValue={patient?.phone}
            inputMode="tel"
            minLength={10}
            required
          />
        </label>
        <label>
          Status
          <select
            name="status"
            defaultValue={patient?.journey_status ?? "new_lead"}
          >
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Origem
          <select
            name="contactSource"
            defaultValue={patient?.contact_source ?? "other"}
          >
            {Object.entries(sources).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details open={Boolean(patient)}>
        <summary>Mais informações</summary>
        <div className="fields">
          <label>
            Data de nascimento
            <input
              name="birthDate"
              type="date"
              defaultValue={patient?.birth_date ?? ""}
            />
          </label>
          <label>
            Responsável pelo paciente
            <input
              name="guardianName"
              defaultValue={patient?.guardian_name ?? ""}
            />
          </label>
          <label className="wide">
            Alerta de cuidado
            <textarea
              name="careAlert"
              rows={2}
              defaultValue={patient?.care_alert ?? ""}
            />
          </label>
          <label className="wide">
            Observações
            <textarea
              name="notes"
              rows={3}
              defaultValue={patient?.notes ?? ""}
            />
          </label>
        </div>
      </details>
      <button disabled={saving}>
        {saving ? "Salvando…" : "Salvar paciente"}
      </button>
    </form>
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
    <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "6px", maxWidth: "100%", boxSizing: "border-box" }}>
      <h3>Exames & Laudos Audiométricos</h3>
      {error && <p className="error" role="alert">{error}</p>}
      <label style={{ display: "block", margin: "0.5rem 0", maxWidth: "100%" }}>
        <span>+ Anexar Laudo (PDF / Imagem máx 10MB):</span>{" "}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} disabled={uploading} style={{ maxWidth: "100%", boxSizing: "border-box" }} />
      </label>
      {uploading && <p>Enviando exame...</p>}
      {attachments.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#666" }}>Nenhum laudo anexado a este paciente.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {attachments.map((a) => (
            <li key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ wordBreak: "break-word", minWidth: 0, flex: "1 1 auto" }}>📄 <strong>{a.original_name}</strong> <small>({(a.size_bytes / 1024).toFixed(1)} KB)</small></span>
              <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontWeight: "bold" }}>
                📥 Baixar Laudo
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

}

function PatientRecord({ id, onBack }: { id: string; onBack: () => void }) {

  const [patient, setPatient] = useState<Patient | null>(null),
    [timeline, setTimeline] = useState<TimelineItem[]>([]),
    [editing, setEditing] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
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
  async function schedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    try {
      await api("/api/follow-ups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientId: id,
          ...Object.fromEntries(new FormData(form)),
        }),
      });
      form.reset();
      setMessage("Retorno agendado.");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  async function archive() {
    if (!confirm("Arquivar este paciente? O histórico será preservado."))
      return;
    try {
      await api(`/api/patients/${id}/archive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: patient!.version }),
      });
      onBack();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  if (!patient)
    return (
      <section className="panel" aria-live="polite">
        {error || "Carregando ficha…"}
      </section>
    );
  if (editing)
    return (
      <PatientForm
        patient={patient}
        onCancel={() => setEditing(false)}
        onDone={async (_id, text) => {
          setMessage(text ?? "Ficha salva.");
          setEditing(false);
          await load();
        }}
      />
    );
  async function handleExportLgpd() {
    window.open(`/api/patients/${id}/export-data`, "_blank");
  }

  async function handleAnonymizeLgpd() {
    if (!confirm("ATENÇÃO: Deseja anonimizar permanentemente este paciente conforme a LGPD? Todos os dados de PII serão mascarados."))
      return;
    try {
      await api(`/api/admin/patients/${id}/anonymize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: patient!.version }),
      });
      setMessage("Paciente anonimizado com sucesso (LGPD).");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  return (
    <>
      <button className="back" onClick={onBack}>
        ← Voltar para pacientes
      </button>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel record">
        <div className="section-title">
          <div>
            <h2>{patient.name}</h2>
            <p>
              {patient.phone} · {statuses[patient.journey_status]}
            </p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={handleExportLgpd} title="Exportar dados do titular (LGPD)">
              Exportar LGPD
            </button>
            {!patient.anonymized_at && (
              <button className="danger" onClick={handleAnonymizeLgpd} title="Anonimizar dados de identificação (LGPD)">
                Anonimizar LGPD
              </button>
            )}
            <button className="secondary" onClick={() => setEditing(true)}>
              Editar ficha
            </button>
            <button className="danger" onClick={archive}>
              Arquivar
            </button>
          </div>
        </div>

        {patient.care_alert && (
          <p className="care-alert">
            <strong>Atenção:</strong> {patient.care_alert}
          </p>
        )}
        <dl>
          <div>
            <dt>Próxima ação</dt>
            <dd>{date(patient.next_contact_on)}</dd>
          </div>
          <div>
            <dt>Responsável interno</dt>
            <dd>{patient.assigned_user_name}</dd>
          </div>
          <div>
            <dt>Origem</dt>
            <dd>{sources[patient.contact_source]}</dd>
          </div>
          <div>
            <dt>Responsável pelo paciente</dt>
            <dd>{patient.guardian_name || "Não informado"}</dd>
          </div>
        </dl>
        {patient.notes && (
          <p>
            <strong>Observações:</strong> {patient.notes}
          </p>
        )}
        <PatientAttachments patientId={id} />
      </section>

      <div className="record-grid">
        <div>
          <form className="panel form" onSubmit={addEvent}>
            <h2>Registrar interação</h2>
            <label>
              Tipo
              <select name="eventType" defaultValue="call">
                {Object.entries(eventTypes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              O que aconteceu?
              <textarea name="description" rows={4} minLength={2} required />
            </label>
            <button>Registrar no histórico</button>
          </form>
          <form className="panel form compact" onSubmit={schedule}>
            <h2>Agendar retorno</h2>
            <label>
              O que fazer?
              <input
                name="title"
                defaultValue="Entrar em contato"
                minLength={2}
                required
              />
            </label>
            <label>
              Quando?
              <input name="dueOn" type="date" required />
            </label>
            <label>
              Observação
              <input name="notes" />
            </label>
            <button>Agendar retorno</button>
          </form>
        </div>
        <section className="panel">
          <h2>Histórico</h2>
          {timeline.length === 0 ? (
            <p>Nenhuma interação registrada.</p>
          ) : (
            <ol className="timeline">
              {timeline.map((item) => (
                <li key={item.id}>
                  <strong>
                    {eventTypes[item.type] ??
                      (item.type === "follow_up_completed"
                        ? "Retorno concluído"
                        : item.type === "follow_up_cancelled"
                          ? "Retorno cancelado"
                          : item.type === "follow_up_scheduled"
                            ? "Retorno agendado"
                            : "Paciente cadastrado")}
                  </strong>
                  <p>{item.description}</p>
                  <small>
                    {new Date(item.occurred_at).toLocaleString("pt-BR")} ·{" "}
                    {item.author}
                  </small>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function FollowUps() {
  const filters: { [key: string]: string } = {
    today: "Hoje",
    overdue: "Atrasados",
    upcoming: "Próximos 30 dias",
    adaptation: "Em adaptação",
    "no-contact": "Sem contato há 90 dias",
  };
  const [filter, setFilter] = useState("today"),
    [items, setItems] = useState<FollowUp[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load() {
    try {
      setItems((await api(`/api/follow-ups?filter=${filter}`)).items);
      setError("");
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [filter]);
  async function close(id: string, action: "complete" | "cancel") {
    if (
      action === "cancel" &&
      !confirm("Cancelar este retorno? O histórico será preservado.")
    )
      return;
    try {
      await api(`/api/follow-ups/${id}/${action}`, { method: "POST" });
      setMessage(
        action === "complete" ? "Retorno concluído." : "Retorno cancelado.",
      );
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  if (selected)
    return (
      <PatientRecord
        id={selected}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );
  return (
    <>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <div
        className="filter-tabs"
        role="group"
        aria-label="Filtrar acompanhamento"
      >
        {Object.entries(filters).map(([value, label]) => (
          <button
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel patient-list">
        <h2>
          {items.length} pessoa{items.length === 1 ? "" : "s"} nesta fila
        </h2>
        {items.length === 0 ? (
          <div className="empty">
            <h3>Nada pendente aqui</h3>
            <p>Escolha outra fila ou continue o atendimento normal.</p>
          </div>
        ) : (
          items.map((item) => (
            <article
              className="follow-row"
              key={`${item.patient_id}-${item.task_id ?? filter}`}
            >
              <button
                className="patient-link"
                onClick={() => setSelected(item.patient_id)}
              >
                <strong>{item.patient_name}</strong>
                <small>
                  {item.phone} · {statuses[item.journey_status]}
                </small>
              </button>
              <div>
                <strong>
                  {item.title ??
                    (filter === "adaptation"
                      ? "Paciente em adaptação"
                      : "Contato de cuidado necessário")}
                </strong>
                <small>
                  {item.due_on
                    ? `Para ${date(item.due_on)}`
                    : item.last_contact_at
                      ? `Último contato ${new Date(item.last_contact_at).toLocaleDateString("pt-BR")}`
                      : "Sem interação registrada"}
                </small>
              </div>
              {item.task_id ? (
                <div className="actions">
                  <button onClick={() => close(item.task_id!, "complete")}>
                    Concluir
                  </button>
                  <button
                    className="secondary"
                    onClick={() => close(item.task_id!, "cancel")}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setSelected(item.patient_id)}>
                  Agendar retorno
                </button>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}

function Patients({ initialPatientId }: { initialPatientId?: string | null }) {
  const [patients, setPatients] = useState<Patient[]>([]),
    [selected, setSelected] = useState<string | null>(initialPatientId ?? null),
    [creating, setCreating] = useState(false),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [overdue, setOverdue] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function load() {
    try {
      const query = new URLSearchParams({
        search,
        ...(status && { status }),
        ...(overdue && { overdue: "true" }),
      });
      setPatients((await api(`/api/patients?${query}`)).patients);
      setError("");
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, status, overdue]);
  if (selected)
    return (
      <>
        {message && <p className="success" role="status">{message}</p>}
        <PatientRecord
          id={selected}
          onBack={() => {
            setSelected(null);
            load();
          }}
        />
        <SaleForm
          patientId={selected}
          onDone={() => setMessage("Venda registrada.")}
        />
      </>
    );
  if (creating)
    return (
      <PatientForm
        onCancel={() => setCreating(false)}
        onDone={(id, text) => {
          setMessage(text ?? "Paciente cadastrado.");
          setCreating(false);
          setSelected(id);
        }}
      />
    );
  return (
    <>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <div className="toolbar">
        <label>
          Buscar paciente
          <input
            type="search"
            placeholder="Nome ou telefone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => setOverdue(e.target.checked)}
          />
          Somente atrasados
        </label>
        <button onClick={() => setCreating(true)}>+ Novo paciente</button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel patient-list">
        <h2>
          {patients.length} paciente{patients.length === 1 ? "" : "s"}
        </h2>
        {patients.length === 0 ? (
          <div className="empty">
            <h3>Nenhum paciente encontrado</h3>
            <p>Revise os filtros ou cadastre o primeiro paciente.</p>
          </div>
        ) : (
          patients.map((patient) => (
            <button
              className="patient-row"
              onClick={() => setSelected(patient.id)}
              key={patient.id}
            >
              <span>
                <strong>{patient.name}</strong>
                <small>
                  {patient.phone} · {statuses[patient.journey_status]}
                </small>
              </span>
              <span
                className={
                  patient.next_contact_on &&
                  patient.next_contact_on <
                    new Date().toISOString().slice(0, 10)
                    ? "overdue"
                    : ""
                }
              >
                {patient.next_contact_on
                  ? `Contato ${date(patient.next_contact_on)}`
                  : "Sem contato agendado"}{" "}
                →
              </span>
            </button>
          ))
        )}
      </section>
    </>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value / 100,
  );
const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  debit_card: "Débito",
  credit_card: "Crédito",
  bank_transfer: "Transferência",
  boleto: "Boleto",
  other: "Outro",
};
const categoryLabels: Record<string, string> = {
  hearing_aid_sale: "Venda de aparelho",
  service: "Serviço",
  maintenance: "Manutenção",
  other_income: "Outras entradas",
  supplier: "Fornecedor",
  rent: "Aluguel",
  payroll: "Folha",
  tax: "Imposto",
  utilities: "Utilidades",
  marketing: "Marketing",
  other_expense: "Outras saídas",
};

function Finance({ user }: { user: User }) {
  const entryRequestId = useRef(crypto.randomUUID());
  const operationIds = useRef(new Map<string, string>());
  const [tab, setTab] = useState<"entries" | "receivables">("entries"),
    [entries, setEntries] = useState<FinancialEntry[]>([]),
    [receivables, setReceivables] = useState<Receivable[]>([]),
    [accounts, setAccounts] = useState<CompanyAccount[]>([]),
    [summary, setSummary] = useState<FinanceSummary | null>(null),
    [showForm, setShowForm] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [filters, setFilters] = useState({
      from: "",
      to: "",
      companyAccountId: "",
      entryType: "",
      category: "",
      paymentMethod: "",
    });
  const query = () =>
    new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value),
    ).toString();
  async function load() {
    try {
      const suffix = query();
      const [entryData, receivableData, accountData, summaryData] =
        await Promise.all([
          api(`/api/finance/entries?${suffix}`),
          api(
            `/api/finance/receivables?${new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && !["entryType", "category"].includes(key))).toString()}`,
          ),
          api("/api/company-accounts"),
          user.role === "admin"
            ? api(`/api/finance/summary?${suffix}`)
            : Promise.resolve(null),
        ]);
      setEntries(entryData.entries);
      setReceivables(receivableData.receivables);
      setAccounts(accountData.accounts.filter((a: CompanyAccount) => a.active));
      setSummary(summaryData);
      setError("");
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [JSON.stringify(filters)]);
  async function createEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      value = Object.fromEntries(new FormData(form));
    if (
      !confirm(
        `Confirmar ${value.entryType === "income" ? "entrada" : "saída"} de R$ ${value.amount} no caixa escolhido?`,
      )
    )
      return;
    try {
      await api("/api/finance/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: entryRequestId.current,
          entryType: value.entryType,
          category: value.category,
          description: value.description,
          amountCents: cents(String(value.amount)),
          competenceOn: value.competenceOn,
          occurredOn: value.occurredOn,
          paymentMethod: value.paymentMethod,
          companyAccountId: value.companyAccountId,
          notes: value.notes,
        }),
      });
      setShowForm(false);
      entryRequestId.current = crypto.randomUUID();
      setMessage("Lançamento registrado.");
      form.reset();
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  async function settle(item: Receivable) {
    if (
      !confirm(
        `Confirmar recebimento de ${money(item.amount_cents)} de ${item.patient_name}?`,
      )
    )
      return;
    try {
      const requestId = operationIds.current.get(item.id) ?? crypto.randomUUID();
      operationIds.current.set(item.id, requestId);
      await api(`/api/finance/receivables/${item.id}/settle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId,
          receivedOn: today(),
        }),
      });
      operationIds.current.delete(item.id);
      setMessage("Recebimento confirmado.");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  async function reverse(item: FinancialEntry) {
    const reason = prompt(`Motivo do estorno de ${money(item.amount_cents)}:`);
    if (!reason) return;
    if (
      !confirm(
        "Confirmar estorno? Um lançamento compensatório será criado e o original permanecerá no histórico.",
      )
    )
      return;
    try {
      const operationKey = `reverse-${item.id}`;
      const requestId = operationIds.current.get(operationKey) ?? crypto.randomUUID();
      operationIds.current.set(operationKey, requestId);
      await api(`/api/finance/entries/${item.id}/reverse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId,
          reason,
          occurredOn: today(),
        }),
      });
      operationIds.current.delete(operationKey);
      setMessage("Estorno registrado.");
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }
  return (
    <>
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="finance-actions">
        <div className="filter-tabs" role="group" aria-label="Visão financeira">
          <button
            className={tab === "entries" ? "active" : ""}
            onClick={() => setTab("entries")}
          >
            Realizado
          </button>
          <button
            className={tab === "receivables" ? "active" : ""}
            onClick={() => setTab("receivables")}
          >
            Previsões
          </button>
        </div>
        <button onClick={() => setShowForm(true)}>+ Novo lançamento</button>
      </div>
      <details className="panel finance-filters">
        <summary>Filtrar resultados</summary>
        <div className="fields">
          <label>
            De
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <label>
            Caixa/CNPJ
            <select
              value={filters.companyAccountId}
              onChange={(e) =>
                setFilters({ ...filters, companyAccountId: e.target.value })
              }
            >
              <option value="">Todos</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.short_label}
                </option>
              ))}
            </select>
          </label>
          {tab === "entries" && (
            <>
              <label>
                Tipo
                <select
                  value={filters.entryType}
                  onChange={(e) =>
                    setFilters({ ...filters, entryType: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </select>
              </label>
              <label>
                Categoria
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            Pagamento
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                setFilters({ ...filters, paymentMethod: e.target.value })
              }
            >
              <option value="">Todos</option>
              {Object.entries(paymentLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
      {user.role === "admin" && tab === "entries" && summary && (
        <>
          <div className="finance-summary">
            <article>
              <span>Saldo consolidado</span>
              <strong>{money(summary.consolidated.balance_cents)}</strong>
            </article>
            <article>
              <span>Entradas</span>
              <strong>{money(summary.consolidated.income_cents)}</strong>
            </article>
            <article>
              <span>Saídas</span>
              <strong>{money(summary.consolidated.expense_cents)}</strong>
            </article>
          </div>
          <div className="finance-accounts">
            {summary.byAccount.map((item) => (
              <article className="panel" key={item.company_account_id}>
                <strong>{item.company_account_label}</strong>
                <span>Saldo {money(item.balance_cents)}</span>
                <small>
                  Entradas {money(item.income_cents)} · Saídas{" "}
                  {money(item.expense_cents)}
                </small>
              </article>
            ))}
          </div>
        </>
      )}
      <section className="panel finance-list">
        <h2>
          {tab === "entries" ? "Lançamentos realizados" : "Parcelas previstas"}
        </h2>
        {tab === "entries" ? (
          entries.length ? (
            entries.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <small>
                    {date(item.occurred_on)} · {item.company_account_label} ·{" "}
                    {paymentLabels[item.payment_method]}
                  </small>
                </div>
                <strong className={item.entry_type}>
                  {item.entry_type === "income" ? "+" : "−"}{" "}
                  {money(item.amount_cents)}
                </strong>
                {user.role === "admin" &&
                  !item.reversal_of_id &&
                  !item.reversed && (
                    <button className="secondary" onClick={() => reverse(item)}>
                      Estornar
                    </button>
                  )}
              </article>
            ))
          ) : (
            <p>Nenhum lançamento no período.</p>
          )
        ) : receivables.length ? (
          receivables.map((item) => (
            <article key={item.id}>
              <div>
                <strong>
                  {item.patient_name} · {item.product}
                </strong>
                <small>
                  Vence {date(item.due_on)} · {item.company_account_label} ·{" "}
                  {paymentLabels[item.payment_method]}
                </small>
              </div>
              <strong>{money(item.amount_cents)}</strong>
              {item.status === "expected" ? (
                <button onClick={() => settle(item)}>
                  Confirmar recebimento
                </button>
              ) : (
                <span className={`status ${item.status}`}>
                  {item.status === "received" ? "Recebido" : "Cancelado"}
                </span>
              )}
            </article>
          ))
        ) : (
          <p>Nenhuma previsão no período.</p>
        )}
      </section>
      {showForm && (
        <dialog
          open
          className="modal"
          aria-labelledby="finance-form-title"
          onCancel={() => setShowForm(false)}
        >
          <form className="panel form" onSubmit={createEntry}>
            <h2 id="finance-form-title">Novo lançamento</h2>
            <div className="fields">
              <label>
                Tipo
                <select name="entryType" required>
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </select>
              </label>
              <label>
                Categoria
                <select name="category" required>
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Valor (R$)
                <input name="amount" inputMode="decimal" required autoFocus />
              </label>
              <label>
                Competência
                <input
                  name="competenceOn"
                  type="date"
                  defaultValue={today()}
                  required
                />
              </label>
              <label>
                Pago/recebido em
                <input
                  name="occurredOn"
                  type="date"
                  defaultValue={today()}
                  required
                />
              </label>
              <label>
                Forma
                <select name="paymentMethod" defaultValue="pix">
                  {Object.entries(paymentLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vai para qual caixa/CNPJ?
                <select name="companyAccountId" required>
                  <option value="">Escolha</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.short_label} — {a.trade_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Descrição
              <input name="description" minLength={2} required />
            </label>
            <label>
              Observação
              <textarea name="notes" rows={2} />
            </label>
            <div className="actions">
              <button>Confirmar lançamento</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}

function Dashboard({ user, openPatient, openFollowUps }: { user: User; openPatient: (id: string) => void; openFollowUps: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null), [error, setError] = useState("");
  useEffect(() => { api("/api/dashboard").then(setData).catch((reason) => setError((reason as Error).message)); }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p aria-live="polite">Carregando resumo…</p>;
  const cards = [["Contatos atrasados", data.overdue, openFollowUps], ["Retornos de hoje", data.today, openFollowUps], ["Tarefas abertas", data.open_tasks, openFollowUps], ["Em adaptação", data.adaptation, openFollowUps], ["Vendas no mês", data.month_sales, undefined]] as const;
  return <>
    <section className="dashboard-cards" aria-label="Resumo operacional">{cards.map(([label, value, action]) => <button className="dashboard-card" key={label} onClick={action} disabled={!action}><span>{label}</span><strong>{value}</strong></button>)}</section>
    {user.role === "admin" && data.financial && <section className="panel"><h2>Financeiro realizado</h2><div className="dashboard-finance"><article><span>Saldo consolidado</span><strong>{money(data.financial.consolidated.balance_cents)}</strong></article><article><span>Entradas no mês</span><strong>{money(data.financial.consolidated.month_income_cents)}</strong></article><article><span>Saídas no mês</span><strong>{money(data.financial.consolidated.month_expense_cents)}</strong></article></div><ul className="account-balances">{data.financial.byAccount.map((account) => <li key={account.company_account_id}><span>{account.company_account_label}</span><strong>{money(account.balance_cents)}</strong></li>)}</ul></section>}
    <section className="panel dashboard-queue"><div className="section-heading"><h2>Próximas ações</h2><button className="secondary" onClick={openFollowUps}>Ver acompanhamento</button></div>{data.queue.length === 0 ? <div className="empty"><h3>Nenhuma tarefa aberta</h3><p>Novos retornos aparecerão aqui por ordem de urgência.</p></div> : data.queue.map((item) => <button className="patient-row" onClick={() => openPatient(item.patient_id)} key={item.task_id}><span><strong>{item.patient_name}</strong><small>{item.title} · {item.phone}</small></span><span className={item.timing === "overdue" ? "overdue" : ""}>{item.timing === "overdue" ? "Atrasado" : item.timing === "today" ? "Hoje" : date(item.due_on)} →</span></button>)}</section>
  </>;
}

function WhatsAppButton({
  patientId,
  phone,
  patientName,
  defaultMessage,
}: {
  patientId: string;
  phone: string;
  patientName: string;
  defaultMessage?: string;
}) {
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
    <button
      type="button"
      className="secondary"
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      title="Abrir conversa no WhatsApp"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", fontSize: "0.85rem" }}
    >
      💬 WhatsApp
    </button>
  );
}

function Inventory({ user }: { user: User }) {

  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  const loadData = () => {
    api("/api/products").then((d) => setProducts(d?.products || [])).catch((e) => setError(e.message));
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

  async function handleAddMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget,
      v = Object.fromEntries(new FormData(form));
    try {
      await api("/api/admin/inventory/movements", {
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
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Catálogo & Estoque de Aparelhos</h2>
        {user.role === "admin" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="secondary" onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? "Cancelar" : "+ Novo Produto"}
            </button>
            <button onClick={() => setShowAddMovement(!showAddMovement)}>
              {showAddMovement ? "Cancelar" : "+ Entrada / Ajuste de Estoque"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="error" role="alert" style={{ margin: "1rem 0" }}>{error}</p>}

      {showAddProduct && (
        <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "500px", margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h3>Cadastrar Produto no Catálogo</h3>
          <label>Nome <input name="name" required placeholder="Ex: Aparelho Audibel Pro" /></label>
          <label>Marca <input name="brand" required placeholder="Ex: Audibel" /></label>
          <label>Modelo <input name="model" required placeholder="Ex: AX7" /></label>
          <label>Preço Sugerido (R$) <input name="price" required placeholder="Ex: 4500,00" /></label>
          <button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Produto"}</button>
        </form>
      )}

      {showAddMovement && (
        <form onSubmit={handleAddMovement} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "500px", margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h3>Lançar Entrada ou Ajuste de Estoque</h3>
          <label>
            Produto
            <select name="productId" required>
              <option value="">Selecione o produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.brand} {p.model})</option>
              ))}
            </select>
          </label>
          <label>
            Tipo de Movimentação
            <select name="movementType" required>
              <option value="entry">Entrada (Adicionar ao estoque)</option>
              <option value="adjustment">Ajuste Manual Auditado</option>
            </select>
          </label>
          <label>Quantidade (Positiva para entrada, negativa para baixa) <input name="quantity" type="number" required placeholder="Ex: 5 ou -1" /></label>
          <label>Observações <input name="notes" placeholder="Motivo do ajuste ou nota fiscal de entrada" /></label>
          <button type="submit" disabled={loading}>{loading ? "Registrando..." : "Registrar Movimentação"}</button>
        </form>
      )}

      <h3>Produtos em Catálogo</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginTop: "0.5rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Nome</th>
            <th style={{ padding: "0.5rem" }}>Marca</th>
            <th style={{ padding: "0.5rem" }}>Modelo</th>
            <th style={{ padding: "0.5rem" }}>Preço</th>
            <th style={{ padding: "0.5rem" }}>Saldo em Estoque</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem" }}><strong>{p.name}</strong></td>
              <td style={{ padding: "0.5rem" }}>{p.brand}</td>
              <td style={{ padding: "0.5rem" }}>{p.model}</td>
              <td style={{ padding: "0.5rem" }}>{money(p.price_cents)}</td>
              <td style={{ padding: "0.5rem", fontWeight: "bold", color: p.stock_balance > 0 ? "green" : "red" }}>
                {p.stock_balance} un.
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {movements.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Histórico de Movimentações (Append-Only)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Data</th>
                <th style={{ padding: "0.5rem" }}>Produto</th>
                <th style={{ padding: "0.5rem" }}>Tipo</th>
                <th style={{ padding: "0.5rem" }}>Qtd.</th>
                <th style={{ padding: "0.5rem" }}>Observação</th>
                <th style={{ padding: "0.5rem" }}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{date(m.created_at)}</td>
                  <td style={{ padding: "0.5rem" }}>{m.product_name}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {m.movement_type === "entry" ? "Entrada" : m.movement_type === "sale_deduction" ? "Baixa por Venda" : "Ajuste"}
                  </td>
                  <td style={{ padding: "0.5rem", color: m.quantity > 0 ? "green" : "red", fontWeight: "bold" }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{m.notes}</td>
                  <td style={{ padding: "0.5rem" }}>{m.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CsvImport() {

  const [entityType, setEntityType] = useState<"patient" | "financial">("patient");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const loadHistory = () => {
    api("/api/admin/import/csv").then((data) => setJobs(data?.jobs || [])).catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent((event.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setMessage({ type: "error", text: "Selecione um arquivo CSV com conteúdo." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api("/api/admin/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, csvContent }),
      });
      setMessage({
        type: "success",
        text: res.idempotent
          ? "Arquivo já importado anteriormente (Idempotente)."
          : `Importação concluída: ${res.processedRows} processados, ${res.errorCount} erros de ${res.totalRows} linhas.`,
      });
      loadHistory();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro na importação" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Importação Massiva via CSV (Administração)</h2>
      <p>Envie planilhas CSV de pacientes ou lançamentos financeiros com garantia de idempotência.</p>
      
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px", margin: "1.5rem 0" }}>
        <label>
          Tipo de Entidade
          <select value={entityType} onChange={(e) => setEntityType(e.target.value as any)}>
            <option value="patient">Pacientes (Nome, Telefone, Origem, Status)</option>
            <option value="financial">Finanças (ContaID, Tipo, ValorCentavos, DataVencimento, Descrição)</option>
          </select>
        </label>
        
        <label>
          Arquivo CSV
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} required />
        </label>
        {fileName && <p style={{ fontSize: "0.85rem", color: "#666" }}>Arquivo selecionado: {fileName}</p>}

        <button type="submit" disabled={loading || !csvContent}>
          {loading ? "Processando..." : "Importar CSV"}
        </button>
      </form>

      {message && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "4px", backgroundColor: message.type === "success" ? "#e6f4ea" : "#fce8e6", color: message.type === "success" ? "#137333" : "#c5221f", marginBottom: "1.5rem" }}>
          {message.text}
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h3>Histórico de Importações CSV</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Data</th>
                <th style={{ padding: "0.5rem" }}>Tipo</th>
                <th style={{ padding: "0.5rem" }}>Total Linhas</th>
                <th style={{ padding: "0.5rem" }}>Processados</th>
                <th style={{ padding: "0.5rem" }}>Erros</th>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{date(job.created_at)}</td>
                  <td style={{ padding: "0.5rem" }}>{job.entity_type === "patient" ? "Pacientes" : "Finanças"}</td>
                  <td style={{ padding: "0.5rem" }}>{job.total_rows}</td>
                  <td style={{ padding: "0.5rem" }}>{job.processed_rows}</td>
                  <td style={{ padding: "0.5rem", color: job.error_count > 0 ? "red" : "inherit" }}>{job.error_count}</td>
                  <td style={{ padding: "0.5rem" }}>{job.status}</td>
                  <td style={{ padding: "0.5rem" }}>{job.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState("Início"),
    [patientId, setPatientId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => setUser(x?.user ?? null))
      .finally(() => setLoading(false));
  }, []);
  async function doLogin(email: string, password: string) {
    setError("");
    try {
      const body = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setUser(body.user);
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget));
    await doLogin(v.email as string, v.password as string);
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }
  if (loading)
    return (
      <main className="center" aria-live="polite">
        Carregando…
      </main>
    );
  if (!user)
    return (
      <main className="login">
        <section>
          <span className="brand">Fonolife</span>
          <h1>Entre para cuidar dos seus pacientes</h1>
          <p>Use seu e-mail e senha de acesso.</p>
          <form onSubmit={login}>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button>Entrar</button>
          </form>
          <details open>
            <summary>Contas de demonstração</summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => doLogin("admin@demo.local", "admin123")}
              >
                🔑 Entrar como Administrador
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => doLogin("operador@demo.local", "operador123")}
              >
                👤 Entrar como Operador
              </button>
            </div>
          </details>
        </section>
      </main>
    );

  const pages = user.role === "admin"
    ? ["Início", "Pacientes", "Acompanhamento", "Financeiro", "Estoque", "Importação CSV"]
    : ["Início", "Pacientes", "Acompanhamento", "Financeiro", "Estoque"];

  return (
    <div className="shell">
      <header>
        <span className="brand">Fonolife</span>
        <div>
          <span>{user.name}</span>
          <button className="link" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <nav aria-label="Principal">
        {pages.map((item) => (
          <button
            className={page === item ? "active" : ""}
            onClick={() => setPage(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
      <main>
        <div className="title">
          <div>
            <h1>{page}</h1>
            <p>
              {page === "Pacientes"
                ? "Cadastre e acompanhe cada pessoa em um só lugar."
                : page === "Acompanhamento"
                  ? "Veja quem precisa de contato ou cuidado hoje."
                  : page === "Início"
                    ? "O que precisa da sua atenção hoje."
                    : page === "Estoque"
                      ? "Catálogo de aparelhos e controle de estoque."
                      : page === "Importação CSV"
                        ? "Importação em lote de registros via planilha CSV."
                        : "Registre uma vez e acompanhe realizado e previsões."}
            </p>
          </div>
        </div>
        {page === "Pacientes" ? (
          <Patients initialPatientId={patientId} />
        ) : page === "Acompanhamento" ? (
          <FollowUps />
        ) : page === "Financeiro" ? (
          <Finance user={user} />
        ) : page === "Estoque" ? (
          <Inventory user={user} />
        ) : page === "Importação CSV" ? (
          <CsvImport />
        ) : <Dashboard user={user} openPatient={(id) => { setPatientId(id); setPage("Pacientes"); }} openFollowUps={() => setPage("Acompanhamento")} />}
      </main>
    </div>
  );


}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
