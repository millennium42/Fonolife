import { spawnSync } from "node:child_process";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("Iniciando Smoke Test da Demonstração Docker...");

  // 1. Health check
  console.log("1. Checando Health API...");
  const resHealth = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!resHealth || !resHealth.ok) {
    console.error("Falha no health check. O servidor não responde em :3000.");
    process.exit(1);
  }
  console.log("Health OK!");

  // 2. Tentar Login Demo como Médico
  console.log("2. Tentando Login Demo (Admin)...");
  const resLogin = await fetch(`${BASE_URL}/api/demo/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": BASE_URL },
    body: JSON.stringify({ role: "admin" })
  }).catch(() => null);

  if (!resLogin || !resLogin.ok) {
    const text = await resLogin?.text().catch(() => "");
    console.error("Falha no login da demo. Status:", resLogin?.status, text);
    process.exit(1);
  }
  
  const cookie = resLogin.headers.get("set-cookie");
  if (!cookie) {
    console.error("Falha: Cookie fonolife_session não retornado.");
    process.exit(1);
  }
  console.log("Login OK!");

  // Helper para rotas seguras
  const fetchSecure = async (path) => {
    return fetch(`${BASE_URL}${path}`, {
      headers: {
        "Cookie": cookie,
        "Content-Type": "application/json",
        "Origin": BASE_URL
      }
    });
  };

  // 3. Checar Agenda populada
  console.log("3. Checando Agenda Mensal (Appointments)...");
  const d = new Date();
  const resAgenda = await fetchSecure(`/api/appointments?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  if (!resAgenda.ok) {
    console.error("Falha ao buscar agenda. Status:", resAgenda.status);
    process.exit(1);
  }
  const payload = await resAgenda.json();
  const agenda = payload.appointments || payload;
  if (!Array.isArray(agenda) || agenda.length === 0) {
    console.error("Falha: Agenda retornou vazia, indicando que a seed falhou no start. Retorno:", JSON.stringify(payload));
    process.exit(1);
  }
  console.log(`Agenda OK! Encontrados ${agenda.length} agendamentos.`);

  // 4. Checar Pacientes e Financeiro
  console.log("4. Checando base de pacientes e finanças...");
  const [resPat, resFin] = await Promise.all([
    fetchSecure('/api/patients'),
    fetchSecure('/api/finance/entries')
  ]);

  if (!resPat.ok || !resFin.ok) {
    const pText = await resPat.text().catch(()=>"");
    const fText = await resFin.text().catch(()=>"");
    console.error(`Falha ao buscar pacientes ou finanças. Pat: ${resPat.status} ${pText}. Fin: ${resFin.status} ${fText}`);
    process.exit(1);
  }
  const patData = await resPat.json();
  const finData = await resFin.json();

  const patList = patData.patients || patData;
  const finList = finData.entries || finData;

  if (patList.length === 0 || finList.length === 0) {
    console.error("Falha: Módulos críticos vazios. Seed ausente ou config incorreta.");
    process.exit(1);
  }
  console.log(`Dados OK! Encontrados ${patList.length} pacientes e ${finList.length} registros financeiros.`);

  console.log("==========================================");
  console.log("SUCESSO: Smoke Test aprovado! Ambiente de demonstração íntegro.");
}

run();
