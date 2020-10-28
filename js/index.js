let savedSex = 1;
let savedWeight = 80;
let hoursBurning = 0.15;

let filters = {
	minPrice: 0,
	maxPrice: 0,
	alcoholPercent: 0,
	energyPer100: 0,
	type: '',
	/*package: '',
	closingMethod: '',
	name: '',
	producer: '',
	liters: 0,
	newInStock: '',
	country: '',
	subregion: '',
	year: '',
	availability: ''*/
};

let currentLoaded = 50;
let loadMoreAvailable = true;

const filterList = (itemsInView = 50) => {
	const filtering = function ( item ) {
		//var priceControl = item.price <= filters.maxPrice
		const l = s => s.toLowerCase();
		let typeControl = l(filters.type) == 'kaikki' || l(item.type) == l(filters.type) || !filters.type.length ;
		let packageControl = !filters.package || l(filters.package).includes(l(item.package));
		return typeControl && packageControl
	};

	if (itemsInView === 50) currentLoaded = 50; else currentLoaded = itemsInView;

	const filtered = data.verified.items.filter( item => filtering(item));

	// Restrict list size

	/*
	const startSlice = filtered.slice(0, itemsInView / 2);
	const size = filtered.length;
	const tailSlice = filtered.slice(size - (itemsInView / 2) - 1, size - 1);
	const sliced = startSlice.concat( tailSlice );
	return sliced
	*/
	const returnable = filtered.slice(0, itemsInView);
	loadMoreAvailable = (returnable.length >= 1);
	return returnable;
};

const makeList = current => {
	const listContainer = document.querySelector('.product-grid');
	let markup = '';
	current.map( item => {
		const slicedRatio = item.euroPerAlcohol.toString().slice(0,4);
		const formatedRatio = slicedRatio[3] == '.' ? slicedRatio.slice(0, 3) : slicedRatio;
		markup +=  `
            <div class="product">
                <div class="product__info">
                    <!--  Euros per alcohol: ${ item.euroPerAlcohol } -->
                    <div class="badge-box outer">
                        <div class="badge-box-text">${ formatedRatio }</div>
                        <div class="badge-box"><div class="badge-box"><div class="badge-box"></div></div></div>
                        <span class="action__text action__text--invisible">Hinta per alkoholiyksikkö</span>
                    </div>
                    <img class="product__image" src="" alt="${ item.name }" style="display: none;" />
                    <div class="rank" data-length="${ item.rank.toString().length }">${ item.rank }</div>
                    <h3 class="product__title">${ item.name }</h3>
                    <span class="product__year extra highlight">${ item.type }</span>
                    <span class="product__region extra highlight">${ item.energyPer100 } kcal / 100ml & ${ item.alcoholPercent }%</span>
                    <span class="product__varietal extra highlight">${ item.package } </span>
                    <span class="product__alcohol extra highlight">${ item.closingMethod }</span>
                    <span class="product__price highlight">${ item.price }€</span>
                    <a href="${ item.url }" target="_blank">
                        <button class="action action--button action--buy">
                            <div class="alko-logo"></div>
                            <!--<i class="alko-icon alko-icon-shopping-cart"></i><span class="action__text">Buy at Alko</span>-->
                        </button>
                    </a>
                </div>
                <label class="action action--compare-add"><input class="check-hidden" type="checkbox" /><i class="alko-icon alko-icon-plus"></i><i class="alko-icon alko-icon-check"></i><span class="action__text action__text--invisible">Lisää vertailuun</span></label>
            </div>
        `;
	});
	listContainer.innerHTML = markup;
	makeLoadMore();
	window.reinit()
};

const makePromilles = () => {

};

const makeFilters = () => {
	const makeOptionsMarkup = (options) => {
		let markup = '';
		options.forEach( option => markup += `<option value="${ option.name }">${ option.name }</option>` );
		return markup
	};
	const filtersEl = document.querySelector('.filters');
	// Type filtering
	const typeSelect = filtersEl.querySelector('#type');
	const availableCategories = data.verified.filtering.types
											.filter(o => o.frequency >= 1)
											.filter(
												o => !['Not available', 'Alkoholittomat'].includes(o.name)
											);
	typeSelect.innerHTML = makeOptionsMarkup(
		[
			{
				name: 'Kaikki',
				frequency: 1
			},
			...availableCategories
		]
	)
};

const makeLoadMore = () => {
	const el = document.querySelector('.load-more-container');
	if (loadMoreAvailable) {
		el.innerHTML = `
			<button class="load-more" onclick="loadMore()">
				Näytä 50 seuraavaa
			</button>
		`
	} else {
		el.innerHTML = '';
		document.querySelector('.product-grid').innerHTML = `
			<p class="loading-text">Emme löytäneet sopivaa tuotetta</p>
		`;
	}
};

const setFilter = (el) => {
	filters[el.id] = el.value;
	emptyBasket();
	updateList();
};

const promilles = (alcoholPercentage, mass = savedWeight, sex = savedSex, burning = hoursBurning) => { // sex; 1: M, 0: F
	const density = 0.79;
	const alcMl = alcoholPercentage * 1000;
	const alcToGram = alcMl*density;
	const massToVol = mass * 1000;
	let times = 0;
	if (!!sex) times = 0.68; else times = 0.55;
	let BAC = (alcToGram/ ( massToVol*times )) - (0.00015 * burning);
	let promille = BAC * 1000;
	return promille
};

const listenSwitchFilterClicks = () => {
	document.querySelectorAll('.switches input + label').forEach(function(label) {
		label.addEventListener('click', function(ev) {
			const forValue = ev.target.htmlFor;
			const radio = document.querySelector('.switches input:checked');
			if ( radio && radio.id === forValue ) {
				ev.preventDefault();
				radio.checked = false;
				setFilter({
					id: 'package',
					value: ''
				})
			} else {
				const value = document.querySelector(`.switches input#${forValue}`).value;
				setFilter({
					id: 'package',
					value: value
				})
			}
		});
	});
};

const emptyBasket = () =>
	document.querySelectorAll('.action--remove').forEach(e => e.click());

const loadMore = () =>
	makeList( filterList(currentLoaded + 50) );

const updateList = () => makeList( filterList() );

const initialise = () => {
	if (!!data) {
		listenSwitchFilterClicks();
		filterList();
		makeFilters();
		updateList();
	} else {
		setTimeout(() => initialise(), 100)
	}
};
