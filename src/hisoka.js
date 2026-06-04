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
        clientId: `${config.session.Name}`
    }),
    authTimeoutMs: 0,
    qrMaxRetries: 99,
    pairingCode: {
        show: true,
        phoneNumber: "6285825396503"
    },
    puppeteer: {
        headless: true,
        bypassCSP: false, // <--- KUNCI UTAMA: Matikan bypass biar ga bentrok CSP
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    },
    // Ganti jadi tipe 'local' biar gak maksain narik HTML remote yang bikin eror
    webVersionCache: {
        type: 'local'
    }
});

// TARUH FUNGSI LOG NYA DI LUAR, TEPAT DI BAWAH SINI:
hisoka.on("pairing_code", code => {
    console.info("========================================");
    console.info(`KODE PAIRING LU: ${code}`);
    console.info("========================================");
});

// Baru panggil inisialisasinya:
hisoka.initialize();

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
