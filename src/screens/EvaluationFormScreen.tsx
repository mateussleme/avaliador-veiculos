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
import { evaluateVehicle, previewMileageAdjustment } from '../domain/evaluationEngine';
import {
  EvaluationInput,
  EvaluationResult,
  FipeVehicleInfo,
  VehicleKind,
} from '../domain/types';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { OptionGroup, ToggleRow } from '../components/OptionGroup';
import { colors, spacing, type } from '../theme/tokens';

interface EvaluationFormScreenProps {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  onResult: (result: EvaluationResult, input: EvaluationInput) => void;
}

const MOTO_TIRE_OPTIONS: { value: '1' | '2'; label: string }[] = [
  { value: '1', label: '1 pneu novo' },
  { value: '2', label: '2 pneus novos' },
];

const CAR_TIRE_OPTIONS: { value: '1' | '2' | '3' | '4'; label: string }[] = [
  { value: '1', label: '1 pneu' },
  { value: '2', label: '2 pneus' },
  { value: '3', label: '3 pneus' },
  { value: '4', label: '4 pneus' },
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

  const maxTires = kind === 'motorcycles' ? 2 : 4;

  const newTireCount = kind === 'motorcycles'
    ? Number(motoTireValue)
    : Number(carTireValue);

  const repaintPieces = parseInt(repaintPiecesText, 10) || 0;
  const repaintWheels = parseInt(repaintWheelsText, 10) || 0;
  const repaintCostPreview = repaintPieces * 800 + repaintWheels * 300;

  const mileagePreview = useMemo(() => {
    const mileage = Number(mileageText.replace(/\D/g, ''));
    if (!mileage || mileage <= 0) return null;
    return previewMileageAdjustment(mileage, vehicle.modelYear);
  }, [mileageText, vehicle.modelYear]);

  function handleSubmit() {
    const mileage = Number(mileageText.replace(/\D/g, ''));
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
            style={styles.input}
          />
          {mileageError ? <Text style={styles.fieldError}>{mileageError}</Text> : null}
          {mileagePreview ? (
            mileagePreview.isCurrentYear ? (
              <Text style={styles.fieldNote}>
                Referência para este período: {mileagePreview.expectedKm.toLocaleString('pt-BR')} km →{' '}
                <Text style={mileagePreview.percent >= 0 ? styles.fieldNotePositive : styles.fieldNoteNegative}>
                  {mileagePreview.percent > 0 ? '+' : ''}{mileagePreview.percent}%
                </Text>
              </Text>
            ) : (
              <Text style={styles.fieldNote}>
                ≈ {Math.round(mileagePreview.kmPerYear).toLocaleString('pt-BR')} km/ano →{' '}
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
            label="Veículo possui pneus novos?"
            value={hasTires}
            onChange={setHasTires}
          />
          {hasTires && (
            <View style={styles.subField}>
              <Text style={styles.subLabel}>Quantos pneus novos?</Text>
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
                {newTireCount} de {maxTires} pneus novos considerados.
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
            label="Há repintura identificada?"
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
  },
  card: { marginBottom: spacing.md },
  input: {
    fontSize: type.h2.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  fieldError: { color: colors.danger, fontSize: type.caption.fontSize, marginTop: spacing.xs },
  fieldNote: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: spacing.xs, lineHeight: 16 },
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
  },
  costPreview: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
  },
  costPreviewText: { fontSize: type.caption.fontSize, color: colors.danger },
  costPreviewValue: { fontWeight: '700' },
  submitButton: { marginTop: spacing.md },
});
