import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { GaugeBar } from '../components/GaugeBar';
import { formatModelYear } from '../api/fipeApi';
import { ADJUSTMENT_RANGE, saleSuggestions } from '../domain/evaluationEngine';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';
import { AdjustmentSeverity, EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from '../domain/types';
import { saveEvaluation, linkEvaluationContact } from '../services/evaluationService';
import { ContactPicker } from '../components/ContactPicker';
import { Contact } from '../types/database';

interface ResultScreenProps {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  input: EvaluationInput;
  result: EvaluationResult;
  plate?: string;
  sessionToken?: string | null; // JWT do Supabase — null quando REQUIRE_AUTH=false
  onRestart: () => void;
  onSaved?: (evaluationId: string) => void;
  // Presente apenas quando a placa retornou mais de uma versao FIPE: permite
  // voltar a lista de versoes e recalcular sem refazer o formulario.
  onChangeVersion?: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function parseMoney(text: string): number {
  const numeric = text.replace(/\D/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
}

function formatMoneyInput(text: string): string {
  const value = parseMoney(text);
  return value > 0 ? value.toLocaleString('pt-BR') : '';
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

export function ResultScreen({ kind, vehicle, input, result, plate, sessionToken, onRestart, onSaved, onChangeVersion }: ResultScreenProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [offerText, setOfferText] = useState('');
  // Contato vinculado ja na avaliacao (opcional) — evita ter que ir ao historico.
  const [contact, setContact] = useState<Contact | null>(null);
  // Evita recalcular o parse várias vezes por render (era chamado 4x na dica).
  const offerNumber = useMemo(() => parseMoney(offerText), [offerText]);
  // Sugestoes de venda (showroom e repasse), derivadas dos valores ja calculados.
  const sale = useMemo(
    () => saleSuggestions(result.finalOfferValue, result.repasseValue, kind),
    [result.finalOfferValue, result.repasseValue, kind]
  );

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
      const id = await saveEvaluation({ kind, vehicle, input, result, plate, offerValue: parseMoney(offerText) });
      // Se um contato foi escolhido, vincula agora (cria desfecho pendente).
      if (contact) await linkEvaluationContact(id, contact.id);
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
        {formatModelYear(vehicle)} · {vehicle.fuel} · {result.mileageKm.toLocaleString('pt-BR')} km ·
        referência {vehicle.referenceMonth}
      </Text>

      <Card style={styles.heroCard}>

        {/* ---- Bloco principal: Sugestão de Compra (valor calculado pelo app) ---- */}
        <SectionLabel>Sugestão de compra</SectionLabel>
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

        {/* ---- Blindagem (se houver) ---- */}
        {result.armorAdjustmentValue !== 0 && (
          <View style={styles.prepCostRow}>
            <Text
              style={[
                styles.prepCostLabel,
                { color: result.armorAdjustmentValue > 0 ? colors.good : colors.danger },
              ]}
            >
              Ajuste de blindagem
            </Text>
            <Text
              style={[
                styles.prepCostValue,
                { color: result.armorAdjustmentValue > 0 ? colors.good : colors.danger },
              ]}
            >
              {result.armorAdjustmentValue > 0 ? '+ ' : '− '}
              {formatCurrency(Math.abs(result.armorAdjustmentValue))}
            </Text>
          </View>
        )}

        {/* ---- Repasse ---- */}
        <View style={styles.repasseCard}>
          <View>
            <Text style={styles.repasseLabel}>Valor para Repasse</Text>
            <Text style={styles.repasseNote}>92% da sugestão de compra</Text>
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

      <Card style={styles.saleCard}>
        <SectionLabel>Sugestão de venda</SectionLabel>
        <View style={styles.saleRow}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleLabel}>Showroom</Text>
            <Text style={styles.saleMargin}>margem {formatCurrency(sale.showroom.margin)}</Text>
          </View>
          <Text style={styles.saleValue}>{formatCurrency(sale.showroom.sale)}</Text>
        </View>
        <View style={[styles.saleRow, styles.saleRowLast]}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleLabel}>Repasse</Text>
            <Text style={styles.saleMargin}>margem {formatCurrency(sale.repasse.margin)}</Text>
          </View>
          <Text style={styles.saleValue}>{formatCurrency(sale.repasse.sale)}</Text>
        </View>
      </Card>

      <Card style={styles.offerCard}>
        <SectionLabel>Sua oferta de compra (opcional)</SectionLabel>
        <TextInput
          value={formatMoneyInput(offerText)}
          onChangeText={setOfferText}
          placeholder="Quanto você ofertaria?"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          style={styles.offerInput}
        />
        {offerNumber > 0 ? (
          <Text style={styles.offerHint}>
            {offerNumber === Math.round(result.finalOfferValue)
              ? 'Igual à sugestão do app.'
              : `${formatCurrency(Math.abs(offerNumber - Math.round(result.finalOfferValue)))} ${
                  offerNumber < result.finalOfferValue ? 'abaixo' : 'acima'
                } da sugestão.`}
          </Text>
        ) : (
          <Text style={styles.offerHint}>
            Registre quanto você pretende ofertar por este veículo. Fica salvo junto da avaliação.
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

      {!saved ? (
        <Card style={styles.offerCard}>
          <SectionLabel>Contato (opcional)</SectionLabel>
          <ContactPicker selected={contact} onChange={setContact} />
          <Text style={styles.offerHint}>
            Vincule ou crie um contato para esta cotação — fica salvo junto da avaliação, sem precisar ir ao histórico.
          </Text>
        </Card>
      ) : null}

      {saved ? (
        <Card style={styles.savedCard}>
          <Text style={styles.savedText}>Avaliação salva no histórico</Text>
        </Card>
      ) : (
        <Button
          label="Salvar avaliação"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
      )}

      {onChangeVersion ? (
        <Button label="Alterar versão" variant="secondary" onPress={onChangeVersion} style={styles.restartButton} />
      ) : null}

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
    fontFamily: fontFamily.spaceGrotesk,
  },
  positionLabel: {
    fontSize: type.body.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.inter,
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
    fontFamily: fontFamily.inter,
  },
  prepCostValue: {
    fontSize: type.h2.fontSize,
    fontWeight: '700',
    color: colors.danger,
    fontFamily: fontFamily.spaceGrotesk,
  },
  repasseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderRadius: radius.md,
  },
  repasseLabel: {
    fontSize: type.body.fontSize,
    fontWeight: '700',
    color: colors.info,
    fontFamily: fontFamily.spaceGrotesk,
  },
  repasseNote: {
    fontSize: type.caption.fontSize,
    color: colors.info,
    opacity: 0.8,
    marginTop: 2,
    fontFamily: fontFamily.inter,
  },
  repasseValue: {
    fontSize: type.h1.fontSize,
    fontWeight: '700',
    color: colors.info,
    fontFamily: fontFamily.spaceGrotesk,
  },
  discountSourceNote: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 16,
    fontFamily: fontFamily.inter,
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
    fontFamily: fontFamily.inter,
  },
  compareValue: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    fontFamily: fontFamily.spaceGrotesk,
  },
  saleCard: {
    marginBottom: spacing.lg,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleRowLast: {
    borderBottomWidth: 0,
  },
  saleInfo: {
    flex: 1,
  },
  saleLabel: {
    fontSize: type.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.spaceGrotesk,
  },
  saleMargin: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: 2,
    fontFamily: fontFamily.inter,
  },
  saleValue: {
    fontSize: type.h2.fontSize,
    fontWeight: '700',
    color: colors.ink,
    fontFamily: fontFamily.spaceGrotesk,
  },
  offerCard: {
    marginBottom: spacing.lg,
  },
  offerInput: {
    fontSize: type.h2.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    fontFamily: fontFamily.spaceGrotesk,
  },
  offerHint: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
    fontFamily: fontFamily.inter,
  },
  breakdownTitle: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
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
    fontFamily: fontFamily.inter,
  },
  percentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamily.spaceGrotesk,
  },
  lineDetail: {
    fontSize: type.caption.fontSize,
    lineHeight: 17,
    color: colors.textSecondary,
    fontFamily: fontFamily.inter,
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
    fontFamily: fontFamily.inter,
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
    fontFamily: fontFamily.inter,
  },
});
