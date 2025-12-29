import axios, { AxiosInstance } from 'axios';
import { ControladorBase } from './ControladorBase';
import { IControladorServico } from './interfaces';
import { IResumoAtividade, IDetalheAtividade, IHistoricoPeso, IRegistroPeso } from '../models/dominio';
import {
    WorkoutHistorySchema,
    WorkoutDetailSchema,
    WeightHistorySchema,
    WorkoutSummary
} from '../types';

const APP_PLATFORM = 'web';
const APP_NAME = 'com.xiaomi.hm.health';

export class HuamiControlador extends ControladorBase implements IControladorServico {

    protected configurarCliente(): AxiosInstance {
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                'apptoken': this.token,
                'appPlatform': APP_PLATFORM,
                'appname': APP_NAME,
            },
        });
    }

    async buscarHistoricoAtividades(idReferencia?: number): Promise<{ itens: IResumoAtividade[], proximoId?: number }> {
        const params: Record<string, any> = {};
        if (idReferencia !== undefined) {
            params.trackid = idReferencia;
        }

        const dadosBrutos = await this.get<any>('/v1/sport/run/history.json', { params });
        const historicoValidado = WorkoutHistorySchema.parse(dadosBrutos);

        return {
            itens: historicoValidado.data.summary.map(this.mapearResumo),
            proximoId: historicoValidado.data.next
        };
    }

    async buscarDetalheAtividade(resumo: IResumoAtividade): Promise<IDetalheAtividade> {
        // Precisamos reconstruir o parametro de source e trackid baseados no resumo
        // O resumo passado já é o nosso objeto de dominio, mas a API precisa dos parâmetros originais
        // Vou assumir que o 'origem' mapeia para 'source' e 'trackid' para 'idRastreamento'

        const params = {
            trackid: resumo.idRastreamento,
            source: resumo.origem,
        };

        const dadosBrutos = await this.get<any>('/v1/sport/run/detail.json', { params });
        const detalheValidado = WorkoutDetailSchema.parse(dadosBrutos);
        const data = detalheValidado.data;

        return {
            idRastreamento: String(data.trackid),
            origem: data.source,
            dadosTempo: data.time || null,
            dadosPosicao: data.longitude_latitude || null,
            dadosAltitude: data.altitude || null,
            dadosFrequenciaCardiaca: data.heart_rate || null,
            dadosCadencia: data.gait || null, // gait costuma ter passos e cadencia
            dadosRitmo: data.pace || null,
            dadosVoltas: data.lap || null,
            // A API original retornava isso dentro do detail mas o parsing complexo acontecia fora
            // Vamos manter os dados brutos strings aqui para o parser processar
        };
    }

    async buscarHistoricoPeso(idUsuario: string): Promise<IHistoricoPeso> {
        const dadosBrutos = await this.get<any>(`/users/${idUsuario}/members/-1/weightRecords`);
        const historicoValidado = WeightHistorySchema.parse(dadosBrutos);

        const itensMapeados: IRegistroPeso[] = historicoValidado.items.map(item => ({
            idUsuario: item.userId,
            idMembro: item.memberId,
            nomeApp: item.appName,
            horarioGeracao: item.generatedTime,
            tipoPeso: item.weightType,
            horarioCriacao: item.createTime,
            resumo: {
                peso: item.summary.weight,
                imc: item.summary.bmi,
                tipoDispositivo: item.summary.deviceType,
                origem: item.summary.source
            }
        }));

        return { itens: itensMapeados };
    }

    async buscarDispositivos(idUsuario: string): Promise<any> {
        const dadosBrutos = await this.get<any>(`/users/${idUsuario}/devices`);
        return dadosBrutos;
    }

    // Helpers de Mapeamento

    private mapearResumo(w: WorkoutSummary): IResumoAtividade {
        return {
            idRastreamento: w.trackid,
            origem: w.source,
            distancia: parseFloat(w.dis),
            calorias: parseFloat(w.calorie),
            horarioFim: new Date(parseInt(w.end_time) * 1000), // assumindo segundos
            duracao: parseInt(w.run_time),
            ritmoMedio: parseFloat(w.avg_pace || '0'),
            frequenciaCardiacaMedia: parseFloat(w.avg_heart_rate),
            tipoAtividade: w.type,
            localizacao: w.location,
            tituloEsporte: w.sport_title || undefined,
            passosTotais: w.total_step || undefined,
            subidaTotal: w.altitude_ascend || undefined,
            descidaTotal: w.altitude_descend || undefined,
            dadosExtras: w.add_info || undefined
        };
    }

    // A lógica de extração complexa de lat/lon estava no parsing.ts, mas agora repassamos bruto.
}
