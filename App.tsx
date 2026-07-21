import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import { AppHeader } from './src/components/AppHeader';
import { LaunchScreen } from './src/components/LaunchScreen';
import { TabBar, TabKey } from './src/components/TabBar';
import { AuthScreen } from './src/screens/AuthScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { VersionSelectionScreen } from './src/screens/VersionSelectionScreen';
import { EvaluationFormScreen } from './src/screens/EvaluationFormScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { EvaluationDetailScreen } from './src/screens/EvaluationDetailScreen';
import { OutcomeScreen } from './src/screens/OutcomeScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { ContactDetailScreen } from './src/screens/ContactDetailScreen';
import { colors } from './src/theme/tokens';
import { EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from './src/domain/types';
import { FipeVersionMatch } from './src/api/plateApi';
import { EvaluationWithOutcome } from './src/types/database';
import { ContactSummary } from './src/services/contactService';

// ============================================================
// FLAG DE AUTENTICAÇÃO
// false → app abre direto, sem tela de login (modo desenvolvimento)
// true  → exige login antes de acessar o app (modo produção)
// Mude para true quando o login via Google/email estiver configurado.
// ============================================================
const REQUIRE_AUTH = true;

type EvalStep = 'search' | 'version-select' | 'form' | 'result';
type HistoryStep = 'list' | 'detail' | 'outcome';
type ContactsStep = 'list' | 'detail';

export default function App() {
  const [session, setSession]     = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(REQUIRE_AUTH);
  const [showLaunch, setShowLaunch] = useState(true);

  useEffect(() => {
    if (!REQUIRE_AUTH) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Sessão disponível para o ResultScreen enviar no header de chamadas ao backend
  const sessionToken = session?.access_token ?? null;

  const [activeTab, setActiveTab] = useState<TabKey>('evaluate');

  // ---- Fluxo de avaliação ----
  const [evalStep, setEvalStep]   = useState<EvalStep>('search');
  const [kind, setKind]           = useState<VehicleKind>('cars');
  const [vehicle, setVehicle]     = useState<FipeVehicleInfo | null>(null);
  const [allMatches, setAllMatches] = useState<FipeVersionMatch[] | null>(null);
  const [evalInput, setEvalInput] = useState<EvaluationInput | null>(null);
  const [result, setResult]       = useState<EvaluationResult | null>(null);
  const [searchedPlate, setSearchedPlate] = useState<string | undefined>(undefined);

  // ---- Fluxo de histórico ----
  const [historyStep, setHistoryStep] = useState<HistoryStep>('list');
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithOutcome | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // ---- Fluxo de contatos ----
  const [contactsStep, setContactsStep] = useState<ContactsStep>('list');
  const [selectedContact, setSelectedContact] = useState<ContactSummary | null>(null);
  const [contactsRefresh, setContactsRefresh] = useState(0);

  const [privacyOpen, setPrivacyOpen] = useState(false);

  function handleContinueFromSearch(
    k: VehicleKind,
    v: FipeVehicleInfo,
    matches?: FipeVersionMatch[],
    plate?: string
  ) {
    setKind(k);
    setVehicle(v);
    setSearchedPlate(plate);
    if (matches && matches.length > 1) {
      setAllMatches(matches);
      setEvalStep('version-select');
    } else {
      setAllMatches(null);
      setEvalStep('form');
    }
  }

  function handleVersionConfirmed(match: FipeVersionMatch) {
    setVehicle(match.vehicle);
    setEvalStep('form');
  }

  function handleResult(evaluation: EvaluationResult, input: EvaluationInput) {
    setResult(evaluation);
    setEvalInput(input);
    setEvalStep('result');
  }

  function handleRestart() {
    setVehicle(null);
    setAllMatches(null);
    setResult(null);
    setEvalInput(null);
    setSearchedPlate(undefined);
    setEvalStep('search');
  }

  function handleSelectEvaluation(evaluation: EvaluationWithOutcome) {
    setSelectedEvaluation(evaluation);
    setHistoryStep('detail');
  }

  function handleOutcomeSaved() {
    setHistoryRefresh(n => n + 1);
    setContactsRefresh(n => n + 1); // desfecho pode vincular contato → atualiza a aba Contatos
    setHistoryStep('list');
    setSelectedEvaluation(null);
  }

  function handleSelectContact(summary: ContactSummary) {
    setSelectedContact(summary);
    setContactsStep('detail');
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (tab === 'history') {
      setHistoryStep('list');
      setSelectedEvaluation(null);
    }
    if (tab === 'contacts') {
      setContactsStep('list');
      setSelectedContact(null);
    }
  }

  // ---- Botão físico de voltar do Android (único listener) ----
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBack = () => {
      if (privacyOpen) { setPrivacyOpen(false); return true; }
      if (activeTab === 'history') {
        if (historyStep === 'outcome') { setHistoryStep('detail'); return true; }
        if (historyStep === 'detail')  { setHistoryStep('list');   return true; }
        return false;
      }
      if (activeTab === 'contacts') {
        if (contactsStep === 'detail') { setContactsStep('list'); return true; }
        return false;
      }
      if (evalStep === 'result')         { setEvalStep('form');                                     return true; }
      if (evalStep === 'form')           { setEvalStep(allMatches ? 'version-select' : 'search');   return true; }
      if (evalStep === 'version-select') { setEvalStep('search');                                   return true; }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [privacyOpen, activeTab, historyStep, contactsStep, evalStep, allMatches]);

  function getHeaderProps() {
    if (activeTab === 'history') {
      if (historyStep === 'detail')  return { title: 'Detalhes da avaliação', onBack: () => setHistoryStep('list') };
      if (historyStep === 'outcome') return { title: 'Registrar desfecho', onBack: () => setHistoryStep('detail') };
      return { title: 'Histórico' };
    }
    if (activeTab === 'contacts') {
      if (contactsStep === 'detail') return { title: 'Contato', onBack: () => setContactsStep('list') };
      return { title: 'Contatos', subtitle: 'Cotações por contato e grupo' };
    }
    switch (evalStep) {
      case 'search':         return { title: 'AutoValor', subtitle: 'Busca por marca, modelo e ano' };
      case 'version-select': return { title: 'Selecione a versão', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: () => setEvalStep('search') };
      case 'form':           return { title: 'Condições do veículo', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: () => setEvalStep(allMatches ? 'version-select' : 'search') };
      case 'result':         return { title: 'Resultado', onBack: () => setEvalStep('form') };
    }
  }

  // ---- Launch Screen (logo com fade/scale, sobre o mesmo fundo do splash nativo) ----
  if (showLaunch) {
    return (
      <SafeAreaProvider>
        <LaunchScreen onFinish={() => setShowLaunch(false)} />
      </SafeAreaProvider>
    );
  }

  // ---- Carregando sessão ----
  if (authLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingRoot}>
          <ActivityIndicator size="large" color={colors.ink} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // ---- Tela de login ----
  if (REQUIRE_AUTH && !session) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={['top']}>
          <StatusBar style="dark" />
          <AuthScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // ---- App principal ----
  const showTabBar =
    !(activeTab === 'history' && historyStep !== 'list') &&
    !(activeTab === 'contacts' && contactsStep !== 'list');

  return (
    <SafeAreaProvider>
      {/* Sem edges — AppHeader cuida do top, TabBar cuida do bottom */}
      <View style={styles.root}>
        <StatusBar style="light" />
        <AppHeader {...getHeaderProps()} onPrivacy={() => setPrivacyOpen(true)} />

        <View style={styles.content}>
          {activeTab === 'evaluate' && (
            <>
              {evalStep === 'search' && (
                <SearchScreen onContinue={handleContinueFromSearch} hasTabBar />
              )}
              {evalStep === 'version-select' && allMatches && (
                <VersionSelectionScreen kind={kind} allMatches={allMatches} onConfirm={handleVersionConfirmed} />
              )}
              {evalStep === 'form' && vehicle && (
                <EvaluationFormScreen kind={kind} vehicle={vehicle} onResult={handleResult} />
              )}
              {evalStep === 'result' && vehicle && result && evalInput && (
                <ResultScreen
                  kind={kind}
                  vehicle={vehicle}
                  input={evalInput}
                  result={result}
                  plate={searchedPlate}
                  sessionToken={sessionToken}
                  onRestart={handleRestart}
                  onSaved={() => setHistoryRefresh(n => n + 1)}
                />
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {historyStep === 'list' && (
                <HistoryScreen onSelectEvaluation={handleSelectEvaluation} refreshTrigger={historyRefresh} />
              )}
              {historyStep === 'detail' && selectedEvaluation && (
                <EvaluationDetailScreen evaluation={selectedEvaluation} onRegisterOutcome={() => setHistoryStep('outcome')} />
              )}
              {historyStep === 'outcome' && selectedEvaluation && (
                <OutcomeScreen evaluation={selectedEvaluation} onSaved={handleOutcomeSaved} />
              )}
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              {contactsStep === 'list' && (
                <ContactsScreen onSelectContact={handleSelectContact} refreshTrigger={contactsRefresh} />
              )}
              {contactsStep === 'detail' && selectedContact && (
                <ContactDetailScreen summary={selectedContact} />
              )}
            </>
          )}
        </View>

        {showTabBar && <TabBar active={activeTab} onChange={handleTabChange} />}

        <PrivacyScreen visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.background },
  loadingRoot: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  content:     { flex: 1 },
});
