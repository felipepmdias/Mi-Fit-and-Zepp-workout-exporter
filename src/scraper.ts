import { Api } from './api';
import { WorkoutSummary } from './types';
import { BaseExporter } from './exporters';
import { parsePoints } from './parsing';
import * as fs from 'fs-extra';
import * as path from 'path';

export class Scraper {
    private api: Api;
    private exporter: BaseExporter;
    private outputDir: string;
    private fileFormat: string;
    private startTs: number;
    private endTs: number;

    constructor(
        api: Api,
        exporter: BaseExporter,
        outputDir: string,
        fileFormat: string,
        startTs: number,
        endTs: number
    ) {
        this.api = api;
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

    private async fetchWorkoutSummaries(): Promise<WorkoutSummary[]> {
        let summaries: WorkoutSummary[] = [];

        console.log("Buscando histórico de treinos...");
        let history = await this.api.getWorkoutHistory();
        summaries.push(...history.data.summary);

        while (history.data.next !== -1) {
            console.log(`Buscando mais resumos a partir do ID ${history.data.next}`);
            history = await this.api.getWorkoutHistory(history.data.next);
            summaries.push(...history.data.summary);
        }

        console.log(`Total de treinos encontrados: ${summaries.length}`);
        return summaries;
    }

    async run(): Promise<void> {
        const summaries = await this.fetchWorkoutSummaries();

        // Filtrar por data
        const filteredSummaries = summaries.filter(s => {
            const trackId = parseInt(s.trackid, 10);
            return trackId >= this.startTs && trackId <= this.endTs;
        });

        console.log(`Treinos após filtro de data: ${filteredSummaries.length}`);

        for (const summary of filteredSummaries) {
            console.log(`Processando treino ${summary.trackid}...`);
            const detail = await this.api.getWorkoutDetail(summary);

            const points = parsePoints(summary, detail.data);

            if (!points || points.length === 0) {
                console.warn(`P - Treino ${summary.trackid} ignorado pois não tem pontos de GPS.`);
                continue;
            }

            const trackIdDate = new Date(parseInt(summary.trackid) * 1000);
            const fileName = `Workout--${trackIdDate.toISOString().replace(/[:.]/g, '-').split('T').join('--')}`;

            const outputFilePath = this.getOutputFilePath(fileName);
            await fs.ensureDir(path.dirname(outputFilePath));

            await this.exporter.export(outputFilePath, summary, points);
            console.log(`Exportado: ${outputFilePath}`);
        }
    }
}
