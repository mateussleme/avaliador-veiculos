import { supabase } from '../lib/supabase';
import { findDuplicate } from '../domain/contactMatching';
import { Contact, EvaluationWithOutcome } from '../types/database';

// Contatos (leads) do lojista. Todas as funções dependem de sessão ativa;
// a RLS no Supabase garante que cada usuário só acessa os próprios contatos.

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Contact[];
}

// Detecção de contato duplicado — a regra em si mora em domain/contactMatching
// (pura e testável); aqui só reexportamos com o tipo Contact.
export function findDuplicateContact(
  contacts: Contact[],
  candidate: { name: string; phone?: string }
): Contact | null {
  return findDuplicate(contacts, candidate);
}

export interface CreateContactInput {
  name: string;
  companyGroup?: string;
  phone?: string;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login necessário para criar contatos.');

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id:       user.id,
      name:          input.name.trim(),
      company_group: input.companyGroup?.trim() || null,
      phone:         input.phone?.trim() || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Contact;
}

// ---- Resumo agregado por contato (para a busca/relatório) ----
//
// A agregação é feita NO BANCO (função SQL contact_summaries), não mais
// baixando todas as avaliações e somando no celular. Isso evita truncamento
// (o limite antigo de 500) e é rápido mesmo com muitos registros.

export interface ContactSummary {
  contact: Pick<Contact, 'id' | 'name' | 'company_group' | 'phone'>;
  quoted: number;              // total de carros cotados com esse contato
  purchased: number;           // quantos viraram compra
  negotiating: number;         // quantos estão em negociação
  notPurchased: number;        // quantos NÃO viraram compra
  pending: number;             // desfecho ainda sem decisão
  totalQuotedValue: number;    // soma do valor cotado (oferta)
  totalPaidValue: number;      // soma do valor pago (comprados)
  totalNegotiatingValue: number; // soma do valor em negociação
  conversionRate: number;      // purchased / quoted (0..1)
}

interface ContactSummaryRow {
  contact_id: string;
  name: string;
  company_group: string | null;
  phone: string | null;
  quoted: number;
  purchased: number;
  negotiating: number;
  not_purchased: number;
  pending: number;
  total_quoted: number;
  total_paid: number;
  total_negotiating: number;
}

export async function fetchContactSummaries(): Promise<ContactSummary[]> {
  const { data, error } = await supabase.rpc('contact_summaries');
  if (error) throw new Error(error.message);

  return ((data ?? []) as ContactSummaryRow[]).map((r) => {
    const quoted = Number(r.quoted) || 0;
    const purchased = Number(r.purchased) || 0;
    return {
      contact: { id: r.contact_id, name: r.name, company_group: r.company_group, phone: r.phone },
      quoted,
      purchased,
      negotiating: Number(r.negotiating) || 0,
      notPurchased: Number(r.not_purchased) || 0,
      pending: Number(r.pending) || 0,
      totalQuotedValue: Number(r.total_quoted) || 0,
      totalPaidValue: Number(r.total_paid) || 0,
      totalNegotiatingValue: Number(r.total_negotiating) || 0,
      conversionRate: quoted > 0 ? purchased / quoted : 0,
    };
  });
}

// Carros cotados com um contato (para a tela de detalhe) — consulta filtrada,
// sem baixar o histórico inteiro.
export async function fetchEvaluationsByContact(contactId: string): Promise<EvaluationWithOutcome[]> {
  const { data, error } = await supabase
    .from('evaluations_with_outcome')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as EvaluationWithOutcome[];
}
