import { createApp } from 'vue'
import { registerPlugins } from '@/plugins'
import { LocalStorage, AppConfig, AppState, LogLevel, EScope, Statistics, appStateSymbol, appConfigSymbol } from "@christianriedl/utils"; 
import { Logger } from './logger';
import { HealthCheck } from './healthCheck';
import { Rest, OAuth, Authorize, DummyOAuth, authorizeSymbol } from "@christianriedl/rest";
import { LoggerService, getLoggerServicesSymbol } from "@christianriedl/logger";
import type { ILoggerService } from "@christianriedl/logger";
import { SmartHomeService, SmartHomeDb, sensorsStateSymbol, sensorCommandsSymbol } from '@christianriedl/smarthome';
import { MediaServiceBin, getMediaBinSymbol } from '@christianriedl/media';

import App from './App.vue';

const root = 'admin';
const accessTokenUrl = "https://www.christian-riedl.com/identity4/connect/token";
const smartHomeUrl = "https://www.christian-riedl.com/smarthome/";
const mediaUrl = "https://www.christian-riedl.com/media/";
const storage = new LocalStorage('admin');
const appConfig = new AppConfig(storage);
const loggerDefault = new Logger('default', LogLevel.Trace);
const appState = new AppState(loggerDefault);
const browser = appState.setBrowser(window);
const logRestError = true;
const statistics = new Statistics();

// Initilize
const allScopes: EScope = EScope.Stock * 2 - 1;
appConfig.add("user", "User Mail Address", '', true, allScopes);
appConfig.add("name", "User Name", 'Christian', true, allScopes);
appConfig.add("user", "User Mail Address", '', true, allScopes);
appConfig.load();

// Authorize
const authorize = new Authorize(smartHomeUrl, storage, appConfig, appState, loggerDefault);
if (authorize.password) {
    authorize.login(authorize.user, authorize.password)
    .then((res) => loggerDefault.info(`Authorization initialized with scopes 0x${appState.scopes.toString(16)}`))
}

// Smarthome API
const smartHomeDb = new SmartHomeDb(loggerDefault, root + "_sensors");
const smartHomeOauth = new OAuth(accessTokenUrl, "same-origin", storage, loggerDefault, "smarthome", "smarthome_service", authorize.secretSmarthome);
const smartHomeRest = new Rest(smartHomeUrl, "same-origin", smartHomeOauth, loggerDefault, logRestError);
const smartHomeService = new SmartHomeService(smartHomeRest, smartHomeDb, statistics, 10000, false, false, false, false, 0, loggerDefault);

// Media API
const mediaStorage = new LocalStorage(root + "_media");   // Collision with smarthome oauth !!!!
const mediaOAuth = new OAuth(accessTokenUrl, 'same-origin', mediaStorage, loggerDefault, "media", "media_service", authorize.secretMedia);
const mediaRest = new Rest(mediaUrl, "same-origin", mediaOAuth, loggerDefault, logRestError);
const mediaService = new MediaServiceBin(mediaRest, appConfig.user, statistics, false, 0, loggerDefault);

// LoggerService
const loggerServices: ILoggerService[] = [];
const dummyOauth = new DummyOAuth();
const smartHomeLoggerRest = new Rest(smartHomeUrl + "apilogger/", smartHomeOauth.mode, smartHomeOauth, loggerDefault, logRestError);
const mediaLoggerRest = new Rest(mediaUrl + "apilogger/", mediaOAuth.mode, mediaOAuth, loggerDefault, logRestError);
const pwaLoggerRest = new Rest("https://www.christian-riedl.com/nextpwa/apilogger/", dummyOauth.mode, dummyOauth, loggerDefault, logRestError);
const photosLoggerRest = new Rest("https://www.christian-riedl.com/photos/apilogger/", dummyOauth.mode, dummyOauth, loggerDefault, logRestError);
const identityLoggerRest = new Rest("https://www.christian-riedl.com/identity4/apilogger/", dummyOauth.mode, dummyOauth, loggerDefault, logRestError);
loggerServices.push(new LoggerService("SmartHome", smartHomeLoggerRest, loggerDefault, false, "SmartHomeCore"));
loggerServices.push(new LoggerService("Media", mediaLoggerRest, loggerDefault, false, "MediaCore"));
loggerServices.push(new LoggerService("PWAServer", pwaLoggerRest, loggerDefault, false));
loggerServices.push(new LoggerService("PhotoServer", photosLoggerRest, loggerDefault, false));
loggerServices.push(new LoggerService("Identity", identityLoggerRest, loggerDefault, false, "IdentityDuende"));

const birdAppRest = new Rest("https://www.christian-riedl.com/birdapp/", dummyOauth.mode, dummyOauth, loggerDefault, logRestError);

const healthRest = new Rest("https://healthcheckmonitor-hzbybre6chgrepby.westeurope-01.azurewebsites.net/api/", "cors", dummyOauth, loggerDefault);
const healthCheck = new HealthCheck(healthRest, "3g88l5Xb_LipZ4_XZf-CKiNHrpNQflcz10tQACUgVAYAAzFudK2efQ==");

// Create vue App
const app = createApp(App);
registerPlugins(app);

// Provide functions
app.provide(appStateSymbol, appState);
app.provide(appConfigSymbol, appConfig);
app.provide(authorizeSymbol, authorize);
app.provide(sensorsStateSymbol, smartHomeService);
app.provide(sensorCommandsSymbol, smartHomeService);
app.provide(getMediaBinSymbol, () => mediaService);
app.provide(getLoggerServicesSymbol, () => loggerServices);

app.provide("birdAppRest", birdAppRest);
app.provide("healthCheck", healthCheck);

app.config.errorHandler = (err, instance, info) => {
  loggerDefault.error("Vue: " + info);
};
app.config.warnHandler = (err, instance, trace) => {
  loggerDefault.warning("Vue: " + trace);
};

app.mount('#app')
