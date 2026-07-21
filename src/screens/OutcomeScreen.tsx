import React, { useRef, useState } from 'react';
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
import { ContactPicker } from '../components/ContactPicker';
import { OptionGroup } from '../components/OptionGroup';
import { saveOutcome } from '../services/evaluationService';
import { Contact, EvaluationWithOutcome, OutcomeStatus } from '../types/database';
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

const STATUS_OPTIONS: { value: OutcomeStatus; label: string }[] = [
  { value: 'purchased',     label: 'Comprado' },
  { value: 'negotiating',   label: 'Em negociação' },
  { value: 'not_purchased', label: 'Não comprado' },
];

export function OutcomeScreen({ evaluation, onSaved }: OutcomeScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  // Ao focar um campo de valor, rola a tela pra ele não ficar atrás do teclado.
  function scrollToInput() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  }

  const [status, setStatus] = useState<OutcomeStatus>(evaluation.outcome_status ?? 'purchased');

  // Um único valor para "pago na compra" e "em negociação": é o mesmo número
  // (quanto o avaliador está pagando/oferecendo). Assim, ao alternar entre
  // Comprado e Em negociação, o que foi digitado não se perde.
  // Prefill: valor já registrado > oferta informada na avaliação > sugestão.
  const [valueText, setValueText] = useState(
    String(
      evaluation.purchase_price ??
      evaluation.negotiation_price ??
      evaluation.offer_value ??
      Math.round(evaluation.final_offer_value)
    )
  );
  const [purchaseDate] = useState(evaluation.purchase_date ?? todayISO());

  const [wasSold, setWasSold] = useState(evaluation.was_sold ?? false);
  const [salePriceText, setSalePriceText] = useState(evaluation.sale_price ? String(evaluation.sale_price) : '');
  const [saleDate] = useState(evaluation.sale_date ?? todayISO());

  const [notes, setNotes] = useState(evaluation.outcome_notes ?? '');
  const [saving, setSaving] = useState(false);

  // Contato já vinculado (se houver) reconstruído a partir da view.
  const [contact, setContact] = useState<Contact | null>(
    evaluation.contact_id
      ? {
          id: evaluation.contact_id,
          user_id: evaluation.user_id,
          name: evaluation.contact_name ?? 'Contato',
          company_group: evaluation.contact_group ?? null,
          phone: evaluation.contact_phone ?? null,
          created_at: '',
          updated_at: '',
        }
      : null
  );

  async function handleSave() {
    setSaving(true);
    try {
      await saveOutcome({
        evaluationId: evaluation.id,
        status,
        purchasePrice: status === 'purchased' ? parseMoney(valueText) : undefined,
        negotiationPrice: status === 'negotiating' ? parseMoney(valueText) : undefined,
        purchaseDate: status === 'purchased' ? purchaseDate : undefined,
        wasSold: status === 'purchased' ? wasSold : false,
        salePrice: status === 'purchased' && wasSold ? parseMoney(salePriceText) : undefined,
        saleDate: status === 'purchased' && wasSold ? saleDate : undefined,
        notes: notes.trim() || undefined,
        contactId: contact?.id ?? null,
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
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Card style={styles.summaryCard}>
          <SectionLabel>Veículo avaliado</SectionLabel>
          <Text style={styles.vehicleName}>{evaluation.brand} {evaluation.model}</Text>
          <Text style={styles.vehicleMeta}>
            {evaluation.model_year} · sugestão de compra {formatCurrency(evaluation.final_offer_value)}
          </Text>
        </Card>

        <Text style={styles.intro}>
          Esse registro é o que constrói a base de inteligência do sistema. Quanto mais desfechos
          registrados, mais preciso fica o motor de avaliação com o tempo.
        </Text>

        <Card style={styles.card}>
          <SectionLabel>Contato / grupo</SectionLabel>
          <ContactPicker selected={contact} onChange={setContact} />
          <Text style={styles.contactHint}>
            Vincule com quem você negociou. Depois é possível buscar por contato ou grupo
            e ver todos os carros cotados.
          </Text>
        </Card>

        <Card style={styles.card}>
          <SectionLabel>Qual o desfecho?</SectionLabel>
          <OptionGroup options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </Card>

        {status === 'negotiating' && (
          <Card style={styles.card}>
            <SectionLabel>Valor em negociação</SectionLabel>
            <TextInput
              value={formatMoneyInput(valueText)}
              onChangeText={setValueText}
              onFocus={scrollToInput}
              placeholder="Ex: 25000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Card>
        )}

        {status === 'purchased' && (
          <>
            <Card style={styles.card}>
              <SectionLabel>Valor pago na compra</SectionLabel>
              <TextInput
                value={formatMoneyInput(valueText)}
                onChangeText={setValueText}
                onFocus={scrollToInput}
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
                  onFocus={scrollToInput}
                  placeholder="Ex: 29900"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                {salePriceText && valueText ? (
                  <Text style={styles.marginNote}>
                    Margem: {formatCurrency(parseMoney(salePriceText) - parseMoney(valueText))}
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
  scroll: { padding: spacing.lg, paddingBottom: 340 },
  summaryCard: { marginBottom: spacing.md },
  vehicleName: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  vehicleMeta: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2, fontFamily: fontFamily.inter },
  intro: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: colors.textSecondary, marginBottom: spacing.lg, fontFamily: fontFamily.inter },
  card: { marginBottom: spacing.md },
  contactHint: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: spacing.sm, lineHeight: 16, fontFamily: fontFamily.inter },
  input: { fontSize: type.h2.fontSize, color: colors.textPrimary, paddingVertical: spacing.sm, fontFamily: fontFamily.spaceGrotesk },
  textArea: { fontSize: type.body.fontSize, minHeight: 70, textAlignVertical: 'top', fontFamily: fontFamily.inter },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleChip: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  toggleChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  toggleChipText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: fontFamily.inter },
  toggleChipTextSelected: { color: colors.textOnInk },
  marginNote: { fontSize: type.caption.fontSize, color: colors.good, fontWeight: '600', marginTop: spacing.xs, fontFamily: fontFamily.spaceGrotesk },
  saveButton: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm, minHeight: 50, justifyContent: 'center' },
  saveButtonText: { color: colors.textOnInk, fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, fontFamily: fontFamily.spaceGrotesk },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
