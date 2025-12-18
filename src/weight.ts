import 'dotenv/config';
import { Api } from './api';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const token = process.env.TOKEN;
    const userId = process.env.USER_ID;

    if (!token) {
        console.error("TOKEN não encontrado no .env");
        return;
    }
    if (!userId) {
        console.error("USER_ID não encontrado no .env");
        return;
    }

    const api = new Api(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);
    const outputDir = process.env.OUTPUT_DIRECTORY || './workouts';

    // Garantir diretório de saída
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Buscando registros de peso para usuário ${userId}...`);

    try {
        // A API de peso não parece ter paginação explícita no endpoint listado "v1",
        // ou o endpoint citado (users/.../weightRecords) retorna tudo ou tem outra lógica.
        // O prompt não menciona paginação, assumiremos chamada única por enquanto.

        const history = await api.getWeightRecords(userId);
        const items = history.items.map(item => {
            const generatedDate = new Date(item.generatedTime * 1000);
            const createDate = new Date(item.createTime * 1000);

            return {
                ...item,
                generatedDateReadable: generatedDate.toLocaleString('pt-BR'),
                generatedDateISO: generatedDate.toISOString(),
                createDateReadable: createDate.toLocaleString('pt-BR'),
                createDateISO: createDate.toISOString()
            };
        });

        console.log(`Total de registros de peso encontrados: ${items.length}`);

        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-');
        const filename = `weight_records_${dateStr}.json`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(items, null, 2));

        console.log(`Registros de peso salvos em: ${filePath}`);

    } catch (error) {
        console.error("Erro ao buscar pesos:", error);
    }
}

main();
