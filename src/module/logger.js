export class Logger {
    constructor() {
        this.service = "OSE-Lights";
    }

    debugMode() {
        return game.settings.get("ose-lights","debug") || true;
    }


    info(message) {
        console.log(`${this.service}| INFO | ${message}`);
    }

    debug(message, ...objects) {
        if (this.debugMode()) { 
            console.log(`${this.service}| DEBUG | ${message}`);
            objects.forEach( (o) => {
                console.log(o);
            });
        }
    }

    error(message, ...objects) {
        console.log(`${this.service}| ERROR| ${message}`);
        objects.forEach( (o) => {
            console.log(`${this.service}| ERROR |`,o);
        });
    }
}