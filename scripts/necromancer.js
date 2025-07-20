import { MODULE_ID, SOURCES, CREATURES } from "./const.js";
import { getSpecificSummonDetails } from "./specificSummons.js";
import { summon } from "./summon.js";

$(document).on('click', ".living-graveyard-move-yes", async function(){    
    const messageId = $(this).parent().parent().parent().data("message-id");
    if (messageId) {
        const t = game.messages.get(messageId);
        const sceneId = t.getFlag(MODULE_ID, 'sceneId');
        const tokenId = t.getFlag(MODULE_ID, 'tokenId');
        const scene = game.scenes.get(sceneId);
        const token = scene.tokens.get(tokenId);
        const actor = token.actor;        
        const summonerId = actor.getFlag(MODULE_ID, 'summoner.id');
        const expirationEffect = actor.itemTypes.effect.find(p=>p.system.slug=="effect-thrall-expiration-date");
        const currentTime = game.time.worldTime;
        const startTime = expirationEffect.system.start.value;
        const delta = currentTime - startTime;
        let duration = 60;
        if (delta > 0){
            duration -= delta;
        }

        const summonerActor = game.actors.get(summonerId);

        const spellRank = Math.floor(summonerActor.level/2);
        
        const durationInfo = { value: Math.floor(duration/6), unit: 'rounds' };
        const spellRelevantInfo = { rank: spellRank, summonerLevel: summonerActor.level, duration: durationInfo }

        const summonDetailsGroup = getSpecificSummonDetails(SOURCES.NECROMANCER.CREATE_THRALL, spellRelevantInfo);

        for (const summonDetails of summonDetailsGroup) {
            summonDetails.amount = 3;
        }
        
        await summon(summonerActor, SOURCES.NECROMANCER.CREATE_THRALL, "thrall", summonDetailsGroup);
        await t.delete();
    }
});

export function setNecromancerHooks(){
    Hooks.on("preUpdateToken", (tokenDoc, data, id) => {
        if (tokenDoc?.actor?.isDead || !game?.combats?.active) {
            return
        }
        if (!data.x && !data.y) {
            return;
        }
        if (data.x === tokenDoc.x && data.y === tokenDoc.y) {
            return
        }
        if (game.combat) {
            if (game?.skipMoveTrigger?.[id]) {
                return
            }
            if (tokenDoc.actor._stats.compendiumSource == CREATURES.NECROMANCER.LIVING_GRAVEYARD) {
                checkLivingGraveyardMovement(tokenDoc);
            }
        }
    });
}

function checkLivingGraveyardMovement(tokenDoc){
    const combatant = game.combat.combatant;
    const check = {
        cId: combatant._id,
        sceneId: tokenDoc.scene.id,
        tokenId: tokenDoc.id, 
        actorId: tokenDoc.actorId,
        actorUuid: tokenDoc.actor.uuid,
        actionName: "living-graveyard-move"
    };
    let whispers = ChatMessage.getWhisperRecipients("GM").map((u) => u.id);
    if (combatant.players) {
        whispers = whispers.concat(combatant.players.map((u) => u.id));
    }
    let data = {
        flavor: '',
        user: null,
        speaker: {
            scene: null,
            actor: null,
            token: null,
            alias: "System"
        },
        style: CONST.CHAT_MESSAGE_STYLES.OOC,
        content: '<div>The Living Graveyard has moved. Do you want to summon 3 new Thralls?</div><div class="message-buttons"><button class="living-graveyard-move-yes">Yes</button></div>',
        whisper: whispers,
        flags: {'pf2e-summons-assistant': check}
    };

    ChatMessage.create(data);
}