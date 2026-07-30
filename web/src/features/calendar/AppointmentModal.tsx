import { useEffect, useState } from "react";
import { Modal, Button } from "../../components/ui.js";

export interface AppointmentPayload {
  id?: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string; // ISO String
  durationMinutes: number;
  type: string;
  status: string;
  notes?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  api: (url: string, options?: any) => Promise<any>;
  user: { id: string; role: string };
  initialData?: Partial<AppointmentPayload>;
}

export function AppointmentModal({ isOpen, onClose, onSave, api, user, initialData }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Data Form
  const [patientId, setPatientId] = useState(initialData?.patientId || "");
  const [doctorId, setDoctorId] = useState(initialData?.doctorId || (user.role === "doctor" ? user.id : ""));
  
  // Parse date and time from initialData.scheduledAt if exists
  const getInitialDate = () => {
    if (initialData?.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      const tzOffset = d.getTimezoneOffset() * 60000; // in milliseconds
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, -1);
      return localISOTime.split("T")[0];
    }
    const d = new Date();
    d.setMinutes(0, 0, 0); // round to current hour
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
  };
  
  const getInitialTime = () => {
    if (initialData?.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "08:00";
  };

  const [date, setDate] = useState(getInitialDate());
  const [time, setTime] = useState(getInitialTime());
  const [duration, setDuration] = useState(initialData?.durationMinutes || 60);
  const [type, setType] = useState(initialData?.type || "Consulta");
  const [status, setStatus] = useState(initialData?.status || "scheduled");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Lookups
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      api("/api/patients").then(d => setPatients(d.patients || [])).catch(console.error);
      if (user.role !== "doctor") {
        api("/api/doctors").then(d => setDoctors(d.doctors || [])).catch(console.error);
      }
    }
  }, [isOpen, api, user.role]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Assemble scheduledAt in UTC using local YYYY-MM-DDTHH:mm:00 logic
      // Assuming form date/time represent local America/Sao_Paulo conceptually
      // We will create a local Date and get its ISO string. In JS, `new Date("2026-08-15T10:00:00")` parses as local time.
      const localDate = new Date(`${date}T${time}:00`);
      
      const payload = {
        patientId,
        doctorId,
        scheduledAt: localDate.toISOString(),
        durationMinutes: Number(duration),
        type,
        status,
        notes
      };

      if (initialData?.id) {
        await api(`/api/appointments/${initialData.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/appointments", { method: "POST", body: JSON.stringify(payload) });
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal label={initialData?.id ? "Editar Agendamento" : "Novo Agendamento"} onClose={onClose}>
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>{initialData?.id ? "Editar Agendamento" : "Novo Agendamento"}</h2>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Paciente</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)} required disabled={!!initialData?.patientId && !!initialData.id}>
              <option value="">Selecione...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {user.role !== "doctor" && (
            <div>
              <label>Profissional</label>
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required disabled={!!initialData?.id}>
                <option value="">Selecione...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label>Duração (min)</label>
              <input type="number" min="15" step="15" value={duration} onChange={e => setDuration(Number(e.target.value))} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Tipo</label>
              <input type="text" value={type} onChange={e => setType(e.target.value)} required placeholder="Ex: Avaliação" />
            </div>
          </div>

          <div>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} required>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="no_show">Faltou</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label>Observações</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
