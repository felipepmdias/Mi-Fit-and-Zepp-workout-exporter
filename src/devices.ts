import 'dotenv/config';
import { HuamiControlador } from './controllers/HuamiControlador';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const token = process.env.TOKEN;
    const userId = process.env.USER_ID;

    if (!token || !userId) {
        console.error("TOKEN ou USER_ID não encontrados no .env");
        return;
    }

    const controlador = new HuamiControlador(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);
    const outputDir = process.env.OUTPUT_DIRECTORY || './workouts';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Buscando dispositivos para usuário ${userId}...`);

    try {
        const data = await controlador.buscarDispositivos(userId);

        // Salvar raw primeiro para inspeção de campos de data
        const rawFilePath = path.join(outputDir, 'devices_raw.json');
        fs.writeFileSync(rawFilePath, JSON.stringify(data, null, 2));
        console.log(`Dados brutos salvos em: ${rawFilePath}`);

        // Tentar identificar e formatar campos comuns de data se for um array
        // A estrutura provável é { items: [...] } ou direto [...]
        const items = Array.isArray(data) ? data : (data.items || []);

        const formattedItems = items.map((item: any) => {
            const newItem = { ...item };

            // Lista de possíveis campos de data para tentar converter
            const dateFields = [
                'lastSyncTime', 'boundTime', 'createTime', 'updateTime',
                'applicationTime', 'lastDataSyncTime', 'lastStatusUpdateTime',
                'lastHeartRateDataSyncTime', 'lastActiveStatusUpdateTime'
            ];

            dateFields.forEach(field => {
                if (newItem[field] && typeof newItem[field] === 'number') {
                    // Assumindo timestamp em segundos se for pequeno, ou ms se for grande?
                    // Huami costuma usar segundos ou ms. Vamos inferir.
                    // Se for > 10000000000 (10^10), é provavel ms (ano 1970+).
                    // Ano 2024 em segundos é ~1.7e9. Em ms é ~1.7e12.

                    let timestamp = newItem[field];
                    // Se parece ser segundos (10 digitos)
                    if (timestamp < 10000000000) {
                        timestamp *= 1000;
                    }

                    const date = new Date(timestamp);
                    newItem[`${field}Readable`] = date.toLocaleString('pt-BR');
                    newItem[`${field}ISO`] = date.toISOString();
                }
            });
            return newItem;
        });

        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-');
        const filename = `devices_${dateStr}.json`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(formattedItems, null, 2));
        console.log(`Dispositivos processados salvos em: ${filePath}`);

    } catch (error) {
        console.error("Erro ao buscar dispositivos:", error);
    }
}

main();
