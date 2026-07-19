import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { CopyableField } from '../components/CopyableField';
import { EvaluationWithOutcome } from '../types/database';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface EvaluationDetailScreenProps {
  evaluation: EvaluationWithOutcome;
  onRegisterOutcome: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function EvaluationDetailScreen({ evaluation, onRegisterOutcome }: EvaluationDetailScreenProps) {
  const hasOutcome = evaluation.was_purchased !== null && evaluation.was_purchased !== undefined;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.vehicleName}>{evaluation.brand} {evaluation.model}</Text>
      <Text style={styles.vehicleMeta}>
        {evaluation.model_year} · {evaluation.fuel}
      </Text>
      <Text style={styles.dateText}>Avaliado em {formatDate(evaluation.created_at)}</Text>

      <Card style={styles.heroCard}>
        <SectionLabel>Oferta de compra</SectionLabel>
        <Text style={styles.estimatedValue}>{formatCurrency(evaluation.final_offer_value)}</Text>
        <View style={styles.compareRow}>
          <View>
            <Text style={styles.compareLabel}>Tabela FIPE</Text>
            <Text style={styles.compareValue}>{formatCurrency(evaluation.fipe_price)}</Text>
          </View>
          <View style={styles.compareRight}>
            <Text style={styles.compareLabel}>Ajuste aplicado</Text>
            <Text style={[styles.compareValue, { color: evaluation.adjustment_percent < 0 ? colors.danger : colors.good }]}>
              {evaluation.adjustment_percent > 0 ? '+' : ''}{evaluation.adjustment_percent.toFixed(1)}%
            </Text>
          </View>
        </View>
        {evaluation.repasse_value > 0 && (
          <View style={styles.repasseRow}>
            <Text style={styles.repasseLabel}>Valor para repasse (92%)</Text>
            <Text style={styles.repasseValue}>{formatCurrency(evaluation.repasse_value)}</Text>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <SectionLabel>Dados do veículo</SectionLabel>
        {evaluation.plate ? (
          <CopyableField label="Placa" value={evaluation.plate} />
        ) : null}
        {evaluation.chassi ? (
          <CopyableField label="Chassi" value={evaluation.chassi} />
        ) : null}
        <CopyableField label="KM" value={`${evaluation.mileage_km.toLocaleString('pt-BR')} km`} copyable={false} />
        {evaluation.fipe_code ? (
          <CopyableField label="Código FIPE" value={evaluation.fipe_code} />
        ) : null}
      </Card>

      <Card style={styles.card}>
        <SectionLabel>Condições informadas</SectionLabel>
        <Text style={styles.detailLine}>Pneus novos: {evaluation.new_tire_count}</Text>
        <Text style={styles.detailLine}>Revisão na concessionária: {evaluation.had_dealer_service ? 'Sim' : 'Não'}</Text>
        <Text style={styles.detailLine}>Repintura identificada: {evaluation.has_repaint ? 'Sim' : 'Não'}</Text>
        <Text style={styles.detailLine}>Blindado: {evaluation.is_armored ? 'Sim' : 'Não'}</Text>
        {evaluation.is_armored && (
          <>
            <Text style={styles.detailLine}>Blindagem nível III-A: {evaluation.is_armored_3a ? 'Sim' : 'Não'}</Text>
            <Text style={styles.detailLine}>
              Delaminações: {evaluation.has_delamination ? `Sim (${evaluation.delaminated_window_count} vidro(s))` : 'Não'}
            </Text>
            <Text
              style={[
                styles.detailLine,
                { color: evaluation.armor_adjustment_value > 0 ? colors.good : evaluation.armor_adjustment_value < 0 ? colors.danger : colors.textPrimary },
              ]}
            >
              Ajuste de blindagem: {evaluation.armor_adjustment_value > 0 ? '+' : evaluation.armor_adjustment_value < 0 ? '− ' : ''}
              {formatCurrency(Math.abs(evaluation.armor_adjustment_value))}
            </Text>
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <SectionLabel>Desfecho</SectionLabel>
        {!hasOutcome ? (
          <Text style={styles.detailLine}>Ainda não registrado.</Text>
        ) : !evaluation.was_purchased ? (
          <Text style={styles.detailLine}>Não foi comprado.</Text>
        ) : (
          <>
            <Text style={styles.detailLine}>
              Comprado por {evaluation.purchase_price ? formatCurrency(evaluation.purchase_price) : '—'}
              {evaluation.purchase_date ? ` em ${formatDate(evaluation.purchase_date)}` : ''}
            </Text>
            {evaluation.was_sold ? (
              <Text style={styles.detailLine}>
                Vendido por {evaluation.sale_price ? formatCurrency(evaluation.sale_price) : '—'}
                {evaluation.sale_date ? ` em ${formatDate(evaluation.sale_date)}` : ''}
              </Text>
            ) : (
              <Text style={styles.detailLine}>Ainda em estoque.</Text>
            )}
          </>
        )}
      </Card>

      <Button
        label={hasOutcome ? 'Atualizar desfecho' : 'Registrar desfecho'}
        onPress={onRegisterOutcome}
        style={styles.outcomeButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  vehicleName: { fontSize: type.h1.fontSize, fontWeight: type.h1.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  vehicleMeta: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2, fontFamily: fontFamily.inter },
  dateText: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginBottom: spacing.lg, fontFamily: fontFamily.inter },
  heroCard: { marginBottom: spacing.md },
  estimatedValue: { fontSize: 30, fontWeight: '700', color: colors.ink, marginTop: 2, marginBottom: spacing.md, fontFamily: fontFamily.spaceGrotesk },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  compareRight: { alignItems: 'flex-end' },
  compareLabel: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginBottom: 2, fontFamily: fontFamily.inter },
  compareValue: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  repasseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderRadius: radius.md,
  },
  repasseLabel: { fontSize: type.caption.fontSize, color: colors.info, fontFamily: fontFamily.inter },
  repasseValue: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.info, fontFamily: fontFamily.spaceGrotesk },
  card: { marginBottom: spacing.md },
  detailLine: { fontSize: type.body.fontSize, color: colors.textPrimary, marginBottom: spacing.xs, fontFamily: fontFamily.inter },
  outcomeButton: { marginTop: spacing.sm },
});
