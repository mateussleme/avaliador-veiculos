-- Opcionais / valorizacao: valor que opcionais nao previstos pela FIPE agregam
-- ao veiculo (teto solar, acabamento/pintura especial, etc.). SOMA na sugestao
-- de compra (o oposto de additional_costs, que desconta). Idempotente.

alter table evaluations
  add column if not exists optionals_value numeric(12,2) not null default 0;

-- A view usa "SELECT e.*", que trava a lista de colunas no CREATE.
-- Por isso e preciso DROP + CREATE para a coluna nova aparecer.
drop view if exists evaluations_with_outcome;
create view evaluations_with_outcome
with (security_invoker = on)
as
  select
    e.*,
    o.was_purchased,
    o.status          as outcome_status,
    o.purchase_price,
    o.purchase_date,
    o.negotiation_price,
    o.was_sold,
    o.sale_price,
    o.sale_date,
    o.notes as outcome_notes,
    o.contact_id,
    c.name          as contact_name,
    c.company_group as contact_group,
    c.phone         as contact_phone
  from evaluations e
  left join outcomes o on o.evaluation_id = e.id
  left join contacts c on c.id = o.contact_id;
