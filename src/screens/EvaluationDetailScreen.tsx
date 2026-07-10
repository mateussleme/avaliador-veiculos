import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { EvaluationWithOutcome } from '../types/database';
import { colors, spacing, type } from '../theme/tokens';

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
        {evaluation.model_year} · {evaluation.fuel} · {evaluation.mileage_km.toLocaleString('pt-BR')} km
        {evaluation.plate ? ` · ${evaluation.plate}` : ''}
      </Text>
      <Text style={styles.dateText}>Avaliado em {formatDate(evaluation.created_at)}</Text>

      <Card style={styles.heroCard}>
        <SectionLabel>Valor estimado</SectionLabel>
        <Text style={styles.estimatedValue}>{formatCurrency(evaluation.estimated_value)}</Text>
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
      </Card>

      <Card style={styles.card}>
        <SectionLabel>Condições informadas</SectionLabel>
        <Text style={styles.detailLine}>Pneus novos: {evaluation.new_tire_count}</Text>
        <Text style={styles.detailLine}>Revisão na concessionária: {evaluation.had_dealer_service ? 'Sim' : 'Não'}</Text>
        <Text style={styles.detailLine}>Repintura identificada: {evaluation.has_repaint ? 'Sim' : 'Não'}</Text>
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
  vehicleName: { fontSize: type.h1.fontSize, fontWeight: type.h1.fontWeight, color: colors.textPrimary },
  vehicleMeta: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginBottom: spacing.lg },
  heroCard: { marginBottom: spacing.md },
  estimatedValue: { fontSize: 30, fontWeight: '700', color: colors.ink, marginTop: 2, marginBottom: spacing.md },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  compareRight: { alignItems: 'flex-end' },
  compareLabel: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginBottom: 2 },
  compareValue: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary },
  card: { marginBottom: spacing.md },
  detailLine: { fontSize: type.body.fontSize, color: colors.textPrimary, marginBottom: spacing.xs },
  outcomeButton: { marginTop: spacing.sm },
});
