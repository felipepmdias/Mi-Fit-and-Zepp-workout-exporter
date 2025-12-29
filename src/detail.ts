import 'dotenv/config';
import { HuamiControlador } from './controllers/HuamiControlador';
import { IResumoAtividade } from './models/dominio';
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

    // Instancia o Controlador
    const controlador = new HuamiControlador(process.env.ENDPOINT || 'https://api-mifit.huami.com', token);

    // Precisamos recriar um objeto IResumoAtividade válido para o método buscarDetalheAtividade
    // Como só idRastreamento e origem são usados para o fetch do detalhe no controlador, podemos mockar o resto
    const fakeSummary = {
        idRastreamento: trackid,
        origem: source
    } as IResumoAtividade;

    console.log(`Buscando detalhes para TrackID: ${fakeSummary.idRastreamento}, Origem: ${fakeSummary.origem}`);

    try {
        const detail = await controlador.buscarDetalheAtividade(fakeSummary);

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
