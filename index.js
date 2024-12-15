import "./toolkit/set/string.prototype.js";
import jimp from "jimp"
await "./toolkit/set/global.js".r()

/*!-======[ Mudules Imports ]======-!*/
const readline = "readline".import()
const fs = "fs".import()
const chalk = "chalk".import()
const baileys = "baileys".import()
const pino = "pino".import()
const { Boom } = "boom".import();
const { Connecting } = await `${fol[8]}systemConnext.js`.r()
const { func } = await `${fol[0]}func.js`.r()
let {
    makeWASocket,
    useMultiFileAuthState,
  	DisconnectReason,
  	getContentType,
  	makeInMemoryStore,
  	getBinaryNodeChild, 
  	jidNormalizedUser,
  	makeCacheableSignalKeyStore,
  	Browsers
} = baileys;

/*!-======[ Functions Imports ]======-!*/
Data.utils = (await `${fol[1]}utils.js`.r()).default
Data.helper = (await `${fol[1]}client.js`.r()).default
Data.In = (await `${fol[1]}interactive.js`.r()).default
Data.reaction = (await `${fol[1]}reaction.js`.r()).default
Data.EventEmitter = (await `${fol[1]}events.js`.r()).default
Data.stubTypeMsg = (await `${fol[1]}stubTypeMsg.js`.r()).default

let logger = pino({ level: 'silent' })
let store = makeInMemoryStore({ logger });

async function launch() {
  try {
    // Langsung set global.pairingCode ke false (menandakan QR mode)
    global.pairingCode = false;

    if(fs.existsSync(session) && !fs.existsSync(session + "/creds.json")) await fs.rmdir(session, { recursive: true }, (err) => {} )   
    if (!fs.existsSync(session + "/creds.json")) {
        console.log(chalk.red.bold('Anda belum memiliki session! Membuat session baru...'));
    }
    
    let { state, saveCreds } = await useMultiFileAuthState(session);
    const Exp = makeWASocket({
        logger,
        printQRInTerminal: !global.pairingCode, // QR akan dicetak di terminal
        browser: Browsers.ubuntu('Chrome'),
        auth: state,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        }
    });
    
    // Jika membutuhkan kode pairing, akan langsung diproses
    if (global.pairingCode && !Exp.authState.creds.registered) {
        const phoneNumber = 'yourPhoneNumber'; // Isi dengan nomor yang sesuai
        let code = await Exp.requestPairingCode(phoneNumber.replace(/[+ -]/g, ""));
        console.log(chalk.bold.rgb(255, 136, 0)(`\n  ╭────────────────────────────╮\n  │  ${chalk.yellow('Your Pairing Code:')} ${chalk.greenBright(code)}  │\n  ╰────────────────────────────╯\n            `));
    }

    /*!-======[ INITIALIZE Exp Functions ]======-!*/
    Exp.func = new func({ Exp, store });

    Exp.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
        jid = jidNormalizedUser(jid);
        const result = await Exp.query({
            tag: 'iq',
            attrs: {
                target: jid,
                to: "@s.whatsapp.net",
                type: 'get',
                xmlns: 'w:profile:picture'
            },
            content: [
                { tag: 'picture', attrs: { type, query: 'url' } }
            ]
        }, timeoutMs);

        const child = getBinaryNodeChild(result, 'picture');
        return child?.attrs?.url;
    };

    Exp.setProfilePicture = async (id, buffer) => {
        try {
            id = jidNormalizedUser(id);
            const jimpread = await jimp.read(buffer);
            const min = jimpread.getWidth();
            const max = jimpread.getHeight();
            const cropped = jimpread.crop(0, 0, min, max);

            let buff = await cropped.scaleToFit(720, 720).getBufferAsync(jimp.MIME_JPEG);
            return await Exp.query({
                tag: 'iq',
                attrs: {
                    to: "@s.whatsapp.net",
                    type:'set',
                    xmlns: 'w:profile:picture'
                },
                content: [
                    {
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: buff
                    }
                ]
            });
        } catch (e) {
            throw new Error(e);
        }
    };

    /*!-======[ EVENTS Exp ]======-!*/
    Exp.ev.on('connection.update', async (update) => {
        await Connecting({ update, Exp, Boom, DisconnectReason, sleep, launch });
    });

    Exp.ev.on('creds.update', saveCreds);
    
    Exp.ev.on('messages.upsert', async ({
        messages
    }) => {
        const cht = {
            ...messages[0],
            id: messages[0].key.remoteJid
        };
        let isMessage = cht?.message;
        let isStubType = cht?.messageStubType;
        if (!(isMessage || isStubType)) return;
        if (cht.key.remoteJid === 'status@broadcast' && cfg.autoreadsw == true) {
            await Exp.readMessages([cht.key]);
            let typ = getContentType(cht.message);
            console.log((/protocolMessage/i.test(typ)) ? `${cht.key.participant.split('@')[0]} Deleted story❗` : 'View user stories : ' + cht.key.participant.split('@')[0]);
            return;
        }
        if (cht.key.remoteJid !== 'status@broadcast'){
            const exs = { cht, Exp, is: {}, store };
            await Data.utils(exs);

            if(isStubType) { 
                Data.stubTypeMsg(exs);
            } else { 
                await Data.helper(exs);
            }
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