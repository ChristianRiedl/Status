<script setup lang="ts">
    import { computed } from 'vue';
    import type { ITopic } from "../interfaces";
    import type { Dictionary } from '@christianriedl/utils';

    const props = defineProps<{ values: Dictionary<string> }>();
    const emits = defineEmits<{ (e: 'goto', target:string): void }>();

    const tempW = computed (() => props.values["HomeMatic.WeatherStation.Temperature"]
                                ? `${props.values["HomeMatic.WeatherStation.Temperature"]} / ${props.values["HomeMatic.WeatherRoom.Temperature"]} °`
                                : "");
    const tempL = computed (() => props.values["HomeMaticRemote.WeatherStationLS.Temperature"]
                                ? `${props.values["HomeMaticRemote.WeatherStationLS.Temperature"]} / ${props.values["HomeMaticRemote.WohnzimmerLS.Temperature"]} °`
                                : "");
    const serverok = computed (() => props.values["HomeNetwork.RICSRV2019.On"] == 'True');
    const server = computed (() => serverok.value
                                ? `CPU ${props.values["HomeNetwork.RICSRV2019.TotalCPU"]}% MEM ${props.values["HomeNetwork.RICSRV2019.TotalMemory"]}% - ${props.values["HomeMatic.Switch_2.Power"]}W`
                                : 'OFFLINE' );
    const disks = computed(() => serverok.value ? `${props.values["HomeNetwork.RICSRV2019.Info"]}` : 'OFFLINE');
    const fans = computed(() => serverok.value ? `${props.values["HomeNetwork.RICSRV2019.Fans"]}` : 'OFFLINE');
    const temperatures = computed(() => serverok.value ? `${props.values["HomeNetwork.RICSRV2019.Temperatures"]}` : 'OFFLINE');
    const driveTemperatures = computed(() => serverok.value ? `${props.values["HomeNetwork.RICSRV2019.DriveTemperatures"]}` : 'OFFLINE');

    const nasok = computed(() => props.values["HomeNetwork.RIC-NAS.On"] == 'True');
    const nas = computed(() => nasok.value
        ? `CPU ${props.values["HomeNetwork.RIC-NAS.TotalCPU"]}% - MEM ${props.values["HomeNetwork.RIC-NAS.TotalMemory"]}%`
        : 'OFFLINE');
    const nasdisks = computed(() => nasok.value ? `${props.values["HomeNetwork.RIC-NAS.Info"]}` : 'OFFLINE');
    const nasdiskused = computed(() => nasok.value ? `DISK USED ${props.values["HomeNetwork.RIC-NAS.LogFilesSize"]} %` : 'OFFLINE');
    const nasdriveTemperatures = computed(() => nasok.value ? nasDriveTemperatures(props.values["HomeNetwork.RIC-NAS.DriveTemperatures"]) : 'OFFLINE');

    const piokW = computed(() => props.values["HomeNetwork.RICPI1.On"] == 'True');
    const piW = computed (() => piokW.value
                                ? `CPU ${props.values["HomeNetwork.RICPI1.TotalCPU"]}% MEM ${props.values["HomeNetwork.RICPI1.TotalMemory"]}%`
                                : 'OFFLINE' );
    const piokL = computed (() => props.values["HomeNetwork.OOEPI.On"] == 'True');
    const piL = computed (() => piokL.value
                                ? `CPU ${props.values["HomeNetwork.OOEPI.TotalCPU"]}% MEM ${props.values["HomeNetwork.OOEPI.TotalMemory"]}%`
                                : 'OFFLINE' );
    const isAlarm = computed(() => props.values["OfficeService.ALARMANLAGE.AlarmDelayed"] == 'True');
    const alarmText = computed(() => isAlarm.value
                                ? 'ALARM !!!!'
                                : ( props.values["OfficeService.ALARMANLAGE.Automatik"] == 'True' ? 'ALARM auf Automatik' : 'Alarm' ) 
                                );
    const climaText = computed(() => `${props.values["FritzBox.FritzSwitch_4.Power"]} W`);
    const tvText = computed(() => `TV - ${Math.round(Number(props.values["FritzBox.FritzSwitch_1.Power"]))} W`);
                                    
    function goto (target: string) {
        emits ('goto', target);
    }
    function nasDriveTemperatures(temp: string) {
        //Drive 1: 30, Drive 2: 30, M.2 Drive 1: 42, M.2 Drive 2: 43
        const arr = temp.split(',');
        for (let i = 0; i < arr.length; i++) {
            const idx = arr[i].indexOf(':');
            arr[i] = arr[i].substring(idx + 1).trim();
        }
        return `D ${arr[0]},${arr[1]} M2 ${arr[2]},${arr[3]} °C`;
    }
</script>

<template>
<svg viewBox="0 0 700 370" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com">
  <rect x="0" y="0" width="700" height="370" class="bg"/>
  <g>
      <rect x="160" y="10" width="530" height="350" class="bglocation" />
      <text class="textbold colorblack" x="170" y="30">Wien</text>
      <text class="textnormal colorblack" x="420" y="30" :class="{ colorok: props.values['OfficeService.ric@rts.co.at.AtHome'] == 'True'}">CHRISTIAN</text>
      <text class="textnormal colorblack" x="520" y="30" :class="{ colorok: props.values['OfficeService.rih@rts.co.at.AtHome'] == 'True'}">HALINA</text>
      <text class="textnormal colorblack anchorend" x="660" y="30">{{tempW}}</text>
      <g>
          <rect x="420" y="40" width="260" height="310" class="bgdevice" />
          <text class="textbold colorblack" x="430" y="60">RICSRV2019</text>
          <text id="text-3" class="textsmall anchorend" :class="{ colorok: serverok, colorbad: !serverok}" x="670" y="60">{{server}}</text>
          <text id="text-4" class="textsmall anchorend" :class="{ colorok: serverok, colorbad: !serverok}" x="670" y="70">{{disks}}</text>
          <text id="text-5" class="textsmall anchorend" :class="{ colorok: serverok, colorbad: !serverok}" x="670" y="80">{{driveTemperatures + " °C"}}</text>
          <text id="text-6" class="textsmall anchorend" :class="{ colorok: serverok, colorbad: !serverok}" x="670" y="90">{{temperatures + " °C"}}</text>
          <text id="text-7" class="textsmall anchorend" :class="{ colorok: serverok, colorbad: !serverok}" x="670" y="100">{{fans + " /min"}}</text>
          <g>
              <rect x="430" y="110" width="240" height="60" class="bgservice" :class="{ bgservicebad: props.values['LOGGER.SmartHome'] != 'true'}" />
              <text class="textbold colorblack" x="440" y="130">Smarthome-Service</text>
              <text class="textnormal" x="440" y="145" :class="{ colorok: props.values['OfficeService.OfficeService.OK'] == 'True', colorbad: props.values['OfficeService.OfficeService.OK'] != 'True' }">Office-Service</text>
              <text class="textnormal colorblack" x="440" y="160" :class="{ colorbad: isAlarm }">{{alarmText}}</text>
          </g>
          <g>
              <rect x="430" y="180" width="240" height="80" class="bgservice" :class="{ bgservicebad: props.values['LOGGER.Media'] != 'true'}" />
              <text class="textbold colorblack" x="440" y="200">Media-Service</text>
              <text class="textnormal" x="440" y="215" :class="{ colorok: props.values['MEDIA.ROON-SOUNDBAR'] == 'true', colorbad: props.values['MEDIA.ROON-SOUNDBAR'] != 'true' }">ROON</text>
              <text class="textnormal colorblack" x="440" y="230">DLNA</text>
              <text class="textnormal colorblack" x="440" y="245">EPG</text>
          </g>
          <g>
              <rect x="430" y="270" width="240" height="30" class="bgservice blueborder" @click="goto('/identity4/')" :class="{ bgservicebad: props.values['LOGGER.Identity'] != 'true'}" />
              <text class="textbold colorblack" x="440" y="290" @click="goto('/identity4/')">Identity-Service</text>
          </g>
          <g>
              <rect x="430" y="310" width="90" height="30" class="bgservice blueborder" @click="goto('/photos/speedtest')" :class="{ bgservicebad: props.values['LOGGER.PhotoServer'] != 'true'}" />
              <text class="textbold colorblack" x="440" y="330" @click="goto('/photos/speedtest')">Foto-Service</text>
          </g>
          <g>
              <rect x="530" y="310" width="80" height="30" class="bgservice blueborder" @click="goto('/nextpwa/')" :class="{ bgservicebad: props.values['LOGGER.PWAServer'] != 'true'}" />
              <text class="textbold colorblack" x="535" y="330" @click="goto('/nextpwa/')">UI-Service</text>
          </g>
          <g>
              <rect x="620" y="310" width="50" height="30" class="bgservice blueborder" @click="goto('/birdapp/')" :class="{ bgservicebad: props.values['BIRDAPP'] != 'true'}" />
              <text class="textbold colorblack" x="625" y="330" @click="goto('/birdapp/')">BIRDS</text>
          </g>
      </g>
      <g>
          <rect x="170" y="40" width="120" height="55" class="bgdevice blueborder" :class="{ bgdevicebad: !piokW}" @click="goto('http://ricpi1:8080/')" />
          <text class="textbold colorblack anchormiddle" x="230" y="55" @click="goto('http://ricpi1:8080/')">PI Touch</text>
          <text class="textnormal anchormiddle" :class="{ colorok: piokW, colorbad: !piokW}" x="230" y="70" @click="goto('http://ricpi1:8080/')">{{piW}}</text>
          <text class="textnormal colorblack anchormiddle" x="230" y="85" :class="{ colorbad: props.values['WeatherStation.WeatherStation.OK'] != 'True'}" @click="goto('http://ricpi1:8080/')">Tinkerforge</text>
      </g>
      <g>
          <rect x="170" y="110" width="120" height="30" class="bgdevice blueborder" :class="{ bgdevicebad: props.values['HomeMatic.HomeMatic.OK'] != 'True'}" @click="goto('http://ccu3-webui/login.htm')" />
          <text class="textnormal anchormiddle" x="230" y="130" @click="goto('http://ccu3-webui/login.htm')">Homematic</text>
      </g>
      <g>
          <rect x="170" y="150" width="120" height="30" class="bgdevice blueborder" :class="{ bgdevicebad: props.values['SomfyShutter.SomfyShutter.OK'] != 'True'}" @click="goto('http://ESPSomfyRTS')" />
          <text class="textnormal anchormiddle" x="230" y="170" @click="goto('http://ESPSomfyRTS')">ESPSomfy</text>
      </g>
      <g>
          <rect x="170" y="190" width="120" height="30" class="bgdevice blueborder" :class="{ bgdevicebad: props.values['HomeNetwork.GlobalCache.On'] != 'True'}" @click="goto('http://192.168.1.107/index.htm')" />
          <text class="textnormal anchormiddle" x="230" y="210" @click="goto('http://192.168.1.107/index.htm')">Globalcache</text>
      </g>
      <g>
          <rect x="170" y="230" width="120" height="30" class="bgdevice blueborder" :class="{ bgdevicebad: props.values['HomeNetwork.DCS2132Camera.On'] != 'True'}" @click="goto('http://192.168.1.210/')" />
          <text class="textnormal anchormiddle" x="230" y="250" @click="goto('http://192.168.1.210/')">Webcam VZ</text>
      </g>
      <g>
          <rect x="170" y="270" width="120" height="30" class="bgdevice blueborder" :class="{ bgdevicebad: props.values['HomeNetwork.DCS5222Camera.On'] != 'True'}" @click="goto('http://192.168.1.222/')" />
          <text class="textnormal anchormiddle" x="230" y="290" @click="goto('http://192.168.1.222/')">Webcam WZ</text>
      </g>
      <g>
          <rect x="170" y="310" width="120" height="30" class="bgdevice" />
          <text class="textnormal anchormiddle colorblack" x="230" y="330" :class="{ colorok: props.values['HomeNetwork.SamsungTV.On'] == 'True'}">{{tvText}}</text>
      </g>
      <g>
          <rect x="300" y="40" width="110" height="70" class="bgdevice blueborder" :class="{ bgdevicebad: !nasok}" @click="goto('http://ric-nas:5000/')"/>
          <text class="textbold" x="310" y="60">RICNAS</text>
          <text id="text-13" class="textsmall anchorend" :class="{ colorok: nasok, colorbad: !nasok}" x="400" y="75">{{nas}}</text>
          <text id="text-14" class="textsmall anchorend" :class="{ colorok: nasok, colorbad: !nasok}" x="400" y="85">{{nasdisks}}</text>
          <text id="text-15" class="textsmall anchorend" :class="{ colorok: nasok, colorbad: !nasok}" x="400" y="95">{{nasdriveTemperatures}}</text>
          <text id="text-16" class="textsmall anchorend" :class="{ colorok: nasok, colorbad: !nasok}" x="400" y="105">{{nasdiskused}}</text>
      </g>
      <g>
          <rect x="300" y="310" width="110" height="40" class="bgdevice" />
          <text class="textbold anchormiddle" x="355" y="325">Klimaanlage</text>
          <text class="textnormal anchormiddle" x="355" y="340">{{climaText}}</text>
      </g>
  </g>
  <g>
    <rect x="10" y="10" width="140" height="160" class="bglocation"/>
    <text class="textbold colorblack" x="20" y="30">Leonstein</text>
    <text class="textnormal colorblack anchorend" x="150" y="30" >{{tempL}}</text>
    <g>
      <rect x="20" y="40" width="120" height="120" class="bgdevice" :class="{ bgdevicebad: !piokL}"/>
      <text class="textbold colorblack anchormiddle" x="80" y="55">PI</text>
      <text class="textnormal anchormiddle" :class="{ colorok: piokL, colorbad: !piokL}" x="80" y="70">{{piL}}</text>
      <g>
        <rect x="30" y="80" width="100" height="30" class="bgservice blueborder" @click="goto('https://smarthomeremote-ric1.eu1.pitunnel.com/')" />
        <text class="textbold colorblack anchormiddle" x="80" y="100" @click="goto('https://smarthomeremote-ric1.eu1.pitunnel.com/')">Smarthome</text>
      </g>
      <g>
        <rect x="30" y="120" width="100" height="30" class="bgservice blueborder" @click="goto('https://dlnaproxyserver-ric1.eu1.pitunnel.com/')" />
        <text class="textbold colorblack anchormiddle" x="80" y="140" @click="goto('https://dlnaproxyserver-ric1.eu1.pitunnel.com/')">DLNA Proxy</text>
      </g>
    </g>
  </g>
</svg>
</template>

<style scoped>
    .textbold {
        font-family: Arial;
        font-size: 12px;
        font-weight: 700;
    }
    .textnormal {
        font-family: Arial;
        font-size: 12px;
    }
    .textsmall {
        font-family: Arial;
        font-size: 9px;
    }
    .anchormiddle {
        text-anchor: middle;
    }
    .anchorend {
        text-anchor: end;
    }
    .colorblack {
        fill: rgb(51, 51, 51);
    }
    .colorok {
        fill: rgb(0, 128, 0) !important;
    }
    .colorbad {
        fill: rgb(128, 0, 0) !important;
    }
    .bg {
        fill: rgb(150,150, 150);
    }
    .bglocation {
        fill: rgb(180, 180, 180);
    }
    .bgdevice {
        fill: rgb(151, 151, 151);
    }
    .bgdevicebad {
        fill: rgb(151, 151, 151) !important;
        stroke: red !important;
        stroke-width: 2px;
    }
    .bgservice {
        fill: rgb(199, 199, 199);
    }
    .bgservicebad {
        fill: rgb(199, 199, 199) !important;
        stroke: red !important;
        stroke-width: 2px;
    }
    .blueborder {
        stroke: blue;
        stroke-width: 1px;
    }
</style>
