import axios, { AxiosInstance } from 'axios';
import {
    WeightHistory,
    WeightHistorySchema,
    WorkoutHistory,
    WorkoutHistorySchema,
    WorkoutDetail,
    WorkoutDetailSchema,
    WorkoutSummary
} from './types';

const APP_PLATFORM = 'web';
const APP_NAME = 'com.xiaomi.hm.health';

export class Api {
    private baseUrl: string;
    private token: string;
    private client: AxiosInstance;

    constructor(endpoint: string, token: string) {
        this.baseUrl = endpoint;
        this.token = token;

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'apptoken': this.token,
                'appPlatform': APP_PLATFORM,
                'appname': APP_NAME,
            },
        });
    }

    async getWorkoutHistory(fromTrackId?: number): Promise<WorkoutHistory> {
        try {
            const params: Record<string, any> = {};
            if (fromTrackId !== undefined) {
                params.trackid = fromTrackId;
            }

            const response = await this.client.get('/v1/sport/run/history.json', {
                params: params,
            });

            // Parse e Validação com Zod
            return WorkoutHistorySchema.parse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`API Error: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    async getWorkoutDetail(workout: WorkoutSummary): Promise<WorkoutDetail> {
        try {
            const response = await this.client.get('/v1/sport/run/detail.json', {
                params: {
                    trackid: workout.trackid,
                    source: workout.source,
                },
            });

            return WorkoutDetailSchema.parse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`API Error: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    async getWeightRecords(userId: string): Promise<WeightHistory> {
        try {
            const response = await this.client.get(`/users/${userId}/members/-1/weightRecords`);
            return WeightHistorySchema.parse(response.data);
        } catch (error: any) {
            throw error;
        }
    }



    async getDevices(userId: string): Promise<any> {
        try {
            const response = await this.client.get(`/users/${userId}/devices`);
            return response.data;
        } catch (error: any) {
            console.error("Erro original na API de devices:", error.message);
            if (error.response) {
                console.error("Dados do erro:", JSON.stringify(error.response.data));
            }
            throw error;
        }
    }
}
