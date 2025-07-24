import { MODULE_ID } from "../const.js";
import { messageItemHasRollOption } from "../helpers.js";

const EIDOLON_CLASS_UUID = "Compendium.pf2e-animal-companions.AC-Features.Item.xPn27nNxcLOByTXJ";

export function isSummoner(msg) {
    return messageItemHasRollOption(msg, "origin:item:trait:summoner");
}

export function setSummonerRelevantInfo(summonerActor, spellRelevantInfo) {
    spellRelevantInfo.summonerActorId = summonerActor.id;
}

export async function getEidolon(summonerActorId){
    const summonerActor = game.actors.get(summonerActorId);
    const defaultEidolonUUID = summonerActor.getFlag(MODULE_ID, 'eidolonUUID');

    const eidolons = game.actors
        .filter(act=> 
            act.type == 'character' && 
            act.class.sourceId == EIDOLON_CLASS_UUID
        )
        .map(act => ({ name: act.name, uuid: act.uuid, selected: defaultEidolonUUID && act.uuid == defaultEidolonUUID }));
  
    //TODO: When the Shared Data option of Toolbelt is back, check if there are any eidolons whose master are the summoner and, in that case, return them
    if (eidolons.length == 1){
        const eidolonUUID = eidolons[0].uuid;
        await summonerActor.setFlag(MODULE_ID, 'eidolonUUID', eidolonUUID);   
        return eidolonUUID;
    } else if (eidolons.length > 1){
        ui.notifications.warn(game.i18n.localize("pf2e-summons-assistant.notification.summoner.too-many-eidelons"));  
    }
    return null;
}