import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { GaugeBar } from '../components/GaugeBar';
import { ADJUSTMENT_RANGE } from '../domain/evaluationEngine';
import { colors, radius, spacing, type } from '../theme/tokens';
import { AdjustmentSeverity, EvaluationResult, FipeVehicleInfo } from '../domain/types';

interface ResultScreenProps {
  vehicle: FipeVehicleInfo;
  result: EvaluationResult;
  onRestart: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function severityColor(severity: AdjustmentSeverity) {
  switch (severity) {
    case 'good':
      return { fg: colors.good, bg: colors.goodBg };
    case 'caution':
      return { fg: colors.caution, bg: colors.cautionBg };
    case 'danger':
      return { fg: colors.danger, bg: colors.dangerBg };
    default:
      return { fg: colors.textSecondary, bg: colors.surfaceAlt };
  }
}

export function ResultScreen({ vehicle, result, onRestart }: ResultScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.vehicleName}>
        {vehicle.brand} {vehicle.model}
      </Text>
      <Text style={styles.vehicleMeta}>
        {vehicle.modelYear} · {vehicle.fuel} · {result.mileageKm.toLocaleString('pt-BR')} km ·
        referência {vehicle.referenceMonth}
      </Text>

      <Card style={styles.heroCard}>
        <SectionLabel>Valor estimado da avaliação</SectionLabel>
        <Text style={styles.estimatedValue}>{formatCurrency(result.estimatedValue)}</Text>
        <Text style={styles.positionLabel}>{result.positionLabel}</Text>

        <GaugeBar
          percent={result.adjustmentPercent}
          min={ADJUSTMENT_RANGE.min}
          max={ADJUSTMENT_RANGE.max}
        />

        <View style={styles.compareRow}>
          <View>
            <Text style={styles.compareLabel}>Tabela FIPE</Text>
            <Text style={styles.compareValue}>{formatCurrency(result.baseValue)}</Text>
          </View>
          <View>
            <Text style={styles.compareLabel}>
              Padrão (-{result.baseDiscountPercent}%{result.discountSource === 'table' ? ' tabela' : ' padrão'})
            </Text>
            <Text style={styles.compareValue}>{formatCurrency(result.standardValue)}</Text>
          </View>
          <View style={styles.compareRight}>
            <Text style={styles.compareLabel}>Ajuste</Text>
            <Text
              style={[
                styles.compareValue,
                { color: result.adjustmentPercent < 0 ? colors.danger : colors.good },
              ]}
            >
              {result.adjustmentPercent > 0 ? '+' : ''}
              {result.adjustmentPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {result.discountSource === 'table' && result.discountMatchedModel ? (
          <Text style={styles.discountSourceNote}>
            Desconto de {result.baseDiscountPercent}% aplicado conforme tabela para{' '}
            {result.discountMatchedModel}.
          </Text>
        ) : (
          <Text style={styles.discountSourceNote}>
            Desconto padrão de {result.baseDiscountPercent}% aplicado (modelo não encontrado na
            tabela).
          </Text>
        )}
      </Card>

      <Text style={styles.breakdownTitle}>Como chegamos nesse valor</Text>

      {result.lines.map((line, idx) => {
        const colorSet = severityColor(line.severity);
        return (
          <Card key={idx} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineLabel}>{line.label}</Text>
              <View style={[styles.percentBadge, { backgroundColor: colorSet.bg }]}>
                <Text style={[styles.percentText, { color: colorSet.fg }]}>
                  {line.percent === 0 ? '—' : `${line.percent > 0 ? '+' : ''}${line.percent.toFixed(1)}%`}
                </Text>
              </View>
            </View>
            <Text style={styles.lineDetail}>{line.detail}</Text>
          </Card>
        );
      })}

      <Card style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          Esta é uma estimativa baseada no desconto de {result.baseDiscountPercent}% aplicado sobre a tabela FIPE e
          nas informações que você preencheu. Não substitui uma inspeção mecânica presencial nem
          garante o valor final de venda ou compra.
        </Text>
      </Card>

      <Button label="Nova avaliação" variant="secondary" onPress={onRestart} style={styles.restartButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  vehicleName: {
    fontSize: type.h1.fontSize,
    fontWeight: type.h1.fontWeight,
    color: colors.textPrimary,
  },
  vehicleMeta: {
    fontSize: type.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  heroCard: {
    marginBottom: spacing.lg,
  },
  estimatedValue: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  positionLabel: {
    fontSize: type.body.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  discountSourceNote: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  compareRight: {
    alignItems: 'flex-end',
  },
  compareLabel: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  compareValue: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
  },
  breakdownTitle: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lineCard: {
    marginBottom: spacing.sm,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lineLabel: {
    fontSize: type.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  percentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lineDetail: {
    fontSize: type.caption.fontSize,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  disclaimerCard: {
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    fontSize: type.caption.fontSize,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  restartButton: {
    marginBottom: spacing.lg,
  },
});
