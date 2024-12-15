import jimp from "jimp"
const {
  getBinaryNodeChild, 
  jidNormalizedUser
} = "baileys".import()
const { func } = await `${fol[0]}func.js`.r()

export default 
async function initialize({ Exp, store }) {
  try {
    
    Exp.func = new func({ Exp, store })
        
    Exp.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
      jid = jidNormalizedUser(jid)
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
      }, timeoutMs)

      const child = getBinaryNodeChild(result, 'picture')
       return child?.attrs?.url
    }

    Exp.setProfilePicture = async (id,buffer) => {
      try{
        id = jidNormalizedUser(id)
        const jimpread = await jimp.read(buffer);
        const min = jimpread.getWidth()
        const max = jimpread.getHeight()
        const cropped = jimpread.crop(0, 0, min, max)

        let buff = await cropped.scaleToFit(720, 720).getBufferAsync(jimp.MIME_JPEG)
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
		})
      } catch (e) {
        throw new Error(e)
      }
    }

    Exp.sendContacts = async(cht, numbers)=> {
      try {
        let contacts = []
        for(let i of numbers){
          let number = i.split("@")[0]
          let name = Exp.func.getName(number)
          let vcard = `BEGIN:VCARD
            VERSION:3.0
            N:${name}
            FN:${name}
            item1.TEL;waid=${number}:+${number}
            item1.X-ABLabel:Ponsel
            END:VCARD`
            .split("\n")
            .map(a => a.trim())
            .join("\n")
          contacts.push({
            vcard,
            displayName: name
          })
        }
        return Exp.relayMessage(cht.id, {
          "contactsArrayMessage": {
            "displayName": "‎X-ReimuAI",
            contacts,
            ...((cht.key && cht.sender) ? { contextInfo: {
                stanzaId: cht.key.id,
                participant: cht.sender,
                quotedMessage: (await store.loadMessage(cht.id, cht.key.id)).message
              }
            } : {})
          }
        }, {})
      } catch (e) {
        console.error("Error in Exp.sendContacts: "+ e)
        throw new Error(e)
      }
    }

  } catch (e) {
    console.error("Error in Initialize.js: "+ e)
  }
}