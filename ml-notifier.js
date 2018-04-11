#!/usr/bin/env node

Array.prototype.diff = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var request = require('request');
var fs = require('fs');
var dateFormat = require('dateformat');
var exec = require('child_process').exec;
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

function getUrl(filters) {
	var url = SEARCH_URL + "?";
	for (var key in filters) {
		if (filters.hasOwnProperty(key)) {
			url += key + "=" + encodeURIComponent(filters[key]) + "&";
		}
	}
	return url;
}

mailOptions.html += "********** STARTING PROCESS (" + getCurrDate() + ") **********<br>";

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
				mailOptions.html += "********** PROCESSING NEW ITEMS (" + getCurrDate() + ") **********<br>";
				items = items.map(function(item) {
					return item.permalink;
				});
				saveItems(items);
				
				var diff = items.diff(oldItems);
				diff.forEach(function(item) {
					mailOptions.html += item + "<br>";
				});

				mailOptions.html += "********** FINISHED PROCESS (" + getCurrDate() + ") **********<br><br>";

				console.log(mailOptions.html);
				if (diff.length) {
					mailOptions.subject = diff.length + ' new items found for ' + itemName + " - " + getCurrDate();
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

function saveItems(items) {
	fs.writeFileSync(itemsFile, JSON.stringify(items));
}

function getCurrDate() {
	return dateFormat(new Date(), "dd/mm/yyyy HH:MM:ss TT");
}

getItems(0);
