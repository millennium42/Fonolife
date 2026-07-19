import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./sales.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "doctor";
};
type Doctor = { id: string; name: string };
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
  doctor_name: string | null;
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
  patient_name?: string | null;
  doctor_name?: string | null;
};
type DoctorRecords = {
  sales: {
    id: string;
    product: string;
    sale_kind: "device" | "service";
    quantity: number;
    total_amount_cents: number;
    sold_on: string;
    patient_name: string;
  }[];
  services: {
    id: string;
    description: string;
    amount_cents: number;
    occurred_on: string;
    patient_name: string | null;
  }[];
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
  queue: Pick<
    FollowUp,
    | "patient_id"
    | "patient_name"
    | "phone"
    | "task_id"
    | "title"
    | "due_on"
    | "timing"
  >[];
  financial?: {
    consolidated: {
      balance_cents: number;
      month_income_cents: number;
      month_expense_cents: number;
    };
    byAccount: {
      company_account_id: string;
      company_account_label: string;
      balance_cents: number;
      month_income_cents: number;
      month_expense_cents: number;
    }[];
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
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(civil) ? `${civil}T12:00:00` : value,
  );
  return Number.isNaN(parsed.valueOf())
    ? "Não informado"
    : new Intl.DateTimeFormat("pt-BR").format(parsed);
};
async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.title ?? "Não foi possível concluir");
  return body;
}
function Modal({
  children,
  onClose,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
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
    [doctors, setDoctors] = useState<Doctor[]>([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([api("/api/company-accounts"), api("/api/doctors")])
      .then(([accountData, doctorData]) => {
        setAccounts(
          accountData.accounts.filter((a: CompanyAccount) => a.active),
        );
        setDoctors(doctorData.doctors);
      })
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
          saleKind: v.saleKind,
          doctorId: v.doctorId,
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
      <div className="fields">
        <label>
          Tipo
          <select name="saleKind" defaultValue="device" required>
            <option value="device">Venda de aparelho</option>
            <option value="service">Serviço</option>
          </select>
        </label>
        <label>
          Médico responsável
          <select name="doctorId" required>
            <option value="">Escolha o médico</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <small>Obrigatório para os retornos de acompanhamento.</small>
        </label>
        <label className="wide">
          Aparelho ou serviço
          <input name="product" required minLength={2} />
        </label>
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

function PatientRecord({ id, onBack }: { id: string; onBack: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null),
    [timeline, setTimeline] = useState<TimelineItem[]>([]),
    [doctors, setDoctors] = useState<Doctor[]>([]),
    [popup, setPopup] = useState<"edit" | "event" | "return" | "sale" | null>(
      null,
    ),
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
    api("/api/doctors")
      .then((data) => setDoctors(data.doctors))
      .catch((reason) => setError((reason as Error).message));
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
      setPopup(null);
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
      setPopup(null);
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
            <button className="secondary" onClick={() => setPopup("edit")}>
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
      </section>
      <section className="record-actions" aria-label="Ações do paciente">
        <button onClick={() => setPopup("event")}>
          <span>Registrar atendimento</span>
          <small>Ligação, consulta, ajuste ou cuidado</small>
        </button>
        <button onClick={() => setPopup("return")}>
          <span>Agendar retorno</span>
          <small>Defina data e médico responsável</small>
        </button>
        <button onClick={() => setPopup("sale")}>
          <span>Registrar venda ou serviço</span>
          <small>Inclui pagamento e acompanhamento</small>
        </button>
      </section>
      <section className="panel record-history">
        <h2>Histórico do paciente</h2>
        {timeline.length === 0 ? (
          <div className="empty">
            <h3>Nenhuma interação registrada</h3>
            <p>Use uma das ações acima para começar o acompanhamento.</p>
          </div>
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
                          : item.type === "sale"
                            ? "Venda ou serviço"
                            : item.type === "sale_cancelled"
                              ? "Venda ou serviço cancelado"
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
      {popup === "edit" && (
        <Modal onClose={() => setPopup(null)}>
          <PatientForm
            patient={patient}
            onCancel={() => setPopup(null)}
            onDone={async (_id, text) => {
              setMessage(text ?? "Ficha salva.");
              setPopup(null);
              await load();
            }}
          />
        </Modal>
      )}
      {popup === "event" && (
        <Modal onClose={() => setPopup(null)}>
          <form className="panel form popup-card" onSubmit={addEvent}>
            <div className="section-title">
              <h2>Registrar atendimento</h2>
              <button
                type="button"
                className="secondary"
                onClick={() => setPopup(null)}
              >
                Fechar
              </button>
            </div>
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
              <textarea
                name="description"
                rows={4}
                minLength={2}
                required
                autoFocus
              />
            </label>
            <button>Registrar no histórico</button>
          </form>
        </Modal>
      )}
      {popup === "return" && (
        <Modal onClose={() => setPopup(null)}>
          <form className="panel form popup-card" onSubmit={schedule}>
            <div className="section-title">
              <h2>Agendar retorno</h2>
              <button
                type="button"
                className="secondary"
                onClick={() => setPopup(null)}
              >
                Fechar
              </button>
            </div>
            <label>
              O que fazer?
              <input
                name="title"
                defaultValue="Entrar em contato"
                minLength={2}
                required
                autoFocus
              />
            </label>
            <div className="fields">
              <label>
                Quando?
                <input name="dueOn" type="date" required />
              </label>
              <label>
                Médico responsável
                <select name="doctorId" required>
                  <option value="">Escolha o médico</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Observação
              <input name="notes" />
            </label>
            <button>Agendar retorno</button>
          </form>
        </Modal>
      )}
      {popup === "sale" && (
        <Modal onClose={() => setPopup(null)}>
          <div className="popup-card">
            <button
              className="secondary popup-close"
              onClick={() => setPopup(null)}
            >
              Fechar
            </button>
            <SaleForm
              patientId={id}
              onDone={async () => {
                setMessage("Venda ou serviço registrado.");
                setPopup(null);
                await load();
              }}
            />
          </div>
        </Modal>
      )}
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
                    ? `Para ${date(item.due_on)} · ${item.doctor_name || "Sem médico histórico"}`
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
    [view, setView] = useState<"list" | "funnel">("list"),
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
      <PatientRecord
        id={selected}
        onBack={() => {
          setSelected(null);
          setMessage("");
          load();
        }}
      />
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
      <div
        className="filter-tabs view-switch"
        role="group"
        aria-label="Visualização do CRM"
      >
        <button
          className={view === "list" ? "active" : ""}
          onClick={() => setView("list")}
        >
          Lista
        </button>
        <button
          className={view === "funnel" ? "active" : ""}
          onClick={() => setView("funnel")}
        >
          Funil
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {view === "list" ? (
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
      ) : (
        <section className="funnel" aria-label="Funil da jornada">
          {Object.entries(statuses).map(([statusValue, statusLabel]) => {
            const stagePatients = patients.filter(
              (patient) => patient.journey_status === statusValue,
            );
            return (
              <article className="funnel-column" key={statusValue}>
                <h2>
                  {statusLabel} <span>{stagePatients.length}</span>
                </h2>
                {stagePatients.length === 0 ? (
                  <p>Nenhum paciente</p>
                ) : (
                  stagePatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelected(patient.id)}
                    >
                      <strong>{patient.name}</strong>
                      <small>{patient.phone}</small>
                      <small>
                        {patient.next_contact_on
                          ? `Próximo contato ${date(patient.next_contact_on)}`
                          : "Sem contato agendado"}
                      </small>
                    </button>
                  ))
                )}
              </article>
            );
          })}
        </section>
      )}
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
    [patients, setPatients] = useState<Patient[]>([]),
    [doctors, setDoctors] = useState<Doctor[]>([]),
    [summary, setSummary] = useState<FinanceSummary | null>(null),
    [showForm, setShowForm] = useState(false),
    [entryCategory, setEntryCategory] = useState("hearing_aid_sale"),
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
      const [
        entryData,
        receivableData,
        accountData,
        patientData,
        doctorData,
        summaryData,
      ] = await Promise.all([
        api(`/api/finance/entries?${suffix}`),
        api(
          `/api/finance/receivables?${new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && !["entryType", "category"].includes(key))).toString()}`,
        ),
        api("/api/company-accounts"),
        api("/api/patients"),
        api("/api/doctors"),
        user.role === "admin"
          ? api(`/api/finance/summary?${suffix}`)
          : Promise.resolve(null),
      ]);
      setEntries(entryData.entries);
      setReceivables(receivableData.receivables);
      setAccounts(accountData.accounts.filter((a: CompanyAccount) => a.active));
      setPatients(patientData.patients);
      setDoctors(doctorData.doctors);
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
          patientId: value.patientId || undefined,
          doctorId: value.doctorId || undefined,
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
      const requestId =
        operationIds.current.get(item.id) ?? crypto.randomUUID();
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
      const requestId =
        operationIds.current.get(operationKey) ?? crypto.randomUUID();
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
                    {item.patient_name ? ` · ${item.patient_name}` : ""}
                    {item.doctor_name ? ` · ${item.doctor_name}` : ""}
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
        <Modal
          onClose={() => setShowForm(false)}
          labelledBy="finance-form-title"
        >
          <form className="panel form" onSubmit={createEntry}>
            <h2 id="finance-form-title">Novo lançamento</h2>
            <div className="fields">
              <label>
                Tipo
                <select name="entryType" required>
                  <option value="income">Entrada</option>
                  {user.role === "admin" && (
                    <option value="expense">Saída</option>
                  )}
                </select>
              </label>
              <label>
                Categoria
                <select
                  name="category"
                  required
                  value={entryCategory}
                  onChange={(event) => setEntryCategory(event.target.value)}
                >
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
              <label>
                Paciente (opcional)
                <select name="patientId">
                  <option value="">Sem paciente associado</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — {patient.phone}
                    </option>
                  ))}
                </select>
              </label>
              {entryCategory === "service" && (
                <label>
                  Médico responsável
                  <select name="doctorId" required>
                    <option value="">Escolha o médico</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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
        </Modal>
      )}
    </>
  );
}

function Dashboard({
  user,
  openPatient,
  openFollowUps,
}: {
  user: User;
  openPatient: (id: string) => void;
  openFollowUps: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("/api/dashboard")
      .then(setData)
      .catch((reason) => setError((reason as Error).message));
  }, []);
  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (!data) return <p aria-live="polite">Carregando resumo…</p>;
  const cards = [
    ["Contatos atrasados", data.overdue, openFollowUps],
    ["Retornos de hoje", data.today, openFollowUps],
    ["Tarefas abertas", data.open_tasks, openFollowUps],
    ["Em adaptação", data.adaptation, openFollowUps],
    ["Vendas no mês", data.month_sales, undefined],
  ] as const;
  return (
    <>
      <section className="dashboard-cards" aria-label="Resumo operacional">
        {cards.map(([label, value, action]) => (
          <button
            className="dashboard-card"
            key={label}
            onClick={action}
            disabled={!action}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </section>
      {user.role === "admin" && data.financial && (
        <section className="panel">
          <h2>Financeiro realizado</h2>
          <div className="dashboard-finance">
            <article>
              <span>Saldo consolidado</span>
              <strong>
                {money(data.financial.consolidated.balance_cents)}
              </strong>
            </article>
            <article>
              <span>Entradas no mês</span>
              <strong>
                {money(data.financial.consolidated.month_income_cents)}
              </strong>
            </article>
            <article>
              <span>Saídas no mês</span>
              <strong>
                {money(data.financial.consolidated.month_expense_cents)}
              </strong>
            </article>
          </div>
          <ul className="account-balances">
            {data.financial.byAccount.map((account) => (
              <li key={account.company_account_id}>
                <span>{account.company_account_label}</span>
                <strong>{money(account.balance_cents)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="panel dashboard-queue">
        <div className="section-heading">
          <h2>Próximas ações</h2>
          <button className="secondary" onClick={openFollowUps}>
            Ver acompanhamento
          </button>
        </div>
        {data.queue.length === 0 ? (
          <div className="empty">
            <h3>Nenhuma tarefa aberta</h3>
            <p>Novos retornos aparecerão aqui por ordem de urgência.</p>
          </div>
        ) : (
          data.queue.map((item) => (
            <button
              className="patient-row"
              onClick={() => openPatient(item.patient_id)}
              key={item.task_id}
            >
              <span>
                <strong>{item.patient_name}</strong>
                <small>
                  {item.title} · {item.phone}
                </small>
              </span>
              <span className={item.timing === "overdue" ? "overdue" : ""}>
                {item.timing === "overdue"
                  ? "Atrasado"
                  : item.timing === "today"
                    ? "Hoje"
                    : date(item.due_on)}{" "}
                →
              </span>
            </button>
          ))
        )}
      </section>
    </>
  );
}

function DoctorPortal() {
  const [records, setRecords] = useState<DoctorRecords | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("/api/doctor/records")
      .then(setRecords)
      .catch((reason) => setError((reason as Error).message));
  }, []);
  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (!records) return <p aria-live="polite">Carregando seus atendimentos…</p>;
  return (
    <div className="doctor-records">
      <section className="panel">
        <h2>Vendas associadas a você</h2>
        {records.sales.length === 0 ? (
          <p>Nenhuma venda associada.</p>
        ) : (
          records.sales.map((sale) => (
            <article key={sale.id}>
              <div>
                <strong>{sale.patient_name}</strong>
                <small>
                  {sale.sale_kind === "service" ? "Serviço" : "Aparelho"} ·{" "}
                  {date(sale.sold_on)}
                </small>
              </div>
              <div>
                <strong>{sale.product}</strong>
                <small>
                  {sale.quantity} unidade(s) · {money(sale.total_amount_cents)}
                </small>
              </div>
            </article>
          ))
        )}
      </section>
      <section className="panel">
        <h2>Serviços associados a você</h2>
        {records.services.length === 0 ? (
          <p>Nenhum serviço associado.</p>
        ) : (
          records.services.map((service) => (
            <article key={service.id}>
              <div>
                <strong>
                  {service.patient_name || "Paciente não associado"}
                </strong>
                <small>{date(service.occurred_on)}</small>
              </div>
              <div>
                <strong>{service.description}</strong>
                <small>{money(service.amount_cents)}</small>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
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
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const body = await api("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      });
      setUser(body.user);
    } catch (reason) {
      setError((reason as Error).message);
    }
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
          <details>
            <summary>Contas da demonstração</summary>
            <p>
              Admin: admin@demo.local / admin123
              <br />
              Operador: operador@demo.local / operador123
              <br />
              Médicos: dra.ana@demo.local ou dr.paulo@demo.local / medico123
            </p>
          </details>
        </section>
      </main>
    );
  if (user.role === "doctor")
    return (
      <div className="shell doctor-shell">
        <header>
          <span className="brand">Fonolife</span>
          <div>
            <span>{user.name}</span>
            <button className="link" onClick={logout}>
              Sair
            </button>
          </div>
        </header>
        <main>
          <div className="title">
            <div>
              <h1>Meus atendimentos</h1>
              <p>Somente vendas e serviços associados ao seu usuário.</p>
            </div>
          </div>
          <DoctorPortal />
        </main>
      </div>
    );
  const pages = ["Início", "Pacientes", "Acompanhamento", "Financeiro"];
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
        ) : (
          <Dashboard
            user={user}
            openPatient={(id) => {
              setPatientId(id);
              setPage("Pacientes");
            }}
            openFollowUps={() => setPage("Acompanhamento")}
          />
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
