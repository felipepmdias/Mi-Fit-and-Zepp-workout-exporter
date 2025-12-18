import 'dotenv/config';
import { Api } from './api';
import { WorkoutSummary } from './types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const token = process.env.TOKEN;
    if (!token) {
        console.error("Token não encontrado no .env");
        return;
    }

    // Leitura de argumentos
    const args = process.argv.slice(2);
    const trackid = args[0];
    const source = args[1] || "run.7930113.huami.com"; // Default ou argumento

    if (!trackid) {
        console.error("Uso: npx ts-node src/detail.ts <trackid> [source]");
        return;
    }

    // Instancia a API
    const api = new Api(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);

    // Parâmetros solicitados
    const target = {
        trackid: trackid,
        source: source
    };

    console.log(`Buscando detalhes para TrackID: ${target.trackid}, Source: ${target.source}`);

    try {
        // O método espera um WorkoutSummary, mas só usa trackid e source.
        const fakeSummary = target as unknown as WorkoutSummary;

        const detail = await api.getWorkoutDetail(fakeSummary);

        const outputDir = path.join(process.cwd(), 'workouts');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = `detail_${trackid}.json`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(detail, null, 2));

        console.log(`\nDetalhes salvos com sucesso em: ${filePath}`);

    } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
    }
}

main();
