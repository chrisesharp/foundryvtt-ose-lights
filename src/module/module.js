import { torch, lantern, spell, extinguishLight } from './lights.js';
import { Logger } from './logger.js';
import { ElapsedTime } from "./about-time/ElapsedTime.js"
import { PseudoClock } from './about-time/PseudoClock.js';

const log = new Logger();

Hooks.once('init', async function() {
    log.info("OSE Lights Module initializing");
    game.settings.register("ose-lights", "player-allowed", {
		name: game.i18n.localize("ose-lights.player.name"),
		hint: game.i18n.localize("ose-lights.player.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register("ose-lights", "debug", {
		name: game.i18n.localize("ose-lights.debug"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register("about-time", "store", {
        name: "Elapsed Time event queue",
        hint: "Don't touch this",
        default: {},
        type: Object,
        scope: 'world',
        config: false
    });
});

Hooks.once('ready', async function() {
	game.oselights = { torch, lantern, spell, extinguishLight };
	game.oselights.debug = true;
	PseudoClock.init();
    ElapsedTime.init();
    log.info("OSE Lights Module ready");
});

Hooks.on("about-time.eventTrigger",(event, tokenId)=> {
	log.debug("eventTrigger hook called: ",event, tokenId);
	if (event === "ExtinguishLight") {
		const token = canvas.tokens.placeables.find(o => o.id === tokenId);
		if (token) game.oselights.extinguishLight(token);
	}
});