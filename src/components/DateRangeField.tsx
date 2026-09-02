import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DateRange, EMPTY_RANGE, formatRangeLabel, hasRange } from '../domain/dateFilter';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface DateRangeFieldProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(day: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const t = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  return t > from.getTime() && t < to.getTime();
}

// Campo compacto com icone de calendario. Ao tocar, abre um calendario em modal
// para escolher inicio e fim. JS puro (sem dependencia nativa) -> funciona no
// Android e na web (PWA) sem build nativo.
export function DateRangeField({ value, onChange }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const base = value.from ?? value.to ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  function openPicker() {
    setDraft(value);
    const base = value.from ?? value.to ?? new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  }

  function pickDay(day: Date) {
    setDraft((cur) => {
      // Sem inicio, ou intervalo ja completo -> comeca de novo.
      if (!cur.from || (cur.from && cur.to)) return { from: day, to: null };
      // Segundo toque antes do inicio -> inverte.
      if (day.getTime() < cur.from.getTime()) return { from: day, to: cur.from };
      return { from: cur.from, to: day };
    });
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clearAndApply() {
    setDraft(EMPTY_RANGE);
    onChange(EMPTY_RANGE);
    setOpen(false);
  }

  const active = hasRange(value);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <Pressable onPress={openPicker} style={[styles.field, active && styles.fieldActive]}>
        <Feather name="calendar" size={16} color={active ? colors.ink : colors.textSecondary} />
        <Text style={[styles.fieldText, active && styles.fieldTextActive]} numberOfLines={1}>
          {formatRangeLabel(value)}
        </Text>
        {active ? (
          <Pressable
            onPress={() => onChange(EMPTY_RANGE)}
            hitSlop={10}
            style={styles.clearBtn}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : (
          <Feather name="chevron-down" size={16} color={colors.textTertiary} />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={() => {}}>
            {/* Cabecalho: mes/ano com navegacao */}
            <View style={styles.calHeader}>
              <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} hitSlop={8} style={styles.navBtn}>
                <Feather name="chevron-left" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.calTitle}>{MONTHS[month]} {year}</Text>
              <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))} hitSlop={8} style={styles.navBtn}>
                <Feather name="chevron-right" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={styles.weekLabel}>{w}</Text>
              ))}
            </View>

            {/* Grade de dias */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={i} style={styles.cell} />;
                const isEndpoint = sameDay(day, draft.from) || sameDay(day, draft.to);
                const inRange = isBetween(day, draft.from, draft.to);
                return (
                  <Pressable key={i} style={styles.cell} onPress={() => pickDay(day)}>
                    <View style={[styles.dayInner, inRange && styles.dayInRange, isEndpoint && styles.dayEndpoint]}>
                      <Text style={[styles.dayText, isEndpoint && styles.dayTextEndpoint]}>{day.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.hint}>{formatRangeLabel(draft)}</Text>

            {/* Acoes */}
            <View style={styles.actions}>
              <Pressable onPress={clearAndApply} style={styles.actionGhost}>
                <Text style={styles.actionGhostText}>Limpar</Text>
              </Pressable>
              <Pressable onPress={apply} style={styles.actionPrimary}>
                <Text style={styles.actionPrimaryText}>Aplicar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldActive: { borderColor: colors.ink },
  fieldText: { flex: 1, fontSize: type.body.fontSize, color: colors.textSecondary, fontFamily: fontFamily.inter },
  fieldTextActive: { color: colors.textPrimary, fontWeight: '600' },
  clearBtn: { padding: 2 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  navBtn: { padding: spacing.xs },
  calTitle: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: type.caption.fontSize, color: colors.textTertiary, fontFamily: fontFamily.inter, marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayInRange: { backgroundColor: colors.infoBg, borderRadius: 0, width: '100%' },
  dayEndpoint: { backgroundColor: colors.ink, borderRadius: 18, width: 36 },
  dayText: { fontSize: type.body.fontSize, color: colors.textPrimary, fontFamily: fontFamily.inter },
  dayTextEndpoint: { color: colors.textOnInk, fontWeight: '700' },
  hint: { textAlign: 'center', marginTop: spacing.md, fontSize: type.caption.fontSize, color: colors.textSecondary, fontFamily: fontFamily.inter },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionGhost: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  actionGhostText: { fontSize: type.body.fontSize, fontWeight: '600', color: colors.textSecondary, fontFamily: fontFamily.spaceGrotesk },
  actionPrimary: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center' },
  actionPrimaryText: { fontSize: type.body.fontSize, fontWeight: '600', color: colors.textOnInk, fontFamily: fontFamily.spaceGrotesk },
});
