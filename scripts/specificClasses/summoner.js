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
            act.class.sourceId.compendiumSource == EIDOLON_CLASS_UUID
        )
        .toSorted(act => act.name)
        .map(act => ({ name: act.name, uuid: act.uuid, selected: defaultEidolonUUID && act.uuid == defaultEidolonUUID }));
    
    //TODO: When the Shared Data option of Toolbelt is back, check if there are any eidolons whose master are the summoner and, in that case, return them

    if (eidolons.length == 1){
        const eidolonUUID = eidolons[0].uuid;
        await summonerActor.setFlag(MODULE_ID, 'eidolonUUID', eidolonUUID);   
        return eidolonUUID;
    }
    if (eidolons.length > 1){    
        const eidolonsOptions = eidolons.map(eidolon => `<option value="${eidolon.uuid}" ${(eidolon.selected ? "selected" : "")}>${eidolon.name}</option>`)
        const uuidResult = await foundry.applications.api.DialogV2.wait({
            window: { title: "Select your Eidolon" },
            content: `
                <select name="eidolon">
                    ${eidolonsOptions}                
                </select>
            `,
            buttons: [{
                label: "Select",
                action: "select",
                callback : async (event, button, dialog) => {
                    const eidolonUUID = button.form.elements.eidolon.value;
                    await summonerActor.setFlag(MODULE_ID, 'eidolonUUID', eidolonUUID);
                    return eidolonUUID;
                }
            }]
        });
        if (uuidResult)
            return uuidResult;
    }
    return null;
}