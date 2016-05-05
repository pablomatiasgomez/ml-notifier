#!/usr/bin/env node

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var request = require('request');
var fs = require('fs');
var dateFormat = require('dateformat');
var exec = require('child_process').exec;


var SEARCH_URL = "https://api.mercadolibre.com/sites/MLA/search";

var itemName = process.argv[2];
if (!itemName) {
	console.log("Missing item name param");
	return;
}
var filtersFile = __dirname + "/filters/" + itemName + "-filters.json";
var itemsFile = __dirname + "/filters/" + itemName + "-items.json";

function getUrl(filters) {
	var url = SEARCH_URL + "?";
	for (var key in filters) {
		if (filters.hasOwnProperty(key)) {
			url += key + "=" + encodeURIComponent(filters[key]) + "&";
		}
	}
	return url;
}

console.log("********** STARTING PROCESS (" + getCurrDate() + ") **********");

var filters = JSON.parse(fs.readFileSync(filtersFile, 'utf8'));
var oldItems = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));

var items = [];

var getItems = function(offset) {
	filters.offset = offset;

	request(getUrl(filters), function(error, response, body) {
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);

			var total = body.paging.total;
			var limit = body.paging.limit; // 50;
			items = items.concat(body.results);

			offset += !isNaN(limit) ? limit : 50;
			
			if (offset >= total) {
				// finished
				console.log("********** PROCESSING NEW ITEMS (" + getCurrDate() + ") **********");
				items = items.map(function(item) {
					return item.permalink;
				});
				saveItems(items);
				
				var diff = items.diff(oldItems);
				if (diff.length) {
					exec('notify-send "' + diff.length + ' new items found for ' + filtersFile + '"');
					diff.forEach(function(item) {
						console.log(item);
					});
				}

				console.log("********** FINISHED PROCESS (" + getCurrDate() + ") **********\n\n");
			} else {
				getItems(offset);
			}
		}
	});
}

function saveItems(items) {
	fs.writeFileSync(itemsFile, JSON.stringify(items));
}

function getCurrDate() {
	return dateFormat(new Date(), "dd/mm/yyyy HH:MM:ss TT");
}

getItems(0);