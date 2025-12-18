import 'dotenv/config';
import { Api } from './api';
import { WorkoutSummary } from './types';

async function main() {
    const token = process.env.TOKEN;
    if (!token) {
        console.error("Token não encontrado no .env");
        return;
    }

    // Instancia a API
    const api = new Api(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);

    // Parâmetros solicitados
    const target = {
        trackid: "1765909770",
        source: "run.7930113.huami.com"
    };

    console.log(`Buscando detalhes para TrackID: ${target.trackid}, Source: ${target.source}`);

    try {
        // O método espera um WorkoutSummary, mas só usa trackid e source.
        // Vamos fazer um cast para 'any' ou construir um objeto parcial para enganar o TS aqui para fins de debug,
        // já que não temos o objeto Summary completo.
        const fakeSummary = target as unknown as WorkoutSummary;

        const detail = await api.getWorkoutDetail(fakeSummary);

        console.log("\n--- DETALHES RETORNADOS PELA API ---\n");
        console.dir(detail, { depth: null, colors: true });

    } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
    }
}

main();
