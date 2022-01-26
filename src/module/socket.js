import { Logger } from "./logger.js";

const log = new Logger();
let socket;

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule("ose-lights");
	socket.register("setTimer", _setTimer);
    socket.register("clearTimer", _clearTimer);
});

export function setLightTimer(light, token) {
    return socket.executeAsGM("setTimer", light.duration, token.id);
}

export function clearLightTimer(eventId, token) {
    return socket.executeAsGM("clearTimer", eventId, token.id);
}

async function _setTimer(duration, tokenId) {
    log.debug("setTimer", duration, tokenId);
    let eventId = 1;
    if (duration > 0) {
        eventId = await game.Gametime.notifyAt({minute:duration}, "ExtinguishLight", tokenId);
        log.debug("Setting timer for ", duration, eventId);
    }
    const token = game.canvas.tokens.placeables.find( e => e.id == tokenId);
    await token.document.setFlag("ose","light-on", eventId);
}

async function _clearTimer(eventId, tokenId) {
    game.Gametime.clearTimeout(eventId);
    const token = game.canvas.tokens.placeables.find( e => e.id == tokenId);
    await token.document.setFlag("ose","light-on", 0);
}