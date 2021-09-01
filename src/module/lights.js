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
    const lightSource = LIGHTSOURCES[type];
    const resource = lightSource.resource;
    const dependency = lightSource.other;

    const hasDependency = (dependency) ? actor.data.items.find(f => f.name === dependency.name && f.type === dependency.type) : true;
    const requiredResource = actor.data.items.find(f => f.name === resource.name && f.type === resource.type);
    if (hasDependency && requiredResource && (requiredResource.data.data.quantity?.value > 0)) {
        const quantity = {value: Math.max(0, requiredResource.data.data.quantity.value - 1)};
        await actor.updateEmbeddedDocuments("Item", [{_id:requiredResource.id,data:{quantity:quantity}}]);
        return foundry.utils.mergeObject(LIGHTSOURCES[type],{item: requiredResource});
    }
}

async function hasLightSpell(actor) {
    const item = actor.data.items.find(f => f.type === "spell" && f.name.includes("Light"));
    console.log("Spells:",item)
    const spell = (item) ? item.data.data: undefined;
    if (spell && spell.memorized >= 0 && spell.cast < spell.memorized) {
        const quantity = Math.min(spell.memorized, spell.cast + 1);
        console.log(spell)
        await actor.updateEmbeddedDocuments("Item", [{_id:item.id,data:{cast:quantity}}]);
        return foundry.utils.mergeObject(LIGHTSOURCES["Light Spell"],{item: item});
    }
}

function getLightSource(token, sourceName) {
    switch (sourceName) {
        case "Torch":
            return hasResources(token.actor, sourceName);
        case "Lantern":
            return hasResources(token.actor, sourceName);
        case "Light Spell":
            return hasLightSpell(token.actor);
    }
  } 
  
async function illuminate(token, light) {
    // console.log("illuminating ",light)
    if (token) {
        const scene = game.scenes.active;
        const newToken = foundry.utils.mergeObject(token.data, light.config);
        await scene.updateEmbeddedDocuments("Token",[newToken])
        await token.document.setFlag("ose","light-on",true);
    }
    //game.Gametime.doIn(game.Gametime.DMf({minutes:60}), "ExtinguishTorch", actor.id, token.id);
}

async function extinguish(actorId, tokenId) {
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
    const source = await getLightSource(token, item);
    if (source && !token.document.getFlag("ose","light-on" )) {
        illuminate(token, source);
    } else {
        extinguish(token.actor.id, token.id);
    }
}

export function torch(token) {
    if (token) {
        toggleLight(token, "Torch");
    }
}

export function lantern(token) {
    if (token) {
        toggleLight(token, "Lantern");
    }
}

export function spell(token) {
    if (token) {
        toggleLight(token, "Light Spell");
    }
}
