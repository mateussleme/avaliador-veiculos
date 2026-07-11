import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// expo-apple-authentication usa módulo nativo iOS — importar no Android causa crash.
// Carregamos só em tempo de execução e somente quando Platform.OS === 'ios'.
const AppleAuthentication = Platform.OS === 'ios'
  ? require('expo-apple-authentication')
  : null;
import { supabase } from '../lib/supabase';
import { colors, fontFamily, radius, spacing, type } from '../theme/tokens';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'signup';

export function AuthScreen() {
  const [mode, setMode]         = useState<AuthMode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios' && AppleAuthentication) {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  async function handleEmailAuth() {
    if (!email.trim() || !password) {
      Alert.alert('Preencha email e senha.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Informe seu nome.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        Alert.alert('Conta criada!', 'Verifique seu email para confirmar o cadastro.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const redirectTo = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error || !data.url) throw error ?? new Error('Sem URL de redirecionamento.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) await supabase.auth.exchangeCodeForSession(code);
      }
    } catch (err: any) {
      Alert.alert('Erro ao entrar com Google', err.message ?? 'Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleLogin() {
    if (!AppleAuthentication) return;
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('Token Apple não recebido.');

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // Apple só envia o nome no primeiro login — salva no perfil se disponível
      if (fullName) {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        Alert.alert('Erro ao entrar com Apple', err.message ?? 'Tente novamente.');
      }
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.appName}>AutoValor</Text>
          <Text style={styles.appTagline}>Plataforma de inteligência para compra de veículos</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={handleEmailAuth}
            disabled={loading}
            style={({ pressed }) => [styles.primaryButton, loading && styles.disabled, pressed && styles.pressed]}
          >
            {loading
              ? <ActivityIndicator color={colors.textOnInk} />
              : <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>}
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switchMode}>
            <Text style={styles.switchModeText}>
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            style={({ pressed }) => [styles.socialButton, googleLoading && styles.disabled, pressed && styles.pressed]}
          >
            {googleLoading
              ? <ActivityIndicator color={colors.textPrimary} />
              : <>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialButtonText}>Continuar com Google</Text>
                </>}
          </Pressable>

          {Platform.OS === 'ios' && appleAvailable && AppleAuthentication && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.md}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}
        </View>

        <Text style={styles.footer}>
          Ao entrar, você concorda com nossa política de privacidade. Seus dados são protegidos
          conforme a LGPD (Lei 13.709/2018).
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  header: { alignItems: 'center', paddingVertical: spacing.xxl },
  appName: { fontSize: 40, fontWeight: '800', color: colors.ink, letterSpacing: -1, fontFamily: fontFamily.spaceGrotesk },
  appTagline: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20, fontFamily: fontFamily.inter },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginBottom: spacing.lg },
  formTitle: { fontSize: type.h1.fontSize, fontWeight: type.h1.fontWeight, color: colors.textPrimary, marginBottom: spacing.lg, fontFamily: fontFamily.spaceGrotesk },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: type.label.fontSize, fontWeight: type.label.fontWeight, letterSpacing: type.label.letterSpacing, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: spacing.xs, fontFamily: fontFamily.inter },
  input: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: type.body.fontSize, color: colors.textPrimary, fontFamily: fontFamily.inter },
  primaryButton: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm, minHeight: 50, justifyContent: 'center' },
  primaryButtonText: { color: colors.textOnInk, fontSize: type.h2.fontSize, fontWeight: type.h2.fontWeight, fontFamily: fontFamily.spaceGrotesk },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  switchMode: { alignItems: 'center', paddingVertical: spacing.md },
  switchModeText: { color: colors.ink, fontSize: type.body.fontSize, fontWeight: '600', fontFamily: fontFamily.inter },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: type.caption.fontSize, color: colors.textTertiary, fontFamily: fontFamily.inter },
  socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, minHeight: 50, gap: spacing.sm },
  socialIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  socialButtonText: { fontSize: type.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: fontFamily.inter },
  appleButton: { width: '100%', height: 50, marginTop: spacing.sm },
  footer: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', lineHeight: 17, paddingBottom: spacing.xl, fontFamily: fontFamily.inter },
});
