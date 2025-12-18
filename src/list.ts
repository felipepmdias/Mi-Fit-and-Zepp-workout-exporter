import 'dotenv/config';
import { Api } from './api';
import { WorkoutSummary, WorkoutDetail } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Função para converter data dd/MM/yyyy para Date
function parseDateArg(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    // Mês em JS é 0-indexed
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}


// Função para parsing do campo 'kiloPace' (informações detalhadas por cada kilômetro percorrido)
function parseKiloPace(kiloPace: string): any[] {
    // Mapeamento de colunas (base 0) - Caminhada ao ar livre
    // Campo 1 (index 0): Contador
    // Campo 2 (index 1): Tempo da Volta
    // Campo 3 (index 2): Geohash (localização)
    // Campo 4 (index 3): Ganho da Elevação (metros)
    // Campo 5 (index 4): Frequência Cardíaca
    // Campo 6 (index 5): Duração do exercício (acumulado)
    // Campo 7 (index 6): Perda de Elevação (m) - a confirmar
    // Campo 8 (index 7): Queima (calorias)
    // Campo 9 (index 8): Pausa (segundos)
    // Campo 10 (index 9): Comprimento da pernada (cm) 
    // Campo 14 (index 13): Frequência de pernada (spm)
    return [];
}




// Função para parsing do campo 'lap' (séries)
function parseLapData(lapData: string): any[] {
    if (!lapData) return [];

    // Linhas separadas por ';'
    const rows = lapData.split(';');
    const series = [];

    // Mapeamento de colunas (base 0) - Atividades de Musculação
    // Campo 1 (index 0): contador
    // Campo 2 (index 1): Duração
    // Campo 5 (index 4): Frequência
    // Campo 6 (index 5): Tempo Total
    // Campo 16 (index 15): Calorias
    // Campo 17 (index 16): Sistema de Medida (kg ou lbs)
    // Campo 22 (index 21): Peso
    // Campo 23 (index 22): Repetições
    // Campo 29 (index 28): Tipo Exercício (actionType)

    for (const row of rows) {
        if (!row.trim()) continue;
        const cols = row.split(',');

        // Verificação básica de tamanho para evitar erro de index
        if (cols.length < 29) continue;

        const actionType = parseInt(cols[28]);

        series.push({
            nome: getExecerciseName(actionType),
            serie: parseInt(cols[0]) + 1,
            repeticoes: parseInt(cols[22]),
            duracao: parseInt(cols[1]),
            frequencia: parseInt(cols[4]),
            peso: parseFloat(cols[21]),
            sistemaMedida: cols[23] === '0' ? 'kg' : 'lbs',
            calorias: parseInt(cols[15]),
            Tempo: parseInt(cols[5])
        });
    }
    return series;
}

// Mapeamento de esportes
function getSportName(type: number): string {
    const map: Record<number, string> = {
        1: "Corrida",
        6: "Caminhada",
        8: "Esteira",
        9: "Ciclismo",
        10: "Ciclismo Indoor",
        16: "Outro",
        40: "Caminhada em Casa",
        52: "Musculação",
    };
    return map[type] || `Tipo Desconhecido (${type})`;
}

// Mapeamento de exercícios
function getExecerciseName(code: number): string {
    const map: Record<number, string> = {
        1: "Aguachamento com Peso Corporal",
        3: "Aguachamento com Barra",
        4: "Tríceps na Polia",
        5: "Remada Inclinada",
        6: "Supino",
        7: "Abdominal com Retenção",
        40: "Elevação Lateral com Halteres",
        55: "Músculos Frontais da Coxa",
        56: "Músculos Traseiros da Coxa",
        60: "Puxada Alta",
        65: "Rosca de Bíceps",
        66: "Remada Sentada",
        67: "Remada Alta",
        68: "Pulldown de braço reto",
        76: "Rosca de Bíceps com Halteres",
        100: "Elevação da Panturrilha",
        113: "Cruxifixo no Voador",
        114: "Cruxifixo Invertido no Voador",
        129: "Supino Reto na Máquina",
        130: "Desenvolvimento de Ombro na Máquina",
        1107: "Extensão da Lombar na Máquina",
        1176: "Alongamento de Adutores Sentado",
        1262: "Extensão de Tríceps na Máquina",
        1363: "Abdução de Quadril Sentado",
        1451: "Flexão de Pernas Deitado",
    };
    return map[code] || `Exercício Desconhecido (${code})`;
}

// Função auxiliar para data ISO local
const toLocalISO = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
};

async function main() {
    const token = process.env.TOKEN;
    if (!token) {
        console.error("Token não encontrado no .env");
        return;
    }

    // Leitura argumentos: detalhado, inicio, termino
    // Exemplo: npx ts-node src/list.ts s 01/01/2024 31/12/2024
    const args = process.argv.slice(2);
    const detalhado = args[0] === 's';
    const inicioStr = args[1];
    const terminoStr = args[2];

    const dataInicio = parseDateArg(inicioStr);
    const dataTermino = parseDateArg(terminoStr);

    // Ajustar término para final do dia (23:59:59) se informado
    if (dataTermino) {
        dataTermino.setHours(23, 59, 59, 999);
    }

    console.log("Configurações:");
    console.log(`- Detalhado: ${detalhado ? 'Sim' : 'Não'}`);
    console.log(`- Início: ${dataInicio ? dataInicio.toLocaleString() : 'Sem filtro'}`);
    console.log(`- Término: ${dataTermino ? dataTermino.toLocaleString() : 'Sem filtro'}`);

    const api = new Api(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);
    const outputDir = process.env.OUTPUT_DIRECTORY || './workouts';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("\nIniciando busca de atividades...");

    const finalResults: any[] = [];
    let nextTrackId = undefined;
    let keepFetching = true;

    // Timestamps para filtro (trackid é timestamp em segundos, geralmente)
    const startTs = dataInicio ? dataInicio.getTime() / 1000 : null;
    const endTs = dataTermino ? dataTermino.getTime() / 1000 : null;

    try {
        while (keepFetching) {
            console.log(`Buscando página... (A partir de: ${nextTrackId || 'Início'})`);
            const history = await api.getWorkoutHistory(nextTrackId);

            if (!history.data.summary || history.data.summary.length === 0) {
                keepFetching = false;
                break;
            }

            for (const s of history.data.summary) {
                const trackTime = parseInt(s.trackid);

                // Otimização: Se trackTime < startTs (e assumindo ordem decrescente), podemos parar TUDO
                if (startTs && trackTime < startTs) {
                    console.log("Atingiu data limite inferior. Parando busca.");
                    keepFetching = false;
                    break;
                }

                // Filtro superior
                if (endTs && trackTime > endTs) {
                    continue; // Pula este, mas continua procurando (ainda pode ter mais recentes que o range se a ordem for bagunçada, mas geralmente é decrescente, então "continue" é seguro, mas se fosse estritamente decrescente poderia ser que nem chegamos no range ainda)
                    // Na verdade, se é decrescente:
                    // 100, 99, 98 ...
                    // Range: 50 a 60.
                    // Se lemos 100 -> continue.
                    // Se lemos 55 -> processa.
                    // Se lemos 40 -> break.
                }

                // Valido para processar
                const endDate = new Date(trackTime * 1000);

                let resultItem: any = {
                    id_atividade: s.trackid,
                    fonte: s.source,
                    codigo_tipo: s.type,
                    titulo_original: s.sport_title || 'N/A',
                    esporte: getSportName(s.type),
                    data: toLocalISO(endDate),
                    series: undefined
                };

                // Detalhes de Musculação
                if (s.type === 52) {
                    // Detalhes avançados (séries do lap)
                    if (detalhado) {
                        try {
                            console.log(`Buscando detalhes avançados para ${s.trackid} (Musculação)...`);
                            // Precisamos fazer fetch do detail
                            const detail = await api.getWorkoutDetail(s);
                            if (detail.data && detail.data.lap) {
                                resultItem.series = parseLapData(detail.data.lap);
                            }
                        } catch (err) {
                            console.error(`Erro buscando detalhes para ${s.trackid}:`, err);
                        }
                    }
                }

                finalResults.push(resultItem);
            }

            if (!keepFetching) break;

            if (history.data.next && history.data.next !== -1) {
                nextTrackId = history.data.next;
            } else {
                keepFetching = false;
            }
        }

        console.log(`Total de atividades processadas: ${finalResults.length}`);

        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-');
        const filename = `list_${dateStr}${detalhado ? '_detailed' : ''}.json`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(finalResults, null, 2));

        console.log(`Lista salva com sucesso em: ${filePath}`);

    } catch (error) {
        console.error("Erro ao executar listagem:", error);
    }
}

main();
