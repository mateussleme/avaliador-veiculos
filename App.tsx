import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AppHeader } from './src/components/AppHeader';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { VersionSelectionScreen } from './src/screens/VersionSelectionScreen';
import { EvaluationFormScreen } from './src/screens/EvaluationFormScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme/tokens';
import { EvaluationResult, FipeVehicleInfo, VehicleKind } from './src/domain/types';
import { FipeVersionMatch } from './src/api/plateApi';

type Step = 'search' | 'version-select' | 'form' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('search');
  const [kind, setKind] = useState<VehicleKind>('cars');
  const [vehicle, setVehicle] = useState<FipeVehicleInfo | null>(null);
  const [allMatches, setAllMatches] = useState<FipeVersionMatch[] | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  function handleContinueFromSearch(
    selectedKind: VehicleKind,
    selectedVehicle: FipeVehicleInfo,
    matches?: FipeVersionMatch[]
  ) {
    setKind(selectedKind);
    setVehicle(selectedVehicle);

    // Se veio de busca por placa com múltiplas versões → tela de seleção
    if (matches && matches.length > 1) {
      setAllMatches(matches);
      setStep('version-select');
    } else {
      // Busca manual ou só 1 versão → vai direto pro formulário
      setAllMatches(null);
      setStep('form');
    }
  }

  function handleVersionConfirmed(match: FipeVersionMatch) {
    setVehicle(match.vehicle);
    setStep('form');
  }

  function handleResult(evaluation: EvaluationResult) {
    setResult(evaluation);
    setStep('result');
  }

  function handleRestart() {
    setVehicle(null);
    setAllMatches(null);
    setResult(null);
    setStep('search');
  }

  function headerProps() {
    switch (step) {
      case 'search':
        return { title: 'Avaliador de veículos', subtitle: 'Busca por marca, modelo e ano' };
      case 'version-select':
        return {
          title: 'Selecione a versão',
          subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined,
          onBack: () => setStep('search'),
        };
      case 'form':
        return {
          title: 'Condições do veículo',
          subtitle: vehicle ? `${vehicle.brand} ${vehicle.model}` : undefined,
          onBack: () => setStep(allMatches ? 'version-select' : 'search'),
        };
      case 'result':
        return {
          title: 'Resultado da avaliação',
          onBack: () => setStep('form'),
        };
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar style="light" />
        <AppHeader {...headerProps()} onPrivacy={() => setPrivacyOpen(true)} />

        {step === 'search' && (
          <SearchScreen onContinue={handleContinueFromSearch} />
        )}

        {step === 'version-select' && allMatches && (
          <VersionSelectionScreen
            kind={kind}
            allMatches={allMatches}
            onConfirm={handleVersionConfirmed}
          />
        )}

        {step === 'form' && vehicle && (
          <EvaluationFormScreen kind={kind} vehicle={vehicle} onResult={handleResult} />
        )}

        {step === 'result' && vehicle && result && (
          <ResultScreen vehicle={vehicle} result={result} onRestart={handleRestart} />
        )}

        <PrivacyScreen visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
