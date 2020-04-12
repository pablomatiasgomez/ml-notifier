#!/usr/bin/env node

Array.prototype.diff = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var request = require('request');
var fs = require('fs');
var nodemailer = require('nodemailer');


const PWD_FILE = __dirname + '/pwd';
let getEmailPassword = () => fs.readFileSync(PWD_FILE, 'utf8').trim();

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(`smtps://gomez.pablo1%40gmail.com:${getEmailPassword()}@smtp.gmail.com`);
var mailOptions = {
	from: '"Pablo Matias Gomez" <gomez.pablo1@gmail.com>', // sender address
	to: 'pablomatiasgomez@gmail.com', // list of receivers
	subject: '', // Subject line
	text: 'Hello world', // plaintext body
	html: '' // html body
};


var SEARCH_URL = "https://api.mercadolibre.com/sites/MLA/search";

var itemName = process.argv[2];
if (!itemName) {
	console.log("Missing item name param");
	return;
}

var filtersFile = __dirname + "/filters/" + itemName + "-filters.json";
var itemsFile = __dirname + "/filters/" + itemName + "-items.json";
createFileIfNotExists(itemsFile, "[]");

function getUrl(filters) {
	var url = SEARCH_URL + "?";
	for (var key in filters) {
		if (filters.hasOwnProperty(key)) {
			url += key + "=" + encodeURIComponent(filters[key]) + "&";
		}
	}
	return url;
}

mailOptions.html += "********** STARTING PROCESS (" + new Date().toISOString() + ") **********<br>";

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
				mailOptions.html += "********** PROCESSING NEW ITEMS (" + new Date().toISOString() + ") **********<br>";

				var linksById = { };
				items.forEach(function(item) {
					linksById[item.id] = item.permalink;
				});
				var itemIds = Object.keys(linksById);

				saveItems(itemIds);
				
				var diff = itemIds.diff(oldItems);
				diff.forEach(function(itemId) {
					mailOptions.html += linksById[itemId] + "<br>";
				});

				mailOptions.html += "********** FINISHED PROCESS (" + new Date().toISOString() + ") **********<br><br>";

				console.log(mailOptions.html);
				if (diff.length) {
					mailOptions.subject = diff.length + ' new products (out of ' + itemIds.length + ') found for ' + itemName + " - " + new Date().toISOString();
					transporter.sendMail(mailOptions, function(error, info){
						if (error) return console.log(error);
						console.log('Message sent: ' + info.response);
					});
				}
			} else {
				getItems(offset);
			}
		} else {
			console.log(error);
		}
	});
};

function saveItems(itemIds) {
	fs.writeFileSync(itemsFile, JSON.stringify(itemIds));
}

function createFileIfNotExists(filePath, content) {
	try {
		fs.writeFileSync(filePath, content, { flag: 'wx' });
	} catch (e) {
		// Ignore if already exists.
		if (e.code !== 'EEXIST') {
			throw e;
		}
	}
};

getItems(0);
