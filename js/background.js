var timeOut = null;

function SetRefresh() {
	clearTimeout(timeOut);

	// check every minute
	timeOut = window.setTimeout(function () { GetWeatherCheck(); }, 1000 * 60);
}

// checks every minute if it needs to download weather data
function GetWeatherCheck() {
	console.log("checking weather valability ...");
	var location = JSON.parse(getSettings("weatherLocation"));
	if (location == null) {
		return;
	}
	var weatherObj = JSON.parse(getSettings("w_" + location.woeid));
	if (!isValidWeatherObject(weatherObj)) {
		console.log("it is NOT valid!");
		GetWeather();
	}
	else {
		console.log("it is valid!");
		updateBadge();
	}

	// check every minute
	SetRefresh();
}

$(document).on("weather_complete", function (event) {
    console.log("complete received ...");
    if (isExtension) {
        updateBadge();
    }
});
	
$(document).ready(function () {

	var locations = JSON.parse(getSettings("weatherLocations"));
	if (locations.length == 0) {
	    updateEmptyBadge();
		return;
	}

	updateBadge();
});

function updateEmptyBadge() {
    chrome.browserAction.setBadgeText({ text: "?" });
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.browserAction.setTitle({ title: "No location defined!\nClick here to set a new location!" });
    chrome.browserAction.setIcon({ path: "images/icon.png" });
}

function updateBadge() {
	var location = JSON.parse(getSettings("weatherLocation"));
	if (location == null) {
		updateEmptyBadge();
		return;
	}

	var weatherObj = JSON.parse(getSettings("w_" + location.woeid));
	if (isValidWeatherObject(weatherObj)) {
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setBadgeText({ text: "." });
		setTimeout(function () { chrome.browserAction.setBadgeText({ text: ".." }); }, 100);
		setTimeout(function () { chrome.browserAction.setBadgeText({ text: "..." }); }, 200);
		setTimeout(function () { chrome.browserAction.setBadgeText({ text: "...." }); }, 300);
		setTimeout(function () { chrome.browserAction.setBadgeText({ text: "....." }); }, 400);
		setTimeout(function () { goUpdateBadge(weatherObj); }, 500);
	}
	else {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setTitle({ title: "No valid data available!" });

		GetWeatherCheck();
	}
}

function goUpdateBadge(weatherObj) {
	console.log("updating badge with weather object queried at " + weatherObj.RefreshDate);
	var badgeTitle = "";
	var badgeText = "";

	badgeTitle += (getLabel("Weather in ") + weatherObj.LocationCity) + getLabel("\nTemperature: ", " - ") + weatherObj.Temp;
	if (getSettings("weatherShowIn") === "C") {
		badgeTitle += String.fromCharCode(176);
	}
	badgeTitle += getSettings("weatherShowIn");

	if (weatherObj.Condition != "")
		badgeTitle += " - " + weatherObj.Condition;

	if (weatherObj.WindChill != "") {
	    badgeTitle += getLabel("\nWind Chill: ", " (") + weatherObj.WindChill;
		if (getSettings("weatherShowIn") === "C") {
			badgeTitle += String.fromCharCode(176);
		}
		badgeTitle += getSettings("weatherShowIn");
		badgeTitle += getLabel("", ")");
	}

	if (weatherObj.WindSpeed != "")
	    badgeTitle += "\n" + getLabel("Wind speed: ") + weatherObj.WindSpeed + " " + weatherObj.UnitSpeed;

	if (weatherObj.AtmosphereHumidity != "")
	    badgeTitle += getLabel("\nHumidity: ", ", ") + weatherObj.AtmosphereHumidity + " g/m3";

	if ((getSettings("weatherDate") === "1") || (getSettings("weatherReadDate") === "1"))
	    badgeTitle += "\n";
    
	if (getSettings("weatherDate") === "1")
		badgeTitle += "\nValid for: " + formatToLocalTimeDate(weatherObj.Date);

	if (getSettings("weatherReadDate") === "1")
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

		$("#canvas").html(getIcon(weatherObj.ConditionCode, findIfIsDay(weatherObj)));
		html2canvas($("#canvas"), {
		    onrendered: function (canvas) {
		        chrome.browserAction.setIcon({ imageData: canvas.getContext("2d").getImageData(0, 0, 19, 19) });
		    }
		});
	}
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
			chrome.tabs.create({ url: "https://www.google.ro/_/chrome/newtab" }, function(tab) {
				newtabid = tab.id;
			});
		}
	});
});

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	console.log("message received ...");
	if (request.message == "update_timeout") {
		console.log("'update_timeout' received ...");
		GetWeatherCheck();
	}
	
	if (request.message == "update_badge") {
		console.log("'update_badge' received ...");
		updateBadge();
	}
	
	if (request.message == "reset_timeout_required") {
		//console.log("'reset_timeout_required' received ...");

		var location = JSON.parse(getSettings("weatherLocation"));
		if (location == null) {
			return;
		}

		var weatherObj = JSON.parse(getSettings("w_" + location.woeid));

		var response = "NO";
		if (!isValidWeatherObject(weatherObj)) { // something went wrong and the timeOut stopped or is null (more than a minute passed)
			response = "YES";
		}

		sendResponse({status: response});
	}
	
	if (request.message == "reset_timeout") {
		console.log("'reset_timeout' received ...");
		GetWeatherCheck();
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