import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

const MARKER_SIZE = 16;

interface GaugeBarProps {
  percent: number; // valor do ajuste a posicionar no medidor
  min: number; // pior caso possível do ajuste
  max: number; // melhor caso possível do ajuste
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function GaugeBar({ percent, min, max }: GaugeBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = clampValue(percent, min, max);
  const span = max - min || 1;
  const positionRatio = (clamped - min) / span;
  const markerLeft = trackWidth ? positionRatio * trackWidth - MARKER_SIZE / 2 : 0;

  // Zonas proporcionais: vermelho cobre a parte negativa da faixa,
  // verde cobre a parte positiva. Quando min ou max é zero, a zona
  // correspondente simplesmente não aparece.
  const negativeSpan = Math.max(0, -min);
  const positiveSpan = Math.max(0, max);
  const dangerWidth = (negativeSpan / span) * 100;
  const goodWidth = (positiveSpan / span) * 100;

  function onLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.track} onLayout={onLayout}>
        {dangerWidth > 0 && (
          <View style={[styles.zone, { width: `${dangerWidth}%`, backgroundColor: colors.dangerBg }]} />
        )}
        {goodWidth > 0 && (
          <View style={[styles.zone, { width: `${goodWidth}%`, backgroundColor: colors.goodBg }]} />
        )}

        {trackWidth > 0 && <View style={[styles.marker, { left: markerLeft }]} />}
      </View>
      <View style={styles.captions}>
        <Text style={styles.captionText}>{formatPercent(min)}</Text>
        <Text style={styles.captionText}>{formatPercent(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.pill,
    overflow: 'visible',
    backgroundColor: colors.surfaceAlt,
  },
  zone: {
    height: 10,
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  captions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  captionText: {
    fontSize: type.caption.fontSize,
    color: colors.textTertiary,
  },
});
