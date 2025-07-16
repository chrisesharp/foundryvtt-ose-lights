import { ElapsedTime } from "./ElapsedTime.js";
export const registerSettings = function () {
    // Register any custom module settings here
    let modulename = "about-time";
    game.settings.register("about-time", "store", {
        name: "Elapsed Time event queue",
        hint: "Don't touch this",
        default: {},
        type: Object,
        scope: 'world',
        config: false
    });
};
