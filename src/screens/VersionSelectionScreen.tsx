import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FipeVersionMatch } from '../api/plateApi';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { VehicleKind } from '../domain/types';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface VersionSelectionScreenProps {
  kind: VehicleKind;
  allMatches: FipeVersionMatch[];
  onConfirm: (match: FipeVersionMatch) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function VersionSelectionScreen({
  kind,
  allMatches,
  onConfirm,
}: VersionSelectionScreenProps) {
  // Pré-seleciona a versão principal (sugestão do sistema)
  const defaultIndex = allMatches.findIndex((m) => m.isPrincipal);
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  const selected = allMatches[selectedIndex];

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

      <Card style={styles.alertCard}>
        <Text style={styles.alertTitle}>⚠️ Confirme a versão antes de avaliar</Text>
        <Text style={styles.alertBody}>
          A base da SENATRAN registra o modelo genérico do veículo, mas a tabela FIPE
          diferencia versões comerciais com preços distintos. Uma versão errada pode distorcer
          a avaliação em dezenas de milhares de reais em veículos premium.
        </Text>
        <Text style={styles.alertBodyBold}>
          Verifique o documento do veículo e selecione a versão correta abaixo.
        </Text>
      </Card>

      <SectionLabel>
        {allMatches.length} versão{allMatches.length !== 1 ? 'ões' : ''} encontrada
        {allMatches.length !== 1 ? 's' : ''} para essa placa
      </SectionLabel>

      {allMatches.map((match, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <Pressable
            key={idx}
            onPress={() => setSelectedIndex(idx)}
            style={[styles.versionCard, isSelected && styles.versionCardSelected]}
          >
            <View style={styles.versionRow}>
              <View style={styles.versionCheckbox}>
                {isSelected && <View style={styles.versionCheckboxInner} />}
              </View>
              <View style={styles.versionContent}>
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionModel, isSelected && styles.versionModelSelected]}>
                    {match.vehicle.brand} {match.vehicle.model}
                  </Text>
                  {match.isPrincipal && (
                    <View style={styles.suggestionBadge}>
                      <Text style={styles.suggestionBadgeText}>Sugestão</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.versionMeta}>
                  {match.vehicle.modelYear} · {match.vehicle.fuel} · cód. {match.vehicle.codeFipe}
                </Text>
                <Text style={[styles.versionPrice, isSelected && styles.versionPriceSelected]}>
                  {match.vehicle.priceLabel}
                </Text>
                <Text style={styles.versionRef}>
                  ref. {match.vehicle.referenceMonth}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      <Card style={styles.selectedSummary}>
        <SectionLabel>Versão selecionada</SectionLabel>
        <Text style={styles.selectedName}>
          {selected.vehicle.brand} {selected.vehicle.model}
        </Text>
        <Text style={styles.selectedPrice}>{selected.vehicle.priceLabel}</Text>
        {!selected.isPrincipal && (
          <Text style={styles.manualNote}>
            Versão corrigida manualmente — diferente da sugestão automática.
          </Text>
        )}
      </Card>

      <Button
        label="Confirmar versão e avaliar"
        onPress={() => onConfirm(selected)}
        style={styles.confirmButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  alertCard: {
    backgroundColor: colors.cautionBg,
    borderColor: colors.caution,
    marginBottom: spacing.lg,
  },
  alertTitle: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.caution,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
  },
  alertBody: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    fontFamily: fontFamily.inter,
  },
  alertBodyBold: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.sm,
    fontFamily: fontFamily.inter,
  },
  versionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  versionCardSelected: {
    borderColor: colors.ink,
    borderWidth: 2,
    backgroundColor: colors.surfaceAlt,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  versionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  versionCheckboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  versionContent: {
    flex: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 2,
  },
  versionModel: {
    fontSize: type.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fontFamily.spaceGrotesk,
  },
  versionModelSelected: {
    color: colors.ink,
  },
  suggestionBadge: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  suggestionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.info,
    fontFamily: fontFamily.spaceGrotesk,
  },
  versionMeta: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginBottom: 4,
    fontFamily: fontFamily.inter,
  },
  versionPrice: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textSecondary,
    fontFamily: fontFamily.spaceGrotesk,
  },
  versionPriceSelected: {
    color: colors.ink,
  },
  versionRef: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: 2,
    fontFamily: fontFamily.inter,
  },
  selectedSummary: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  selectedName: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    marginBottom: 4,
    fontFamily: fontFamily.spaceGrotesk,
  },
  selectedPrice: {
    fontSize: type.display.fontSize,
    fontWeight: type.display.fontWeight,
    color: colors.ink,
    fontFamily: fontFamily.spaceGrotesk,
  },
  manualNote: {
    fontSize: type.caption.fontSize,
    color: colors.caution,
    marginTop: spacing.sm,
    fontWeight: '600',
    fontFamily: fontFamily.inter,
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
});
