let input = document.getElementById("inputfield");
let inputArr = [];
let sendBtn = document.getElementById("send");
let dataArr = [];
let data = {};
let userName = "";
let oreString = "";
let locations = document.getElementsByName("location");

async function loadSettingFile() {
	let response = await fetch('settings.json');
	 // read response body and parse as JSON
	return await response.json();
}

let settings = {};

loadSettingFile().then((result) => {
	settings = result;
});

// Add an event listener to the Button "LAUF FOREST, LAUF!"
sendBtn.addEventListener("click", () => {
	dataArr = [];
	data = {};
	// Function call to remove previously generated results
	removeDivs();
	// Function call to start the input processing
	splitToStr();
	// Security check to see if the input is properly from the EVE Fleet log, if not...
	if (Object.keys(data).length == 0) {
		// Output a message ...
		alert(
			"Eingegebene Daten stimmen nicht mit gefordertem Format überein."
		);
		// ... else start building the result tiles...
	} else {
		buildTiles();
		// ... and style them.
		styleTiles();
		// Once they are done, scroll the window to the results.
		window.scrollTo(0, document.body.scrollHeight);
	}
});

// Function to remove the result container, that contains the individual tiles with the output
// Cycles through all children of the HTML body and if the child has the ID "Target", it is removed
function removeDivs() {
	let body = document.querySelector("body");
	let childList = body.children;
	for (let i = childList.length - 1; i > 0; i--) {
		let child = childList[i];
		if (child.id == "target") {
			child.parentElement.removeChild(child);
		}
	}
}

// Function to prepare the input for processing
function splitToStr() {
	// replace all line breaks by white space
	inputStr = input.value.replace(/\r?\n|\r/g, " ");
	// Split into an array based on white space as separator
	inputArr = inputStr.split(" ");

	// Cycle through all items in the array
	inputArr.forEach((field, index) => {
		// If the field contains ":" it is the timestamp of the log and that marks the start of a new line
		if (field.includes(":")) {
			let start = 0;
			start = index;
			// Everything between the timestamp and the keyword "hat" is the User name
			for (let j = start + 1; j < inputArr.length; j++) {
				const element = inputArr[j];
				if (element == "hat") {
					break;
				}
				// Construct the complete User name out of the array items between timestamp and keyword
				userName = userName + element + " ";
			}

			userName = userName.trim();
			// Push the assembled User name as string into the data array
			dataArr.push(userName);
			// Reset the User name string
			userName = "";
		}
		// The keyword "x" is another landmark.
		if (field == "x") {
			let amount = 0;
			let oreType = "";
			// Everything between the "x" and the keyword "erbeutet" is the ore type
			for (let k = index + 1; k < inputArr.length; k++) {
				const element = inputArr[k];
				if (element == "erbeutet") {
					break;
				}
				// Construct the ore type string from the array items between the two landmarks
				oreType = oreType + element + " ";
			}

			oreType = oreType.trim();
			// Remove the unneccessary asterisk
			oreType = oreType.replace("*", "");
			// Push the ore type as assembled string into the data array
			dataArr.push(oreType);
			// The amount of the ore is one spot before the "x" landmark and needs to be clear of thousands separators
			amount = inputArr[index - 1].replace(/\./g, "");
			// Push the amount as Integer into the data array
			dataArr.push(parseInt(amount));
		}
	});

	// Cycle through the data array
	for (let index = 0; index < dataArr.length + 1; index++) {
		// If the index is not 0 and can be devided by 3 without remainder, this is a block of contingent data
		if (index != 0 && index % 3 == 0) {
			let user = dataArr[index - 3];
			let ore = dataArr[index - 2];
			let amount = dataArr[index - 1];
			let allowed = true;
			// Check if the item in the data array actually is an ore, by comparing against the whitelist
			if (settings.oreWhiteList.indexOf(ore) === -1) {
				// If it is not, set the switch to false
				allowed = false;
			}
			// If it is an ore, start constructing the data object
			if (allowed) {
				// If the data object has no entry for the user name key...
				if (!data.hasOwnProperty(user)) {
					// generate the user name key and declare it with an empty object for the different ore types
					data[user] = {};
				}
				// Then check if the ore type is already contained in the user name key position of the data object...
				if (!data[user].hasOwnProperty(ore)) {
					// ... if not, generate the key and save the amount
					data[user][ore] = amount;
				} else {
					// ... if yes, add the amount to the already existing entry
					data[user][ore] = data[user][ore] + amount;
				}
			}
		}
	}
}

// Function to build the result tiles
function buildTiles() {
	let body = document.querySelector("body");
	let div, table, thead, tbody, txt, th, td, tr, buttonCopy, buttonDone;
	let i = 0;

	// Build the result container with ID "target"
	let target = document.createElement("div");
	target.id = "target";

	data = orderByKeyName(data);

	// Cycle thourgh the data object and start building for each user
	for (const person in data) {
		if (data.hasOwnProperty(person)) {
			const element = orderByKeyName(data[person]);

			// Build a fresh tile as div element and ID it
			div = document.createElement("div");
			div.id = "tile_" + person.replace(" ", "_");

			// Create the table into which the ore type and the amount is inserted
			// Generate all HTML elements
			table = document.createElement("table");
			thead = document.createElement("thead");
			tbody = document.createElement("tbody");
			tr = document.createElement("tr");
			th = document.createElement("th");
			// Fill the table header with the user name and style it
			txt = document.createTextNode(person);
			th.appendChild(txt);
			th.setAttribute("colspan", "2");
			th.style.paddingBottom = "20px";
			th.style.borderBottom = "1px solid #ffffff";
			tr.appendChild(th);
			thead.appendChild(tr);
			// Cycle through the entries for each user name and build td's and tr's
			for (const ore in element) {
				if (element.hasOwnProperty(ore)) {
					const value = element[ore];
					// Generate the table body with first the ore type in each row...
					tr = document.createElement("tr");
					td = document.createElement("td");
					txt = document.createTextNode(ore);
					td.appendChild(txt);
					tr.appendChild(td);
					// ... and then the amount
					td = document.createElement("td");
					txt = document.createTextNode(value.toLocaleString());
					td.appendChild(txt);
					td.style.textAlign = "right";
					tr.appendChild(td);
					tbody.appendChild(tr);
				}
			}
			// Add the table header and body to the table
			table.appendChild(thead);
			table.appendChild(tbody);
			// Style the table
			table.style.width = "100%";
			table.style.padding = "5px";
			// Add the assembled table to the tile
			div.appendChild(table);

			// Create a button for getting the ore's worth
			buttonDone = document.createElement("button");
			buttonDone.innerText = "Erledigt";
			buttonDone.id = person;
			buttonDone.classList.add("price");
			// Add an event listener to the ore's worth button which starts the fetchPrices function with the button as argument
			buttonDone.addEventListener("click", function (div) {

				if (div.style.outlineStyle === '') {
					div.style.outlineColor = 'green';
					div.style.outlineWidth = '5px';
					div.style.outlineStyle = 'solid';
				} else {
					div.style.outline = null;
				}
			}.bind(null, div));
			// Create a button for copying the table to the clipboard
			buttonCopy = document.createElement("button");
			buttonCopy.innerText = "Copy";
			buttonCopy.classList.add("clipboard");
			// Add an event listener to the Copy button which starts the copyToClipboard function with the button as argument
			buttonCopy.addEventListener("click", function () {
				copyToClipboard(this);
			});

			// Generate a container for both buttons as kind of control panel
			let controls = document.createElement("div");
			// Add the buttons
			controls.appendChild(buttonDone);
			controls.appendChild(buttonCopy);
			// Add the control panel to the tile
			div.appendChild(controls);
		}
		// Add the tile to the result container
		target.appendChild(div);
		// Add the result container to the body element
		body.appendChild(target);
		i++;
	}
}

// Function to cycle through all children of the result container and give them the class "tile"
function styleTiles() {
	let target = document.getElementById("target");
	let childList = target.children;
	for (let i = childList.length - 1; i >= 0; i--) {
		let child = childList[i];
		if (child.tagName == "DIV") {
			child.classList.add("tile");
		}
	}
}

// Function called by event listener on the "Copy" button
function copyToClipboard(button) {
	let table = button.parentElement.parentElement.children[0];
	// Select the table body of the tile, the activated button is in
	let tbody = table.children[1];
	// Call the function to select all content of the table body
	selectElementContents(tbody);
}

// Still need to understand this snippet from the web
function selectElementContents(el) {
	var body = document.body,
		range,
		sel;
	if (document.createRange && window.getSelection) {
		range = document.createRange();
		sel = window.getSelection();
		sel.removeAllRanges();
		try {
			range.selectNodeContents(el);
			sel.addRange(range);
		} catch (e) {
			range.selectNode(el);
			sel.addRange(range);
		}
	} else if (body.createTextRange) {
		range = body.createTextRange();
		range.moveToElementText(el);
		range.select();
	}
	document.execCommand("Copy");
}

// Function to fetch the prices from Evepraisal which is called by event listener on "Wert" button
async function fetchPrices(button) {
	// As soon as the button is pressed, all "Wert" buttons on the page are disabled and the cursor changed to "wait"
	let priceButtons = document.getElementsByClassName("price");
	let market;
	for (const wait of priceButtons) {
		wait.style.cursor = "wait";
		wait.disabled = true;
	}

	for (const hub of locations) {
		if (hub.checked) {
			market = hub.value;
		}
	}
	 

	// The object, that contains all Info on the ores and amounts, that each user mined can be selected by the key, which is also saved in the button ID
	let person = data[button.id];
	oreString = "";
	// All ore amounts and types are saved into a string
	for (const oreType in person) {
		if (person.hasOwnProperty(oreType)) {
			const oreValue = person[oreType];
			// Amount and type are one group. Groups are separated by urlencode enter key.
			oreString = oreString + oreValue + " " + oreType + "%0A";
			// All white space in the string is urlencoded and changed to lower case letters.
			oreString = oreString.replace(/\s/g, "%20").toLowerCase();
		}
	}
	// The worth is fetched fro Evepraisal via API in an async way with the function call to doAjax with the assembled ore string from abpve as argument
	let resultObj = await doAjax(oreString, market);

	// Value of all mined ores is then styled and attached to the table
	let buy = resultObj.appraisal.totals.buy.toFixed(2);
	buy = buy.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	let sell = resultObj.appraisal.totals.sell.toFixed(2);
	sell = sell.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	let table = button.parentElement.parentElement.children[0];
	let tableBody = table.children[1];
	let tr = document.createElement("tr");
	let lth = document.createElement("th");
	let dth = document.createElement("th");
	lth.innerText = market.charAt(0).toUpperCase() + market.slice(1) + " Buy Orders:";
	dth.innerText = buy + " ISK";
	lth.style.color = "#ff0000";
	dth.style.color = "#ff0000";
	tr.appendChild(lth);
	tr.appendChild(dth);
	tableBody.appendChild(tr);
	tr = document.createElement("tr");
	lth = document.createElement("th");
	dth = document.createElement("th");
	lth.innerText = market.charAt(0).toUpperCase() + market.slice(1) + " Sell Orders:";
	dth.innerText = sell + " ISK";
	lth.style.color = "#ff0000";
	dth.style.color = "#ff0000";
	tr.appendChild(lth);
	tr.appendChild(dth);
	tableBody.appendChild(tr);

	// The button text is changed to "DONE!" ...
	button.innerText = "DONE!";
	// ... and while all other "Wert" buttons are enabled again and the cursor changed back ...
	for (const wait of priceButtons) {
		wait.style.cursor = "";
		wait.disabled = false;
	}
	// ... the originally activated button is deactivated to avoid sending the same price request twice
	button.disabled = true;
}

// Function for the AJAX request
function doAjax(oreString, market) {
	let info = $.ajax({
		// Request has to be of type POST
		type: "POST",
		// The URL contains a proxy to fake a correct header (https://cors-anywhere.herokuapp.com/)
		// The second part of the URL is actually the request adress containing the orestring and the setting to avoid saving the request on the Evepraisal servers (persist= no)
		url:
			"https://cors-anywhere.herokuapp.com/https://evepraisal.com/appraisal.json?market=" + market + "&raw_textarea=" +
			oreString +
			"&persist=no",
	});
	// The request will the yield the appraisal which is returned into the event listener function of the "Wert" button that was clicked
	return info;
}

function orderByKeyName(objectWithKeys) {
	return Object.keys(objectWithKeys).sort().reduce(
		(obj, key) => {
			obj[key] = objectWithKeys[key];
			return obj;
		},
		{}
	);
}
