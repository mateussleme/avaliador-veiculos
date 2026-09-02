import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { evaluateVehicle, previewArmorAdjustment, previewMileageAdjustment } from '../domain/evaluationEngine';
import { lookupDiscount } from '../domain/discountTable';
import {
  EvaluationInput,
  EvaluationResult,
  FipeVehicleInfo,
  VehicleKind,
} from '../domain/types';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { OptionGroup, ToggleRow } from '../components/OptionGroup';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface EvaluationFormScreenProps {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  onResult: (result: EvaluationResult, input: EvaluationInput) => void;
}

function clampInput(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

const MOTO_TIRE_OPTIONS: { value: '1' | '2'; label: string }[] = [
  { value: '1', label: '1 pneu' },
  { value: '2', label: '2 pneus' },
];

const CAR_TIRE_OPTIONS: { value: '1' | '2' | '3' | '4'; label: string }[] = [
  { value: '1', label: '1 pneu' },
  { value: '2', label: '2 pneus' },
  { value: '3', label: '3 pneus' },
  { value: '4', label: '4 pneus' },
];

const DELAMINATED_WINDOW_OPTIONS: { value: '1' | '2' | '3' | '4' | '5' | '6' | '7'; label: string }[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
];

export function EvaluationFormScreen({ kind, vehicle, onResult }: EvaluationFormScreenProps) {
  const [mileageText, setMileageText]             = useState('');
  const [mileageError, setMileageError]           = useState<string | null>(null);

  // Pneus
  const [hasTires, setHasTires]                   = useState(false);
  const [motoTireValue, setMotoTireValue]         = useState<'1' | '2'>('1');
  const [carTireValue, setCarTireValue]           = useState<'1' | '2' | '3' | '4'>('4');

  // Revisão
  const [hadDealerService, setHadDealerService]   = useState(false);

  // Repintura
  const [hasRepaint, setHasRepaint]               = useState(false);
  const [repaintPiecesText, setRepaintPiecesText] = useState('');
  const [repaintWheelsText, setRepaintWheelsText] = useState('');

  // Gastos adicionais previstos (R$)
  const [additionalCostsText, setAdditionalCostsText] = useState('');

  // Opcionais / valorização (R$)
  const [optionalsText, setOptionalsText] = useState('');

  // Blindagem (só carros)
  const [isArmored, setIsArmored]                 = useState(false);
  const [isArmored3A, setIsArmored3A]             = useState(false);
  const [hasDelamination, setHasDelamination]     = useState(false);
  const [delaminatedWindowValue, setDelaminatedWindowValue] = useState<'1' | '2' | '3' | '4' | '5' | '6' | '7'>('1');

  const maxTires = kind === 'motorcycles' ? 2 : 4;

  const newTireCount = kind === 'motorcycles'
    ? Number(motoTireValue)
    : Number(carTireValue);

  // Limites de sanidade: nada aqui é "seguro" no sentido de ataque (é tudo
  // local, sem backend), mas sem teto um erro de digitação (ex: um zero a
  // mais) gera uma avaliação sem sentido. 500.000 km e 8 peças/rodas cobrem
  // qualquer caso real de veículo seminovo com folga.
  const MAX_MILEAGE_KM = 500000;
  const MAX_REPAINT_PIECES = 8;
  const MAX_REPAINT_WHEELS = 8;

  const repaintPieces = clampInput(parseInt(repaintPiecesText, 10) || 0, MAX_REPAINT_PIECES);
  const repaintWheels = clampInput(parseInt(repaintWheelsText, 10) || 0, MAX_REPAINT_WHEELS);
  const repaintCostPreview = repaintPieces * 800 + repaintWheels * 300;

  // Gastos adicionais: só dígitos (R$). Teto de sanidade contra digitação errada.
  const MAX_ADDITIONAL_COSTS = 1000000;
  const additionalCosts = clampInput(Number(additionalCostsText.replace(/\D/g, '')), MAX_ADDITIONAL_COSTS);
  const optionalsValue = clampInput(Number(optionalsText.replace(/\D/g, '')), MAX_ADDITIONAL_COSTS);

  const mileagePreview = useMemo(() => {
    const mileage = clampInput(Number(mileageText.replace(/\D/g, '')), MAX_MILEAGE_KM);
    if (!mileage || mileage <= 0) return null;
    // Usa a média de km/ano do modelo (mesma da tabela de descontos) para
    // deixar o preview igual ao cálculo final.
    const media = lookupDiscount(vehicle.brand, vehicle.model).kmPerYear;
    return previewMileageAdjustment(mileage, vehicle.modelYear, media);
  }, [mileageText, vehicle.modelYear, vehicle.brand, vehicle.model]);

  const delaminatedWindowCount = hasDelamination ? Number(delaminatedWindowValue) : 0;

  const armorPreview = useMemo(() => {
    if (!isArmored) return null;
    return previewArmorAdjustment(vehicle.modelYear, vehicle.priceValue, delaminatedWindowCount);
  }, [isArmored, vehicle.modelYear, vehicle.priceValue, delaminatedWindowCount]);

  function handleSubmit() {
    const mileage = clampInput(Number(mileageText.replace(/\D/g, '')), MAX_MILEAGE_KM);
    if (!mileageText || mileage <= 0) {
      setMileageError('Informe a quilometragem atual do veículo.');
      return;
    }
    setMileageError(null);

    const input: EvaluationInput = {
      vehicle,
      kind,
      currentMileageKm: mileage,
      hasTires,
      newTireCount: hasTires ? newTireCount : 0,
      hadDealerService,
      hasRepaint,
      repaintPiecesCount: hasRepaint ? repaintPieces : 0,
      repaintWheelsCount: hasRepaint ? repaintWheels : 0,
      isArmored: kind === 'cars' ? isArmored : false,
      isArmored3A: kind === 'cars' && isArmored ? isArmored3A : false,
      hasDelamination: kind === 'cars' && isArmored ? hasDelamination : false,
      delaminatedWindowCount: kind === 'cars' && isArmored ? delaminatedWindowCount : 0,
      additionalCosts,
      optionalsValue,
    };

    onResult(evaluateVehicle(input), input);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          O padrão de avaliação parte da tabela FIPE com desconto por modelo. Os itens abaixo
          ajustam esse padrão pra cima ou pra baixo.
        </Text>

        {/* Quilometragem */}
        <Card style={styles.card}>
          <SectionLabel>Quilometragem atual (km)</SectionLabel>
          <TextInput
            value={mileageText}
            onChangeText={(t) => { setMileageText(t); setMileageError(null); }}
            placeholder="Ex: 65000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
          {mileageError ? <Text style={styles.fieldError}>{mileageError}</Text> : null}
          {mileagePreview ? (
            mileagePreview.isCurrentYear ? (
              <Text style={styles.fieldNote}>
                Referência para este período: {mileagePreview.expectedKm.toLocaleString('pt-BR')} km ·{' '}
                <Text style={mileagePreview.percent >= 0 ? styles.fieldNotePositive : styles.fieldNoteNegative}>
                  {mileagePreview.percent > 0 ? '+' : ''}{mileagePreview.percent}%
                </Text>
              </Text>
            ) : (
              <Text style={styles.fieldNote}>
                Cerca de {Math.round(mileagePreview.kmPerYear).toLocaleString('pt-BR')} km/ano ·{' '}
                <Text style={mileagePreview.percent >= 0 ? styles.fieldNotePositive : styles.fieldNoteNegative}>
                  {mileagePreview.percent > 0 ? '+' : ''}{mileagePreview.percent}%
                </Text>
              </Text>
            )
          ) : (
            <Text style={styles.fieldNote}>
              O ajuste depende da média de km/ano, não só do total.
            </Text>
          )}
        </Card>

        {/* Pneus */}
        <Card style={styles.card}>
          <SectionLabel>Pneus</SectionLabel>
          <ToggleRow
            label="Precisa trocar os pneus?"
            value={hasTires}
            onChange={setHasTires}
          />
          {hasTires && (
            <View style={styles.subField}>
              <Text style={styles.subLabel}>Quantos pneus precisam trocar?</Text>
              {kind === 'motorcycles' ? (
                <OptionGroup
                  options={MOTO_TIRE_OPTIONS}
                  value={motoTireValue}
                  onChange={setMotoTireValue}
                />
              ) : (
                <OptionGroup
                  options={CAR_TIRE_OPTIONS}
                  value={carTireValue}
                  onChange={setCarTireValue}
                />
              )}
              <Text style={styles.fieldNote}>
                {newTireCount} de {maxTires} pneus para trocar considerados.
              </Text>
            </View>
          )}
        </Card>

        {/* Revisão na CSS */}
        <Card style={styles.card}>
          <SectionLabel>Revisão na concessionária</SectionLabel>
          <ToggleRow
            label="Fez revisão na concessionária?"
            value={hadDealerService}
            onChange={setHadDealerService}
          />
          <Text style={styles.fieldNote}>
            {hadDealerService ? '+1% por revisão na CSS.' : '-4% por ausência de revisão na CSS.'}
          </Text>
        </Card>

        {/* Repintura */}
        <Card style={styles.card}>
          <SectionLabel>Repintura</SectionLabel>
          <ToggleRow
            label="Precisa de repintura?"
            value={hasRepaint}
            onChange={setHasRepaint}
          />

          {hasRepaint && (
            <View style={styles.subField}>
              <Text style={styles.subLabel}>Número de peças para pintar (R$800 cada)</Text>
              <TextInput
                value={repaintPiecesText}
                onChangeText={setRepaintPiecesText}
                placeholder="Ex: 2"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.input}
              />

              <Text style={[styles.subLabel, { marginTop: spacing.md }]}>
                Número de rodas para pintar (R$300 cada)
              </Text>
              <TextInput
                value={repaintWheelsText}
                onChangeText={setRepaintWheelsText}
                placeholder="Ex: 4"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.input}
              />

              {repaintCostPreview > 0 && (
                <View style={styles.costPreview}>
                  <Text style={styles.costPreviewText}>
                    Custo de preparação estimado:{' '}
                    <Text style={styles.costPreviewValue}>
                      R$ {repaintCostPreview.toLocaleString('pt-BR')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Gastos adicionais previstos */}
        <Card style={styles.card}>
          <SectionLabel>Gastos adicionais</SectionLabel>
          <Text style={styles.subLabel}>Valor previsto (R$)</Text>
          <TextInput
            value={additionalCosts > 0 ? additionalCosts.toLocaleString('pt-BR') : ''}
            onChangeText={setAdditionalCostsText}
            placeholder="Ex: 3.000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Text style={styles.fieldNote}>
            Custos extras que você prevê ter com o veículo (peças, funilaria, documentação, etc.). Descontam da sugestão de compra.
          </Text>
        </Card>

        {/* Opcionais / valorização */}
        <Card style={styles.card}>
          <SectionLabel>Opcionais / valorização</SectionLabel>
          <Text style={styles.subLabel}>Valor agregado (R$)</Text>
          <TextInput
            value={optionalsValue > 0 ? optionalsValue.toLocaleString('pt-BR') : ''}
            onChangeText={setOptionalsText}
            placeholder="Ex: 15.000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Text style={styles.fieldNote}>
            Opcionais que a FIPE não considera e agregam valor (teto solar, acabamento ou pintura especial, etc.). Somam na sugestão de compra.
          </Text>
        </Card>

        {/* Blindagem (só carros) */}
        {kind === 'cars' && (
          <Card style={styles.card}>
            <SectionLabel>Blindagem</SectionLabel>
            <ToggleRow
              label="Veículo é blindado?"
              value={isArmored}
              onChange={setIsArmored}
            />

            {isArmored && (
              <View style={styles.subField}>
                <ToggleRow
                  label="Blindagem nível III-A?"
                  value={isArmored3A}
                  onChange={setIsArmored3A}
                />
                <ToggleRow
                  label="Há delaminações?"
                  value={hasDelamination}
                  onChange={setHasDelamination}
                />

                {hasDelamination && (
                  <View style={styles.subField}>
                    <Text style={styles.subLabel}>Quantos vidros delaminados? (R$6.000 cada)</Text>
                    <OptionGroup
                      options={DELAMINATED_WINDOW_OPTIONS}
                      value={delaminatedWindowValue}
                      onChange={setDelaminatedWindowValue}
                    />
                  </View>
                )}

                {armorPreview && (
                  <View style={styles.costPreview}>
                    <Text
                      style={[
                        styles.costPreviewText,
                        armorPreview.total >= 0 ? styles.fieldNotePositive : undefined,
                      ]}
                    >
                      Ajuste da blindagem:{' '}
                      <Text style={styles.costPreviewValue}>
                        {armorPreview.total >= 0 ? '+' : ''}R$ {armorPreview.total.toLocaleString('pt-BR')}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        <Button label="Calcular avaliação" onPress={handleSubmit} style={styles.submitButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontFamily: fontFamily.inter,
  },
  card: { marginBottom: spacing.md },
  input: {
    fontSize: type.h2.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
  },
  fieldError: { color: colors.danger, fontSize: type.caption.fontSize, marginTop: spacing.xs, fontFamily: fontFamily.inter },
  fieldNote: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: spacing.xs, lineHeight: 16, fontFamily: fontFamily.inter },
  fieldNotePositive: { fontWeight: '700', color: colors.good },
  fieldNoteNegative: { fontWeight: '700', color: colors.danger },
  subField: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subLabel: {
    fontSize: type.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: fontFamily.inter,
  },
  costPreview: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
  },
  costPreviewText: { fontSize: type.caption.fontSize, color: colors.danger, fontFamily: fontFamily.inter },
  costPreviewValue: { fontWeight: '700' },
  submitButton: { marginTop: spacing.md },
});
