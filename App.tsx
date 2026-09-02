import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, BackHandler, Platform, StyleSheet, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { useFonts } from 'expo-font';
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
import { evaluateVehicle, recomputeForNewVehicle } from './src/domain/evaluationEngine';
import { FipeVersionMatch, fetchVehicleByPlate } from './src/api/plateApi';
import { parsePlate } from './src/domain/plateValidation';
import { updateEvaluationVehicle } from './src/services/evaluationService';
import { EvaluationWithOutcome } from './src/types/database';
import { ContactSummary } from './src/services/contactService';
import { loadAndApplyEvaluationParams } from './src/services/evaluationParams';

// O Sentry e inicializado em index.ts (src/lib/sentry.ts), com redacao de PII.
// Nao adicionar Sentry.init aqui: init duplicado sobrescreve a configuracao de
// privacidade e o wrap duplicado quebra o error boundary raiz.

// ============================================================
// FLAG DE AUTENTICAÇÃO
// false → app abre direto, sem tela de login (modo desenvolvimento)
// true  → exige login antes de acessar o app (modo produção)
// Mude para true quando o login via Google/email estiver configurado.
// ============================================================
const REQUIRE_AUTH = true;

type EvalStep = 'search' | 'version-select' | 'form' | 'result';
type HistoryStep = 'list' | 'detail' | 'outcome' | 'version-select';
type ContactsStep = 'list' | 'detail' | 'eval-detail' | 'eval-outcome';

export default function App() {
  const [session, setSession]     = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(REQUIRE_AUTH);
  const [showLaunch, setShowLaunch] = useState(true);

  // Carrega as fontes em tempo de execucao. No nativo elas ja vem embutidas no
  // build; na WEB (PWA) o navegador so as tem se forem registradas aqui. Usamos
  // as fontes variaveis, que cobrem todos os pesos via fontWeight. Os nomes
  // batem com os de src/theme/tokens.ts (fontFamily).
  const [fontsLoaded] = useFonts({
    SpaceGrotesk: require('./assets/fonts/SpaceGrotesk-VariableFont_wght.ttf'),
    Inter: require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    'Inter Display': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
  });

 useEffect(() => {
  if (!REQUIRE_AUTH) return;
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    setAuthLoading(false);
    if (data.session) loadAndApplyEvaluationParams(); // busca parâmetros já com sessão válida
  });
  const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
    setSession(s);
    if (s) loadAndApplyEvaluationParams(); // reaplica ao logar/trocar de sessão
  });
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
  // true quando o usuario tocou "Alterar versão" no resultado: ao escolher a
  // nova versao, recalculamos com as MESMAS respostas e voltamos ao resultado.
  const [changingVersion, setChangingVersion] = useState(false);

  // ---- Fluxo de histórico ----
  const [historyStep, setHistoryStep] = useState<HistoryStep>('list');
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithOutcome | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  // Alterar versão no histórico: versões rebuscadas pela placa + estados.
  const [historyMatches, setHistoryMatches] = useState<FipeVersionMatch[] | null>(null);
  const [historyVersionLoading, setHistoryVersionLoading] = useState(false);

  // ---- Fluxo de contatos ----
  const [contactsStep, setContactsStep] = useState<ContactsStep>('list');
  const [selectedContact, setSelectedContact] = useState<ContactSummary | null>(null);
  const [contactsRefresh, setContactsRefresh] = useState(0);
  // Avaliação aberta a partir da tela de um contato (independente do histórico).
  const [contactEvaluation, setContactEvaluation] = useState<EvaluationWithOutcome | null>(null);
  const [contactDetailRefresh, setContactDetailRefresh] = useState(0);

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
    // Fluxo novo: descarta respostas/resultado de uma avaliacao anterior, para
    // "Alterar versão" so recalcular quando as respostas forem deste veiculo.
    setEvalInput(null);
    setResult(null);
    setChangingVersion(false);
    if (matches && matches.length > 1) {
      setAllMatches(matches);
      setEvalStep('version-select');
    } else {
      setAllMatches(null);
      setEvalStep('form');
    }
  }

  // Volta para a lista de versoes a partir do resultado, sem perder as respostas.
  function handleChangeVersion() {
    if (!allMatches) return;
    setChangingVersion(true);
    setEvalStep('version-select');
  }

  // "Voltar" da tela de versoes: se o usuario veio do resultado (Alterar versão),
  // retorna ao resultado; caso contrario, volta para a busca.
  function backFromVersionSelect() {
    if (changingVersion) {
      setChangingVersion(false);
      setEvalStep('result');
    } else {
      setEvalStep('search');
    }
  }

  function handleVersionConfirmed(match: FipeVersionMatch) {
    setVehicle(match.vehicle);
    // Se veio de "Alterar versão" e o formulario ja foi respondido, recalcula
    // com as mesmas respostas (so troca o veiculo) e vai direto ao resultado.
    if (changingVersion && evalInput) {
      const newInput: EvaluationInput = { ...evalInput, vehicle: match.vehicle };
      setEvalInput(newInput);
      setResult(evaluateVehicle(newInput));
      setChangingVersion(false);
      setEvalStep('result');
    } else {
      setChangingVersion(false);
      setEvalStep('form');
    }
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
    setChangingVersion(false);
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

  // "Alterar versão" no histórico: rebusca as versões FIPE da placa da avaliação
  // (cache do backend costuma tornar isso gratuito no mesmo mês) e abre a lista.
  async function handleHistoryChangeVersion() {
    const ev = selectedEvaluation;
    if (!ev || !ev.plate) return;
    const parsed = parsePlate(ev.plate);
    if (!parsed) { Alert.alert('Placa inválida', 'Não foi possível reconhecer a placa desta avaliação.'); return; }

    setHistoryVersionLoading(true);
    try {
      const result = await fetchVehicleByPlate(parsed);
      if (result.allMatches.length <= 1) {
        Alert.alert('Sem outras versões', 'A FIPE retornou apenas uma versão para esta placa.');
        return;
      }
      setHistoryMatches(result.allMatches);
      setHistoryStep('version-select');
    } catch (err: any) {
      Alert.alert('Erro ao buscar versões', err.message ?? 'Verifique sua conexão e tente novamente.');
    } finally {
      setHistoryVersionLoading(false);
    }
  }

  // Confirma a nova versão: recalcula (mantendo ajuste % e preparação salvos) e
  // atualiza a avaliação no banco. Reflete localmente sem precisar recarregar.
  async function handleHistoryVersionConfirmed(match: FipeVersionMatch) {
    const ev = selectedEvaluation;
    if (!ev) return;
    setHistoryVersionLoading(true);
    try {
      const rc = recomputeForNewVehicle({
        vehicle: match.vehicle,
        adjustmentPercent: ev.adjustment_percent,
        preparationCost: ev.preparation_cost,
        additionalCosts: ev.additional_costs ?? 0,
        optionalsValue: ev.optionals_value ?? 0,
        isArmored: ev.is_armored,
        delaminatedWindowCount: ev.delaminated_window_count,
      });
      await updateEvaluationVehicle(ev.id, match.vehicle, rc);
      setSelectedEvaluation({
        ...ev,
        brand:                 match.vehicle.brand,
        model:                 match.vehicle.model,
        model_year:            match.vehicle.modelYear,
        fuel:                  match.vehicle.fuel,
        fipe_code:             match.vehicle.codeFipe,
        fipe_price:            match.vehicle.priceValue,
        fipe_reference_month:  match.vehicle.referenceMonth,
        base_discount_percent: rc.baseDiscountPercent,
        discount_source:       rc.discountSource,
        standard_value:        rc.standardValue,
        estimated_value:       rc.estimatedValue,
        armor_adjustment_value: rc.armorAdjustmentValue,
        final_offer_value:     rc.finalOfferValue,
        repasse_value:         rc.repasseValue,
      });
      setHistoryMatches(null);
      setHistoryRefresh(n => n + 1);
      setContactsRefresh(n => n + 1);
      setHistoryStep('detail');
    } catch (err: any) {
      Alert.alert('Erro ao alterar versão', err.message ?? 'Tente novamente.');
    } finally {
      setHistoryVersionLoading(false);
    }
  }

  function handleSelectContact(summary: ContactSummary) {
    setSelectedContact(summary);
    setContactsStep('detail');
  }

  function handleSelectContactCar(evaluation: EvaluationWithOutcome) {
    setContactEvaluation(evaluation);
    setContactsStep('eval-detail');
  }

  function handleContactOutcomeSaved() {
    // O desfecho mudou: atualiza a lista de carros do contato, os resumos de
    // contatos e o histórico. Volta para a tela do contato.
    setContactDetailRefresh(n => n + 1);
    setContactsRefresh(n => n + 1);
    setHistoryRefresh(n => n + 1);
    setContactsStep('detail');
    setContactEvaluation(null);
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
        if (historyStep === 'outcome')        { setHistoryStep('detail'); return true; }
        if (historyStep === 'version-select') { setHistoryStep('detail'); return true; }
        if (historyStep === 'detail')         { setHistoryStep('list');   return true; }
        return false;
      }
      if (activeTab === 'contacts') {
        if (contactsStep === 'eval-outcome') { setContactsStep('eval-detail'); return true; }
        if (contactsStep === 'eval-detail')  { setContactsStep('detail');      return true; }
        if (contactsStep === 'detail')       { setContactsStep('list');        return true; }
        return false;
      }
      if (evalStep === 'result')         { setEvalStep('form');                                     return true; }
      if (evalStep === 'form')           { setEvalStep(allMatches ? 'version-select' : 'search');   return true; }
      if (evalStep === 'version-select') { backFromVersionSelect();                                 return true; }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [privacyOpen, activeTab, historyStep, contactsStep, evalStep, allMatches, changingVersion]);

  function getHeaderProps() {
    if (activeTab === 'history') {
      if (historyStep === 'detail')         return { title: 'Detalhes da avaliação', onBack: () => setHistoryStep('list') };
      if (historyStep === 'version-select') return { title: 'Selecione a versão', onBack: () => setHistoryStep('detail') };
      if (historyStep === 'outcome')        return { title: 'Registrar desfecho', onBack: () => setHistoryStep('detail') };
      return { title: 'Histórico' };
    }
    if (activeTab === 'contacts') {
      if (contactsStep === 'eval-outcome') return { title: 'Registrar desfecho', onBack: () => setContactsStep('eval-detail') };
      if (contactsStep === 'eval-detail')  return { title: 'Detalhes da avaliação', onBack: () => setContactsStep('detail') };
      if (contactsStep === 'detail')       return { title: 'Contato', onBack: () => setContactsStep('list') };
      return { title: 'Contatos', subtitle: 'Cotações por contato e grupo' };
    }
    switch (evalStep) {
      case 'search':         return { title: 'AutoValor', subtitle: 'Busca por marca, modelo e ano' };
      case 'version-select': return { title: 'Selecione a versão', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: backFromVersionSelect };
      case 'form':           return { title: 'Condições do veículo', subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined, onBack: () => setEvalStep(allMatches ? 'version-select' : 'search') };
      case 'result':         return { title: 'Resultado', onBack: () => setEvalStep('form') };
    }
  }

  // Na WEB, segura a renderizacao ate as fontes carregarem, para nao aparecer
  // um flash com a fonte serifada padrao do navegador. No nativo nao bloqueia
  // (as fontes ja vem embutidas), entao fontsLoaded nao atrasa o startup.
  if (Platform.OS === 'web' && !fontsLoaded) {
    return <View style={styles.root} />;
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
                  onChangeVersion={allMatches && allMatches.length > 1 ? handleChangeVersion : undefined}
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
                <EvaluationDetailScreen
                  evaluation={selectedEvaluation}
                  onRegisterOutcome={() => setHistoryStep('outcome')}
                  onChangeVersion={selectedEvaluation.plate ? handleHistoryChangeVersion : undefined}
                  changingVersion={historyVersionLoading}
                />
              )}
              {historyStep === 'version-select' && selectedEvaluation && historyMatches && (
                <VersionSelectionScreen
                  kind={selectedEvaluation.vehicle_kind}
                  allMatches={historyMatches}
                  onConfirm={handleHistoryVersionConfirmed}
                />
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
                <ContactDetailScreen
                  summary={selectedContact}
                  onSelectCar={handleSelectContactCar}
                  refreshTrigger={contactDetailRefresh}
                />
              )}
              {contactsStep === 'eval-detail' && contactEvaluation && (
                <EvaluationDetailScreen
                  evaluation={contactEvaluation}
                  onRegisterOutcome={() => setContactsStep('eval-outcome')}
                />
              )}
              {contactsStep === 'eval-outcome' && contactEvaluation && (
                <OutcomeScreen evaluation={contactEvaluation} onSaved={handleContactOutcomeSaved} />
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
