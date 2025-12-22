import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import './style.css';
import PrimeVuePlugin from './plugins/primevue.js';

const app = createApp(App);

app.use(router);
app.use(PrimeVuePlugin);
app.provide('BX24', window.BX24)


router.isReady().then(() => {
  router.push('/'); // Принудительный переход на главную страницу
});

app.mount('#app');
