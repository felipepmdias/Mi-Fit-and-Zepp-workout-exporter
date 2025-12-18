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

    const api = new Api(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);
    const outputDir = process.env.OUTPUT_DIRECTORY || './workouts';

    // Garantir diretório de saída
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("Iniciando busca de atividades...");

    const allSummaries: WorkoutSummary[] = [];
    let nextTrackId = undefined;
    let keepFetching = true;

    try {
        while (keepFetching) {
            console.log(`Buscando página... (A partir de: ${nextTrackId || 'Início'})`);
            const history = await api.getWorkoutHistory(nextTrackId);

            if (history.data.summary && history.data.summary.length > 0) {
                allSummaries.push(...history.data.summary);
            }

            if (history.data.next && history.data.next !== -1) {
                nextTrackId = history.data.next;
            } else {
                keepFetching = false;
            }
        }

        console.log(`Total de atividades encontradas: ${allSummaries.length}`);

        // Mapear para o formato simples solicitado
        const simpleList = allSummaries.map(s => {
            // Conversão de data (end_time vem como string numérica em segundos, geralmente)
            // Assumindo end_time como timestamp unix seconds
            const endDate = new Date(parseInt(s.end_time) * 1000);

            return {
                trackid: s.trackid,
                source: s.source,
                type: s.type,
                sport_title: s.sport_title || 'N/A',
                type_description: getSportName(s.type),
                end_time_readable: endDate.toLocaleString('pt-BR'), // Formato legível
                end_time_iso: endDate.toISOString()
            };
        });

        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-');
        const filename = `list_${dateStr}.json`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(simpleList, null, 2));

        console.log(`Lista salva com sucesso em: ${filePath}`);

    } catch (error) {
        console.error("Erro ao executar listagem:", error);
    }
}

// Mapeamento básico de tipos de esporte (comuns no ecossistema Huami/Zepp)
// Isso é uma aproximação, pois a lista completa é extensa.
function getSportName(type: number): string {
    const map: Record<number, string> = {
        1: "Corrida",
        6: "Caminhada",
        8: "Esteira",
        9: "Ciclismo",
        10: "Ciclismo Indoor",
        16: "Outro",
        52: "Musculação",
        // Adicione outros conforme necessário
    };
    return map[type] || `Tipo Desconhecido (${type})`;
}

main();
