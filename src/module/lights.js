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
        duration: 6,
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
        duration: 24,
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
        duration: 12,
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

async function hasResources(actor, type) {
    log.debug("hasResources() ", type);
    const lightSource = LIGHTSOURCES[type];
    const resource = lightSource.resource;
    const dependency = lightSource.other;

    const hasDependency = (dependency) ? actor.data.items.find(f => f.name === dependency.name && f.type === dependency.type) : true;
    log.debug(`has dependency? ${hasDependency}`);
    const requiredResource = actor.data.items.find(f => f.name === resource.name && f.type === resource.type);
    log.debug("required resource: ", requiredResource);
    
    const quantity = requiredResource.data.data[resource.qty] 
    log.debug("required resource quantity: ", quantity);
    if (hasDependency && requiredResource) {
        const data = {};
        let hasEnough = false;
        if (quantity.value > 0) {
            hasEnough = true;
            const qty = {value: Math.max(0, requiredResource.data.data[resource.qty].value - 1)};
            data[resource.qty]= qty;
        } else if (quantity > 0) {
            hasEnough = true;
            data[resource.qty]= Math.max(0, requiredResource.data.data[resource.qty] - 1);
        } else {
            log.debug("not enough resource quantity");
        }
        if (hasEnough) {
            log.debug("new resource data: ", data);
            await actor.updateEmbeddedDocuments("Item", [{_id:requiredResource.id,data:data}]);
            return foundry.utils.mergeObject(LIGHTSOURCES[type],{item: requiredResource});
        }
    }
}

function getLightSource(token, sourceName) {
    log.debug("getLightSource() ", token.actor, sourceName);
    return hasResources(token.actor, sourceName);
  } 
  
async function illuminate(token, light) {
    log.debug("illuminate() ", light)
    if (token) {
        const scene = game.scenes.active;
        const newToken = foundry.utils.mergeObject(token.data, light.config);
        await scene.updateEmbeddedDocuments("Token",[newToken])
        await token.document.setFlag("ose","light-on",true);
    }
    //game.Gametime.doIn(game.Gametime.DMf({minutes:60}), "ExtinguishTorch", actor.id, token.id);
}

async function extinguish(actorId, tokenId) {
    log.debug("extinguish() ",actorId, tokenId);
    const actor = game.actors.get(actorId);
    const token = actor.getActiveTokens({linked:true}).find(t => t.id === tokenId);
    if (token) {
        const scene = game.scenes.active;
        const newToken = foundry.utils.mergeObject(token.data, lightOff);
        await scene.updateEmbeddedDocuments("Token",[newToken])
        await token.document.setFlag("ose","light-on",false);
    }
}

async function toggleLight(token, item) {
    log.debug("toggleLight() ", item);
    if (!token.document.getFlag("ose","light-on" )) {
        const source = await getLightSource(token, item);
        if (source) illuminate(token, source);
    } else {
        extinguish(token.actor.id, token.id);
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
        toggleLight(token, "Light Spell");
    }
}
