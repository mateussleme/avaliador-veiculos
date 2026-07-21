import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { ContactSummary, fetchContactSummaries } from '../services/contactService';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface ContactsScreenProps {
  onSelectContact: (summary: ContactSummary) => void;
  refreshTrigger?: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// Card de contato memoizado: digitar na busca não re-renderiza todos.
const ContactCard = memo(function ContactCard({
  item,
  onSelect,
}: {
  item: ContactSummary;
  onSelect: (s: ContactSummary) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardName} numberOfLines={1}>{item.contact.name}</Text>
          {item.contact.company_group ? (
            <Text style={styles.cardGroup} numberOfLines={1}>{item.contact.company_group}</Text>
          ) : null}
        </View>
        <View style={styles.conversionWrap}>
          <Text style={styles.conversionValue}>{Math.round(item.conversionRate * 100)}%</Text>
          <Text style={styles.conversionLabel}>conversão</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.quoted}</Text>
          <Text style={styles.statLabel}>cotados</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.good }]}>{item.purchased}</Text>
          <Text style={styles.statLabel}>comprados</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.info }]}>{item.negotiating}</Text>
          <Text style={styles.statLabel}>negociação</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{item.notPurchased}</Text>
          <Text style={styles.statLabel}>não</Text>
        </View>
      </View>

      <View style={styles.valuesRow}>
        <Text style={styles.valueText}>Cotado: {formatCurrency(item.totalQuotedValue)}</Text>
        <Text style={styles.valueText}>Pago: {formatCurrency(item.totalPaidValue)}</Text>
      </View>
    </Pressable>
  );
});

export function ContactsScreen({ onSelectContact, refreshTrigger }: ContactsScreenProps) {
  const [summaries, setSummaries] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSummaries([]); return; }
      setSummaries(await fetchContactSummaries());
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar contatos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter(
      (s) =>
        s.contact.name.toLowerCase().includes(q) ||
        (s.contact.company_group ?? '').toLowerCase().includes(q)
    );
  }, [summaries, query]);

  const renderItem = useCallback(
    ({ item }: { item: ContactSummary }) => <ContactCard item={item} onSelect={onSelectContact} />,
    [onSelectContact]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.ink} />
        <Text style={styles.loadingText}>Carregando contatos…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => load()} style={styles.retryButton}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (summaries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhum contato ainda</Text>
        <Text style={styles.emptyBody}>
          Ao registrar o desfecho de uma avaliação, vincule o contato (nome, grupo e telefone).
          {'\n\n'}Depois eles aparecem aqui, e você pode ver tudo que cotou com cada um.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por contato ou grupo"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} style={styles.searchClear} hitSlop={8}>
            <Text style={styles.searchClearText}>×</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.contact.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} />}
        ListEmptyComponent={
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyText}>Nenhum contato encontrado para "{query}".</Text>
          </View>
        }
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: type.body.fontSize, color: colors.textPrimary, paddingVertical: spacing.sm + 2, fontFamily: fontFamily.inter },
  searchClear: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  searchClearText: { fontSize: 20, lineHeight: 20, color: colors.textTertiary, fontFamily: fontFamily.inter },
  searchEmpty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  searchEmptyText: { fontSize: type.body.fontSize, color: colors.textSecondary, textAlign: 'center', fontFamily: fontFamily.inter },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: type.body.fontSize, fontFamily: fontFamily.inter },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md, fontFamily: fontFamily.inter },
  retryButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.ink, borderRadius: radius.md },
  retryText: { color: colors.textOnInk, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  emptyTitle: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm, fontFamily: fontFamily.spaceGrotesk },
  emptyBody: { fontSize: type.body.fontSize, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, fontFamily: fontFamily.inter },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.sm },
  cardPressed: { opacity: 0.85 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1, paddingRight: spacing.sm },
  cardName: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  cardGroup: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  conversionWrap: { alignItems: 'flex-end' },
  conversionValue: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.ink, fontFamily: fontFamily.spaceGrotesk },
  conversionLabel: { fontSize: type.caption.fontSize, color: colors.textTertiary, fontFamily: fontFamily.inter },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.md },
  stat: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
  statValue: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  statLabel: { fontSize: type.caption.fontSize, color: colors.textTertiary, textAlign: 'center', fontFamily: fontFamily.inter },
  valuesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  valueText: { fontSize: type.caption.fontSize, color: colors.textSecondary, fontFamily: fontFamily.inter },
});
