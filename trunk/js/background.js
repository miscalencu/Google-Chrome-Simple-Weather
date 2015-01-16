var timeOut = null;

function SetRefresh() {
	clearTimeout(timeOut);
	timeOut = window.setTimeout(function () { GetWeather(); }, 1000 * 60 * parseInt(getSettings("weatherTimeout")));
}

$(document).on("weather_complete", function (event) {
	console.log("complete received ...");
	if (isExtension) {
		updateBadge(event.weather);
		}
})
	
$(document).ready(function () {
	GetWeather();
});

function updateBadge(weatherObj) {
	chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
	chrome.browserAction.setBadgeText({ text: "." });
	setTimeout(function() { chrome.browserAction.setBadgeText({ text: ".." }); }, 100);
	setTimeout(function() { chrome.browserAction.setBadgeText({ text: "..." }); }, 200);
	setTimeout(function() { chrome.browserAction.setBadgeText({ text: "...." }); }, 300);
	setTimeout(function() { chrome.browserAction.setBadgeText({ text: "....." }); }, 400);
	setTimeout(function() { goUpdateBadge(weatherObj) }, 500);
}

function goUpdateBadge(weatherObj) {
	console.log("updating badge with weather object queried at " + weatherObj.RefreshDate);
	if (JSON.parse(getSettings("weatherLocations")).length == 0) {
		chrome.browserAction.setBadgeText({ text: "?" });
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setTitle({ title: "No location defined!\nClick here to set a new location!" });
		chrome.browserAction.setIcon({ path: "images/icon.png" });
	}
	else {
		var badgeTitle = "";
		var badgeText = "";

		badgeTitle += (getLabel("Weather in ") + weatherObj.LocationCity) + "\nTemperature: " + weatherObj.Temp;
		if (getSettings("weatherShowIn") === "C") {
			badgeTitle += String.fromCharCode(176);
		}
		badgeTitle += getSettings("weatherShowIn");

		if (weatherObj.Condition != "")
			badgeTitle += " - " + weatherObj.Condition;

		if (weatherObj.WindChill != "") {
			badgeTitle += "\nWind Chill: " + weatherObj.WindChill + " ";
			if (getSettings("weatherShowIn") === "C") {
				badgeTitle += String.fromCharCode(176);
			}
			badgeTitle += getSettings("weatherShowIn");
		}

		if (weatherObj.WindSpeed != "")
			badgeTitle += "\nWind speed: " + weatherObj.WindSpeed + " " + weatherObj.UnitSpeed;

		if (weatherObj.AtmosphereHumidity != "")
			badgeTitle += "\nHumidity: " + weatherObj.AtmosphereHumidity + " g/m3";

		if (getSettings("weatherDate") == "1")
			badgeTitle += "\n\nValid for: " + formatToLocalTimeDate(weatherObj.Date);

		if (getSettings("weatherReadDate") == "1")
			badgeTitle += "\nLast checked on: " + formatToLocalTimeDate(weatherObj.RefreshDate);

		var temp = weatherObj.Temp;
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

			if (weatherObj.Icon != "") {
				chrome.browserAction.setIcon({ path: getSettings("imgLocation") + weatherObj.Icon.split("/")[weatherObj.Icon.split("/").length - 1] });
			}
			else {
				chrome.browserAction.setIcon({ path: "images/icon.png" });
			}
		}
	}
	SetRefresh();
}

var newtabid = 0;
chrome.browserAction.onClicked.addListener(function (tab) {
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
	if (request.message == "update_timeout") {
		console.log("'update_timeout' received ...");
		SetRefresh();
	}
	if (request.message == "update_badge") {
		console.log("'update_badge' received ...");
		updateBadge(request.weather);
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