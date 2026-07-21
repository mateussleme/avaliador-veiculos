import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  deleteEvaluation,
  fetchEvaluationsPage,
  searchEvaluations,
  HISTORY_PAGE_SIZE,
} from '../services/evaluationService';
import { supabase } from '../lib/supabase';
import { EvaluationWithOutcome } from '../types/database';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface HistoryScreenProps {
  onSelectEvaluation: (evaluation: EvaluationWithOutcome) => void;
  refreshTrigger?: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function OutcomeBadge({ evaluation }: { evaluation: EvaluationWithOutcome }) {
  const status = evaluation.outcome_status;
  if (!status) {
    return <View style={[styles.badge, styles.badgePending]}><Text style={[styles.badgeText, styles.badgePendingText]}>Aguardando decisão</Text></View>;
  }
  if (status === 'not_purchased') {
    return <View style={[styles.badge, styles.badgeDeclined]}><Text style={[styles.badgeText, styles.badgeDeclinedText]}>Não comprado</Text></View>;
  }
  if (status === 'negotiating') {
    return <View style={[styles.badge, styles.badgeNegotiating]}><Text style={[styles.badgeText, styles.badgeNegotiatingText]}>Em negociação</Text></View>;
  }
  if (evaluation.was_sold) {
    return <View style={[styles.badge, styles.badgeSold]}><Text style={[styles.badgeText, styles.badgeSoldText]}>Vendido</Text></View>;
  }
  return <View style={[styles.badge, styles.badgePurchased]}><Text style={[styles.badgeText, styles.badgePurchasedText]}>Em estoque</Text></View>;
}

// Linha da lista memoizada: só re-renderiza se a própria avaliação mudar.
// Sem isso, digitar na busca re-renderizava o conteúdo de todos os cards.
const EvaluationCard = memo(function EvaluationCard({
  item,
  onSelect,
  onLongPress,
}: {
  item: EvaluationWithOutcome;
  onSelect: (e: EvaluationWithOutcome) => void;
  onLongPress: (e: EvaluationWithOutcome) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={450}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardVehicle} numberOfLines={1}>{item.brand} {item.model}</Text>
          <Text style={styles.cardMeta}>
            {item.model_year} · {item.mileage_km.toLocaleString('pt-BR')} km{item.plate ? ` · ${item.plate}` : ''}
          </Text>
        </View>
        <View style={styles.cardPriceWrap}>
          <Text style={styles.cardPrice}>{formatCurrency(item.final_offer_value)}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <OutcomeBadge evaluation={item} />
        {item.outcome_status === 'purchased' && item.purchase_price ? (
          <Text style={styles.cardPurchasePrice}>Comprado por {formatCurrency(item.purchase_price)}</Text>
        ) : null}
        {item.outcome_status === 'negotiating' && item.negotiation_price ? (
          <Text style={styles.cardNegotiatingPrice}>Negociando {formatCurrency(item.negotiation_price)}</Text>
        ) : null}
        {item.was_sold && item.sale_price ? (
          <Text style={styles.cardSalePrice}>Vendido por {formatCurrency(item.sale_price)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
});

export function HistoryScreen({ onSelectEvaluation, refreshTrigger }: HistoryScreenProps) {
  const [evaluations, setEvaluations] = useState<EvaluationWithOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EvaluationWithOutcome[]>([]);
  const [searching, setSearching] = useState(false);

  const isSearching = debouncedQuery.trim().length > 0;

  // Ref com a lista atual: permite que loadMore/handleDelete sejam estáveis
  // (useCallback sem dependências da lista) e ainda leiam o estado atual.
  const evaluationsRef = useRef<EvaluationWithOutcome[]>([]);
  useEffect(() => { evaluationsRef.current = evaluations; }, [evaluations]);

  // ---- Primeira página (e recarga) ----
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEvaluations([]);
        setHasMore(false);
        return;
      }
      const first = await fetchEvaluationsPage(0);
      setEvaluations(first);
      setHasMore(first.length === HISTORY_PAGE_SIZE);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  // ---- Próximas páginas (rolagem infinita) ----
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isSearching || loading) return;
    setLoadingMore(true);
    try {
      const next = await fetchEvaluationsPage(evaluationsRef.current.length);
      if (next.length > 0) {
        setEvaluations((prev) => {
          // Evita duplicar se algo foi inserido entre uma página e outra.
          const seen = new Set(prev.map((e) => e.id));
          return [...prev, ...next.filter((e) => !seen.has(e.id))];
        });
      }
      setHasMore(next.length === HISTORY_PAGE_SIZE);
    } catch {
      setHasMore(false); // para de tentar; o pull-to-refresh recomeça
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isSearching, loading]);

  // ---- Busca: espera o usuário parar de digitar (350ms) ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ---- Busca no banco inteiro, não só nas páginas carregadas ----
  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!term) { setSearchResults([]); setSearching(false); return; }

    let active = true;
    setSearching(true);
    searchEvaluations(term)
      .then((rows) => { if (active) setSearchResults(rows); })
      .catch(() => { if (active) setSearchResults([]); })
      .finally(() => { if (active) setSearching(false); });
    return () => { active = false; };
  }, [debouncedQuery]);

  const visibleEvaluations = isSearching ? searchResults : evaluations;

  const handleDelete = useCallback(async (id: string) => {
    const previous = evaluationsRef.current;
    // Otimista nas duas listas (paginada e resultado de busca).
    setEvaluations(evs => evs.filter(e => e.id !== id));
    setSearchResults(rs => rs.filter(e => e.id !== id));
    try {
      await deleteEvaluation(id);
    } catch (err: any) {
      setEvaluations(previous); // desfaz se der erro
      Alert.alert('Erro ao apagar', err.message ?? 'Tente novamente.');
    }
  }, []);

  const confirmDelete = useCallback((item: EvaluationWithOutcome) => {
    Alert.alert(
      'Apagar avaliação?',
      `${item.brand} ${item.model} (${item.model_year}) será removido do histórico. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => handleDelete(item.id) },
      ]
    );
  }, [handleDelete]);

  const renderItem = useCallback(
    ({ item }: { item: EvaluationWithOutcome }) => (
      <EvaluationCard item={item} onSelect={onSelectEvaluation} onLongPress={confirmDelete} />
    ),
    [onSelectEvaluation, confirmDelete]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.ink} />
        <Text style={styles.loadingText}>Carregando histórico…</Text>
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

  if (evaluations.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma avaliação ainda</Text>
        <Text style={styles.emptyBody}>
          As avaliações que você salvar aparecem aqui.
          {'\n\n'}Use a aba Avaliar para consultar um veículo e salvar a avaliação.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por placa, marca ou modelo"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.searchClear} hitSlop={8}>
            <Text style={styles.searchClearText}>×</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={visibleEvaluations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} />}
        ListEmptyComponent={
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyText}>
              {searching
                ? 'Buscando…'
                : isSearching
                  ? `Nenhuma avaliação encontrada para "${debouncedQuery}".`
                  : 'Nenhuma avaliação no histórico ainda.'}
            </Text>
          </View>
        }
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : null
        }
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
  searchInput: {
    flex: 1,
    fontSize: type.body.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    fontFamily: fontFamily.inter,
  },
  searchClear: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  searchClearText: {
    fontSize: 20,
    lineHeight: 20,
    color: colors.textTertiary,
    fontFamily: fontFamily.inter,
  },
  footerLoading: { paddingVertical: spacing.lg, alignItems: 'center' },
  searchEmpty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  searchEmptyText: { fontSize: type.body.fontSize, color: colors.textSecondary, textAlign: 'center', fontFamily: fontFamily.inter },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
   loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: type.body.fontSize, fontFamily: fontFamily.inter },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.ink, borderRadius: radius.md },
  retryText: { color: colors.textOnInk, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  emptyTitle: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm, fontFamily: fontFamily.spaceGrotesk },
  emptyBody: { fontSize: type.body.fontSize, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, fontFamily: fontFamily.inter },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.sm },
  cardPressed: { opacity: 0.85 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1, paddingRight: spacing.sm },
  cardVehicle: { fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  cardMeta: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  cardPriceWrap: { alignItems: 'flex-end' },
  cardPrice: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.ink, fontFamily: fontFamily.spaceGrotesk },
  cardDate: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '600', fontFamily: fontFamily.inter },
  badgePending: { backgroundColor: colors.surfaceAlt },
  badgePendingText: { color: colors.textSecondary },
  badgeDeclined: { backgroundColor: colors.dangerBg },
  badgeDeclinedText: { color: colors.danger },
  badgePurchased: { backgroundColor: colors.cautionBg },
  badgePurchasedText: { color: colors.caution },
  badgeSold: { backgroundColor: colors.goodBg },
  badgeSoldText: { color: colors.good },
  badgeNegotiating: { backgroundColor: colors.infoBg },
  badgeNegotiatingText: { color: colors.info },
  cardPurchasePrice: { fontSize: type.caption.fontSize, color: colors.caution, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  cardNegotiatingPrice: { fontSize: type.caption.fontSize, color: colors.info, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  cardSalePrice: { fontSize: type.caption.fontSize, color: colors.good, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
});
