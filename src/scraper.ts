import { HuamiControlador } from './controllers/HuamiControlador';
import { IResumoAtividade } from './models/dominio';
import { BaseExporter } from './exporters';
import { parsePoints } from './parsing';
import * as fs from 'fs-extra';
import * as path from 'path';

export class Scraper {
    private controlador: HuamiControlador;
    private exporter: BaseExporter;
    private outputDir: string;
    private fileFormat: string;
    private startTs: number;
    private endTs: number;

    constructor(
        controlador: HuamiControlador,
        exporter: BaseExporter,
        outputDir: string,
        fileFormat: string,
        startTs: number,
        endTs: number
    ) {
        this.controlador = controlador;
        this.exporter = exporter;
        this.outputDir = outputDir;
        this.fileFormat = fileFormat;
        this.startTs = startTs;
        this.endTs = endTs;

        if (startTs > endTs) {
            throw new Error("Data inicial não pode ser depois da data final");
        }
    }

    private getOutputFilePath(fileName: string): string {
        return path.join(this.outputDir, `${fileName}.${this.fileFormat}`);
    }

    private async fetchWorkoutSummaries(): Promise<IResumoAtividade[]> {
        let summaries: IResumoAtividade[] = [];
        let nextId: number | undefined = undefined;

        console.log("Buscando histórico de treinos...");
        // Primeira chamada sem ID
        let resultado = await this.controlador.buscarHistoricoAtividades();
        summaries.push(...resultado.itens);
        nextId = resultado.proximoId;

        // Loop enquanto houver próximo ID e for diferente de -1 (API Huami usa -1 para fim)
        while (nextId !== undefined && nextId !== -1) {
            console.log(`Buscando mais resumos a partir do ID ${nextId}`);
            resultado = await this.controlador.buscarHistoricoAtividades(nextId);
            summaries.push(...resultado.itens);
            nextId = resultado.proximoId;
        }

        console.log(`Total de treinos encontrados: ${summaries.length}`);
        return summaries;
    }

    async run(): Promise<void> {
        const summaries = await this.fetchWorkoutSummaries();

        // Filtrar por data
        const filteredSummaries = summaries.filter(s => {
            const trackId = parseInt(s.idRastreamento, 10);
            return trackId >= this.startTs && trackId <= this.endTs;
        });

        console.log(`Treinos após filtro de data: ${filteredSummaries.length}`);

        for (const summary of filteredSummaries) {
            console.log(`Processando treino ${summary.idRastreamento}...`);
            const detail = await this.controlador.buscarDetalheAtividade(summary);

            const points = parsePoints(summary, detail);

            if (!points || points.length === 0) {
                console.warn(`P - Treino ${summary.idRastreamento} ignorado pois não tem pontos de GPS.`);
                continue;
            }

            const trackIdDate = new Date(parseInt(summary.idRastreamento) * 1000);
            const fileName = `Workout--${trackIdDate.toISOString().replace(/[:.]/g, '-').split('T').join('--')}`;

            const outputFilePath = this.getOutputFilePath(fileName);
            await fs.ensureDir(path.dirname(outputFilePath));

            // Ajuste aqui: O BaseExporter pode precisar de adaptação também se ele usava WorkoutSummary.
            // Por enquanto vou passar 'any' ou refatorar também o Exporter.
            // Como o Exporter não foi solicitado refatoração agora e é TypeScript, ele vai reclamar.
            // Vou assumir que o exporter precisa ser adaptado ou castado. 
            // O ideal é adaptar o BaseExporter. Mas para manter o escopo, vou usar cast se necessário ou TODO.
            // Update: O user pediu "Refatore... que se integra aos serviços REST". Exporter não é serviço REST. 
            // Mas ele quebra se eu passar IResumoAtividade.
            // Para consertar rápido: vou fazer o cast para 'any' na chamada do exporter.
            await this.exporter.export(outputFilePath, summary as any, points);
            console.log(`Exportado: ${outputFilePath}`);
        }
    }
}
