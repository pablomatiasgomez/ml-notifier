#!/usr/bin/env node
'use strict';

global.__project_dir = __dirname + '/..';
global.config = Object.assign(require('./config.js'), require(`${__project_dir}/config.json`));

const Utils = require('./utils.js');
const MercadoLibreAPI = require('./ml-api.js');
const NotifierService = require('./notifier-service.js');

//----------------------

Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

//----------------------

(function () {
    let itemName = process.argv.slice(2)[0];
    if (!itemName) throw new Error('Missing item name param');

    const filtersFile = __project_dir + "/filters/" + itemName + "-filters.json";
    const itemsFile = __project_dir + "/filters/" + itemName + "-items.json";
    Utils.createFileIfNotExists(itemsFile, "[]");

    let filters = Utils.readJSONFile(filtersFile);
    let oldItemIds = Utils.readJSONFile(itemsFile);

    let mlAPI = new MercadoLibreAPI();
    let notifierService = new NotifierService();

    return mlAPI.fetchItems(filters).then(items => {
        console.log(`Got a total of ${items.length} items.`)

        let itemById = {};
        items.forEach(function (item) {
            itemById[item.id] = item;
        });
        let itemIds = Object.keys(itemById);

        // Save current item ids
        Utils.writeJSONFile(itemsFile, itemIds);

        let newItemIds = itemIds.diff(oldItemIds);
        console.log(`Found ${newItemIds.length} new items.`)

        if (newItemIds.length) {
            let messageHTML = "";
            newItemIds.forEach(function (itemId) {
                let item = itemById[itemId];
                messageHTML += `- <a href="${item.permalink}">${item.title}</a> $${item.price} ${item.currency_id}\n`
            });
            return notifierService.notify(`<b>Found ${newItemIds.length} new items (out of ${itemIds.length}) for ${itemName}:</b>\n\n${messageHTML}`);
        }
    });
})();