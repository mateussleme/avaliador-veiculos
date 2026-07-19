import { supabase } from '../lib/supabase';
import { EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from '../domain/types';
import { EvaluationWithOutcome } from '../types/database';

// Nota: estas funções requerem sessão ativa no Supabase.
// Quando REQUIRE_AUTH=false no App.tsx, o botão "Salvar" mostra um Alert
// antes de chegar aqui — este guard é uma camada extra de proteção.

export interface SaveEvaluationInput {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  input: EvaluationInput;
  result: EvaluationResult;
  plate?: string;
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
      final_offer_value:     data.result.finalOfferValue,
      repasse_value:         data.result.repasseValue,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return saved.id;
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

export async function fetchEvaluations(limit = 50): Promise<EvaluationWithOutcome[]> {
  const { data, error } = await supabase
    .from('evaluations_with_outcome')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as EvaluationWithOutcome[];
}

export interface SaveOutcomeInput {
  evaluationId: string;
  wasPurchased: boolean;
  purchasePrice?: number;
  purchaseDate?: string;
  wasSold?: boolean;
  salePrice?: number;
  saleDate?: string;
  notes?: string;
}

export async function saveOutcome(data: SaveOutcomeInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const payload = {
    evaluation_id:  data.evaluationId,
    user_id:        user.id,
    was_purchased:  data.wasPurchased,
    purchase_price: data.purchasePrice ?? null,
    purchase_date:  data.purchaseDate  ?? null,
    was_sold:       data.wasSold       ?? false,
    sale_price:     data.salePrice     ?? null,
    sale_date:      data.saleDate      ?? null,
    notes:          data.notes         ?? null,
    updated_at:     new Date().toISOString(),
  };

  // Upsert: cria ou atualiza (evaluation_id é UNIQUE na tabela outcomes)
  const { error } = await supabase
    .from('outcomes')
    .upsert(payload, { onConflict: 'evaluation_id' });

  if (error) throw new Error(error.message);
}
