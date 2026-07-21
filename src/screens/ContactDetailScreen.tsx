import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SectionLabel } from '../components/Card';
import { ContactSummary, fetchEvaluationsByContact } from '../services/contactService';
import { EvaluationWithOutcome } from '../types/database';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

interface ContactDetailScreenProps {
  summary: ContactSummary;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function OutcomeBadge({ ev }: { ev: EvaluationWithOutcome }) {
  const status = ev.outcome_status;
  if (!status) {
    return <View style={[styles.badge, styles.badgePending]}><Text style={[styles.badgeText, styles.badgePendingText]}>Sem decisão</Text></View>;
  }
  if (status === 'not_purchased') {
    return <View style={[styles.badge, styles.badgeDeclined]}><Text style={[styles.badgeText, styles.badgeDeclinedText]}>Não comprado</Text></View>;
  }
  if (status === 'negotiating') {
    return <View style={[styles.badge, styles.badgeNegotiating]}><Text style={[styles.badgeText, styles.badgeNegotiatingText]}>Em negociação</Text></View>;
  }
  return <View style={[styles.badge, styles.badgePurchased]}><Text style={[styles.badgeText, styles.badgePurchasedText]}>Comprado</Text></View>;
}

export function ContactDetailScreen({ summary }: ContactDetailScreenProps) {
  const { contact } = summary;

  const [evaluations, setEvaluations] = useState<EvaluationWithOutcome[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingCars(true);
    fetchEvaluationsByContact(contact.id)
      .then((evs) => { if (active) setEvaluations(evs); })
      .catch(() => { if (active) setEvaluations([]); })
      .finally(() => { if (active) setLoadingCars(false); });
    return () => { active = false; };
  }, [contact.id]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.name}>{contact.name}</Text>
      {(contact.company_group || contact.phone) ? (
        <Text style={styles.meta}>
          {[contact.company_group, contact.phone].filter(Boolean).join(' · ')}
        </Text>
      ) : null}

      <Card style={styles.card}>
        <SectionLabel>Resumo</SectionLabel>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.quoted}</Text>
            <Text style={styles.statLabel}>cotados</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.good }]}>{summary.purchased}</Text>
            <Text style={styles.statLabel}>comprados</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.info }]}>{summary.negotiating}</Text>
            <Text style={styles.statLabel}>negociação</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{summary.notPurchased}</Text>
            <Text style={styles.statLabel}>não comprados</Text>
          </View>
        </View>

        <View style={styles.valuesBox}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Valor cotado</Text>
            <Text style={styles.valueNum}>{formatCurrency(summary.totalQuotedValue)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Valor pago</Text>
            <Text style={styles.valueNum}>{formatCurrency(summary.totalPaidValue)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Em negociação</Text>
            <Text style={styles.valueNum}>{formatCurrency(summary.totalNegotiatingValue)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Conversão</Text>
            <Text style={styles.valueNum}>{Math.round(summary.conversionRate * 100)}%</Text>
          </View>
        </View>
      </Card>

      <SectionLabel>Carros cotados</SectionLabel>
      {loadingCars ? (
        <View style={styles.loadingCars}><ActivityIndicator color={colors.ink} /></View>
      ) : null}
      {evaluations.map((ev) => (
        <Card key={ev.id} style={styles.carCard}>
          <View style={styles.carHeader}>
            <View style={styles.carTitleWrap}>
              <Text style={styles.carName} numberOfLines={1}>{ev.brand} {ev.model}</Text>
              <Text style={styles.carMeta}>
                {ev.model_year}{ev.plate ? ` · ${ev.plate}` : ''} · {formatDate(ev.created_at)}
              </Text>
            </View>
            <Text style={styles.carPrice}>{formatCurrency(ev.final_offer_value)}</Text>
          </View>
          <View style={styles.carFooter}>
            <OutcomeBadge ev={ev} />
            {ev.outcome_status === 'purchased' && ev.purchase_price ? (
              <Text style={styles.carPaid}>Pago {formatCurrency(ev.purchase_price)}</Text>
            ) : null}
            {ev.outcome_status === 'negotiating' && ev.negotiation_price ? (
              <Text style={styles.carNegotiating}>Negociando {formatCurrency(ev.negotiation_price)}</Text>
            ) : null}
          </View>
        </Card>
      ))}

      {!loadingCars && evaluations.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum carro cotado com esse contato ainda.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  name: { fontSize: type.h1.fontSize, fontWeight: type.h1.fontWeight, color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  meta: { fontSize: type.caption.fontSize, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg, fontFamily: fontFamily.inter },
  card: { marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.sm },
  stat: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
  statValue: { fontSize: type.h2.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  statLabel: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, textAlign: 'center', fontFamily: fontFamily.inter },
  valuesBox: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  valueLabel: { fontSize: type.body.fontSize, color: colors.textSecondary, fontFamily: fontFamily.inter },
  valueNum: { fontSize: type.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  carCard: { marginBottom: spacing.sm },
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  carTitleWrap: { flex: 1, paddingRight: spacing.sm },
  carName: { fontSize: type.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: fontFamily.spaceGrotesk },
  carMeta: { fontSize: type.caption.fontSize, color: colors.textTertiary, marginTop: 2, fontFamily: fontFamily.inter },
  carPrice: { fontSize: type.body.fontSize, fontWeight: '700', color: colors.ink, fontFamily: fontFamily.spaceGrotesk },
  carFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  carPaid: { fontSize: type.caption.fontSize, color: colors.caution, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  carNegotiating: { fontSize: type.caption.fontSize, color: colors.info, fontWeight: '600', fontFamily: fontFamily.spaceGrotesk },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '600', fontFamily: fontFamily.inter },
  badgePending: { backgroundColor: colors.surfaceAlt },
  badgePendingText: { color: colors.textSecondary },
  badgeDeclined: { backgroundColor: colors.dangerBg },
  badgeDeclinedText: { color: colors.danger },
  badgePurchased: { backgroundColor: colors.goodBg },
  badgePurchasedText: { color: colors.good },
  badgeNegotiating: { backgroundColor: colors.infoBg },
  badgeNegotiatingText: { color: colors.info },
  emptyText: { fontSize: type.body.fontSize, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg, fontFamily: fontFamily.inter },
  loadingCars: { paddingVertical: spacing.lg, alignItems: 'center' },
});
