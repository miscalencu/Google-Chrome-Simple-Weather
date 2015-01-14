var currentPage = "background";
var timeOut = null;

function SetRefresh() {
	clearTimeout(timeOut);
	timeOut = window.setTimeout(function () { Init(); }, 1000 * 60 * parseInt(getSettings("weatherTimeout")));
}

function Init() {
	var location = getSettings("weatherLocation");
	GetWeather(location.split("#")[0], location.split("#")[1]);
}

$(document).on("weather_complete", function () {
	console.log("complete received ...");
	if (isExtension)
		updateBadge();
})
	
$(document).ready(function () {
	Init();
	SetRefresh();
});

function updateBadge() {
	if (localStorage.weatherLocations == "") {
		chrome.browserAction.setBadgeText({ text: "?" });
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setTitle({ title: "No location defined!\nClick here to set a new location!" });
		chrome.browserAction.setIcon({ path: "images/icon.png" });
	}
	else {
		var badgeTitle = "";
		var badgeText = "";
		badgeTitle += (getLabel("Weather in ") + weatherCity) + "\n";
		badgeTitle += getValue(weatherInfo[0].temp) + String.fromCharCode(176) + localStorage.weatherShowIn;

		if (weatherInfo[0].condition != "")
			badgeTitle += " - " + weatherInfo[0].condition;

		if (weatherInfo[0].wind != "")
			badgeTitle += "\n" + weatherInfo[0].wind;

		if (weatherInfo[0].humidity != "")
			badgeTitle += "\n" + weatherInfo[0].humidity;

		if (localStorage.weatherDate == "1")
			badgeTitle += "\n\nValid for: " + weatherDate;

		if (localStorage.weatherReadDate == "1")
			badgeTitle += "\nLast checked on: " + formatToLocalTimeDate(new Date());

		var temp = weatherInfo[0].temp;
		if (getSettings("weatherShowIn") === "C") {
			badgeText = temp + String.fromCharCode(176);
		}
		else
			badgeText = temp;

		if (badgeText.length < 4)
			badgeText += getSettings("weatherShowIn");

		if (isExtension) {
			chrome.browserAction.setBadgeText({ text: badgeText });
			chrome.browserAction.setBadgeBackgroundColor({ color: [0, 153, 204, 255] });
			chrome.browserAction.setTitle({ title: badgeTitle });

			if (weatherInfo[0].icon != "") {
				chrome.browserAction.setIcon({ path: localStorage.imgLocation + weatherInfo[0].icon.split("/")[weatherInfo[0].icon.split("/").length - 1] });
			}
			else {
				chrome.browserAction.setIcon({ path: "images/icon.png" });
			}
		}
	}
}

var newtabid = 0;
chrome.browserAction.onClicked.addListener(function (tab) {
	currentPage = "background";
	updateBadge();
	chrome.tabs.sendMessage(tab.id, { args: "open" }, function (response) {
		if (response != "OK") { // we are not in a tab (Settings page, etc ...)
			localStorage.OpenOnLoad = "YES";
			chrome.tabs.create({ url: "chrome://newtab" }, function(tab) {
				newtabid = tab.id;
			});
		}
	});
});

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	console.log("message received ...");
	if (request.message == "updateTimeout") {
		console.log("'updateTimeout' received ...");
		SetRefresh();
	}
	if (request.message == "updateBadge") {
		console.log("'updateBadge' received ...");
		updateBadge();
	}
});

chrome.webNavigation.onCompleted.addListener(function (details) {
	if (localStorage.OpenOnLoad && localStorage.OpenOnLoad === "YES") {
		localStorage.OpenOnLoad = null;
		chrome.tabs.sendMessage(newtabid, { args: "open" }, function (response) {
			// give up no matter the response
		});
	}
});