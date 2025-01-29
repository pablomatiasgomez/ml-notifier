'use strict';

const Utils = require('./utils.js');

//----------------------

const SEARCH_URL = "https://api.mercadolibre.com/sites/MLA/search";
const DEFAULT_LIMIT = 50;

class MercadoLibreAPI {

	constructor() {
	}

	fetchItems(filters, items = []) {
		if (!filters.offset) filters.offset = 0;
		console.log(`Fetching items for page offset ${filters.offset}. Current items size: ${items.length}`)

		const url = SEARCH_URL + "?" + new URLSearchParams(filters).toString();
		return fetch(url).then(response => {
			if (response.status !== 200) throw new Error(`Error while getting items: ${response.status}`);
			return response.json();
		}).then(body => {
			let limit = body.paging.limit;
			let total = body.paging.total;
			filters.offset += !isNaN(limit) ? limit : DEFAULT_LIMIT;

			// Append page items to items array
			items = items.concat(body.results);

			if (filters.offset < total) {
				// Continue with next page
				return Promise.resolve().then(Utils.delay(500)).then(() => this.fetchItems(filters, items));
			}

			// Otherwise, finished fetching items:
			return items;
		});
	}

}

module.exports = MercadoLibreAPI;
