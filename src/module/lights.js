import { Logger } from "./logger.js";

const log = new Logger();

const LIGHTSOURCES = {
    "Torch": {
        config: {
            dimLight: 30,
            brightLight: 15,
            lightAngle: 360
        },
        resource: {
            name: "Torch",
            type: "item",
            qty: "quantity"
        },
        duration: 60,
    },
    "Lantern": {
        config: {
            dimLight: 30,
            brightLight: 15,
            lightAngle: 30,
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
        config: {
            dimLight: 15,
            brightLight: 5,
            lightAngle: 360,
        },
        resource: {
            name: "C1.4 Light",
            type: "spell",
            qty: "cast"
        },
        duration: 120,
    },
    "Continual Light Spell": {
        config: {
            dimLight: 30,
            brightLight: 15,
            lightAngle: 360,
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
    dimLight: 0,
    brightLight: 0
}

function hasResources(actor, type) {
    log.debug("hasResources() ", type);
    const lightSource = LIGHTSOURCES[type];
    const resource = lightSource.resource;
    const dependency = lightSource.other;

    const hasDependency = (dependency) ? actor.data.items.find(f => f.name === dependency.name && f.type === dependency.type) : true;
    log.debug(`has dependency? ${hasDependency}`);
    const requiredResource = actor.data.items.find(f => f.name === resource.name && f.type === resource.type);
    log.debug("required resource: ", requiredResource);

    const quantity = (requiredResource) ? requiredResource.data.data[resource.qty]  : 0;
    log.debug("required resource quantity: ", quantity);
    if (hasDependency && requiredResource) {
        const hasEnough = ((quantity.value > 0) || (quantity > 0));
        if (hasEnough) {
            return requiredResource;
        } else { 
            log.debug("not enough resource quantity:",hasEnough);
        }
    }
}

async function getLightSource(token, sourceName) {
    log.debug("getLightSource() ", token.actor, sourceName);
    const lightSource = LIGHTSOURCES[sourceName];
    const resource = lightSource.resource;
    const requiredResource = hasResources(token.actor, sourceName);
    if (requiredResource) {
        const quantity = (requiredResource) ? requiredResource.data.data[resource.qty]  : 0;
        const data = {};
        if (quantity.value > 0) {
            const qty = {value: Math.max(0, requiredResource.data.data[resource.qty].value - 1)};
            data[resource.qty]= qty;
        } else if (quantity > 0) {
            data[resource.qty]= Math.max(0, requiredResource.data.data[resource.qty] - 1);
        }
        log.debug("new resource data: ", data);
        await token.actor.updateEmbeddedDocuments("Item", [{_id:requiredResource.id,data:data}]);
        return foundry.utils.mergeObject(LIGHTSOURCES[sourceName],{item: requiredResource});
    }
  } 
  
async function illuminate(token, light) {
    log.debug("illuminate() ", light)
    if (token) {
        const scene = game.scenes.active;
        const newToken = foundry.utils.mergeObject(token.data, light.config);
        let eventId = 1;
        await scene.updateEmbeddedDocuments("Token",[newToken])
        if (light.duration > 0) {
            eventId = await game.Gametime.notifyAt({minute:light.duration}, "ExtinguishLight", token.id);
            log.debug("Setting timer for ", light.duration, eventId);
        }
        await token.document.setFlag("ose","light-on", eventId);
    }
}

async function extinguish(token, eventId) {
    log.debug("extinguish() ",token);
    if (token) {
        game.Gametime.clearTimeout(eventId);
        const scene = game.scenes.active;
        const newToken = foundry.utils.mergeObject(token.data, lightOff);
        await scene.updateEmbeddedDocuments("Token",[newToken])
        await token.document.setFlag("ose","light-on", 0);
    }
}

async function toggleLight(token, item) {
    log.debug("toggleLight() ", item);
    if (!token.document.getFlag("ose","light-on")) {
        const source = await getLightSource(token, item);
        if (source) illuminate(token, source);
    } else {
        extinguishLight(token);
    }
}

export function extinguishLight(token) {
    log.debug("extinguishLight() ", token);
    if (token) {
        const eventId = token.document.getFlag("ose","light-on");
        if (eventId > 0) {
            extinguish(token, eventId);
        }
    }
}
export function torch(token) {
    log.debug("torch() ",token);
    if (token) {
        toggleLight(token, "Torch");
    }
}

export function lantern(token) {
    log.debug("lantern() ",token);
    if (token) {
        toggleLight(token, "Lantern");
    }
}

export function spell(token) {
    log.debug("spell() ",token);
    if (token) {
        const hasCLSpell = hasResources(token.actor, "Continual Light Spell");
        log.debug("has CL spell? ",hasCLSpell);
        const spellName = (hasCLSpell) ? "Continual Light Spell" : "Light Spell";
        log.debug("spell to use:",spellName);
        toggleLight(token, spellName);
    }
}