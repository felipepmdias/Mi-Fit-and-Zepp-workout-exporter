import { IResumoAtividade, IDetalheAtividade, IHistoricoPeso } from '../models/dominio';

export interface IControladorServico {
    buscarHistoricoAtividades(idReferencia?: number): Promise<{ itens: IResumoAtividade[], proximoId?: number }>;
    buscarDetalheAtividade(resumo: IResumoAtividade): Promise<IDetalheAtividade>;
    buscarHistoricoPeso(idUsuario: string): Promise<IHistoricoPeso>;
    buscarDispositivos(idUsuario: string): Promise<any>;
}
