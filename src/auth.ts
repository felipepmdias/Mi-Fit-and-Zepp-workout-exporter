import { chromium } from 'playwright';
import { URL } from 'url';

const APP_NAME = 'com.xiaomi.hm.health';
const APP_PLATFORM = 'web';

function getGdprUrl(): string {
    const url = new URL('https://user.huami.com/privacy2/index.html');
    url.searchParams.append('platform_app', APP_NAME);
    url.searchParams.append('loginPlatform', APP_PLATFORM);
    return url.toString();
}

export async function getAppToken(): Promise<string | null> {
    console.log("Iniciando autenticação via navegador...");

    try {
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log("Abrindo URL GDPR...");
        await page.goto(getGdprUrl());

        console.log("Aguardando botão 'Export data'...");
        const exportButton = page.locator('div.gdpr-operation-output');
        await exportButton.click();

        console.log("Por favor, faça login no navegador aberto...");

        // Espera o botão reaparecer (o que índica que o login completou e voltamos pra página inicial autenticados)
        // Ou espera o cookie aparecer.
        // O script python espera o botão de novo.
        await exportButton.waitFor({ state: 'visible', timeout: 0 }); // timeout 0 = infinito

        console.log("Login detectado, buscando token...");

        const cookies = await context.cookies();
        const tokenCookie = cookies.find(c => c.name === 'apptoken');

        await browser.close();

        if (tokenCookie) {
            return tokenCookie.value;
        } else {
            console.error("Não foi possível encontrar o cookie 'apptoken'.");
            return null;
        }

    } catch (error) {
        console.error("Erro durante a autenticação:", error);
        return null;
    }
}
