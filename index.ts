// O polyfill de URL precisa ser o PRIMEIRO import do app.
// Sem isso o Supabase e outras libs que usam URL/fetch crasham no startup.
import 'react-native-url-polyfill/auto';

import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';
import { initSentry, Sentry } from './src/lib/sentry';

// Inicializa o monitoramento de erros o mais cedo possível, para capturar
// falhas de startup. Em desenvolvimento (__DEV__) e na web o init é ignorado.
initSentry();

// Sentry.wrap adiciona o error boundary raiz. So aplicamos no nativo; na web
// (PWA) registramos o App direto, para nao depender do SDK nativo no navegador.
const RootComponent = Platform.OS === 'web' ? App : Sentry.wrap(App);

registerRootComponent(RootComponent);
