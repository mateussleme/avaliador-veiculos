import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, SectionLabel } from '../components/Card';
import { OptionGroup } from '../components/OptionGroup';
import { saveOutcome } from '../services/evaluationService';
import { EvaluationWithOutcome } from '../types/database';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';


interface OutcomeScreenProps {
  evaluation: EvaluationWithOutcome;
  onSaved: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseMoney(text: string): number {
  const numeric = text.replace(/\D/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
}

function formatMoneyInput(text: string): string {
  const value = parseMoney(text);
  return value > 0 ? value.toLocaleString('pt-BR') : '';
}

const PURCHASE_OPTIONS: { value: 'yes' | 'no'; label: string }[] = [
  { value: 'yes', label: 'Sim, foi comprado' },
  { value: 'no',  label: 'Não foi comprado' },
];

export function OutcomeScreen({ evaluation, onSaved }: OutcomeScreenProps) {
  const [wasPurchased, setWasPurchased] = useState<'yes' | 'no'>(
    evaluation.was_purchased === false ? 'no' : 'yes'
  );
  const [purchasePriceText, setPurchasePriceText] = useState(
    evaluation.purchase_price ? String(evaluation.purchase_price) : String(Math.round(evaluation.estimated_value))
  );
  const [purchaseDate] = useState(evaluation.purchase_date ?? todayISO());

  const [wasSold, setWasSold] = useState(evaluation.was_sold ?? false);
  const [salePriceText, setSalePriceText] = useState(evaluation.sale_price ? String(evaluation.sale_price) : '');
  const [saleDate] = useState(evaluation.sale_date ?? todayISO());

  const [notes, setNotes] = useState(evaluation.outcome_notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveOutcome({
        evaluationId: evaluation.id,
        wasPurchased: wasPurchased === 'yes',
        purchasePrice: wasPurchased === 'yes' ? parseMoney(purchasePriceText) : undefined,
        purchaseDate: wasPurchased === 'yes' ? purchaseDate : undefined,
        wasSold: wasPurchased === 'yes' ? wasSold : false,
        salePrice: wasSold ? parseMoney(salePriceText) : undefined,
        saleDate: wasSold ? saleDate : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Salvo!', 'O desfecho foi registrado com sucesso.', [{ text: 'OK', onPress: onSaved }]);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Card style={styles.summaryCard}>
          <SectionLabel>Veículo avaliado</SectionLabel>
          <Text style={styles.vehicleName}>{evaluation.brand} {evaluation.model}</Text>
          <Text style={styles.vehicleMeta}>
            {evaluation.model_year} · valor estimado {formatCurrency(evaluation.estimated_value)}
          </Text>
        </Card>

        <Text style={styles.intro}>
          Esse registro é o que constrói a base de inteligência do sistema. Quanto mais desfechos
          registrados, mais preciso fica o motor de avaliação com o tempo.
        </Text>

        <Card style={styles.card}>
          <SectionLabel>Esse veículo foi comprado?</SectionLabel>
          <OptionGroup options={PURCHASE_OPTIONS} value={wasPurchased} onChange={setWasPurchased} />
        </Card>

        {wasPurchased === 'yes' && (
          <>
            <Card style={styles.card}>
              <SectionLabel>Valor pago na compra</SectionLabel>
              <TextInput
                value={formatMoneyInput(purchasePriceText)}
                onChangeText={setPurchasePriceText}
                placeholder="Ex: 25000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                style={styles.input}
              />
            </Card>

            <Card style={styles.card}>
              <SectionLabel>Esse veículo já foi vendido?</SectionLabel>
              <View style={styles.toggleRow}>
                <Pressable onPress={() => setWasSold(false)} style={[styles.toggleChip, !wasSold && styles.toggleChipSelected]}>
                  <Text style={[styles.toggleChipText, !wasSold && styles.toggleChipTextSelected]}>Ainda em estoque</Text>
                </Pressable>
                <Pressable onPress={() => setWasSold(true)} style={[styles.toggleChip, wasSold && styles.toggleChipSelected]}>
                  <Text style={[styles.toggleChipText, wasSold && styles.toggleChipTextSelected]}>Já vendido</Text>
                </Pressable>
              </View>
            </Card>

            {wasSold && (
              <Card style={styles.card}>
                <SectionLabel>Valor de venda</SectionLabel>
                <TextInput
                  value={formatMoneyInput(salePriceText)}
                  onChangeText={setSalePriceText}
                  placeholder="Ex: 29900"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                {salePriceText && purchasePriceText ? (
                  <Text style={styles.marginNote}>
                    Margem: {formatCurrency(parseMoney(salePriceText) - parseMoney(purchasePriceText))}
                  </Text>
                ) : null}
              </Card>
            )}
          </>
        )}

        <Card style={styles.card}>
          <SectionLabel>Observações (opcional)</SectionLabel>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Detalhes da negociação, motivo da decisão, etc."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </Card>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveButton, saving && styles.disabled, pressed && styles.pressed]}
        >
          {saving ? <ActivityIndicator color={colors.textOnInk} /> : <Text style={styles.saveButtonText}>Salvar desfecho</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryCard: { marginBottom: spacing.md },
  vehicleName: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  vehicleMeta: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2, fontFamily: fontFamily.inter },
  intro: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: colors.textSecondary, marginBottom: spacing.lg, fontFamily: fontFamily.inter },
  card: { marginBottom: spacing.md },
  input: { fontSize: type.h2.fontSize, color: colors.textPrimary, paddingVertical: spacing.sm, fontFamily: fontFamily.spaceGrotesk },
  textArea: { fontSize: type.body.fontSize, minHeight: 70, textAlignVertical: 'top', fontFamily: fontFamily.inter },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleChip: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  toggleChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  toggleChipText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: fontFamily.inter },
  marginNote: { fontSize: type.caption.fontSize, color: colors.good, fontWeight: '600', marginTop: spacing.xs, fontFamily: fontFamily.spaceGrotesk },
  saveButton: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm, minHeight: 50, justifyContent: 'center' },
  saveButton: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm, minHeight: 50, justifyContent: 'center' },
  saveButtonText: { color: colors.textOnInk, fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, fontFamily: fontFamily.spaceGrotesk },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
