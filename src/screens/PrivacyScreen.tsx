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
              preenche na avaliação ficam apenas na tela, durante o uso do app. Nesta versão eles
              não são enviados a nenhum servidor nem salvos depois que você fecha o app.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>Campo de placa/Renavam (ainda inativo)</SectionLabel>
            <Text style={styles.body}>
              A tela de busca já tem um campo para placa ou Renavam, preparado para a próxima
              fase. Hoje ele só valida o formato no próprio celular — nenhuma placa ou Renavam
              digitado é enviado a qualquer servidor ainda. Quando essa busca for ativada de
              verdade, esta tela será atualizada antes, explicando exatamente quem recebe esse
              dado e por quê.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>O que ainda não existe nesta versão</SectionLabel>
            <Text style={styles.body}>
              Consulta por placa/Renavam conectada a uma API real, login, histórico salvo na
              nuvem e exportação de relatório fazem parte de uma fase futura. Quando forem
              adicionados, esta tela será atualizada antes de qualquer coleta começar, com um
              pedido de consentimento claro.
            </Text>
          </Card>

          <Card style={styles.card}>
            <SectionLabel>Seus direitos</SectionLabel>
            <Text style={styles.body}>
              Como nenhum dado pessoal é coletado ou armazenado nesta versão, não há dados seus
              para acessar, corrigir ou excluir em um servidor — eles simplesmente não saem do seu
              aparelho. Isso muda apenas quando funcionalidades futuras forem ativadas, sempre
              com aviso prévio.
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
