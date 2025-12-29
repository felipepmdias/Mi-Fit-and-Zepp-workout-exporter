import { HuamiControlador } from '../controllers/HuamiControlador';
import { IResumoAtividade } from '../models/dominio';
import assert from 'assert';

// Mock Data
const MOCK_HISTORY_RESPONSE = {
    code: 1,
    message: "success",
    data: {
        next: -1,
        summary: [
            {
                trackid: "1704067200", // 2024-01-01 00:00:00 UTC
                source: "run.source",
                dis: "5000",
                calorie: "300",
                end_time: "1704070800", // +1h
                run_time: "3600",
                avg_pace: "720",
                avg_frequency: "0",
                avg_heart_rate: "140",
                type: 1,
                location: "Rio de Janeiro",
                city: "Rio de Janeiro",
                sport_title: "Corrida Matinal",
                app_name: "test_app"
            }
        ]
    }
};

const MOCK_DETAIL_RESPONSE = {
    code: 1,
    message: "success",
    data: {
        trackid: 1704067200,
        source: "run.source",
        time: "0;60;120",
        longitude_latitude: "22.90,-43.20;22.91,-43.21",
        altitude: "10;11;12",
        heart_rate: "135;140;145",
        gait: "0;0;0;0", // cadence
        pace: "700;710;720",
        lap: "1,300,0,0,0;2,300,0,0,0" // fake lap data
    }
};

// Mock Controller extending original to override network calls
class HuamiControladorMock extends HuamiControlador {
    protected async get<T>(url: string, config?: any): Promise<T> {
        console.log(`[MOCK] GET ${url}`);
        if (url.includes('/history.json')) {
            return MOCK_HISTORY_RESPONSE as unknown as T;
        }
        if (url.includes('/detail.json')) {
            return MOCK_DETAIL_RESPONSE as unknown as T;
        }
        throw new Error(`URL não mockada: ${url}`);
    }
}

async function runTests() {
    console.log("Iniciando bateria de testes manuais...");
    const controlador = new HuamiControladorMock("http://mock-api", "mock-token");

    // Teste 1: Buscar Histórico
    console.log("\nTeste 1: Buscar Histórico de Atividades");
    const historico = await controlador.buscarHistoricoAtividades();

    assert(historico.itens.length === 1, "Deveria retornar 1 item");
    const item = historico.itens[0];

    assert.strictEqual(item.idRastreamento, "1704067200", "ID incorreto");
    assert.strictEqual(item.distancia, 5000, "Distância incorreta");
    assert.strictEqual(item.tipoAtividade, 1, "Tipo de atividade incorreto");
    assert.strictEqual(item.tituloEsporte, "Corrida Matinal", "Título incorreto");
    console.log("✅ Histórico mapeado corretamente.");

    // Teste 2: Buscar Detalhe
    console.log("\nTeste 2: Buscar Detalhe da Atividade");
    const detalhe = await controlador.buscarDetalheAtividade(item);

    assert.strictEqual(detalhe.idRastreamento, "1704067200", "ID detalhe incorreto");
    assert.strictEqual(detalhe.dadosPosicao, "22.90,-43.20;22.91,-43.21", "Posição incorreta");
    assert.strictEqual(detalhe.dadosVoltas, "1,300,0,0,0;2,300,0,0,0", "Voltas incorretas");
    console.log("✅ Detalhe mapeado corretamente.");

    console.log("\n🎉 Todos os testes passaram!");
}

runTests().catch(err => {
    console.error("❌ Falha nos testes:", err);
    process.exit(1);
});
