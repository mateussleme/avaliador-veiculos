import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { GaugeBar } from '../components/GaugeBar';
import { ADJUSTMENT_RANGE } from '../domain/evaluationEngine';
import { colors, radius, spacing, type } from '../theme/tokens';
import { AdjustmentSeverity, EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from '../domain/types';
import { saveEvaluation } from '../services/evaluationService';

interface ResultScreenProps {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  input: EvaluationInput;
  result: EvaluationResult;
  plate?: string;
  sessionToken?: string | null; // JWT do Supabase — null quando REQUIRE_AUTH=false
  onRestart: () => void;
  onSaved?: (evaluationId: string) => void;
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

export function ResultScreen({ kind, vehicle, input, result, plate, sessionToken, onRestart, onSaved }: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!sessionToken) {
      // Modo sem auth: salvar vai falhar sem JWT. Mostra mensagem orientando.
      Alert.alert(
        'Login necessário',
        'Para salvar avaliações e registrar desfechos, ative o login no app (REQUIRE_AUTH = true no App.tsx).'
      );
      return;
    }
    setSaving(true);
    try {
      const id = await saveEvaluation({ kind, vehicle, input, result, plate });
      setSaved(true);
      onSaved?.(id);
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message ?? 'Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

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

        {/* ---- Bloco principal: Oferta de Compra ---- */}
        <SectionLabel>Oferta de compra</SectionLabel>
        <Text style={styles.estimatedValue}>{formatCurrency(result.finalOfferValue)}</Text>
        <Text style={styles.positionLabel}>{result.positionLabel}</Text>

        <GaugeBar
          percent={result.adjustmentPercent}
          min={ADJUSTMENT_RANGE.min}
          max={ADJUSTMENT_RANGE.max}
        />

        {/* ---- Linha de preços secundários ---- */}
        <View style={styles.priceRowThree}>
          <View style={styles.priceBlock}>
            <Text style={styles.compareLabel}>Tabela FIPE</Text>
            <Text style={styles.compareValue}>{formatCurrency(result.baseValue)}</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.compareLabel}>
              Padrão (-{result.baseDiscountPercent}%{result.discountSource === 'table' ? ' tabela' : ' padrão'})
            </Text>
            <Text style={styles.compareValue}>{formatCurrency(result.standardValue)}</Text>
          </View>
          <View style={[styles.priceBlock, styles.priceBlockRight]}>
            <Text style={styles.compareLabel}>Ajuste</Text>
            <Text style={[
              styles.compareValue,
              { color: result.adjustmentPercent < 0 ? colors.danger : colors.good },
            ]}>
              {result.adjustmentPercent > 0 ? '+' : ''}{result.adjustmentPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* ---- Custo de preparação (se houver) ---- */}
        {result.preparationCost > 0 && (
          <View style={styles.prepCostRow}>
            <Text style={styles.prepCostLabel}>
              Custo de preparação (peças/rodas)
            </Text>
            <Text style={styles.prepCostValue}>
              − {formatCurrency(result.preparationCost)}
            </Text>
          </View>
        )}

        {/* ---- Repasse ---- */}
        <View style={styles.repasseCard}>
          <View>
            <Text style={styles.repasseLabel}>Valor para Repasse</Text>
            <Text style={styles.repasseNote}>92% da oferta de compra</Text>
          </View>
          <Text style={styles.repasseValue}>{formatCurrency(result.repasseValue)}</Text>
        </View>

        {result.discountSource === 'table' && result.discountMatchedModel ? (
          <Text style={styles.discountSourceNote}>
            Desconto de {result.baseDiscountPercent}% aplicado conforme tabela para{' '}
            {result.discountMatchedModel}.
          </Text>
        ) : (
          <Text style={styles.discountSourceNote}>
            Desconto padrão de {result.baseDiscountPercent}% (modelo não encontrado na tabela).
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

      {saved ? (
        <Card style={styles.savedCard}>
          <Text style={styles.savedText}>✓ Avaliação salva no histórico</Text>
        </Card>
      ) : (
        <Button
          label="Salvar avaliação"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      )}

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
    borderColor: colors.gold,
  },
  estimatedValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  positionLabel: {
    fontSize: type.body.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  priceRowThree: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceBlock: {
    flex: 1,
  },
  priceBlockRight: {
    alignItems: 'flex-end',
  },
  prepCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dangerBg,
  },
  prepCostLabel: {
    fontSize: type.caption.fontSize,
    color: colors.danger,
    flex: 1,
    paddingRight: spacing.sm,
  },
  prepCostValue: {
    fontSize: type.h2.fontSize,
    fontWeight: '700',
    color: colors.danger,
  },
  repasseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repasseLabel: {
    fontSize: type.body.fontSize,
    fontWeight: '700',
    color: colors.info,
  },
  repasseNote: {
    fontSize: type.caption.fontSize,
    color: colors.info,
    opacity: 0.8,
    marginTop: 2,
  },
  repasseValue: {
    fontSize: type.h1.fontSize,
    fontWeight: '700',
    color: colors.info,
  },
  discountSourceNote: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  // legados mantidos
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  saveButton: {
    marginBottom: spacing.sm,
  },
  savedCard: {
    backgroundColor: colors.goodBg,
    borderColor: colors.good,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  savedText: {
    color: colors.good,
    fontWeight: '700',
    fontSize: type.body.fontSize,
  },
});
