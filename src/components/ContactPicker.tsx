import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Contact } from '../types/database';
import { createContact, fetchContacts, findDuplicateContact } from '../services/contactService';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

// Seletor de contato para vincular ao desfecho: escolhe um contato já
// cadastrado ou cria um novo (nome + grupo + telefone) na hora.

interface ContactPickerProps {
  selected: Contact | null;
  onChange: (contact: Contact | null) => void;
}

function contactSubtitle(c: Contact): string {
  return [c.company_group, c.phone].filter(Boolean).join(' · ');
}

export function ContactPicker({ selected, onChange }: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Contato existente parecido com o que está sendo cadastrado (mesmo telefone
  // ou mesmo nome). Enquanto estiver preenchido, pedimos confirmação.
  const [duplicate, setDuplicate] = useState<Contact | null>(null);

  function openModal() {
    setOpen(true);
    setCreating(false);
    setQuery('');
    setError(null);
    setDuplicate(null);
    setLoading(true);
    fetchContacts()
      .then(setContacts)
      .catch((e) => setError(e.message ?? 'Erro ao carregar contatos.'))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company_group ?? '').toLowerCase().includes(q)
    );
  }, [contacts, query]);

  function pick(contact: Contact | null) {
    onChange(contact);
    setOpen(false);
  }

  async function handleCreate(force = false) {
    if (!newName.trim()) {
      setError('Informe ao menos o nome do contato.');
      return;
    }

    // Evita cadastrar o mesmo contato duas vezes (o que fragmentaria os
    // relatórios por contato/grupo). Só bloqueia na primeira tentativa.
    if (!force) {
      const dup = findDuplicateContact(contacts, { name: newName, phone: newPhone });
      if (dup) {
        setDuplicate(dup);
        setError(null);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const contact = await createContact({
        name: newName,
        companyGroup: newGroup,
        phone: newPhone,
      });
      setNewName('');
      setNewGroup('');
      setNewPhone('');
      pick(contact);
    } catch (e: any) {
      setError(e.message ?? 'Não foi possível salvar o contato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <View style={styles.field}>
        <Pressable style={styles.fieldMain} onPress={openModal}>
          <Text style={[styles.fieldText, !selected && styles.fieldPlaceholder]} numberOfLines={1}>
            {selected ? selected.name : 'Nenhum contato vinculado'}
          </Text>
          {selected && contactSubtitle(selected) ? (
            <Text style={styles.fieldSub} numberOfLines={1}>{contactSubtitle(selected)}</Text>
          ) : null}
        </Pressable>
        {selected ? (
          <Pressable onPress={() => onChange(null)} hitSlop={10} style={styles.clearBtn}>
            <Text style={styles.clearText}>{'×'}</Text>
          </Pressable>
        ) : (
          <Text style={styles.chevron}>{'⌄'}</Text>
        )}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{creating ? 'Novo contato' : 'Contato'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>

          {creating ? (
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Nome do contato</Text>
              <TextInput
                value={newName}
                onChangeText={(t) => { setNewName(t); setDuplicate(null); }}
                placeholder="Ex: Mateus"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                autoFocus
              />
              <Text style={styles.inputLabel}>Grupo / empresa</Text>
              <TextInput
                value={newGroup}
                onChangeText={setNewGroup}
                placeholder="Ex: Auto Nation"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                value={newPhone}
                onChangeText={(t) => { setNewPhone(t); setDuplicate(null); }}
                placeholder="Ex: (11) 9 0000-0000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                style={styles.input}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {duplicate ? (
                <View style={styles.dupBox}>
                  <Text style={styles.dupTitle}>Esse contato já existe</Text>
                  <Text style={styles.dupName}>{duplicate.name}</Text>
                  {contactSubtitle(duplicate) ? (
                    <Text style={styles.dupSub}>{contactSubtitle(duplicate)}</Text>
                  ) : null}
                  <Text style={styles.dupHint}>
                    Usar o contato existente mantém todas as cotações dele juntas no relatório.
                  </Text>
                  <Pressable
                    onPress={() => pick(duplicate)}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.primaryBtnText}>Usar este contato</Text>
                  </Pressable>
                  <Pressable onPress={() => handleCreate(true)} style={styles.linkBtn} hitSlop={8}>
                    <Text style={styles.linkText}>Cadastrar mesmo assim</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleCreate()}
                  disabled={saving}
                  style={({ pressed }) => [styles.primaryBtn, saving && styles.disabled, pressed && styles.pressed]}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.textOnInk} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Salvar e vincular</Text>
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={() => { setCreating(false); setError(null); setDuplicate(null); }}
                style={styles.linkBtn}
                hitSlop={8}
              >
                <Text style={styles.linkText}>Voltar para a lista</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por nome ou grupo"
                placeholderTextColor={colors.textTertiary}
                style={styles.search}
              />

              <View style={styles.actionsRow}>
                <Pressable onPress={() => { setCreating(true); setError(null); setDuplicate(null); }} style={styles.newBtn}>
                  <Text style={styles.newBtnText}>+ Novo contato</Text>
                </Pressable>
                <Pressable onPress={() => pick(null)} style={styles.noneBtn}>
                  <Text style={styles.noneBtnText}>Sem contato</Text>
                </Pressable>
              </View>

              {loading ? (
                <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable style={styles.option} onPress={() => pick(item)}>
                      <Text style={styles.optionName}>{item.name}</Text>
                      {contactSubtitle(item) ? (
                        <Text style={styles.optionSub}>{contactSubtitle(item)}</Text>
                      ) : null}
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      Nenhum contato ainda. Toque em "Novo contato" para cadastrar.
                    </Text>
                  }
                />
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldMain: { flex: 1 },
  fieldText: { fontSize: type.body.fontSize, color: colors.textPrimary, fontFamily: fontFamily.inter },
  fieldSub: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  fieldPlaceholder: { color: colors.textTertiary },
  clearBtn: { marginLeft: spacing.sm, paddingHorizontal: spacing.xs },
  clearText: { fontSize: 20, color: colors.textTertiary, fontFamily: fontFamily.inter },
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
  actionsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  newBtn: { flex: 1, backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  newBtnText: { color: colors.textOnInk, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  noneBtn: { flex: 1, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  noneBtnText: { color: colors.textSecondary, fontWeight: '600', fontFamily: fontFamily.inter },
  center: { paddingTop: spacing.xxl, alignItems: 'center' },
  option: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  optionName: { fontSize: type.body.fontSize, color: colors.textPrimary, fontFamily: fontFamily.inter },
  optionSub: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
  emptyText: { textAlign: 'center', color: colors.textTertiary, marginTop: spacing.xxl, paddingHorizontal: spacing.xl, fontSize: type.body.fontSize, fontFamily: fontFamily.inter },
  form: { paddingHorizontal: spacing.lg, paddingBottom: 320 },
  inputLabel: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    letterSpacing: type.label.letterSpacing,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    fontFamily: fontFamily.inter,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    fontFamily: fontFamily.inter,
  },
  errorText: { color: colors.danger, fontSize: type.body.fontSize, marginTop: spacing.md, paddingHorizontal: spacing.lg, fontFamily: fontFamily.inter },
  dupBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.cautionBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.caution,
  },
  dupTitle: {
    fontSize: type.caption.fontSize,
    fontWeight: '700',
    color: colors.caution,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    fontFamily: fontFamily.inter,
  },
  dupName: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  dupSub: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2, fontFamily: fontFamily.inter },
  dupHint: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 16, fontFamily: fontFamily.inter },
  primaryBtn: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg, minHeight: 50, justifyContent: 'center' },
  primaryBtnText: { color: colors.textOnInk, fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, fontFamily: fontFamily.spaceGrotesk },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.md },
  linkText: { color: colors.ink, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
});
