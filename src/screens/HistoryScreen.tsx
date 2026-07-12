import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deleteEvaluation, fetchEvaluations } from '../services/evaluationService';
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
  if (evaluation.was_purchased === null || evaluation.was_purchased === undefined) {
    return <View style={[styles.badge, styles.badgePending]}><Text style={[styles.badgeText, styles.badgePendingText]}>Aguardando decisão</Text></View>;
  }
  if (!evaluation.was_purchased) {
    return <View style={[styles.badge, styles.badgeDeclined]}><Text style={[styles.badgeText, styles.badgeDeclinedText]}>Não comprado</Text></View>;
  }
  if (evaluation.was_sold) {
    return <View style={[styles.badge, styles.badgeSold]}><Text style={[styles.badgeText, styles.badgeSoldText]}>Vendido</Text></View>;
  }
  return <View style={[styles.badge, styles.badgePurchased]}><Text style={[styles.badgeText, styles.badgePurchasedText]}>Em estoque</Text></View>;
}

export function HistoryScreen({ onSelectEvaluation, refreshTrigger }: HistoryScreenProps) {
  const [evaluations, setEvaluations] = useState<EvaluationWithOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      // Verifica se há sessão ativa antes de tentar buscar do banco
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEvaluations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setEvaluations(await fetchEvaluations(100));
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  async function handleDelete(id: string) {
    const previous = evaluations;
    setEvaluations(evs => evs.filter(e => e.id !== id)); // otimista
    try {
      await deleteEvaluation(id);
    } catch (err: any) {
      setEvaluations(previous); // desfaz se der erro
      Alert.alert('Erro ao apagar', err.message ?? 'Tente novamente.');
    }
  }

  function confirmDelete(item: EvaluationWithOutcome) {
    Alert.alert(
      'Apagar avaliação?',
      `${item.brand} ${item.model} (${item.model_year}) será removido do histórico. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => handleDelete(item.id) },
      ]
    );
  }

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
        <Text style={styles.emptyTitle}>Histórico indisponível</Text>
        <Text style={styles.emptyBody}>
          O histórico e o registro de desfechos ficam disponíveis após ativar o login.
          {'\n\n'}Por enquanto, use a aba Avaliar para consultar veículos.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={evaluations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelectEvaluation(item)}
          onLongPress={() => confirmDelete(item)}
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
              <Text style={styles.cardPrice}>{formatCurrency(item.estimated_value)}</Text>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <OutcomeBadge evaluation={item} />
            {item.was_purchased && item.purchase_price ? (
              <Text style={styles.cardPurchasePrice}>Comprado por {formatCurrency(item.purchase_price)}</Text>
            ) : null}
            {item.was_sold && item.sale_price ? (
              <Text style={styles.cardSalePrice}>Vendido por {formatCurrency(item.sale_price)}</Text>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  cardPurchasePrice: { fontSize: type.caption.fontSize, color: colors.caution, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  cardSalePrice: { fontSize: type.caption.fontSize, color: colors.good, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
});
