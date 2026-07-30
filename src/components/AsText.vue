<script setup lang="ts">
    import type { ITopic } from "../interfaces";
    const props = defineProps<{ values: ITopic[]  }>();
</script>

<template>
    <v-row density="compact" class="font-weight-bold">
        <v-col cols = "3">DEVICE</v-col>
        <v-col cols = "3">SENSOR</v-col>
        <v-col cols = "3">VALUENAME</v-col>
        <v-col cols = "3">VALUE</v-col>
    </v-row>
    <v-row density="compact" v-for="(value, index) in props.values" :key="index">
        <v-col cols = "3">{{value.device}}</v-col>
        <v-col cols = "3">{{value.sensor}}</v-col>
        <v-col cols = "3">{{value.valueName}}</v-col>
        <v-col cols = "3">{{value.value}}</v-col>
    </v-row>
</template>
