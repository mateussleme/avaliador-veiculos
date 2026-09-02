import { supabase } from '../lib/supabase';
import { EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from '../domain/types';
import { VersionRecompute } from '../domain/evaluationEngine';
import { EvaluationWithOutcome, OutcomeStatus } from '../types/database';

// Nota: estas funções requerem sessão ativa no Supabase.
// Quando REQUIRE_AUTH=false no App.tsx, o botão "Salvar" mostra um Alert
// antes de chegar aqui — este guard é uma camada extra de proteção.

export interface SaveEvaluationInput {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  input: EvaluationInput;
  result: EvaluationResult;
  plate?: string;
  offerValue?: number; // oferta informada pelo avaliador (opcional)
}

export async function saveEvaluation(data: SaveEvaluationInput): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login necessário para salvar avaliações.');

  const { data: saved, error } = await supabase
    .from('evaluations')
    .insert({
      user_id:               user.id,
      plate:                 data.plate?.trim().toUpperCase() ?? null,
      brand:                 data.vehicle.brand,
      model:                 data.vehicle.model,
      model_year:            data.vehicle.modelYear,
      fuel:                  data.vehicle.fuel,
      fipe_code:             data.vehicle.codeFipe,
      chassi:                data.vehicle.chassi ?? null,
      fipe_price:            data.vehicle.priceValue,
      fipe_reference_month:  data.vehicle.referenceMonth,
      vehicle_kind:          data.kind,
      mileage_km:            data.input.currentMileageKm,
      new_tire_count:        data.input.newTireCount,
      had_dealer_service:    data.input.hadDealerService,
      has_repaint:           data.input.hasRepaint,
      base_discount_percent: data.result.baseDiscountPercent,
      discount_source:       data.result.discountSource,
      standard_value:        data.result.standardValue,
      adjustment_percent:    data.result.adjustmentPercent,
      estimated_value:       data.result.estimatedValue,
      is_armored:            data.input.isArmored,
      is_armored_3a:         data.input.isArmored3A,
      has_delamination:      data.input.hasDelamination,
      delaminated_window_count: data.input.delaminatedWindowCount,
      armor_adjustment_value:   data.result.armorAdjustmentValue,
      preparation_cost:      data.result.preparationCost,
      additional_costs:      data.result.additionalCosts,
      optionals_value:       data.result.optionalsValue,
      final_offer_value:     data.result.finalOfferValue,
      repasse_value:         data.result.repasseValue,
      offer_value:           data.offerValue && data.offerValue > 0 ? data.offerValue : null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return saved.id;
}

// Vincula um contato a uma avaliacao ja no momento da avaliacao (sem esperar o
// desfecho). Cria um outcome "pendente" (status null) so com o contato. O
// vinculo mora em outcomes.contact_id, entao o relatorio por contato ja conta
// essa cotacao. Ao registrar o desfecho depois, o OutcomeScreen pre-carrega
// este contato e o preserva. Upsert por evaluation_id (idempotente).
export async function linkEvaluationContact(evaluationId: string, contactId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login necessário para vincular contato.');

  const { error } = await supabase.from('outcomes').upsert(
    {
      evaluation_id: evaluationId,
      user_id:       user.id,
      status:        null,   // pendente: cotado, sem decisao ainda
      was_purchased: false,
      contact_id:    contactId,
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'evaluation_id' }
  );

  if (error) throw new Error(error.message);
}

// Atualiza o VEICULO (versao FIPE) de uma avaliacao ja salva e os valores
// recalculados. Usado pelo "Alterar versão" no histórico. RLS garante que o
// usuario so altera as proprias avaliacoes.
export async function updateEvaluationVehicle(
  evaluationId: string,
  vehicle: FipeVehicleInfo,
  rc: VersionRecompute
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login necessário para alterar a versão.');

  const { error } = await supabase
    .from('evaluations')
    .update({
      brand:                 vehicle.brand,
      model:                 vehicle.model,
      model_year:            vehicle.modelYear,
      fuel:                  vehicle.fuel,
      fipe_code:             vehicle.codeFipe,
      fipe_price:            vehicle.priceValue,
      fipe_reference_month:  vehicle.referenceMonth,
      base_discount_percent: rc.baseDiscountPercent,
      discount_source:       rc.discountSource,
      standard_value:        rc.standardValue,
      estimated_value:       rc.estimatedValue,
      armor_adjustment_value: rc.armorAdjustmentValue,
      final_offer_value:     rc.finalOfferValue,
      repasse_value:         rc.repasseValue,
    })
    .eq('id', evaluationId);

  if (error) throw new Error(error.message);
}

export async function deleteEvaluation(evaluationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login necessário para apagar avaliações.');

  // RLS ("Usuário gerencia as próprias avaliações") garante que só é possível
  // apagar avaliação do próprio usuário, mesmo que o id seja manipulado no cliente.
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', evaluationId);

  if (error) throw new Error(error.message);
}

export const HISTORY_PAGE_SIZE = 30;

// Página do histórico. Antes o app buscava um bloco fixo de 100 e as avaliações
// mais antigas simplesmente sumiam da tela; agora carrega sob demanda.
export async function fetchEvaluationsPage(
  offset: number,
  limit = HISTORY_PAGE_SIZE,
  fromISO?: string | null,
  toISO?: string | null
): Promise<EvaluationWithOutcome[]> {
  let query = supabase
    .from('evaluations_with_outcome')
    .select('*')
    .order('created_at', { ascending: false });

  // Filtro por intervalo (opcional): from = inicio, to = fim (inclusivo).
  if (fromISO) query = query.gte('created_at', fromISO);
  if (toISO) query = query.lte('created_at', toISO);

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return (data ?? []) as EvaluationWithOutcome[];
}

// Busca no banco INTEIRO (placa, marca ou modelo), não só nas páginas já
// carregadas — senão procurar um carro antigo não acharia nada.
export async function searchEvaluations(
  term: string,
  limit = 50,
  fromISO?: string | null,
  toISO?: string | null
): Promise<EvaluationWithOutcome[]> {
  // Vírgula, % e parênteses quebram a sintaxe do filtro .or() do PostgREST.
  const safe = term.trim().replace(/[,%()]/g, ' ').trim();
  if (!safe) return [];
  const pattern = `%${safe}%`;

  let query = supabase
    .from('evaluations_with_outcome')
    .select('*')
    .or(`plate.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern}`)
    .order('created_at', { ascending: false });

  // Filtro por intervalo (opcional): combina com a busca por texto.
  if (fromISO) query = query.gte('created_at', fromISO);
  if (toISO) query = query.lte('created_at', toISO);

  const { data, error } = await query.limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as EvaluationWithOutcome[];
}

export interface SaveOutcomeInput {
  evaluationId: string;
  status: OutcomeStatus;
  purchasePrice?: number;      // status = 'purchased'
  negotiationPrice?: number;   // status = 'negotiating'
  purchaseDate?: string;
  wasSold?: boolean;
  salePrice?: number;
  saleDate?: string;
  notes?: string;
  contactId?: string | null; // contato vinculado ao desfecho
}

export async function saveOutcome(data: SaveOutcomeInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const payload = {
    evaluation_id:     data.evaluationId,
    user_id:           user.id,
    status:            data.status,
    // was_purchased é legado: true só quando comprado.
    was_purchased:     data.status === 'purchased',
    purchase_price:    data.status === 'purchased'   ? (data.purchasePrice ?? null)    : null,
    purchase_date:     data.status === 'purchased'   ? (data.purchaseDate ?? null)     : null,
    negotiation_price: data.status === 'negotiating' ? (data.negotiationPrice ?? null) : null,
    was_sold:          data.status === 'purchased'   ? (data.wasSold ?? false)         : false,
    sale_price:        data.salePrice  ?? null,
    sale_date:         data.saleDate   ?? null,
    notes:             data.notes      ?? null,
    contact_id:        data.contactId  ?? null,
    updated_at:        new Date().toISOString(),
  };

  // Upsert: cria ou atualiza (evaluation_id é UNIQUE na tabela outcomes)
  const { error } = await supabase
    .from('outcomes')
    .upsert(payload, { onConflict: 'evaluation_id' });

  if (error) throw new Error(error.message);
}
