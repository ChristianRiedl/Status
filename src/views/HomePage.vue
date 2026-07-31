<script setup lang="ts">
    import { inject, ref, reactive, onMounted } from 'vue';
    import { Authorize, authorizeSymbol } from '@christianriedl/rest';
    import type { IRest } from '@christianriedl/rest';
    import { appConfigSymbol } from '@christianriedl/utils';
    import type { IAppConfig, Dictionary } from '@christianriedl/utils';
    import { sensorsStateSymbol } from '@christianriedl/smarthome';
    import type { SmartHomeService, IValueSelection } from '@christianriedl/smarthome';
    import { getMediaBinSymbol } from '@christianriedl/media';
    import type { IMediaService } from '@christianriedl/media';
    import { LoggerService, getLoggerServicesSymbol } from "@christianriedl/logger";
    import type { ILoggerService } from "@christianriedl/logger";
    import type { ITopic } from "../interfaces";
    import type { IHealthCheck, IHealthState } from "../healthCheck";
    import AsText from "../components/AsText.vue";
    import AsSvg from "../components/AsSvg.vue";
    import Health from "../components/Health.vue";

    const authorize = inject(authorizeSymbol)!;
    const appConfig = inject(appConfigSymbol)!;
    const getMediaService = inject(getMediaBinSymbol)!;
    const mediaService = getMediaService();
    const smarthomeService = inject(sensorsStateSymbol)! as SmartHomeService;
    const getLoggerServices = inject(getLoggerServicesSymbol)!;
    const loggerServices = getLoggerServices();
    const birdAppRest = inject("birdAppRest")! as IRest;
    const identityRest = inject("identityRest") as IRest | undefined;
    const healthCheck = inject("healthCheck")! as IHealthCheck;
    const logger = smarthomeService.logger;
    const email = ref(authorize.user);
    const password = ref(authorize.password);
    const result = ref("");
    const showpwd = ref(false);
    const fake = location.hostname == 'localhost';;
    const authenticated = ref(false);
    const pwaDisabled = ref(true);
    const photosDisabled = ref(true);
    const identityDisabled = ref(true);
    const values = reactive<ITopic[]>([]);
    const valuesDict = reactive<Dictionary<string>>({});
    const mediaStatus = reactive<Dictionary<boolean>>({});
    const smartHomeValues = reactive<Dictionary<string>[]>([]);
    const loggerStatus = reactive<Dictionary<boolean>>({});
    const birdAppStatus = ref(false);
    const healthStates = ref<IHealthState[]>([]);
    const asSvg = ref(true);
    const asHealthCheck = ref(false);

    const sensors: IValueSelection[] = [
        { deviceName: "HomeNetwork", sensorName: "RICSRV2019", valueNames: ["On", "TotalCPU", "TotalMemory", "Info", "Fans", "Temperatures", "DriveTemperatures" ] },
        { deviceName: "HomeNetwork", sensorName: "RIC-NAS", valueNames: ["On", "TotalCPU", "TotalMemory", "ErrorCount", "Info", "LogFilesSize", "DriveTemperatures"] },
        { deviceName: "HomeNetwork", sensorName: "RICPI1", valueNames: ["On", "TotalCPU", "TotalMemory" ] },
        { deviceName: "HomeNetwork", sensorName: "OOEPI", valueNames: ["On", "TotalCPU", "TotalMemory" ] },
        { deviceName: "HomeMatic", sensorName: "HomeMatic", valueNames: ["OK" ] },
        { deviceName: "OfficeService", sensorName: "OfficeService", valueNames: ["OK" ] },
        { deviceName: "SomfyShutter", sensorName: "SomfyShutter", valueNames: ["OK" ] },
        { deviceName: "WeatherStation", sensorName: "WeatherStation", valueNames: ["OK" ] },
        { deviceName: "HomeNetwork", sensorName: "DCS2132Camera", valueNames: ["On" ] },
        { deviceName: "HomeNetwork", sensorName: "DCS5222Camera", valueNames: ["On" ] },
        { deviceName: "HomeNetwork", sensorName: "GlobalCache", valueNames: ["On" ] },
        { deviceName: "HomeNetwork", sensorName: "SamsungTV", valueNames: ["On" ] },
        { deviceName: "OfficeService", sensorName: "ric@rts.co.at", valueNames: ["AtHome" ] },
        { deviceName: "OfficeService", sensorName: "rih@rts.co.at", valueNames: ["AtHome" ] },
        { deviceName: "OfficeService", sensorName: "ALARMANLAGE", valueNames: ["Automatik", "AlarmDelayed" ] },
        { deviceName: "HomeMatic", sensorName: "WeatherStation", valueNames: ["Temperature" ] },
        { deviceName: "HomeMatic", sensorName: "WeatherRoom", valueNames: ["Temperature" ] },
        { deviceName: "HomeMaticRemote", sensorName: "WeatherStationLS", valueNames: ["Temperature" ] },
        { deviceName: "HomeMaticRemote", sensorName: "WohnzimmerLS", valueNames: ["Temperature" ] },
        { deviceName: "HomeMatic", sensorName: "Switch_2", valueNames: ["Power" ] },
        { deviceName: "FritzBox", sensorName: "FritzSwitch_1", valueNames: ["Power" ] },
        { deviceName: "FritzBox", sensorName: "FritzSwitch_4", valueNames: ["Power" ] },
    ];

    onMounted (async () => {
        if (fake) {
            authenticated.value = true;
            onStartFake();
        }
        else {
            if (authorize.password) {
                const auth = await authorize.login(authorize.user, authorize.password);
                if (auth && auth.smarthomeSecret && auth.mediaSecret && auth.scopes) {
                    logger.info(`Authorization initialized with scopes ${auth.scopes}`);
                    authenticated.value = true;
                    onStart();
                }
                else if (authorize.lastStatus != 401 && authorize.lastStatus != 200) {
                    authenticated.value = true;
                    onStartOffline();
                }
            }
        }
    });

    async function onStart()
    {
        const status = await mediaService.getStatus();
        logger.info (`MEDIA : ${!!status}`);
        for (var key in status) {
            mediaStatus[key] = Boolean(status[key]);
        }
        const manyValues = await smarthomeService.getManyValues(sensors);
        for (let i = 0; i < manyValues.length; i++) {
            const sensor = sensors[i];
            const sensorValues = manyValues[i];
            smartHomeValues.push(sensorValues);
        }
        logger.info (`SMARTHOME : ${!!smartHomeValues}`);
        for (let i = 0; i < loggerServices.length; i++) {
            const loggerService = loggerServices[i];
            //const res = await loggerService.getLoggers();
            try {
                const res = await loggerService.getProviders(); // is Shorter
                loggerStatus[loggerService.name] = !!res;
                switch (loggerService.name) {
                    case 'PWAServer':
                        pwaDisabled.value = false;
                        break;
                    case 'PhotoServer':
                        photosDisabled.value = false;
                        break;
                    case 'Identity':
                        identityDisabled.value = false;
                        break;
                }
                logger.info (`LOGGER ${loggerService.name} : ${!!res}`);
            }
            catch (reason) {
                loggerStatus[loggerService.name] = false;
                logger.warning (`LOGGER ${loggerService.name} : ${reason}`);
            }
        }
        const res = await birdAppRest.getData<any>('status');
        if (res && res.ok && res.result)
            birdAppStatus.value = true;

        if (identityRest) {
            const identityRes = await identityRest.getData<any>('.well-known/openid-configuration');
            const identityStatus = !!(identityRes && identityRes.ok && identityRes.result);
            loggerStatus["Identity"] = identityStatus;
            logger.info(`LOGGER Identify : ${identityStatus}`);
            identityDisabled.value = !identityStatus;
        }

        showValues();
    }
    async function onStartFake()
    {
        mediaStatus["ROON-SOUNDBAR"] = true;
        smartHomeValues.push({
            On: "True", TotalCPU: "77", TotalMemory: "55", Info: "C:ON D:On E:On F:On G:On H:On ", Fans: "CPU:1234",
            Temperatures: "CPU:27 PCH:55 GPU:66", DriveTemperatures: "C:27 D:55 E:66"
        });
        smartHomeValues.push({
            On: "True", TotalCPU: "77", TotalMemory: "55", ErrorCount: "10",Info: "C:ON", LogFilesSize: "100", DriveTemperatures: "C:27 D:55 E:66"
        });
        smartHomeValues.push ({ On: "True", TotalCPU: "77", TotalMemory: "55"});
        smartHomeValues.push ({ On: "True", TotalCPU: "77", TotalMemory: "55"});
        smartHomeValues.push ({ OK: "True"});
        smartHomeValues.push ({ OK: "True"});
        smartHomeValues.push ({ OK: "True"});
        smartHomeValues.push ({ OK: "True"});
        smartHomeValues.push ({ On: "True"});
        smartHomeValues.push ({ On: "True"});
        smartHomeValues.push ({ On: "True"});
        smartHomeValues.push ({ On: "True"});
        smartHomeValues.push ({ AtHome: "True" });
        smartHomeValues.push ({ AtHome: "True" });
        smartHomeValues.push ({ Automatik: "True", AlarmDelayed : "True" });
        smartHomeValues.push ({ Temperature: "10"});
        smartHomeValues.push ({ Temperature: "20"});
        smartHomeValues.push ({ Temperature: "11"});
        smartHomeValues.push ({ Temperature: "21"});
        smartHomeValues.push ({ Power: "38"});
        smartHomeValues.push ({ Power: "160"});
        smartHomeValues.push ({ Power: "400"});
        loggerStatus["SmartHome"] = true;
        loggerStatus["Media"] = true;
        loggerStatus["PWAServer"] = true;
        loggerStatus["PhotoServer"] = true;
        loggerStatus["Identity"] = true;
        birdAppStatus.value = true;
        showValues();
    }
    function onStartOffline() {
        mediaStatus["ROON-SOUNDBAR"] = false;
        smartHomeValues.push({
            On: "False", TotalCPU: "0", TotalMemory: "0", Info: "OFFLINE ", Fans: "",
            Temperatures: "", DriveTemperatures: ""
        });
        smartHomeValues.push({
            On: "False", TotalCPU: "0", TotalMemory: "0", ErrorCount: "0", Info: "UNKNOWN", LogFilesSize: "0", DriveTemperatures: ""
        });
        smartHomeValues.push({ On: "False", TotalCPU: "", TotalMemory: "0" });
        smartHomeValues.push({ On: "False", TotalCPU: "0", TotalMemory: "0" });
        smartHomeValues.push({ OK: "False" });
        smartHomeValues.push({ OK: "False" });
        smartHomeValues.push({ OK: "False" });
        smartHomeValues.push({ OK: "False" });
        smartHomeValues.push({ On: "False" });
        smartHomeValues.push({ On: "False" });
        smartHomeValues.push({ On: "False" });
        smartHomeValues.push({ On: "False" });
        smartHomeValues.push({ AtHome: "False" });
        smartHomeValues.push({ AtHome: "False" });
        smartHomeValues.push({ Automatik: "False", AlarmDelayed: "False" });
        smartHomeValues.push({ Temperature: "0" });
        smartHomeValues.push({ Temperature: "0" });
        smartHomeValues.push({ Temperature: "0" });
        smartHomeValues.push({ Temperature: "0" });
        smartHomeValues.push({ Power: "0" });
        smartHomeValues.push({ Power: "0" });
        smartHomeValues.push({ Power: "0" });
        loggerStatus["SmartHome"] = false;
        loggerStatus["Media"] = false;
        loggerStatus["PWAServer"] = false;
        loggerStatus["PhotoServer"] = false;
        loggerStatus["Identity"] = false;
        birdAppStatus.value = false;
        showValues();
    }
    function showValues ()
    {
        for (var key in mediaStatus) {
            if (asSvg.value) {
                valuesDict[`MEDIA.${key}`] = mediaStatus[key].toString();
            }
            else {
                values.push ({ device: 'MEDIA', sensor: key, valueName: 'On', value: mediaStatus[key].toString()});
            }
        }
        for (let i = 0; i < smartHomeValues.length; i++) {
            const sensor = sensors[i];
            const sensorValues = smartHomeValues[i];
            for (var key in sensorValues) {
                if (asSvg.value) {
                    valuesDict[`${sensors[i].deviceName}.${sensor.sensorName}.${key}`] = sensorValues[key];
                }
                else {
                    values.push ({ device: sensors[i].deviceName, sensor: sensor.sensorName, valueName: key, value: sensorValues[key] });
                }
            }
        }
        for (var key in loggerStatus) {
            if (asSvg.value) {
                valuesDict[`LOGGER.${key}`] = loggerStatus[key].toString();
            }
            else {
                values.push ({ device: 'LOGGER', sensor: key, valueName: 'ON', value: loggerStatus[key].toString()});
            }
        }
        if (asSvg.value) {
            valuesDict[`BIRDAPP`] = birdAppStatus.value.toString();
        }
        else {
            values.push ({ device: 'BIRDAPP', sensor: '', valueName: 'ON', value: birdAppStatus.value.toString()});
        }
    }

    async function onLogin() {
        try {
            const res = await authorize.authorize(email.value, password.value);
            if (res.mediaSecret && res.smarthomeSecret && res.scopes) {
                // Write only to storage because app has to reload
                result.value = "Everything OK, restart the app or go back and refresh browser";
                authenticated.value = true;
                onStart();
            }
            else
                result.value = "Probably email or password is wrong, contact ric@rts.co.at";
        }
        catch (reason) {
            if (reason === 500 || reason === 404) {
                result.value = `Something went wrong, contact ric@rts.co.at ${reason}`;
            }
            else
                result.value = `Something went wrong, contact ric@rts.co.at ${reason}`;
        }
    }
    function goto (path : string) {
        if (path.startsWith("http"))
            location.href = path;
        else
            location.pathname = path;
    }
    async function showHealth() {
        healthStates.value = await healthCheck.getHealthState();
        if (healthStates.value && healthStates.value.length) {
            asSvg.value = false;
            asHealthCheck.value = true;
        }
        else {
            alert("Healthcheck not available !!")
        }
    }
    function backFromHealth() {
        healthStates.value = [];
        asHealthCheck.value = false;
        asSvg.value = true;
    }
</script>

<template>
    <v-container v-if="authenticated">
        <as-svg v-if="asSvg" :values="valuesDict" @goto="goto"></as-svg>
        <health v-else-if="asHealthCheck" :states="healthStates"></health>
        <as-text v-else :values="values"></as-text>
        <v-row>
            <v-col cols="2">
                <v-btn size="large" :disabled="pwaDisabled" @click="goto('https://www.christian-riedl.com/nextpwa/')">NEXTPWA</v-btn>
            </v-col>
            <v-col cols="2">
                <v-btn size="large" :disabled="photosDisabled" @click="goto('https://www.christian-riedl.com/photos/speedtest')">PHOTOS</v-btn>
            </v-col>
            <v-col cols="2">
                <v-btn size="large" :disabled="identityDisabled" @click="goto('https://www.christian-riedl.com/identity4/')">IDENTITY</v-btn>
            </v-col>
            <v-col cols="2">
                <v-btn size="large" :disabled="!birdAppStatus" @click="goto('https://www.christian-riedl.com/birdapp/')">BIRD-APP</v-btn>
            </v-col>
            <v-col cols="2">
                <v-btn v-if="asHealthCheck" size="large" @click="backFromHealth">BACK</v-btn>
                <v-btn v-else size="large" @click="showHealth">HEALTH</v-btn>
            </v-col>
        </v-row>
    </v-container>
    <v-container v-else>
        <v-row>
            <v-col cols="12">
                <h2>Enter your email address and password</h2>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-text-field v-model="email" label="Email address" single-line solo></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-text-field :append-icon="showpwd ? '$eye' : '$eye_off'"
                              name="pwd-field"
                              v-model="password"
                              label="Password"
                              :type="showpwd ? 'text' : 'password'"
                              class="input-group--focused"
                              @click:append="showpwd = !showpwd"
                              single-line solo>
                </v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-btn size="large" color="primary" @click="onLogin">LOGIN</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                {{result}}
            </v-col>
        </v-row>
    </v-container>
</template>
