import { createApp } from 'vue';
import App from './App.vue';
import BootstrapVue3 from 'bootstrap-vue-3';

// Import Bootstrap and BootstrapVue CSS files
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

const app = createApp(App);

app.use(BootstrapVue3);
app.config.globalProperties.$apiBaseUrl = "http://localhost:8081/api/v1";

app.mount('#app');
