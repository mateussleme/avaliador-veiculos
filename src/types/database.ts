export interface Profile {
  id: string;
  full_name: string | null;
  store_name: string | null;
  role: 'admin' | 'evaluator';
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  plate: string | null;
  brand: string;
  model: string;
  model_year: number;
  fuel: string | null;
  fipe_code: string | null;
  chassi: string | null; // só vem preenchido em avaliações feitas via busca por placa
  fipe_price: number;
  fipe_reference_month: string | null;
  vehicle_kind: 'cars' | 'motorcycles';
  mileage_km: number;
  new_tire_count: number;
  had_dealer_service: boolean;
  has_repaint: boolean;
  base_discount_percent: number;
  discount_source: 'table' | 'default';
  standard_value: number;
  adjustment_percent: number;
  estimated_value: number;
  is_armored: boolean;
  is_armored_3a: boolean;
  has_delamination: boolean;
  delaminated_window_count: number;
  armor_adjustment_value: number;
  preparation_cost: number;
  final_offer_value: number;
  repasse_value: number;
  notes: string | null;
  created_at: string;
}

export interface Outcome {
  id: string;
  evaluation_id: string;
  user_id: string;
  was_purchased: boolean | null;
  purchase_price: number | null;
  purchase_date: string | null;
  was_sold: boolean;
  sale_price: number | null;
  sale_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationWithOutcome extends Evaluation {
  was_purchased?: boolean | null;
  purchase_price?: number | null;
  purchase_date?: string | null;
  was_sold?: boolean;
  sale_price?: number | null;
  sale_date?: string | null;
  outcome_notes?: string | null;
}
