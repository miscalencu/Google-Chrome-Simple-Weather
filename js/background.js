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
		updateBadge(false);
	}

	// check every minute
	SetRefresh();
}

$(document).on("weather_complete", function (event) {
    console.log("complete received ...");
    if (isExtension) {
        updateBadge(true);
    }
});
	
$(document).ready(function () {

	var locations = JSON.parse(getSettings("weatherLocations"));
	if (locations.length == 0) {
	    updateEmptyBadge();
		return;
	}

	updateBadge(true);
	SetRefresh();
});

function updateEmptyBadge() {
    chrome.browserAction.setBadgeText({ text: "?" });
    chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    chrome.browserAction.setTitle({ title: chrome.i18n.getMessage("warning_nolocation") + "\n" + chrome.i18n.getMessage("action_setlocation") });
    chrome.browserAction.setIcon({ path: "images/icon.png" });
}

function updateBadge(showAnimation) {

	if (showAnimation == undefined) {
		showAnimation = false;
	}

	var location = JSON.parse(getSettings("weatherLocation"));
	if (location == null) {
		updateEmptyBadge();
		return;
	}

	var weatherObj = JSON.parse(getSettings("w_" + location.woeid));
	if (isValidWeatherObject(weatherObj)) {
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		if (showAnimation) {
			chrome.browserAction.setBadgeText({ text: "." });
			setTimeout(function () { chrome.browserAction.setBadgeText({ text: ".." }); }, 100);
			setTimeout(function () { chrome.browserAction.setBadgeText({ text: "..." }); }, 200);
			setTimeout(function () { chrome.browserAction.setBadgeText({ text: "...." }); }, 300);
			setTimeout(function () { chrome.browserAction.setBadgeText({ text: "....." }); }, 400);
		}
		setTimeout(function () { goUpdateBadge(weatherObj); }, 500);
	}
	else {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setTitle({ title: chrome.i18n.getMessage("warning_nodata") + "\n" + chrome.i18n.getMessage("action_updatingsoon") });
	}
}

function goUpdateBadge(weatherObj) {
	console.log("updating badge with weather object queried at " + weatherObj.RefreshDate);
	var badgeTitle = "";
	var badgeText = "";

	badgeTitle += (getLabel(chrome.i18n.getMessage("label_weatherin") + " ") + weatherObj.LocationCity) + getLabel("\n" + chrome.i18n.getMessage("label_temperature") + ": ", " - ") + fillInTemperature(weatherObj.Temp);
	if (getSettings("weatherShowIn") === "C") {
		badgeTitle += String.fromCharCode(176);
	}
	else {
		badgeTitle += " ";
	}
	badgeTitle += getSettings("weatherShowIn");

	if (weatherObj.Condition != "")
		badgeTitle += " - " + getWeatherCondition(weatherObj.Condition);

	if (weatherObj.WindChill != "") {
	    badgeTitle += getLabel("\n" + chrome.i18n.getMessage("label_windchill") + ": ", " (") + fillInTemperature(weatherObj.WindChill);
	    if (getSettings("weatherShowIn") === "C") {
	    	badgeTitle += String.fromCharCode(176);
	    }
	    else {
	    	badgeTitle += " ";
	    }
		badgeTitle += getSettings("weatherShowIn");
		badgeTitle += getLabel("", ")");
	}

	if (weatherObj.WindSpeed != "")
	    badgeTitle += "\n" + getLabel(chrome.i18n.getMessage("label_windspeed") + ": ") + fillWindSpeed(weatherObj.WindSpeed, weatherObj.UnitSpeed);

	if (weatherObj.AtmosphereHumidity != "")
	    badgeTitle += getLabel("\n" + chrome.i18n.getMessage("label_humidity") + ": ", ", ") + weatherObj.AtmosphereHumidity + "%";

	if (weatherObj.AtmospherePressure != "")
	    badgeTitle += getLabel("\n" + chrome.i18n.getMessage("label_pressure") + ": ", ", ") + fillPressure(weatherObj.AtmospherePressure, weatherObj.UnitPressure);

	if (weatherObj.AtmosphereVisibility != "")
	    badgeTitle += getLabel("\n" + chrome.i18n.getMessage("label_visibility") + ": ", ", ") + fillVisibility(weatherObj.AtmosphereVisibility, weatherObj.UnitDistance);

	if ((getSettings("weatherDate") === "1") || (getSettings("weatherReadDate") === "1"))
	    badgeTitle += "\n";
    
	if (getSettings("weatherDate") === "1")
	    badgeTitle += "\n" + chrome.i18n.getMessage("label_validfor") + ": " + formatToLocalTimeDate(weatherObj.Date);

	if (getSettings("weatherReadDate") === "1")
	    badgeTitle += "\n" + chrome.i18n.getMessage("label_lastcheckedon") + ": " + formatToLocalTimeDate(weatherObj.RefreshDate);

	var temp = fillInTemperature(weatherObj.Temp);
	if (getSettings("weatherShowIn") === "C") {
		badgeText = String(temp) + String.fromCharCode(176);
	}
	else {
		badgeText = String(temp) + " ";
	}

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
		GetWeatherCheck();
	}
	
	if (request.message == "update_badge") {
		console.log("'update_badge' received ...");
		updateBadge(request.showAnimation);
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