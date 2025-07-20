import { MODULE_ID, SOURCES } from "./const.js";
import { messageItemHasRollOption } from "./helpers.js";
import { extractDCValueRegex, isIncarnate } from "./incarnate.js";
import { isMechanic, setMechanicRelevantInfo } from "./mechanic.js";
import { setupSettings } from "./settings.js";
import { getSpecificSummonDetails } from "./specificSummons.js";
import { handleUpdateMessage } from "./updateMessage.js";
import { summon, getTraditionalSummonerSpellDetails } from "./summon.js";
import { setNecromancerHooks } from "./necromancer.js";

Hooks.once("init", async function () {
  loadTemplates([
    `modules/${MODULE_ID}/templates/updateMessage.hbs`,
  ])
  setupSettings();
});

Hooks.once("ready", async function () {
  handleUpdateMessage();
  setNecromancerHooks();
  Hooks.on("createChatMessage", async (chatMessage, _info, userID) => {
    if (userID !== game.user.id) return;

    // Handle Specific Case Bind Heroic Spirit
    const itemUuid = isBindHeroicSpiritHit(chatMessage)
      ? SOURCES.NECROMANCER.BIND_HEROIC_SPIRIT_STRIKE
      : chatMessage?.item?.sourceId;

    if (!itemUuid) return;

    // TODO handle Incarnate spells at a later date
    //if (!chatMessage?.flags?.pf2e?.origin?.rollOptions?.includes("summon")) return;
    let summonLevel = 20;
    //attributes.classDC.value

    const summonerActor = ChatMessage.getSpeakerActor(chatMessage.speaker);

    const spellRank = chatMessage?.flags?.pf2e?.origin?.castRank ?? 0;
    const spellRelevantInfo = { rank: spellRank, summonerLevel: summonerActor.level }
    //Grab DC for Incarnate spells
    if (isIncarnate(chatMessage)) spellRelevantInfo.dc = extractDCValueRegex(chatMessage.content) ?? 0;
    if (isMechanic(chatMessage)) {
      setMechanicRelevantInfo(summonerActor, spellRelevantInfo);
    }

    let summonDetailsGroup = getSpecificSummonDetails(itemUuid, spellRelevantInfo)
    if (!summonDetailsGroup) {
      summonDetailsGroup = getTraditionalSummonerSpellDetails(itemUuid, spellRank);
    }

    const summonType = isMechanic(chatMessage) ? "mechanic" : (messageItemHasRollOption(chatMessage, "thrall") ? "thrall" : "summon")
    await summon(summonerActor, itemUuid, summonType, summonDetailsGroup);
  });
});

function isBindHeroicSpiritHit(chatMessage) {
  return chatMessage?.flags?.pf2e?.context?.type === 'attack-roll'
    && ['success', 'criticalSuccess'].includes(chatMessage?.flags?.pf2e?.context?.outcome)
    && chatMessage?.flags?.pf2e?.context?.options?.includes("self:effect:bind-heroic-spirit")
}

// function getMap(uuid) {
//   const name = fromUuidSync(uuid).name.toUpperCase().split(' ').join('_')
//       console.log(`${name}: "${uuid}",`)
//   }
