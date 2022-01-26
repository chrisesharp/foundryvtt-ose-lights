import { Logger } from "./logger.js";
import { setLightTimer, clearLightTimer } from "./socket.js";

const log = new Logger();

const LIGHTSOURCES = {
    "Torch": {
        light: {
            dim: 30,
            bright: 15,
            angle: 360
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
            dim: 30,
            bright: 15,
            angle: 30,
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
            dim: 15,
            bright: 5,
            angle: 360,
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
            dim: 30,
            bright: 15,
            angle: 360,
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
    bright: 0
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

async function getLightSource(actor, sourceName) {
    log.debug("getLightSource() ", actor, sourceName);
    const lightSource = LIGHTSOURCES[sourceName];
    const resource = lightSource.resource;
    const requiredResource = hasResources(actor, sourceName);
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
        await actor.updateEmbeddedDocuments("Item", [{_id:requiredResource.id,data:data}]);
        return foundry.utils.mergeObject(LIGHTSOURCES[sourceName],{item: requiredResource});
    }
  } 
  
async function illuminate(token, light) {
    log.debug("illuminate() ", light)
    if (token) {
        const scene = game.scenes.active;
        const existingData = token.data;
        existingData.light = light.light;
        const newToken = foundry.utils.mergeObject(token.data, existingData);
        
        await scene.updateEmbeddedDocuments("Token",[newToken]);
        token.updateLightSource();

        setLightTimer(light, token);
    }
}

async function extinguish(token, eventId) {
    log.debug("extinguish() ",token);
    if (token) {
        const scene = game.scenes.active;
        const existingData = token.data;
        existingData.light = lightOff;
        const newToken = foundry.utils.mergeObject(token.data, existingData);

        await scene.updateEmbeddedDocuments("Token",[newToken])
        token.updateLightSource();
        clearLightTimer(eventId, token);
    }
}

async function toggleLight(actor, token, item) {
    log.debug("toggleLight() ", item);
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
    log.debug("extinguishLight() ", token);
    if (token) {
        const eventId = token.document.getFlag("ose","light-on");
        log.debug("Extinguishing event ",eventId);
        if (eventId > 0) {
            extinguish(token, eventId);
        }
    }
}
export function torch(token) {
    log.debug("torch() ",token);
    if (token) {
        toggleLight(token.actor, token, "Torch");
    }
}

export function lantern(token) {
    log.debug("lantern() ",token);
    if (token) {
        toggleLight(token.actor, token, "Lantern");
    }
}

export function spell(token) {
    log.debug("spell() ", token);
    if (token) {
        let target = token;
        log.debug("Targets:",game.user.targets.size);
        game.user.targets.forEach(t => {
            target = t;
        });
        log.debug("target of Light Spell: ", target);
        const hasCLSpell = hasResources(token.actor, "Continual Light Spell");
        log.debug("has CL spell? ",hasCLSpell);
        const spellName = (hasCLSpell) ? "Continual Light Spell" : "Light Spell";
        log.debug("spell to use:",spellName);
        toggleLight(token.actor, target, spellName);
    }
}
