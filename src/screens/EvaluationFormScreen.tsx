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
import { EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from '../domain/types';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { OptionGroup, ToggleRow } from '../components/OptionGroup';
import { colors, spacing, type } from '../theme/tokens';

interface EvaluationFormScreenProps {
  kind: VehicleKind;
  vehicle: FipeVehicleInfo;
  onResult: (result: EvaluationResult) => void;
}

const MOTO_TIRE_OPTIONS: { value: '0' | '1' | '2'; label: string }[] = [
  { value: '0', label: 'Nenhum pneu novo' },
  { value: '1', label: '1 pneu novo' },
  { value: '2', label: '2 pneus novos (par completo)' },
];

// Lê algo como "1,2,3,4" ou "1, 3" e devolve quantos pneus distintos e
// válidos (1 a 4) foram informados. Texto inválido/fora da faixa é ignorado.
function parseCarTireText(text: string): number {
  const found = new Set<number>();
  text.split(',').forEach((chunk) => {
    const n = parseInt(chunk.trim(), 10);
    if (Number.isInteger(n) && n >= 1 && n <= 4) {
      found.add(n);
    }
  });
  return found.size;
}

export function EvaluationFormScreen({ kind, vehicle, onResult }: EvaluationFormScreenProps) {
  const [mileageText, setMileageText] = useState('');
  const [mileageError, setMileageError] = useState<string | null>(null);

  const [motoTireValue, setMotoTireValue] = useState<'0' | '1' | '2'>('0');
  const [carTireText, setCarTireText] = useState('');

  const [hadDealerService, setHadDealerService] = useState(false);
  const [hasRepaint, setHasRepaint] = useState(false);

  const carTireCount = useMemo(() => parseCarTireText(carTireText), [carTireText]);
  const newTireCount = kind === 'motorcycles' ? Number(motoTireValue) : carTireCount;
  const maxTires = kind === 'motorcycles' ? 2 : 4;

  const mileagePreview = useMemo(() => {
    const mileage = Number(mileageText.replace(/\D/g, ''));
    if (!mileageText || Number.isNaN(mileage) || mileage <= 0) return null;
    return previewMileageAdjustment(mileage, vehicle.modelYear);
  }, [mileageText, vehicle.modelYear]);

  function handleSubmit() {
    const mileage = Number(mileageText.replace(/\D/g, ''));

    if (!mileageText || Number.isNaN(mileage) || mileage <= 0) {
      setMileageError('Informe a quilometragem atual do veículo.');
      return;
    }
    setMileageError(null);

    const input: EvaluationInput = {
      vehicle,
      kind,
      currentMileageKm: mileage,
      newTireCount,
      hadDealerService,
      hasRepaint,
    };

    onResult(evaluateVehicle(input));
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          O padrão de avaliação parte da tabela FIPE com 20% de desconto fixo. Os itens abaixo
          ajustam esse padrão pra cima ou pra baixo.
        </Text>

        <Card style={styles.card}>
          <SectionLabel>Quilometragem atual (km)</SectionLabel>
          <TextInput
            value={mileageText}
            onChangeText={(t) => {
              setMileageText(t);
              setMileageError(null);
            }}
            placeholder="Ex: 65000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={styles.input}
          />
          {mileageError ? <Text style={styles.fieldError}>{mileageError}</Text> : null}
          {mileagePreview ? (
            <Text style={styles.fieldNote}>
              ≈ {Math.round(mileagePreview.kmPerYear).toLocaleString('pt-BR')} km/ano para esse
              veículo →{' '}
              <Text
                style={
                  mileagePreview.percent >= 0 ? styles.fieldNotePositive : styles.fieldNoteNegative
                }
              >
                {mileagePreview.percent > 0 ? '+' : ''}
                {mileagePreview.percent}% no padrão de avaliação
              </Text>
            </Text>
          ) : (
            <Text style={styles.fieldNote}>
              O ajuste depende da média de km rodados por ano de uso, não só do total.
            </Text>
          )}
        </Card>

        <Card style={styles.card}>
          <SectionLabel>Pneus novos</SectionLabel>

          {kind === 'motorcycles' ? (
            <OptionGroup options={MOTO_TIRE_OPTIONS} value={motoTireValue} onChange={setMotoTireValue} />
          ) : (
            <>
              <TextInput
                value={carTireText}
                onChangeText={setCarTireText}
                placeholder="Ex: 1,2,3,4"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
              <Text style={styles.fieldNote}>
                Liste de 1 a 4, separados por vírgula, indicando quantos e quais pneus estão
                novos. Ex: "1,3" para dois pneus novos, "1,2,3,4" para o jogo completo.
              </Text>
            </>
          )}

          <View style={styles.tireSummary}>
            <Text style={styles.tireSummaryText}>
              {newTireCount} de {maxTires} pneus novos considerados
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionLabel>Revisão na concessionária</SectionLabel>
          <ToggleRow
            label="O veículo fez revisão na concessionária?"
            value={hadDealerService}
            onChange={setHadDealerService}
          />
        </Card>

        <Card style={styles.card}>
          <SectionLabel>Repintura</SectionLabel>
          <ToggleRow
            label="Há repintura identificada?"
            value={hasRepaint}
            onChange={setHasRepaint}
          />
        </Card>

        <Button label="Calcular avaliação" onPress={handleSubmit} style={styles.submitButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  intro: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  input: {
    fontSize: type.h2.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  fieldError: {
    color: colors.danger,
    fontSize: type.caption.fontSize,
    marginTop: spacing.xs,
  },
  fieldNote: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  fieldNotePositive: {
    fontWeight: '700',
    color: colors.good,
  },
  fieldNoteNegative: {
    fontWeight: '700',
    color: colors.danger,
  },
  tireSummary: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tireSummaryText: {
    fontSize: type.caption.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
