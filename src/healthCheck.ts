import type { IRest } from "@christianriedl/rest";

export interface IHealthState {
    partitionKey: string;
    rowKey: string;
    lastIsHealthy: boolean;
    consecutiveFailures: number;
    currentlyAlerted: boolean;
    responseTime: number;
    lastSeenUtc?: Date;
    timestamp: Date;
}
export interface IHealthCheck {
    getHealthState(): Promise<IHealthState[]>;
}
export class HealthCheck implements IHealthCheck {
    hostKey: string;
    rest: IRest;
    constructor(rest: IRest, hostKey: string) {
        this.rest = rest;
        this.hostKey = hostKey;
    }
    fixDate(dt: Date | undefined): Date | undefined {
        if (dt) {
            try {
                const str = dt as unknown as string;
                const idx = str.lastIndexOf('.');
                if (idx > 0)
                    return new Date(str.substring(0, idx) + 'Z');
            }
            catch (e) {
            }
        }
        return undefined;
    }
    async getHealthState(): Promise<IHealthState[]> {
        const result = await this.rest.getData<IHealthState[]>(`checkstates?code=${this.hostKey}`);
        if (result.ok && result.result) {
            const states = result.result as IHealthState[];
            for (let i = 0; i < states.length; i++) {
                const state = states[i];
                state.timestamp = this.fixDate(state.timestamp)!;
                if (state.lastSeenUtc) {
                    state.lastSeenUtc = this.fixDate(state.lastSeenUtc);
                }
            }
            return states;
        }
        return [];
    }

}
