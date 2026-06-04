import config from "../config.js"

import { LocalAuth } from 'whatsapp-web.js'
import qrcode from "qrcode-terminal"
import chokidar from "chokidar"
import { chromium } from 'playwright-chromium'
import { platform } from 'os'
import path from 'path'
import API from "./lib/lib.api.js"


import Function from "./lib/lib.function.js"
import { Client, serialize } from "./lib/whatsapp.serialize.js"
import { Message, readCommands } from "./event/event.message.js"
import { database as databes } from "./lib/lib.database.js"


const database = new databes()
global.Func = Function
global.api = API
global.commands = new (await import("./lib/lib.collection.js")).default


async function start() {
    process.on("uncaughtException", console.error)
    process.on("unhandledRejection", console.error)
    readCommands()

    const content = await database.read()
    if (content && Object.keys(content).length === 0) {
        global.db = {
            users: {},
            groups: {},
            ...(content || {})
        }
        await database.write(global.db)
    } else {
        global.db = content
    }

    const hisoka = new Client({
    authStrategy: new LocalAuth({
        dataPath: `./${config.session.Path}`,
        clientId: `${config.session.Name}`
    }),
    authTimeoutMs: 0,
    qrMaxRetries: 99,
    playwright: {
        headless: true,
        devtools: false,
        timeout: 0,
        bypassCSP: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017571341-alpha.html'
    }
});
    
    // GANTI NOMOR DI BAWAH PAKAI NOMOR YANG MAU DIJADIKAN BOT (Pake 62)
const nomorBot = "6285825396503"; 

hisoka.initialize();

// Jika library minta pairing code
if (nomorBot && !hisoka.authStrategy.client.pupPage) {
    setTimeout(async () => {
        try {
            const code = await hisoka.requestPairingCode(nomorBot);
            console.info("========================================");
            console.info("INI KODE PAIRING BOT LU, MASUKIN KE WA:");
            console.info(`KODE: ${code}`);
            console.info("========================================");
        } catch (err) {
            console.error("Gagal minta pairing code:", err);
        }
    }, 5000);
}

    hisoka.on("loading_screen", (percent, message) => {
        console.log(chalk.bgBlack(chalk.green(message)) + " :" + chalk.bgBlack(chalk.yellow(percent)))
    })

    hisoka.on("auth_failure", console.error)

    hisoka.on("ready", m => {
        console.info("Client is already on ")
    })

    hisoka.on("disconnected", m => {
        if (m) start()
    })

    hisoka.on("message_create", async (message) => {
    global.public = true;
    global.owner = ["6285171542317"]; // <--- GANTI JADI NOMOR WA LU

    const m = await (await serialize(hisoka, message));
    await (await Message(hisoka, m));
});

    // rewrite database every 30 seconds
    setInterval(async () => {
        if (global.db) await database.write(global.db)
    }, 3000)

    return hisoka
}


start()


let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), 'src', 'commands')), { ignored: /^\./ })
choki
.on('change', async(Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
.on('add', async function(Path) {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
