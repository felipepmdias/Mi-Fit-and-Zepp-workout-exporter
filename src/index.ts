#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { Api } from './api';
import { getAppToken } from './auth';
import { Scraper } from './scraper';
import { GpxExporter } from './exporters/gpx';
import { GeoJsonExporter } from './exporters/geojson';

const program = new Command();

program
    .name('zepp-exporter')
    .description('Exporta treinos do Mi Fit / Zepp para GPX ou GeoJSON')
    .version('1.0.0');

program
    .option('-e, --endpoint <url>', 'Endpoint da API', process.env.ENDPOINT || 'https://api-mifit.huami.com')
    .option('-t, --token <token>', 'Token da aplicação (apptoken)', process.env.TOKEN)
    .option('-f, --file-format <format>', 'Formato do arquivo (gpx, geojson)', process.env.FILE_FORMAT || 'gpx')
    .option('-o, --output-directory <path>', 'Diretório de saída', process.env.OUTPUT_DIRECTORY || './workouts')
    .option('--start-date <date>', 'Data inicial (YYYY-MM-DD)', process.env.START_DATE)
    .option('--end-date <date>', 'Data final (YYYY-MM-DD)', process.env.END_DATE);

program.parse(process.argv);

const options = program.opts();

async function main() {
    let token = options.token;

    if (!token) {
        console.log("Token não fornecido via argumento. Tentando obter automaticamente...");
        token = await getAppToken();
    }

    if (!token) {
        console.error("Falha ao obter token. Por favor, forneça manualmente com -t.");
        process.exit(1);
    }

    const api = new Api(options.endpoint, token);

    let exporter;
    if (options.fileFormat === 'gpx') {
        exporter = new GpxExporter();
    } else if (options.fileFormat === 'geojson') {
        exporter = new GeoJsonExporter();
    } else {
        console.error(`Formato não suportado: ${options.fileFormat}`);
        process.exit(1);
    }

    const parseDateToTimestamp = (dateStr: string | undefined, isEnd: boolean): number => {
        if (!dateStr) {
            return isEnd ? Infinity : -Infinity;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${dateStr}`);
        }
        if (isEnd) {
            date.setHours(23, 59, 59, 999);
        } else {
            date.setHours(0, 0, 0, 0);
        }
        return date.getTime() / 1000;
    };

    const startTs = parseDateToTimestamp(options.startDate, false);
    const endTs = parseDateToTimestamp(options.endDate, true);

    const scraper = new Scraper(api, exporter, options.outputDirectory, options.fileFormat, startTs, endTs);

    try {
        await scraper.run();
        console.log("Concluído!");
    } catch (error) {
        console.error("Erro durante a execução:", error);
    }
}

main();
