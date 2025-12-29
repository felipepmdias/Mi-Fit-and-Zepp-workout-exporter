import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export abstract class ControladorBase {
    protected cliente: AxiosInstance;
    protected baseUrl: string;
    protected token: string;

    constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.cliente = this.configurarCliente();
    }

    protected abstract configurarCliente(): AxiosInstance;

    protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.cliente.get(url, config);
            return response.data;
        } catch (error) {
            this.tratarErro(error);
            throw error; // Garantir que o erro seja propagado após tratamento/log
        }
    }

    protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.cliente.post(url, data, config);
            return response.data;
        } catch (error) {
            this.tratarErro(error);
            throw error;
        }
    }

    protected tratarErro(error: any): void {
        if (axios.isAxiosError(error)) {
            console.error(`Erro na requisição API: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error(`Dados: ${JSON.stringify(error.response.data)}`);
            }
        } else {
            console.error('Erro desconhecido:', error);
        }
    }
}
