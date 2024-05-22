'use strict';

const fs = require('fs');

//----------------------

class Utils {
    constructor() {
        throw new Error("Utils class not meant to be instantiated");
    }

    static delay(delayMs) {
        return result => new Promise(resolve => setTimeout(() => resolve(result), delayMs));
    }

    static createFileIfNotExists(filePath, contents) {
        try {
            fs.writeFileSync(filePath, contents, {flag: 'wx'});
        } catch (e) {
            // Ignore if already exists.
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
    }

    static readJSONFile(filePath) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    static writeJSONFile(filePath, contents) {
        fs.writeFileSync(filePath, JSON.stringify(contents));
    }

}


module.exports = Utils;