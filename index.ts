// O polyfill de URL precisa ser o PRIMEIRO import do app.
// Sem isso o Supabase e outras libs que usam URL/fetch crasham no startup.
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
