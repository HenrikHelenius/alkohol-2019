// Helpers

String.prototype.replaceAll = function(search, replacement) {
	return this.replace(new RegExp(search, 'g'), replacement)
};

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

Array.prototype.pushIfNotExistCounter = function(element) {
	if (JSON.stringify(this).indexOf(element) === -1) this.push({
		name: element,
		frequency: 1
	});
	else this.find(object => object.name === element).frequency += 1
};

function makeJSON(data, resultName) {
	const verified = [];
	const unverified = [];
	data.filter(item => item['Valikoima'] !== 'tarvikevalikoima')
			.filter(item => item['Tyyppi'] !== 'lahja- ja juomatarvikkeet')
			.filter(item => !!item['Alkoholi-%'] && item['Alkoholi-%'] !== '0.0')
			.filter(item => !!item['Pullokoko'])
			.filter(item => !!item['Nimi'])
			.filter(item => !!item['Hinta'])
			.forEach(item => {
				const name = item['Nimi'];
				const liters = parseFloat(item['Pullokoko'].split(' ')[0].replace(',', '.'));
				const alcoholPercent = parseFloat(item['Alkoholi-%']);
				const alcoholAbsolute = liters * alcoholPercent;
				const price = parseFloat(item['Hinta']);
				const euroPerAlcohol = price / alcoholAbsolute;
				const urlSlug = name.toLowerCase()
					.replaceAll('\'', '')
					.replaceAll(' ', '-')
					.replace(new RegExp(/[àáâãäåö]/g),"-");
				const completeUrlGuess = 'https://www.alko.fi/tuotteet/' + item['Numero'] + '/' + urlSlug;
				const nav = 'Not available';

				const final = {
					euroPerAlcohol: euroPerAlcohol,
					url:            completeUrlGuess,
					id:             item['Numero' || nav],
					name:           name,
					producer:       item['Valmistaja'] || nav,
					liters:         liters,
					price:          price,
					newInStock:     item['Uutuus'] || nav,
					type:           item['Tyyppi'] || nav,
					speciality:     item['Erityisryhmä'] || nav,
					country:        item['Valmistusmaa'] || nav,
					subregion:      item['Alue'] || nav,
					year:           item['Vuosikerta'] || nav,
					package:        item['Pakkaustyyppi'] || nav,
					closingMethod:  item['Suljentatyppi'] || nav,
					alcoholPercent: alcoholPercent,
					sugarGramPerL:  item['Sokeri g/l'] || nav,
					energyPer100:   item['Energia kcal/100 ml'] || nav,
					availability:   item['Valikoima'] || nav
				};

				const literPrice = item['Litrahinta'];
				const calculatedLiterPrice = price / liters;
				const literPriceCheck = (literPrice - calculatedLiterPrice) < 1;

				if (literPriceCheck) verified.push(final); else unverified.push(final);
			});

	const filtering = (items) => {
		const f = {
			types: [],
			countries: [],
			packages: [],
			closingMethods: [],
			availabilities: [],
			specialities: [],
			newInStocks: []
		};

		items.forEach( item => {
			f.types.pushIfNotExistCounter(item.type.capitalize());
			f.countries.pushIfNotExistCounter(item.country.capitalize());
			f.packages.pushIfNotExistCounter(item.package.capitalize());
			f.closingMethods.pushIfNotExistCounter(item.closingMethod.capitalize());
			f.availabilities.pushIfNotExistCounter(item.availability.capitalize());
			f.specialities.pushIfNotExistCounter(item.speciality.capitalize());
			f.newInStocks.pushIfNotExistCounter(item.newInStock.capitalize());
		});

		return f
	};

	const ratioSort = arr => arr.sort((first, second) => first.euroPerAlcohol - second.euroPerAlcohol);
	const ranker = (item, rank) => { item['rank'] = rank + 1; return item };
	const alla = {
		verified: {
			items: ratioSort(verified).map((item, index) => ranker(item, index)),
			filtering: filtering(verified)
		},
		unverified: {
			items: ratioSort(unverified).map((item, index) => ranker(item, index)),
			filtering: filtering(unverified)
		}
	};

	const fs = require('fs');
	fs.writeFile(resultName, 'var data = ' + JSON.stringify(alla/*, null, 3*/), 'utf8', () => {
		console.log('JSON created successfully. Verified: ' + verified.length + ' unverified: ' + unverified.length)
	});
}

const convertToJson = (name) => {
	const excelToJson = require('convert-excel-to-json');
	return excelToJson({
		sourceFile: name,
		columnToKey: {
			A: 'Numero',
			B: 'Nimi',
			C: 'Valmistaja',
			D: 'Pullokoko',
			E: 'Hinta',
			F: 'Litrahinta',
			G: 'Uutuus',
			H: 'Hinnastojärjestyskoodi',
			I: 'Tyyppi',
			J: 'Erityisryhmä',
			K: 'Oluttyyppi',
			L: 'Valmistusmaa',
			M: 'Alue',
			N: 'Vuosikerta',
			O: 'Etikettimerkintöjä',
			P: 'Huomautus',
			Q: 'Rypäleet',
			R: 'Luonnehdinta',
			S: 'Pakkaustyyppi',
			T: 'Suljentatyppi',
			U: 'Alkoholi-%',
			V: 'Hapot g/l',
			W: 'Sokeri g/l',
			X: 'Kantavierrep-%',
			Y: 'Väri EBC',
			Z: 'Katkerot EBU',
			AA: 'Energia kcal/100 ml',
			AB: 'Valikoima'
		}
	})
};

const downloadXls = (name) => {
	const url = 'https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/alkon-hinnasto-tekstitiedostona.xls';
	const https = require('https');
	const fs = require('fs');

	const file = fs.createWriteStream(name);
	https.get(url, (response) => {
		response.pipe(file);
		file.on('finish', () => {
			file.close(jsonProcess);
		});
	});
};

const date = new Date();
const xlsName = `data_${date.toISOString()}.xls`;

const process = () => {
	downloadXls(xlsName);
};

const jsonProcess = (name = xlsName) => {
	const data = convertToJson(name);
	const sheet1Data = data[Object.keys(data)[0]];
	console.log(sheet1Data, typeof data);
	makeJSON(sheet1Data, '../data.js');
};

process();