import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppLink,
  formatE164Phone,
  WHATSAPP_TEMPLATES,
} from "../src/domain/whatsapp.js";

test("formata telefone celular brasileiro para o padrão E.164", () => {
  assert.equal(formatE164Phone("(11) 99999-8888"), "5511999998888");
  assert.equal(formatE164Phone("11988887777"), "5511988887777");
  assert.equal(formatE164Phone("12345"), "", "Telefones inválidos retornam string vazia");
});

test("constrói link wa.me seguro com encodeURIComponent", () => {
  const phone = "(11) 98888-7777";
  const message = "Olá, Maria! Tudo bem? & como vai?";
  const link = buildWhatsAppLink(phone, message);
  assert.ok(link.startsWith("https://wa.me/5511988887777?text="));
  assert.ok(link.includes("Ol%C3%A1%2C%20Maria!"));
  assert.ok(link.includes("%26"), "Caractere & deve ser devidamente codificado em URL");
});

test("gera templates de mensagem padronizados", () => {
  const msgD7 = WHATSAPP_TEMPLATES.postSaleD7("João Silva");
  assert.ok(msgD7.includes("João Silva"));
  assert.ok(msgD7.includes("primeira semana"));

  const msgD90 = WHATSAPP_TEMPLATES.postSaleD90("Ana");
  assert.ok(msgD90.includes("90 dias"));
  assert.ok(msgD90.includes("revisão preventiva gratuita"));
});
