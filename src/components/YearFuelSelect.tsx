import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SelectOption } from './SelectField';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

// Seletor de "Ano / combustível" em dois passos:
//   1. escolhe o combustível (cards de botão)
//   2. escolhe o ano daquele combustível (do mais novo / 0 km para o mais antigo)
// A FIPE entrega os anos já com o combustível no nome ("2025 Gasolina"), então
// agrupamos por aqui. O valor selecionado guarda o SelectOption original.

interface YearFuelSelectProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: SelectOption | null;
  onSelect: (option: SelectOption) => void;
  onClear?: () => void; // se fornecido e houver valor, mostra "×" para limpar
  disabled?: boolean;
  loading?: boolean;
}

const FUEL_ORDER = ['gasolina', 'alcool', 'flex', 'diesel', 'hibrido', 'eletrico'];
const FUEL_LABEL: Record<string, string> = {
  gasolina: 'Gasolina',
  alcool: 'Álcool',
  flex: 'Flex',
  diesel: 'Diesel',
  hibrido: 'Híbrido',
  eletrico: 'Elétrico',
};

const KNOWN_FUELS = new Set(FUEL_ORDER);

function normalizeWord(w: string): string {
  return w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Combustível pela ULTIMA palavra do nome — mas so se for um combustivel
// conhecido. Algumas listas (ex: motos) trazem o nome so com o ano ("2026"),
// sem combustivel; nesses casos retornamos 'default' para nao virar um grupo
// por ano (bug: cada ano aparecia como um "combustivel").
function fuelKey(name: string): string {
  const last = normalizeWord(name.trim().split(/\s+/).pop() ?? '');
  return KNOWN_FUELS.has(last) ? last : 'default';
}

// "2025-1" -> 2025, "32000-5" -> 32000 (0km ordena no topo, descendente).
function yearNum(code: string): number {
  const n = parseInt(code.split('-')[0], 10);
  return Number.isFinite(n) ? n : 0;
}

// "2025 Gasolina" -> "2025"; "0 km Gasolina" -> "0 km"; "2026" -> "2026".
// So remove a ultima palavra se ela for um combustivel conhecido (senao, em
// listas sem combustivel, "0 km" viraria "0" e "2026" sumiria).
function yearOnlyLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = normalizeWord(parts[parts.length - 1] ?? '');
  if (KNOWN_FUELS.has(last)) parts.pop();
  return parts.join(' ') || name;
}

interface FuelGroup {
  key: string;
  label: string;
  years: SelectOption[]; // já ordenados do mais novo para o mais antigo
}

function buildFuelGroups(options: SelectOption[]): FuelGroup[] {
  const groups = new Map<string, SelectOption[]>();
  for (const o of options) {
    const k = fuelKey(o.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(o);
  }
  const known = FUEL_ORDER.filter((k) => groups.has(k));
  const unknown = [...groups.keys()].filter((k) => !FUEL_ORDER.includes(k)).sort();
  return [...known, ...unknown].map((k) => ({
    key: k,
    label: FUEL_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1),
    years: groups.get(k)!.slice().sort((a, b) => yearNum(b.code) - yearNum(a.code)),
  }));
}

export function YearFuelSelect({
  label,
  placeholder,
  options,
  value,
  onSelect,
  onClear,
  disabled = false,
  loading = false,
}: YearFuelSelectProps) {
  const [open, setOpen] = useState(false);
  const [fuel, setFuel] = useState<string | null>(null);

  const groups = useMemo(() => buildFuelGroups(options), [options]);
  const isDisabled = disabled || loading || options.length === 0;

  // Um unico combustivel (ex: motos, que so tem gasolina): nao faz sentido
  // pedir para escolher combustivel — vai direto para os anos.
  const singleFuel = groups.length === 1;
  const activeGroup = groups.find((g) => g.key === fuel) ?? null;

  function openModal() {
    if (isDisabled) return;
    // Com um combustivel so, abre direto na lista de anos. Se ja ha um ano
    // escolhido, abre na lista do combustivel dele; senao, no passo 1.
    setFuel(singleFuel ? groups[0].key : value ? fuelKey(value.name) : null);
    setOpen(true);
  }

  function pickYear(option: SelectOption) {
    onSelect(option);
    setOpen(false);
    setFuel(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, isDisabled && styles.fieldDisabled]}>
        <Pressable style={styles.fieldMain} onPress={openModal}>
          <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]} numberOfLines={1}>
            {loading ? 'Carregando…' : value ? value.name : placeholder}
          </Text>
        </Pressable>
        {value && onClear && !isDisabled ? (
          <Pressable onPress={onClear} hitSlop={10} style={styles.clearBtn}>
            <Text style={styles.clearText}>{'×'}</Text>
          </Pressable>
        ) : (
          <Text style={styles.chevron}>{'⌄'}</Text>
        )}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeGroup && !singleFuel ? activeGroup.label : label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>

          {!activeGroup ? (
            // ---- Passo 1: escolher o combustível ----
            <View style={styles.fuelWrap}>
              <Text style={styles.stepHint}>Escolha o combustível</Text>
              {groups.map((g) => (
                <Pressable
                  key={g.key}
                  style={({ pressed }) => [styles.fuelCard, pressed && styles.fuelCardPressed]}
                  onPress={() => setFuel(g.key)}
                >
                  <Text style={styles.fuelCardText}>{g.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            // ---- Passo 2: escolher o ano daquele combustível ----
            <>
              {!singleFuel ? (
                <Pressable onPress={() => setFuel(null)} style={styles.backRow} hitSlop={8}>
                  <Text style={styles.backText}>‹ Trocar combustível</Text>
                </Pressable>
              ) : null}
              <FlatList
                data={activeGroup.years}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable style={styles.option} onPress={() => pickYear(item)}>
                    <Text style={styles.optionText}>{yearOnlyLabel(item.name)}</Text>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    letterSpacing: type.label.letterSpacing,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    fontFamily: fontFamily.inter,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  clearBtn: { marginLeft: spacing.sm, paddingHorizontal: spacing.xs },
  clearText: { fontSize: 20, color: colors.textTertiary, fontFamily: fontFamily.inter },
  fieldText: { fontSize: type.body.fontSize, color: colors.textPrimary, flex: 1, fontFamily: fontFamily.inter },
  fieldPlaceholder: { color: colors.textTertiary, fontFamily: fontFamily.inter },
  chevron: { color: colors.textTertiary, fontSize: 18, marginLeft: spacing.sm, fontFamily: fontFamily.spaceGrotesk },
  modalRoot: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xxl },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: { fontSize: type.h1.fontSize, fontWeight: type.h1.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  modalClose: { fontSize: 15, fontWeight: '600', color: colors.ink, fontFamily: fontFamily.spaceGrotesk },
  fuelWrap: { paddingHorizontal: spacing.lg },
  stepHint: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginBottom: spacing.lg, fontFamily: fontFamily.inter },
  fuelCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  fuelCardPressed: { backgroundColor: colors.surfaceAlt, borderColor: colors.ink },
  fuelCardText: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    fontFamily: fontFamily.spaceGrotesk,
  },
  backRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backText: { fontSize: 15, fontWeight: '600', color: colors.ink, fontFamily: fontFamily.spaceGrotesk },
  option: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  optionText: { fontSize: type.body.fontSize, color: colors.textPrimary, fontFamily: fontFamily.inter },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
});
