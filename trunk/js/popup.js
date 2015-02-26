function ShowWeather(weatherObj) {
	var locations = JSON.parse(getSettings("weatherLocations"));
	var showin = getSettings("weatherShowIn");

	$("#main_container").fadeOut("fast", function () {

		var headerContent = "";
		headerContent += "<div class=\"pull-left\">" + getLabel("Weather in ") + weatherObj.LocationCity + ((weatherObj.LocationCountry.length == 0) ? "" : (" - " + weatherObj.LocationCountry)) + ((weatherObj.LocationRegion.length == 0) ? "" : (" - " + weatherObj.LocationRegion)) + "</div>";
		headerContent += "<div class=\"pull-right links\">";
		headerContent += "	<a href=\"#\" id=\"link_previous\"><span class=\"glyphicon glyphicon-chevron-left\"title=\"View previous location\"></span></a>";
		headerContent += "	<b>" + (1 + getCurrentIndex()) + " / " + locations.length + "</b> ";
		headerContent += "	<a href=\"#\" id=\"link_next\"><span class=\"glyphicon glyphicon-chevron-right\" title=\"View next location\" /></span></a>";
		headerContent += "</div>";

		$("#title").html(headerContent);
		$("#weather").html("");

		var content = "<div class=\"box_now\">";

		var isDay = findIfIsDay(weatherObj);
		content += "<span class=\"temp\">" + getIcon(weatherObj.ConditionCode, isDay) + "</span>";
		content += "<span class=\"now\">" + weatherObj.Temp + "&deg;" + showin + "</span>";

		if (weatherObj.Condition != "")
		    content += "<div class=\"condition\">" + getLabel("Now: ") + "<b>" + weatherObj.Condition + "</b></div>";

		if (weatherObj.WindChill != "")
		    content += "<i title=\"Wind chill\" class=\"wi wi-thermometer-exterior\" style=\"font-size: 18px\"></i> " + getLabel("Wind chill: ") + weatherObj.WindChill + "&deg;" + showin;

		content += "<br />";

		if (weatherObj.WindSpeed != "")
		    content += "<br /><i title=\"Wind speed\" class=\"wi wi-strong-wind\"></i> " + getLabel("Wind speed: ") + weatherObj.WindSpeed + " " + weatherObj.UnitSpeed + " <i title=\"" + weatherObj.WindDirection + " deg.\" class=\"wi wi-wind-default _" + weatherObj.WindDirection + "-deg\"></i>";

		if (weatherObj.AtmosphereHumidity != "")
		    content += "<br /><i class=\"wi wi-cloud-refresh\"></i> " + getLabel("Humidity: ") + weatherObj.AtmosphereHumidity + " g/m<sup>3</sup>";

		if (weatherObj.AtmospherePressure != "")
		    content += "<br /><i title=\"Pressure\" class=\"wi wi-cloud-down\"></i> " + getLabel("Pressure: ") + weatherObj.AtmospherePressure + " " + weatherObj.UnitPressure;

		if (weatherObj.AtmosphereVisibility != "")
		    content += "<br /><i title=\"Visibility\" class=\"wi wi-windy\"></i> " + getLabel("Visibility: ") + weatherObj.AtmosphereVisibility + " " + weatherObj.UnitDistance;

		content += "<br />";

		if (weatherObj.AstronomySunrise != "")
		    content += "<br /><i title=\"Sunrise\" class=\"wi wi-sunrise\"></i>" + getLabel("Sunrise: ") + weatherObj.AstronomySunrise;

		if (weatherObj.AstronomySunset != "")
		    content += "<br /><i title=\"Sunset\" class=\"wi wi-sunset\"></i>" + getLabel("Sunset: ") + weatherObj.AstronomySunset;

		content += "</div>";
		content += "<div class=\"box_forecast\">";

		for (var i = 0; i < weatherObj.Forecast.length; i++) {

			var weatherForecast = weatherObj.Forecast[i];

			content += "<div class=\"box\">";
			content += getIcon(weatherForecast.Code, isDay);
			content += "<div style=\"width:180px\">";
			content += "<span class=\"subtitle\"><b>" + weatherForecast.Day + "</b>: " + weatherForecast.Condition + "</span><br />";
			content += getLabel("High/Low: ");
			content += "<span class=\"high\">" + weatherForecast.High + "&deg;" + showin + "</span> / ";
			content += "<span class=\"low\">" + weatherForecast.Low + "&deg;" + showin + "</span>";
			content += "</div>";
			content += "</div>";
		}

		content += "</div>";
		content += "<br clear=\"all\" />";

		$("#weather").html(content);

		var footerContent = "";
		if (getSettings("weatherShowLinks") == "1") {
			footerContent += "<div class=\"separator\"></div>";
			footerContent += "<div class=\"inner_content\">";
			footerContent += "View extended forecast details at: ";
			footerContent += "<a href=\"#\" id=\"add_link_twc\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/twc.png\" alt=\"Weather.com\" title=\"Weather.com\" /></a>";
			footerContent += "<a href=\"#\" id=\"add_link_wund\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/wu.png\" alt=\"Wunderground.com\" title=\"Wunderground.com\" /></a>";
			footerContent += "</div>";
			footerContent += "<div class=\"separator\"></div>";
		}

		footerContent += "<div class=\"inner_content\" style=\"font-size: 10px; margin-bottom:0\">";
		if (getSettings("weatherDate") == "1")
			footerContent += "Valid for " + weatherObj.Date + ".<br/>";
		if (getSettings("weatherReadDate") == "1")
		    footerContent += "Last time checked on: " + formatToLocalTimeDate(new Date()) + ".<br/>";

		var manifest = chrome.runtime.getManifest();
		footerContent += "<div class=\"tips\">Press Alt + w to open this popup.<br />Use the arrows to change locations. Press ESC to close (v" + manifest.version + ").</div>";

		footerContent += "</div>";

		$("#footer").html(footerContent);

		ShowWeatherBackground(weatherObj);

		$('#main_container').fadeIn("fast");

		AddListeners();
	});
}

function getCurrentIndex()
	{
	var current = -1;
	var location = JSON.parse(getSettings("weatherLocation"));
	var locations = JSON.parse(getSettings("weatherLocations"));
	for(var i=0; i < locations.length; i++)
		{
		if (locations[i].woeid === location.woeid) {
			current = i;
			break;
			}
	}

	if(current == -1)
		current = 0;

	return current;
	}

function goToPreviousLocation()
	{
	var locations = JSON.parse(getSettings("weatherLocations"));
	var current = getCurrentIndex();
	
	if(current == 0)
		current = locations.length - 1;
	else
		current --;
	setSettings("weatherLocation", JSON.stringify(locations[current]));
	GetWeather();
	}

function goToNextLocation() {
	var locations = JSON.parse(getSettings("weatherLocations"));
	var current = getCurrentIndex();
	if(current == locations.length - 1)
		current = 0;
	else
	    current++;

	setSettings("weatherLocation", JSON.stringify(locations[current]));
	GetWeather();
}

function AddListeners() {
	var location = JSON.parse(getSettings("weatherLocation"));
    if ($("#set_locations").length > 0) {
        $("#set_locations").on("click", function () { 
			chrome.extension.sendMessage({ message: "open_window", url: "options" }, function () { 
				console.log("'open_window' sent ..."); 
				window.top.postMessage({ args: "close" }, '*');
			});
		});
    }
    else {
        $("#link_previous").on("click", function () { goToPreviousLocation(); });
        $("#link_next").on("click", function () { goToNextLocation(); });
        $("#add_link_twc").on("click", function () { 
			chrome.extension.sendMessage({ message: "open_window", url: "http://www.weather.com/search/enhancedlocalsearch?where=" + location.name }, function () { console.log("'open_window' sent ..."); });
			});
        $("#add_link_wund").on("click", function () { 
			chrome.extension.sendMessage({ message: "open_window", url: "http://www.wunderground.com/cgi-bin/findweather/getForecast?query=" + location.name }, function () { console.log("'open_window' sent ..."); });
			});
    }
}

$(document).ready(function () {

	var locations = JSON.parse(getSettings("weatherLocations"));
	
	if (locations.length == 0) {
		$("#title").html("No locations defined!");
		$("#weather").html("<a href=\"#\" id=\"set_locations\">Click here to set locations.</a>");
		$("#main_container").show();
		AddListeners();
		return;
		}
	else {
		GetWeather();
	}

	chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
		console.log("message received ...");
		if (request.message == "goto_previous") {
			console.log("'goto_previous' received ...");
			goToPreviousLocation();
		}

		if (request.message == "goto_next") {
			console.log("'goto_next' received ...");
			goToNextLocation();
		}
	});

	$(document).on("weather_complete", function (event) {
		console.log("complete received ...");
		ShowWeather(event.weather);
		try { // could not be an extension
			refreshBadge(event.weather);
		}
		catch(e) {
			console.log("Sorry, cannot update badge ... ");
		}
		$(document).focus();
	});

	$(document).on("keyup", function (e) {
		if (e.keyCode == 27) {   // esc
			window.top.postMessage({ args: "close" }, '*');
		}

		if (e.keyCode == 37) {   // left
			goToPreviousLocation();
		}

		if (e.keyCode == 39) {   // right
			goToNextLocation();
		}
	});
});
