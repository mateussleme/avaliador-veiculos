import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  fetchBrands,
  fetchModels,
  fetchModelsByYear,
  fetchVehicleInfo,
  fetchYears,
  fetchYearsByBrand,
  FipeApiError,
  formatModelYear,
} from '../api/fipeApi';
import { fetchVehicleByPlate, FipeVersionMatch, PlateApiError, PlateLookupResult } from '../api/plateApi';
import { filterCuratedBrands } from '../domain/brandFilters';
import { formatPlateHint, parsePlate } from '../domain/plateValidation';
import { Button } from '../components/Button';
import { Card, SectionLabel } from '../components/Card';
import { CopyableField } from '../components/CopyableField';
import { OptionGroup } from '../components/OptionGroup';
import { SelectField, SelectOption } from '../components/SelectField';
import { YearFuelSelect } from '../components/YearFuelSelect';
import { useBottomPadding } from '../hooks/useBottomPadding';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';
import { FipeVehicleInfo, VehicleKind } from '../domain/types';

interface SearchScreenProps {
  onContinue: (kind: VehicleKind, vehicle: FipeVehicleInfo, allMatches?: FipeVersionMatch[], plate?: string) => void;
  hasTabBar?: boolean;
}

type SearchMode = 'manual' | 'plate';

const MODE_OPTIONS: { value: SearchMode; label: string }[] = [
  { value: 'manual', label: 'Marca, modelo e ano' },
  { value: 'plate', label: 'Placa' },
];

const KIND_OPTIONS: { value: VehicleKind; label: string }[] = [
  { value: 'cars', label: 'Carro' },
  { value: 'motorcycles', label: 'Moto' },
];

const KIND_LABEL: Record<VehicleKind, string> = {
  cars: 'Carro',
  motorcycles: 'Moto',
};


export function SearchScreen({ onContinue }: SearchScreenProps) {
  const [mode, setMode] = useState<SearchMode>('manual');

  // ---- Busca manual (marca / modelo / ano) ----
  // Modelo e Ano são independentes: depois de escolher a marca, os dois
  // campos ficam habilitados. Escolher um filtra o outro pela FIPE (o
  // modelo escolhido limita os anos; o ano escolhido limita os modelos).
  const [kind, setKind] = useState<VehicleKind>('cars');

  const [rawBrands, setRawBrands] = useState<SelectOption[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [years, setYears] = useState<SelectOption[]>([]);

  const [brand, setBrand] = useState<SelectOption | null>(null);
  const [model, setModel] = useState<SelectOption | null>(null);
  const [year, setYear] = useState<SelectOption | null>(null);

  const [manualVehicleInfo, setManualVehicleInfo] = useState<FipeVehicleInfo | null>(null);

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ---- Busca por placa ----
  const [plateText, setPlateText] = useState('');
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateResult, setPlateResult] = useState<PlateLookupResult | null>(null);

  // Recarrega marcas sempre que o tipo de veículo muda.
  useEffect(() => {
    setBrand(null);
    setModel(null);
    setYear(null);
    setManualVehicleInfo(null);
    setModels([]);
    setYears([]);
    setManualError(null);
    setLoadingBrands(true);

    fetchBrands(kind)
      .then(setRawBrands)
      .catch((e) => setManualError(e instanceof FipeApiError ? e.message : 'Erro ao carregar marcas.'))
      .finally(() => setLoadingBrands(false));
  }, [kind]);

  // Lista exibida: por padrão, só marcas atuais do mercado brasileiro.
  // Se o filtro não achar nada (ou o usuário pedir), mostra a lista completa.
  const brands = useMemo(() => {
    if (showAllBrands) return rawBrands;
    const filtered = filterCuratedBrands(kind, rawBrands);
    return filtered.length > 0 ? filtered : rawBrands;
  }, [rawBrands, showAllBrands, kind]);

  // Ao trocar a marca, zera modelo/ano e o preço. As listas são recarregadas
  // pelos dois efeitos abaixo (que dependem de brand).
  useEffect(() => {
    setModel(null);
    setYear(null);
    setManualVehicleInfo(null);
  }, [brand]);

  // ---- Lista de MODELOS ----
  // Sem ano escolhido: todos os modelos da marca.
  // Com ano escolhido: só os modelos daquele ano+combustível.
  // Se o modelo já selecionado sair da lista filtrada, ele é limpo.
  useEffect(() => {
    if (!brand) {
      setModels([]);
      return;
    }
    setManualError(null);
    setLoadingModels(true);

    const request = year
      ? fetchModelsByYear(kind, brand.code, year.code)
      : fetchModels(kind, brand.code);

    request
      .then((list) => {
        setModels(list);
        setModel((cur) => (cur && !list.some((m) => m.code === cur.code) ? null : cur));
      })
      .catch((e) => setManualError(e instanceof FipeApiError ? e.message : 'Erro ao carregar modelos.'))
      .finally(() => setLoadingModels(false));
  }, [brand, kind, year]);

  // ---- Lista de ANOS ----
  // Sem modelo escolhido: todos os anos da marca.
  // Com modelo escolhido: só os anos daquele modelo.
  // Se o ano já selecionado sair da lista filtrada, ele é limpo.
  useEffect(() => {
    if (!brand) {
      setYears([]);
      return;
    }
    setManualError(null);
    setLoadingYears(true);

    const request = model
      ? fetchYears(kind, brand.code, model.code)
      : fetchYearsByBrand(kind, brand.code);

    request
      .then((list) => {
        setYears(list);
        setYear((cur) => (cur && !list.some((y) => y.code === cur.code) ? null : cur));
      })
      .catch((e) => setManualError(e instanceof FipeApiError ? e.message : 'Erro ao carregar anos.'))
      .finally(() => setLoadingYears(false));
  }, [brand, kind, model]);

  // Busca o preço FIPE quando marca + modelo + ano estão escolhidos.
  useEffect(() => {
    setManualVehicleInfo(null);

    if (!brand || !model || !year) return;

    setManualError(null);
    setLoadingPrice(true);
    fetchVehicleInfo(kind, brand.code, model.code, year.code)
      .then(setManualVehicleInfo)
      .catch((e) => setManualError(e instanceof FipeApiError ? e.message : 'Erro ao consultar o preço.'))
      .finally(() => setLoadingPrice(false));
  }, [year, model, brand, kind]);

  const parsedPlate = useMemo(() => parsePlate(plateText), [plateText]);

  function handlePlateSearch() {
    if (!parsedPlate) {
      setPlateError('Digite uma placa válida (ex: ABC1234 ou ABC1D23).');
      setPlateResult(null);
      return;
    }

    setPlateError(null);
    setPlateResult(null);
    setPlateLoading(true);
    fetchVehicleByPlate(parsedPlate)
      .then(setPlateResult)
      .catch((e) => setPlateError(e instanceof PlateApiError ? e.message : 'Erro ao consultar o veículo.'))
      .finally(() => setPlateLoading(false));
  }

  const resolvedKind = mode === 'manual' ? kind : plateResult?.kind ?? null;
  const resolvedVehicle = mode === 'manual' ? manualVehicleInfo : plateResult?.vehicle ?? null;

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Selecione o veículo para consultar o valor de referência na tabela FIPE.
      </Text>

      <View style={styles.kindWrap}>
        <SectionLabel>Como buscar</SectionLabel>
        <OptionGroup options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </View>

      {mode === 'manual' ? (
        <>
          <View style={styles.kindWrap}>
            <SectionLabel>Tipo de veículo</SectionLabel>
            <OptionGroup options={KIND_OPTIONS} value={kind} onChange={setKind} />
          </View>

          <SelectField
            label="Marca"
            placeholder="Selecione a marca"
            options={brands}
            value={brand}
            onSelect={setBrand}
            onClear={() => setBrand(null)}
            loading={loadingBrands}
          />

          <Pressable onPress={() => setShowAllBrands((v) => !v)} style={styles.brandFilterToggle}>
            <Text style={styles.brandFilterToggleText}>
              {showAllBrands ? 'Mostrar só marcas do mercado brasileiro' : 'Mostrar todas as marcas'}
            </Text>
          </Pressable>

          <YearFuelSelect
            label="Ano / combustível"
            placeholder={brand ? 'Selecione o combustível' : 'Selecione a marca primeiro'}
            options={years}
            value={year}
            onSelect={setYear}
            onClear={() => setYear(null)}
            disabled={!brand}
            loading={loadingYears}
          />

          <SelectField
            label="Modelo"
            placeholder={brand ? 'Selecione o modelo' : 'Selecione a marca primeiro'}
            options={models}
            value={model}
            onSelect={setModel}
            onClear={() => setModel(null)}
            disabled={!brand}
            loading={loadingModels}
          />

          {manualError ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{manualError}</Text>
            </Card>
          ) : null}

          {loadingPrice ? (
            <Card style={styles.priceCard}>
              <Text style={styles.loadingText}>Consultando tabela FIPE…</Text>
            </Card>
          ) : null}

          {manualVehicleInfo ? (
            <Card style={styles.priceCard}>
              <SectionLabel>Valor de referência FIPE</SectionLabel>
              <Text style={styles.vehicleName}>
                {manualVehicleInfo.brand} {manualVehicleInfo.model}
              </Text>
              <Text style={styles.vehicleMeta}>
                {formatModelYear(manualVehicleInfo)} · {manualVehicleInfo.fuel} · ref.{' '}
                {manualVehicleInfo.referenceMonth}
              </Text>
              <Text style={styles.priceValue}>{manualVehicleInfo.priceLabel}</Text>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Card style={styles.card}>
            <SectionLabel>Placa do veículo</SectionLabel>
            <TextInput
              value={plateText}
              onChangeText={(t) => {
                setPlateText(t);
                setPlateError(null);
              }}
              placeholder="Ex: ABC1234 ou ABC1D23"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              style={styles.input}
            />
            {parsedPlate ? (
              <Text style={styles.fieldNote}>{formatPlateHint(parsedPlate.type)} reconhecido.</Text>
            ) : null}
            <Button
              label="Buscar veículo"
              onPress={handlePlateSearch}
              loading={plateLoading}
              disabled={!plateText}
              style={styles.searchButton}
            />
          </Card>

          {plateError ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{plateError}</Text>
            </Card>
          ) : null}

          {plateResult ? (
            <Card style={styles.priceCard}>
              <SectionLabel>Veículo encontrado</SectionLabel>
              <Text style={styles.vehicleName}>
                {plateResult.vehicle.brand} {plateResult.vehicle.model}
              </Text>
              <Text style={styles.vehicleMeta}>
                {KIND_LABEL[plateResult.kind]} · {formatModelYear(plateResult.vehicle)} ·{' '}
                {plateResult.vehicle.fuel} · ref. {plateResult.vehicle.referenceMonth}
              </Text>
              <Text style={styles.priceValue}>{plateResult.vehicle.priceLabel}</Text>

              <View style={styles.vehicleDocsWrap}>
                {plateResult.vehicle.codeFipe ? (
                  <CopyableField label="Código FIPE" value={plateResult.vehicle.codeFipe} />
                ) : null}
                {plateResult.vehicle.chassi ? (
                  <CopyableField label="Chassi" value={plateResult.vehicle.chassi} />
                ) : null}
                {plateResult.vehicle.renavam ? (
                  <CopyableField label="Renavam" value={plateResult.vehicle.renavam} />
                ) : null}
              </View>

              {plateResult.allMatches.length > 1 ? (
                <Text style={styles.fieldNote}>
                  {plateResult.allMatches.length} versões FIPE encontradas — você vai selecionar a correta na próxima tela.
                </Text>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      <Button
        label="Continuar para a avaliação"
        onPress={() => resolvedKind && resolvedVehicle && onContinue(
          resolvedKind,
          resolvedVehicle,
          mode === 'plate' && plateResult ? plateResult.allMatches : undefined,
          mode === 'plate' && parsedPlate ? parsedPlate.normalized : undefined
        )}
        disabled={!resolvedKind || !resolvedVehicle}
        style={styles.continueButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  intro: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    fontFamily: fontFamily.inter,
  },
  kindWrap: {
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  input: {
    fontSize: type.h2.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
  },
  fieldNote: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
    fontFamily: fontFamily.inter,
  },
  vehicleDocsWrap: {
    marginTop: spacing.sm,
  },
  searchButton: {
    marginTop: spacing.md,
  },
  brandFilterToggle: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  brandFilterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: fontFamily.spaceGrotesk,
  },
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: type.body.fontSize,
    fontFamily: fontFamily.inter,
  },
  priceCard: {
    marginBottom: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: type.body.fontSize,
    fontFamily: fontFamily.inter,
  },
  vehicleName: {
    fontSize: type.h2.fontSize,
    fontWeight: type.h2.fontWeight,
    color: colors.textPrimary,
    marginBottom: 2,
    fontFamily: fontFamily.spaceGrotesk,
  },
  vehicleMeta: {
    fontSize: type.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.inter,
  },
  priceValue: {
    fontSize: type.display.fontSize,
    fontWeight: type.display.fontWeight,
    color: colors.ink,
    fontFamily: fontFamily.spaceGrotesk,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
});
