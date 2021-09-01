import { torch, lantern, spell } from './lights.js';
import { Logger } from './logger.js';

const log = new Logger();

Hooks.once('init', async function() {
    log.info("OSE Lights Module initializing");
    game.settings.register("ose-lights", "playerTorches", {
		name: game.i18n.localize("ose-lights.player.name"),
		hint: game.i18n.localize("ose-lights.player.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
});

Hooks.once('ready', async function() {
	game.oselights = { torch, lantern, spell };
	game.debug = true;
    log.info("OSE Lights Module ready");
});