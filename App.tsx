import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from 'react-native';
import * as Font from 'expo-font';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import { AppHeader } from './src/components/AppHeader';
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
import { colors } from './src/theme/tokens';
import { EvaluationInput, EvaluationResult, FipeVehicleInfo, VehicleKind } from './src/domain/types';
import { FipeVersionMatch } from './src/api/plateApi';
import { EvaluationWithOutcome } from './src/types/database';

// ============================================================
// FLAG DE AUTENTICAÇÃO
// false → app abre direto, sem tela de login (modo desenvolvimento)
// true  → exige login antes de acessar o app (modo produção)
// Mude para true quando o login via Google/email estiver configurado.
// ============================================================
const REQUIRE_AUTH = true;

type EvalStep = 'search' | 'version-select' | 'form' | 'result';
type HistoryStep = 'list' | 'detail' | 'outcome';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(REQUIRE_AUTH);
  // ---- Carregamento de fontes customizadas ----
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Inter — corpo de texto, labels, dados
          Inter: require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
          'Inter-ExtraBold': require('./assets/fonts/Inter-ExtraBold.ttf'),
          // Inter Display — textos de alto impacto visual
          'Inter Display': require('./assets/fonts/InterDisplay-Regular.ttf'),
          'Inter Display-Medium': require('./assets/fonts/InterDisplay-Medium.ttf'),
          'Inter Display-SemiBold': require('./assets/fonts/InterDisplay-SemiBold.ttf'),
          'Inter Display-Bold': require('./assets/fonts/InterDisplay-Bold.ttf'),
          'Inter Display-ExtraBold': require('./assets/fonts/InterDisplay-ExtraBold.ttf'),
          // Space Grotesk — títulos, destaques, valores de preço
          SpaceGrotesk: require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
          'SpaceGrotesk-Light': require('./assets/fonts/SpaceGrotesk-Light.ttf'),
          'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
          'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (err) {
        console.error('Erro ao carregar fontes:', err);
        setFontsLoaded(true); // não travar o app se a fonte falhar
      }
    }
    loadFonts();
  }, []);


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
  const [evalStep, setEvalStep] = useState<EvalStep>('search');
  const [kind, setKind] = useState<VehicleKind>('cars');
  const [vehicle, setVehicle] = useState<FipeVehicleInfo | null>(null);
  const [allMatches, setAllMatches] = useState<FipeVersionMatch[] | null>(null);
  const [evalInput, setEvalInput] = useState<EvaluationInput | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [searchedPlate, setSearchedPlate] = useState<string | undefined>(undefined);

  // ---- Fluxo de histórico ----
  const [historyStep, setHistoryStep] = useState<HistoryStep>('list');
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithOutcome | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

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
    setHistoryStep('list');
    setSelectedEvaluation(null);
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (tab === 'history') {
      setHistoryStep('list');
      setSelectedEvaluation(null);
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
      if (evalStep === 'result')         { setEvalStep('form');                                     return true; }
      if (evalStep === 'form')           { setEvalStep(allMatches ? 'version-select' : 'search');   return true; }
      if (evalStep === 'version-select') { setEvalStep('search');                                   return true; }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [privacyOpen, activeTab, historyStep, evalStep, allMatches]);

  function getHeaderProps() {
    if (activeTab === 'history') {
      if (historyStep === 'detail')  return { title: 'Detalhes da avaliação', onBack: () => setHistoryStep('list') };
      if (historyStep === 'outcome') return { title: 'Registrar desfecho', onBack: () => setHistoryStep('detail') };
      return { title: 'Histórico' };
    }
    switch (evalStep) {
      case 'search':         return { title: 'AutoValor', subtitle: 'Busca por marca, modelo e ano' };
      case 'version-select': return { title: 'Selecione a versão', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: () => setEvalStep('search') };
      case 'form':           return { title: 'Condições do veículo', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: () => setEvalStep(allMatches ? 'version-select' : 'search') };
      case 'result':         return { title: 'Resultado', onBack: () => setEvalStep('form') };
    }
  }
// ---- Carregando fontes ----
  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingRoot}>
          <ActivityIndicator size="large" color={colors.ink} />
        </SafeAreaView>
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
  const showTabBar = !(activeTab === 'history' && historyStep !== 'list');

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
