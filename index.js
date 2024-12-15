/*!-======[ Preparing Configuration ]======-!*/
import "./toolkit/set/string.prototype.js";
await "./toolkit/set/global.js".r()

/*!-======[ Modules Imports ]======-!*/
const readline = "readline".import()
const fs = "fs".import()
const chalk = "chalk".import()
const baileys = "baileys".import()
const pino = "pino".import()
const { Boom } = "boom".import();
const { Connecting } = await `${fol[8]}systemConnext.js`.r()
let {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    makeInMemoryStore,
    Browsers
} = baileys;
/*!-======[ Functions Imports ]======-!*/
let detector = (await (fol[0] + "detector.js").r()).default
Data.utils = (await `${fol[1]}utils.js`.r()).default
Data.helper = (await `${fol[1]}client.js`.r()).default
Data.In = (await `${fol[1]}interactive.js`.r()).default
Data.reaction = (await `${fol[1]}reaction.js`.r()).default
Data.EventEmitter = (await `${fol[1]}events.js`.r()).default
Data.stubTypeMsg = (await `${fol[1]}stubTypeMsg.js`.r()).default
Data.initialize = (await `${fol[1]}initialize.js`.r()).default

let logger = pino({ level: 'silent' })
let store = makeInMemoryStore({ logger });

async function launch() {
  try {
    if (fs.existsSync(session) && !fs.existsSync(session + "/creds.json")) {
      await fs.rmdir(session, { recursive: true }, (err) => {});
    }

    if (!fs.existsSync(session + "/creds.json")) {
        console.log(chalk.green("✅ Secara otomatis memilih opsi QR untuk autentikasi."));
        global.pairingCode = false; // Langsung memilih opsi QR
    }

    let { state, saveCreds } = await useMultiFileAuthState(session);
    const Exp = makeWASocket({
        logger,
        printQRInTerminal: !global.pairingCode,
        browser: Browsers.ubuntu('Chrome'),
        auth: state
    });

    /*!-======[ Detect File Update ]======-!*/
    detector({ Exp, store });

    if (global.pairingCode && !Exp.authState.creds.registered) {
        const phoneNumber = await question(chalk.yellow('Please type your WhatsApp number: '));
        let code = await Exp.requestPairingCode(phoneNumber.replace(/[+ -]/g, ""));
        console.log(chalk.bold.rgb(255, 136, 0)(`
  ╭────────────────────────────╮
  │  ${chalk.yellow('Your Pairing Code:')} ${chalk.greenBright(code)}  │
  ╰────────────────────────────╯
            `)
        );
    }

    /*!-======[ INITIALIZE Exp Functions ]======-!*/
    Data.initialize({ Exp, store });

    /*!-======[ EVENTS Exp ]======-!*/
    Exp.ev.on('connection.update', async (update) => {
        await Connecting({ update, Exp, Boom, DisconnectReason, sleep, launch });
    });

    Exp.ev.on('creds.update', saveCreds);

    Exp.ev.on('messages.upsert', async ({ messages }) => {
        const cht = {
            ...messages[0],
            id: messages[0].key.remoteJid
        }
        let isMessage = cht?.message;
        let isStubType = cht?.messageStubType;
        if (!(isMessage || isStubType)) return;

        if (cht.key.remoteJid === 'status@broadcast' && cfg.autoreadsw == true) {
            await Exp.readMessages([cht.key]);
            let typ = getContentType(cht.message);
            console.log((/protocolMessage/i.test(typ)) ? `${cht.key.participant.split('@')[0]} Deleted story❗` : 'View user stories : ' + cht.key.participant.split('@')[0]);
            return;
        }
        if (cht.key.remoteJid !== 'status@broadcast') {
            const exs = { cht, Exp, is: {}, store };
            await Data.utils(exs);

            if (isStubType) {
                Data.stubTypeMsg(exs);
            } else {
                await Data.helper(exs);
            }
        }
    });

    Exp.ev.on('call', async ([c]) => {
        let { from, id, status } = c;
        if (status !== 'offer') return;
        cfg.call = cfg.call || { block: false, reject: false };
        let { block, reject } = cfg.call;

        if (reject) {
            await Exp.rejectCall(id, from);
            await Exp.sendMessage(from, { text: "⚠️JANGAN TELFON❗" });
        }
        if (block) {
            let text = `\`⚠️KAMU TELAH DI BLOKIR!⚠️\``
                + "\n- *Menelfon tidak diizinkan karena sangat mengganggu aktivitas kami*"
                + "\n> _Untuk membuka blokir, silahkan hubungi owner!_";
            await Exp.sendMessage(from, { text });
            await Exp.sendContacts({ id: from }, owner);
            await sleep(2000);
            await Exp.updateBlockStatus(from, "block");
        }
    });
    store.bind(Exp.ev);

  } catch (error) {
    console.error(error);
  }
}
launch();

process.on("uncaughtException", e => {
  console.error(e);
});
