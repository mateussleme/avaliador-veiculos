import React, { useEffect, useRef, useState } from 'react';
// Clipboard do react-native está deprecado, mas continua funcionando e —
// diferente do expo-clipboard — não é módulo nativo novo, então a cópia
// funciona via eas update sem precisar gerar APK novo. Quando houver um
// build nativo novo de qualquer forma, migrar para expo-clipboard.
import { Clipboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

// Linha "Rótulo: valor" que copia o valor ao toque, com feedback "Copiado!".
// Usada nos campos de código FIPE, chassi, Renavam e placa (busca por placa e
// detalhes da avaliação). Com copyable=false vira uma linha informativa com
// o mesmo visual, mas sem o botão de copiar (ex: km, que não se copia).
export function CopyableField({
  label,
  value,
  copyable = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const content = (
    <Text style={styles.text}>
      {label}: <Text style={styles.value}>{value}</Text>
    </Text>
  );

  if (!copyable) {
    return <View style={styles.row}>{content}</View>;
  }

  function handleCopy() {
    Clipboard.setString(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Pressable onPress={handleCopy} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {content}
      {/* Sem rótulo "Copiar" fixo (poluía a tela): toca-se na própria linha
          para copiar; só o "Copiado!" aparece por ~2s como confirmação. */}
      {copied ? <Text style={styles.hintCopied}>Copiado!</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    fontSize: type.caption.fontSize,
    color: colors.textSecondary,
    fontFamily: fontFamily.inter,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: fontFamily.spaceGrotesk,
  },
  hintCopied: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.good,
    marginLeft: spacing.sm,
    fontFamily: fontFamily.spaceGrotesk,
  },
});
