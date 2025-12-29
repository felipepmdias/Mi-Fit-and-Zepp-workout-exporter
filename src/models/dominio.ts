export interface IResumoAtividade {
    idRastreamento: string;
    origem: string;
    distancia: number; // metros
    calorias: number;
    horarioFim: Date;
    duracao: number; // segundos
    ritmoMedio: number; // min/km ou similar
    frequenciaCardiacaMedia: number;
    tipoAtividade: number;
    localizacao?: string;
    tituloEsporte?: string;
    passosTotais?: number;
    subidaTotal?: number;
    descidaTotal?: number;
    dadosExtras?: string;
}

export interface IDetalheAtividade {
    idRastreamento: string;
    origem: string;
    dadosTempo: string | null;     // time
    dadosPosicao: string | null;   // longitude_latitude (combined raw string)
    dadosAltitude: string | null;  // altitude
    dadosFrequenciaCardiaca: string | null; // heart_rate
    dadosCadencia: string | null;  // cadence/gait
    dadosRitmo: string | null;     // pace
    dadosVoltas: string | null;    // lap
    pontosEixoX?: number[]; // times parsados
    // Adicionar outros campos conforme a necessidade de mapeamento reverso ou uso direto
}

export interface IResumoPeso {
    peso: number;
    imc: number;
    tipoDispositivo?: number;
    origem?: number;
}

export interface IRegistroPeso {
    idUsuario: string;
    idMembro: string;
    nomeApp: string;
    horarioGeracao: number; // timestamp
    tipoPeso: number;
    resumo: IResumoPeso;
    horarioCriacao: number; // timestamp
}

export interface IHistoricoPeso {
    itens: IRegistroPeso[];
}
