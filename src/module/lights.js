import { Logger } from "./logger.js";
import { setLightTimer, clearLightTimer } from "./socket.js";

const log = new Logger();

const LIGHTSOURCES = {
    "Torch": {
        light: {
            alpha: 0.15,
            dim: 30,
            bright: 15,
            angle: 360,
            color: "#5c4b0f",
            animation: {
                type: "torch"
            },
            attenuation: 0.7,
        },
        resource: {
            name: "Torch",
            type: "item",
            qty: "quantity"
        },
        duration: 60,
    },
    "Lantern": {
        light: {
            alpha: 0.15,
            dim: 30,
            bright: 15,
            angle: 30,
            color: "#5c4b0f",
            animation: {
                type: "flame"
            },
            attenuation: 0.7,
        },
        resource: {
            name: "Oil flask", 
            type: "item",
            qty: "quantity"
        },
        dependency: {
            name: "Lantern",
            type: "item"
        },
        duration: 240,
    },
    "Light Spell": {
        light: {
            alpha: 0.25,
            dim: 15,
            bright: 5,
            angle: 360,
            color: "#ffffff",
            animation: {
                type: "starlight"
            },
            attenuation: 0.7,
        },
        resource: {
            name: "C1.4 Light",
            type: "spell",
            qty: "cast"
        },
        duration: 120,
    },
    "Continual Light Spell": {
        light: {
            alpha: 0.25,
            dim: 30,
            bright: 15,
            angle: 360,
            color: "#ffffff",
            animation: {
                type: "starlight"
            },
            attenuation: 0.7,
        },
        resource: {
            name: "C3.1 Continual Light",
            type: "spell",
            qty: "cast"
        },
        duration: -1,
    }
}

const lightOff = {
    dim: 0,
    bright: 0,
    animation: {}
}

function hasResources(actor, type, noisily=true) {
    log.debug("hasResources(): ", type);
    const lightSource = LIGHTSOURCES[type];
    const resource = lightSource.resource;
    const dependency = lightSource.dependency;

    const hasDependency = (dependency) ? actor.items.find(f => f.name === dependency.name && f.type === dependency.type) : true;
    log.debug(`has dependency? ${hasDependency}`);
    const requiredResource = actor.items.find(f => f.name === resource.name && f.type === resource.type);
    log.debug("required resource: ", requiredResource);

    const quantity = (requiredResource) ? requiredResource.system[resource.qty]  : 0;
    log.debug("required resource quantity: ", quantity);
    if (hasDependency && requiredResource) {
        const hasEnough = ((quantity.value > 0) || (quantity > 0));
        if (hasEnough) {
            return requiredResource;
        }
    }
    if (noisily) {
        const message = (hasDependency) ? `You can't light a ${type} because you don't have enough of the required resource  "${resource.name}"` : `You can't light a ${type} because you don't have the requisite "${dependency.name}"`;
        ui.notifications.warn(message);
    }
}

async function getLightSource(actor, sourceName) {
    log.debug("getLightSource():", actor, sourceName);
    const lightSource = LIGHTSOURCES[sourceName];
    const resource = lightSource.resource;
    const requiredResource = hasResources(actor, sourceName);
    if (requiredResource) {
        const quantity = (requiredResource) ? requiredResource.system[resource.qty]  : 0;
        const data = {};
        if (quantity.value > 0) {
            const qty = {value: Math.max(0, requiredResource.system[resource.qty].value - 1)};
            data[resource.qty]= qty;
        } else if (quantity > 0) {
            data[resource.qty]= Math.max(0, requiredResource.system[resource.qty] - 1);
        }
        log.debug("new resource data: ", data);
        await actor.updateEmbeddedDocuments("Item", [{_id:requiredResource.id,system:data}]);
        return foundry.utils.foundry.utils.mergeObject(LIGHTSOURCES[sourceName],{item: requiredResource});
    }
  } 
  
async function illuminate(token, light) {
    log.debug("illuminate():", light)
    if (token) {
        const tokenArray = [token];
        const scene = canvas.scene;
        const updates = foundry.utils.duplicate(token.document)
        foundry.utils.mergeObject(updates.light, light.light)
        let updateMap = tokenArray.map(t => foundry.utils.mergeObject({ _id: t.id }, updates))
        await scene.updateEmbeddedDocuments("Token", updateMap);
        setLightTimer(light, token);

        const item = (light.dependency) ? light.dependency.name: light.resource.name;
        const message = `lit up a ${item}`;
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: token.actor.name}),
            content: message
            });
    }
}

async function extinguish(token, eventId) {
    log.debug("extinguish():",token);
    if (token) {
        const tokenArray = [token];
        const scene = canvas.scene;
        const updates = foundry.utils.duplicate(token.document)
        foundry.utils.mergeObject(updates.light, lightOff)
        let updateMap = tokenArray.map(t => foundry.utils.mergeObject({ _id: t.id }, updates))
        await scene.updateEmbeddedDocuments("Token", updateMap);
        clearLightTimer(eventId, token);

        const message = `Extinguished their light source.`;
        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: token.actor.name}),
            content: message
            });
    }
}

async function toggleLight(actor, token, item) {
    log.debug("toggleLight():", item);
    if (game.settings.get("ose-lights","player-allowed")===true || game.user.isGM) {
        if (!token.document.getFlag("ose","light-on")) {
            log.debug("toggleLight(): light-on flag not on");
            const source = await getLightSource(actor, item);
            log.debug("toggleLight(): lightsource is ", source);
            if (source) illuminate(token, source);
        } else {
            extinguishLight(token);
        }
    } else {
        log.debug("toggleLight(): Players not allowed");
    }
}

export function extinguishLight(token) {
    log.debug("extinguishLight(): ", token);
    if (token) {
        const eventId = token.document.getFlag("ose","light-on");
        log.debug("Extinguishing event ",eventId);
        if (eventId > 0) {
            extinguish(token, eventId);
        }
    }
}
export function torch(token) {
    log.debug("torch():",token);
    if (token) {
        toggleLight(token.actor, token, "Torch");
    }
}

export function lantern(token) {
    log.debug("lantern():",token);
    if (token) {
        toggleLight(token.actor, token, "Lantern");
    }
}

export function spell(token) {
    log.debug("spell():", token);
    if (token) {
        let target = token;
        log.debug("Targets:",game.user.targets.size);
        game.user.targets.forEach(t => {
            target = t;
        });
        log.debug("target of Light Spell: ", target);
        const hasCLSpell = hasResources(token.actor, "Continual Light Spell", false);
        log.debug("has CL spell? ",hasCLSpell);
        const spellName = (hasCLSpell) ? "Continual Light Spell" : "Light Spell";
        log.debug("spell to use:",spellName);
        toggleLight(token.actor, target, spellName);
    }
}
