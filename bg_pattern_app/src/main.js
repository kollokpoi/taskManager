import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import './style.css';
import PrimeVuePlugin from './plugins/primevue.js';

const app = createApp(App);

app.use(router);
app.use(PrimeVuePlugin);
app.provide('BX24', window.BX24)

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue глобальная ошибка:', err);
  console.info('Компонент:', instance);
  console.info('Информация:', info);
};

router.isReady().then(() => {
  router.push('/'); // Принудительный переход на главную страницу
});

app.mount('#app');
