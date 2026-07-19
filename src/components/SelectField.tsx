import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

export interface SelectOption {
  code: string;
  name: string;
  // Cabeçalho de grupo (não selecionável) — usado para agrupar os anos por
  // combustível. Renderiza como título de seção em vez de item clicável.
  header?: boolean;
  // Texto alternativo a mostrar na lista (ex: só "2025" sob o cabeçalho
  // "Gasolina"). Se ausente, usa name. O valor selecionado sempre mostra name.
  displayName?: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: SelectOption | null;
  onSelect: (option: SelectOption) => void;
  onClear?: () => void; // se fornecido e houver valor, mostra "×" para limpar
  disabled?: boolean;
  loading?: boolean;
}

export function SelectField({
  label,
  placeholder,
  options,
  value,
  onSelect,
  onClear,
  disabled = false,
  loading = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    // Ao buscar, esconde os cabeçalhos de grupo e mostra só os itens que batem.
    return options.filter((o) => !o.header && o.name.toLowerCase().includes(q));
  }, [options, query]);

  const isDisabled = disabled || loading || options.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, isDisabled && styles.fieldDisabled]}>
        <Pressable style={styles.fieldMain} onPress={() => !isDisabled && setOpen(true)}>
          <Text
            style={[styles.fieldText, !value && styles.fieldPlaceholder]}
            numberOfLines={1}
          >
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
            <Text style={styles.modalTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar..."
            placeholderTextColor={colors.textTertiary}
            style={styles.search}
            autoFocus
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) =>
              item.header ? (
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>{item.name}</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.displayName ?? item.name}</Text>
                </Pressable>
              )
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum resultado para essa busca.</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
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
  fieldDisabled: {
    opacity: 0.5,
  },
  fieldMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  clearText: {
    fontSize: 20,
    color: colors.textTertiary,
    fontFamily: fontFamily.inter,
  },
  fieldText: {
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fontFamily.inter,
  },
  fieldPlaceholder: {
    color: colors.textTertiary,
    fontFamily: fontFamily.inter,
  },
  chevron: {
    color: colors.textTertiary,
    fontSize: 18,
    marginLeft: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: type.h1.fontSize,
    fontWeight: type.h1.fontWeight,
    color: colors.textPrimary,
    fontFamily: fontFamily.spaceGrotesk,
  },
  modalClose: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: fontFamily.spaceGrotesk,
  },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    fontFamily: fontFamily.inter,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  optionText: {
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    fontFamily: fontFamily.inter,
  },
  groupHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  groupHeaderText: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    letterSpacing: type.label.letterSpacing,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontFamily: fontFamily.inter,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xxl,
    fontSize: type.body.fontSize,
    fontFamily: fontFamily.inter,
  },
});
