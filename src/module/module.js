import { torch, lantern, spell } from './lights.js';

Hooks.once('init', async function() {
    console.log("OSE Lights Module initializing");
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
    console.log("OSE Lights Module ready");
});