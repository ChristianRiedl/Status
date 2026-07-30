<script setup lang="ts">
    import type { IHealthState } from "../healthCheck";
    import type { Dictionary } from '@christianriedl/utils';
    const props = defineProps<{ states: IHealthState[] }>();
    const links: Dictionary<string> = {
        "http-BM06-BMWebApp": "https://bm06.bmwien.org",
        "http-BM15-BMWebApp": "https://bm15.bmwien.org",
        "http-RIC-BMWebApp": "https://ric.bmwien.org",
        "http-OOE-Pi": "https://www.pitunnel.com/devices",
        "http-RIC-Photos": "https://www.christian-riedl.com/photos/speedtest",
        "http-RIC-PWA": "https://www.christian-riedl.com/nextpwa",
        "http-RIC-Identity": "https://www.christian-riedl.com/identity4",
    };
    function formatDiffToNow(dt: Date | undefined): string {
        if (!dt)
            return "";
        const diffMs = new Date().getTime() - dt.getTime(); // Millisekunden-Differenz

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        // zweistellige Ausgabe für hh und mm
        const hh = String(hours).padStart(2, "0");
        const mm = String(minutes).padStart(2, "0");

        if (days)
            return `since ${days} ${hh}:${mm}`;
        else
            return `since ${hh}:${mm}`;
    }

</script>

<template>
    <v-row density="compact" class="font-weight-bold">
        <v-col cols="4">SERVICE</v-col>
        <v-col cols="2">HEALTHY</v-col>
        <v-col cols="2">ALERTED</v-col>
        <v-col cols="2">FAILURES</v-col>
        <v-col cols="2">RESPONSE(ms)</v-col>
    </v-row>
    <v-row density="compact" class="align-center no-margin" v-for="(state, index) in props.states" :key="index">
        <v-col v-if="links[state.rowKey]" cols="4">
            <a :href="links[state.rowKey]" target="_blank" rel="noopener noreferrer">{{state.rowKey}}</a>
        </v-col>
        <v-col v-else cols="4">{{state.rowKey}}</v-col>
        <v-col cols="2"><v-checkbox :model-value="state.lastIsHealthy" hide-details density="compact"></v-checkbox></v-col>
        <v-col cols="2"><v-checkbox :model-value="state.currentlyAlerted" hide-details density="compact"></v-checkbox></v-col>
        <v-col cols="2">{{state.consecutiveFailures}}</v-col>
        <v-col v-if="state.rowKey.startsWith('heartbeat:')" cols="2">{{formatDiffToNow(state.lastSeenUtc)}}</v-col>
        <v-col v-else cols="2">{{state.responseTime}}</v-col>
    </v-row>
</template>

<style type="scoped">
    .no-margin {
        margin-top: 0px !important;
    }
</style>

