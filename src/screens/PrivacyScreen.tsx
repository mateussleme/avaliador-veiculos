import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SectionLabel } from '../components/Card';
import { Button } from '../components/Button';
import { colors, spacing, type } from '../theme/tokens';

interface PrivacyScreenProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyScreen({ visible, onClose }: PrivacyScreenProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Privacidade nesta versão do app</Text>
          <Text style={styles.intro}>
            Esta é a versão inicial do app, focada em busca manual por marca, modelo e ano. O
            resumo abaixo descreve exatamente o que ela faz com dados.
          </Text>

          <Card style={styles.card}>
            <SectionLabel>O que é enviado pela internet</SectionLabel>
            <Text style={styles.body}>
              Apenas marca, modelo e ano do veículo são enviados à tabela FIPE pública para
              consultar o preço de referência. Nenhum dado pessoal seu é enviado nessa consulta.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>O que fica só no seu celular</SectionLabel>
            <Text style={styles.body}>
              Quilometragem, estado dos pneus, histórico de manutenção e os demais dados que você
              preenche na avaliação ficam no aparelho durante o uso. Eles só são enviados a um
              servidor se você optar por salvar a avaliação no histórico (requer login).
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>Consulta por placa</SectionLabel>
            <Text style={styles.body}>
              Ao buscar por placa, a placa digitada é enviada ao nosso servidor, que consulta um
              provedor de dados veiculares (APIBrasil) para identificar o veículo e o valor FIPE.
              A placa não é armazenada em banco de dados — é usada apenas para essa consulta.
              Um cache temporário no aparelho evita consultas repetidas da mesma placa na mesma
              sessão de uso.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>Login e histórico (opcional)</SectionLabel>
            <Text style={styles.body}>
              Se você criar uma conta, as avaliações que optar por salvar ficam vinculadas ao
              seu usuário em nosso banco de dados (Supabase), protegidas por controle de acesso
              em nível de linha — cada usuário só acessa os próprios dados. Você pode excluir
              suas avaliações a qualquer momento.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>Seus direitos (LGPD)</SectionLabel>
            <Text style={styles.body}>
              Conforme a Lei 13.709/2018, você pode solicitar acesso, correção ou exclusão dos
              seus dados a qualquer momento. Dados de avaliações salvas podem ser excluídos
              diretamente no app. Para exclusão completa da conta, entre em contato pelo canal
              de suporte.
            </Text>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Entendi" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  heading: {
    fontSize: type.h1.fontSize,
    fontWeight: type.h1.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  intro: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
  },
  body: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
