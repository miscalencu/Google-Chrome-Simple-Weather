currentPage = "popup";
function ShowWeather(showBadgeAnimation) {

	if (showBadgeAnimation == undefined) {
		showBadgeAnimation = false;
	}

	var locations = JSON.parse(getSettings("weatherLocations"));
	var showin = getSettings("weatherShowIn");

	var location = JSON.parse(getSettings("weatherLocation"));
	var weatherObj = JSON.parse(getSettings("w_" + location.woeid));

	if (!isValidWeatherObject(weatherObj)) {
		$(".loading").addClass("fa-spin");
		GetWeather();

		if (weatherObj == null) {
			return;
		}
	}

	try { // could not be an extension
		refreshBadge(showBadgeAnimation);
	}
	catch (e) {
		console.log("Sorry, cannot update badge ...");
	}

	$("#main_container").fadeOut("fast", function () {
		var headerContent = "";
		headerContent += "<div class=\"pull-left\"><i class=\"wi wi-refresh loading\" title=\"" + chrome.i18n.getMessage("action_refreshnow") + "\"></i> " + getLabel(chrome.i18n.getMessage("label_weatherin") + " ") + weatherObj.LocationCity + ((weatherObj.LocationCountry.length == 0) ? "" : (" - " + weatherObj.LocationCountry)) + ((weatherObj.LocationRegion.length == 0) ? "" : (" - " + weatherObj.LocationRegion)) + "</div>";
		headerContent += "<div class=\"pull-right links\">";
		headerContent += "	<a href=\"#\" id=\"link_previous\"><span class=\"glyphicon glyphicon-chevron-left\"title=\"" + chrome.i18n.getMessage("action_viewprevlocation") + "\"></span></a>";
		headerContent += "	<b>" + (1 + getCurrentIndex()) + " / " + locations.length + "</b> ";
		headerContent += "	<a href=\"#\" id=\"link_next\"><span class=\"glyphicon glyphicon-chevron-right\" title=\"" + chrome.i18n.getMessage("action_viewnextlocation") + "\" /></span></a>";
		headerContent += "</div>";
		headerContent += "<div class=\"pull-right preload_image\" style=\"padding-right: 20px;\"></div>";

		$("#title").html(headerContent);
		$("#weather").html("");

		var content = "<div class=\"box_now\">";

		var isDay = findIfIsDay(weatherObj);
		content += "<span class=\"temp\">" + getIcon(weatherObj.ConditionCode, isDay) + "</span>";
		content += "<span class=\"now\">" + fillInTemperature(weatherObj.Temp) + ((showin === "C") ? "&deg;" : " ") + showin + "</span>";

		if (weatherObj.Condition != "")
		    content += "<div class=\"condition\">" + getLabel(chrome.i18n.getMessage("label_now") + ": ") + "<b>" + getWeatherCondition(weatherObj.Condition) + "</b></div>";

		if (weatherObj.WindChill != "")
		    content += "<i title=\"" + chrome.i18n.getMessage("label_windchill") + "\" class=\"wi wi-thermometer-exterior\" style=\"font-size: 18px\"></i> " + getLabel(chrome.i18n.getMessage("label_windchill") + ": ") + fillInTemperature(weatherObj.WindChill) + ((showin === "C") ? "&deg;" : " ") + showin;

		content += "<br />";

		if (weatherObj.WindSpeed != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_windspeed") + "\" class=\"wi wi-strong-wind\"></i> " + getLabel(chrome.i18n.getMessage("label_windspeed") + ": ") + fillWindSpeed(weatherObj.WindSpeed, weatherObj.UnitSpeed) + " <i title=\"" + weatherObj.WindDirection + " deg.\" class=\"wi wi-wind-default _" + weatherObj.WindDirection + "-deg\"></i>";

		if (weatherObj.AtmosphereHumidity != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_humidity") + "\" class=\"wi wi-cloud-refresh\"></i> " + getLabel(chrome.i18n.getMessage("label_humidity") + ": ") + weatherObj.AtmosphereHumidity + "%</sup>";

		if (weatherObj.AtmospherePressure != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_pressure") + "\" class=\"wi wi-cloud-down\"></i> " + getLabel(chrome.i18n.getMessage("label_pressure") + ": ") + fillPressure(weatherObj.AtmospherePressure, weatherObj.UnitPressure);

		if (weatherObj.AtmosphereVisibility != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_visibility") + "\" class=\"wi wi-windy\"></i> " + getLabel(chrome.i18n.getMessage("label_visibility") + ": ") + fillVisibility(weatherObj.AtmosphereVisibility, weatherObj.UnitDistance);

		content += "<br />";

		if (weatherObj.AstronomySunrise != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_sunrise") + "\" class=\"wi wi-sunrise\"></i>" + getLabel(chrome.i18n.getMessage("label_sunrise") + ": ") + weatherObj.AstronomySunrise;

		if (weatherObj.AstronomySunset != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_sunset") + "\" class=\"wi wi-sunset\"></i>" + getLabel(chrome.i18n.getMessage("label_sunset") + ": ") + weatherObj.AstronomySunset;

		content += "</div>";
		content += "<div class=\"box_forecast\">";

		for (var i = 0; i < weatherObj.Forecast.length; i++) {

			if (i > 4) {
				break;
			}

			var weatherForecast = weatherObj.Forecast[i];

			content += "<div class=\"box\">";
			content += getIcon(weatherForecast.Code, isDay);
			content += "<div style=\"width:180px\">";
			content += "<span class=\"subtitle\"><b>" + getWeatherDay(weatherForecast.Day) + "</b>: " + getWeatherCondition(weatherForecast.Condition) + "</span><br />";
			content += getLabel("High/Low: ");
			content += "<span class=\"high\">" + fillInTemperature(weatherForecast.High) + ((showin === "C") ? "&deg;" : " ") + showin + "</span> / ";
			content += "<span class=\"low\">" + fillInTemperature(weatherForecast.Low) + ((showin === "C") ? "&deg;" : " ") + showin + "</span>";
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
			footerContent += chrome.i18n.getMessage("popup_text_viewexernallinks") + " ";
			footerContent += "<a href=\"#\" id=\"add_link_twc\" style=\"display:none\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/twc.png\" alt=\"Weather.com\" title=\"Weather.com\" /></a>";
			footerContent += "<a href=\"#\" id=\"add_link_wund\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/wu.png\" alt=\"Wunderground.com\" title=\"Wunderground.com\" /></a>";
			footerContent += "<a href=\"#\" id=\"add_link_yw\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/yw.png\" alt=\"Yahoo Weather\" title=\"Yahoo Weather\" /></a>";
			footerContent += "</div>";
			footerContent += "<div class=\"separator\"></div>";
		}

		footerContent += "<div class=\"inner_content\" style=\"font-size: 10px; margin-bottom:0\">";
		if (getSettings("weatherDate") == "1")
		    footerContent += chrome.i18n.getMessage("label_validfor") + " " + weatherObj.Date + ".<br/>";
		if (getSettings("weatherReadDate") == "1")
		    footerContent += chrome.i18n.getMessage("label_lastcheckedon") + " " + formatToLocalTimeDate(weatherObj.RefreshDate) + ".<br/>";

		var manifest = chrome.runtime.getManifest();
		footerContent += "<div class=\"tips\">" + chrome.i18n.getMessage("popup_text_tiptoopen") + ".<br />" + chrome.i18n.getMessage("popup_text_othertips") + " (v" + manifest.version + ").</div>";

		footerContent += "</div>";

		$("#footer").html(footerContent);

		ShowWeatherBackground(weatherObj, location.woeid, isDay);

		$('#main_container').fadeIn("fast");
		$(".loading").removeClass("fa-spin");

		AddListeners(weatherObj);
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
	ShowWeather();
	}

function goToNextLocation() {
	var locations = JSON.parse(getSettings("weatherLocations"));
	var current = getCurrentIndex();
	if(current == locations.length - 1)
		current = 0;
	else
	    current++;

	setSettings("weatherLocation", JSON.stringify(locations[current]));
	ShowWeather();
}

function AddListeners(weatherObj) {
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
        	chrome.extension.sendMessage({ message: "open_window", url: weatherObj.WeatherLink }, function () { console.log("'open_window' sent ..."); });
        });

        $("#add_link_wund").on("click", function () { 
			chrome.extension.sendMessage({ message: "open_window", url: "http://www.wunderground.com/cgi-bin/findweather/getForecast?query=" + location.name }, function () { console.log("'open_window' sent ..."); });
        });

        $("#add_link_yw").on("click", function () {
        	chrome.extension.sendMessage({ message: "open_window", url: weatherObj.YahooLink }, function () { console.log("'open_window' sent ..."); });
        });

        $(".loading").css("cursor", "pointer").on("click", function () {
        	$(".loading").addClass("fa-spin");
        	GetWeather();
        });
    }
}

$(document).ready(function () {

	var locations = JSON.parse(getSettings("weatherLocations"));
	
	if (locations.length == 0) {
	    $("#title").html(chrome.i18n.getMessage("warning_nolocation"));
	    $("#weather").html("<a href=\"#\" id=\"set_locations\">" + chrome.i18n.getMessage("action_setlocation") + "</a>");
		$("#main_container").show();
		AddListeners(null);
		return;
		}
	else {
		ShowWeather();
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

	$(document).on("weather_error", function (event) {
		console.log("error received ...");
		$(".loading").removeClass("fa-spin");
		$(document).focus();
	});

	$(document).on("weather_complete", function (event) {
		console.log("complete received ...");
		ShowWeather(true);
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
