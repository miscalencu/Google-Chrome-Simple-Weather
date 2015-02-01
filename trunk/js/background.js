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
});
	
$(document).ready(function () {

	var locations = JSON.parse(getSettings("weatherLocations"));
	if (locations.length == 0) {
	    updateEmptyBadge();
		return;
	}

	GetWeather();
});

function updateEmptyBadge() {
    chrome.browserAction.setBadgeText({ text: "?" });
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.browserAction.setTitle({ title: "No location defined!\nClick here to set a new location!" });
    chrome.browserAction.setIcon({ path: "images/icon.png" });
}

function updateBadge(weatherObj) {
    if (weatherObj == null) {
        updateEmptyBadge();
    }
    else {
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        chrome.browserAction.setBadgeText({ text: "." });
        setTimeout(function () { chrome.browserAction.setBadgeText({ text: ".." }); }, 100);
        setTimeout(function () { chrome.browserAction.setBadgeText({ text: "..." }); }, 200);
        setTimeout(function () { chrome.browserAction.setBadgeText({ text: "...." }); }, 300);
        setTimeout(function () { chrome.browserAction.setBadgeText({ text: "....." }); }, 400);
        setTimeout(function () { goUpdateBadge(weatherObj) }, 500);
    }
}

function goUpdateBadge(weatherObj) {
	console.log("updating badge with weather object queried at " + weatherObj.RefreshDate);
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
	SetRefresh();
}

var newtabid = 0;
chrome.browserAction.onClicked.addListener(function (tab) {

	var locations = JSON.parse(getSettings("weatherLocations"));
	if(locations.length === 0) {
		OpenWindow("options");
		return;
	}
	
	chrome.tabs.sendMessage(tab.id, { args: "open" }, function (response) {
		if (response != "OK") { // we are not in a tab (Settings page, etc ...)
			setSettings("OpenOnLoad", "YES");
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
	
	if (request.message == "reset_timeout_required") {
		console.log("'reset_timeout_required' received ...");
		var response = "NO";
		if(getSettings("weatherRefreshDate") != null) {
			var timePassed = DateDiff(new Date(), new Date(getSettings("weatherRefreshDate")));
			if(timePassed > (parseInt(getSettings("weatherTimeout")) + 1) * 60) { // something went wrong and the timeOut stopped or is null (more than a minute passed)
				response = "YES";
				}
			}
		sendResponse({status: response});
	}
	
	if (request.message == "reset_timeout") {
		console.log("'reset_timeout' received ...");
		GetWeather();
	}
	
	if(request.message == "open_window") {
		console.log("'open_window' received ...");
		OpenWindow(request.url);
		sendResponse({status: "Opened!"});
	}
});

chrome.webNavigation.onCompleted.addListener(function (details) {
	if (getSettings("OpenOnLoad") != null && getSettings("OpenOnLoad") === "YES") {
		setSettings("OpenOnLoad", null);
		chrome.tabs.sendMessage(newtabid, { args: "open" }, function (response) {
			// give up no matter the response
		});
	}
});