currentPage = "weather";
function ShowWeather(showBadgeAnimation) {

	if (showBadgeAnimation == undefined) {
		showBadgeAnimation = false;
	}

	var locations = JSON.parse(getSettings("weatherLocations"));
	var showin = getSettings("weatherShowIn");

	var location = JSON.parse(getSettings("weatherLocation"));
	var weatherObj = JSON.parse(getSettings("w_" + location.woeid));

	if (weatherObj == null || weatherObj == undefined) {
	    return;
	}

	try { // could not be an extension
		refreshBadge(showBadgeAnimation);
	}
	catch (e) {
		console.log("Sorry, cannot update badge ...");
	}

	$("#main_container").fadeOut("fast", function () {
		var headerContent = "";
		headerContent += "<div class=\"pull-left\"><i class=\"wi wi-refresh loading\" title=\"" + chrome.i18n.getMessage("action_refreshnow") + "\" data-placement=\"right\"></i> " + getLabel(chrome.i18n.getMessage("label_weatherin") + " ") + weatherObj.LocationCity + ((weatherObj.LocationCountry.length == 0) ? "" : (" - " + weatherObj.LocationCountry)) + ((weatherObj.LocationRegion.length == 0) ? "" : (" - " + weatherObj.LocationRegion)) + "</div>";
		headerContent += "<div class=\"pull-right links\">";
		headerContent += "	<a href=\"#\" id=\"link_previous\"><span data-toggle=\"tooltip\" data-placement=\"left\" class=\"glyphicon glyphicon-chevron-left\" title=\"" + chrome.i18n.getMessage("action_viewprevlocation") + "\"></span></a>";
		headerContent += "	<b>" + (1 + getCurrentIndex()) + " / " + locations.length + "</b> ";
		headerContent += "	<a href=\"#\" id=\"link_next\"><span data-toggle=\"tooltip\" data-placement=\"left\" class=\"glyphicon glyphicon-chevron-right\" title=\"" + chrome.i18n.getMessage("action_viewnextlocation") + "\" /></span></a>";
		headerContent += "</div>";
		headerContent += "<div class=\"pull-right preload_image\" style=\"padding-right: 20px;\"></div>";

		$("#title").html(headerContent);
		$("#weather").html("");

		var content = "<div class=\"box_now\">";
		content += "<div class=\"box_now_left\">";

		var isDay = findIfIsDay(weatherObj);
		content += "<span class=\"temp\">" + getIcon(weatherObj.ConditionCode, isDay) + "</span>";
		content += "<span class=\"now\" data-toggle=\"tooltip\" title=\"" + fillInTemperature(weatherObj.Temp) + ((showin === "C") ? " &deg; " : " ") + showin + "\">" + fillInTemperature(weatherObj.Temp) + "</span>";

		if (weatherObj.Condition != "")
		    content += "<div class=\"condition\">" + getLabel(chrome.i18n.getMessage("label_now") + ": ") + "<b>" + getWeatherCondition(weatherObj.Condition) + "</b></div>";

		if (weatherObj.WindChill != "")
			content += "<i data-toggle=\"tooltip\" title=\"" + chrome.i18n.getMessage("label_windchill") + "\" class=\"wi wi-thermometer-exterior\" style=\"font-size: 18px\"></i>: " + fillInTemperature(weatherObj.WindChill) + ((showin === "C") ? "&deg;" : " ") + showin;

		content += "</div><div class=\"box_now_right\">";

		if (weatherObj.WindSpeed != "")
		    content += "<i title=\"" + chrome.i18n.getMessage("label_windspeed") + "\" class=\"wi wi-strong-wind\"></i>: " + fillWindSpeed(weatherObj.WindSpeed, weatherObj.UnitSpeed) + " <i title=\"" + weatherObj.WindDirection + " deg.\" class=\"wi wi-wind-default _" + weatherObj.WindDirection + "-deg\"></i>";

		if (weatherObj.AtmosphereHumidity != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_humidity") + "\" class=\"wi wi-cloud-refresh\"></i>: " + weatherObj.AtmosphereHumidity + "%</sup>";

		if (weatherObj.AtmospherePressure != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_pressure") + "\" class=\"wi wi-cloud-down\"></i>: " + fillPressure(weatherObj.AtmospherePressure, weatherObj.UnitPressure);

		if (weatherObj.AtmosphereVisibility != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_visibility") + "\" class=\"wi wi-windy\"></i>: " + fillVisibility(weatherObj.AtmosphereVisibility, weatherObj.UnitDistance);

		content += "<br />";

		if (weatherObj.AstronomySunrise != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_sunrise") + "\" class=\"wi wi-sunrise\"></i>: " + weatherObj.AstronomySunrise;

		if (weatherObj.AstronomySunset != "")
		    content += "<br /><i title=\"" + chrome.i18n.getMessage("label_sunset") + "\" class=\"wi wi-sunset\"></i>: " + weatherObj.AstronomySunset;

		content += "</div>";

		content += "</div>";
		content += "<div class=\"box_forecast\">";

		for (var i = 0; i < weatherObj.Forecast.length; i++) {

			if (i > 4) {
				break;
			}

			var weatherForecast = weatherObj.Forecast[i];

			content += "<div class=\"box\">";
			content += getIcon(weatherForecast.Code, isDay, weatherForecast.Day);
			content += "<span class=\"subtitle\"><b data-toggle=\"tooltip\" title=\"" + getWeatherDay(weatherForecast.Day) + ": " + getWeatherCondition(weatherForecast.Condition) + "\">" + getWeatherDay(weatherForecast.Day).substring(0, 3) + "</b></span><br />";
			content += "<span class=\"high\" data-toggle=\"tooltip\" title=\"" + getLabel(chrome.i18n.getMessage("label_high") + ": ") + fillInTemperature(weatherForecast.High) + ((showin === "C") ? "&deg;" : " ") + showin + "\">" + fillInTemperature(weatherForecast.High) + "</span> / ";
			content += "<span class=\"low\" data-toggle=\"tooltip\" title=\"" + getLabel(chrome.i18n.getMessage("label_low") + ": ") + fillInTemperature(weatherForecast.Low) + ((showin === "C") ? "&deg;" : " ") + showin + "\">" + fillInTemperature(weatherForecast.Low) + "</span>";
			content += "</div>";
		}

		content += "</div>";
				
		$("#weather").html(content);
		
		var footerContent = "<div class=\"separator\"></div>";
		footerContent += "<br clear=\"all\" />";

		if (getSettings("weatherShowLinks") == "1") {
			footerContent += "<div class=\"inner_content\">";
			footerContent += chrome.i18n.getMessage("popup_text_viewexernallinks") + " ";
			footerContent += "<a data-toggle=\"tooltip\" href=\"#\" id=\"add_link_twc\" style=\"display:none\"><img data-toggle=\"tooltip\" hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/twc.png\" alt=\"Weather.com\" title=\"Weather.com\" /></a>";
			footerContent += "<a data-toggle=\"tooltip\" href=\"#\" id=\"add_link_wund\"><img data-toggle=\"tooltip\" hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/wu.png\" alt=\"Wunderground.com\" title=\"Wunderground.com\" /></a>";
			footerContent += "<a data-toggle=\"tooltip\" href=\"#\" id=\"add_link_yw\"><img data-toggle=\"tooltip\" hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/yw.png\" alt=\"Yahoo Weather\" title=\"Yahoo Weather\" /></a>";
			footerContent += "</div>";
		}

		var manifest = chrome.runtime.getManifest();
		footerContent += "<div class=\"inner_content\" style=\"font-size: 10px; margin-bottom:0\">";
		if (getSettings("weatherDate") == "1")
		    footerContent += chrome.i18n.getMessage("label_validfor") + " " + weatherObj.Date + ".<br/>";
		if (getSettings("weatherReadDate") == "1")
			footerContent += chrome.i18n.getMessage("label_lastcheckedon") + " " + formatToLocalTimeDate(weatherObj.RefreshDate) + " (v" + manifest.version + ").<br/>";

		// footerContent += "<div class=\"tips\">" + chrome.i18n.getMessage("popup_text_tiptoopen") + ".<br />" + chrome.i18n.getMessage("popup_text_othertips") + " (v" + manifest.version + ").</div>";

		footerContent += "</div>";

		$("#footer").html(footerContent);

		ShowWeatherBackground(weatherObj, location.woeid, isDay);

		$('#main_container').fadeIn("fast");
		$(".loading").removeClass("fa-spin");

		AddListeners(weatherObj);
	});
}

function ShowWeatherBackground(weatherObj, woeid, isDay) {
	var url = StaticWeatherBackgroundImage(weatherObj);
	var useFlickrImages = getSettings("useFlickrImages");

	if (useFlickrImages == "1") {
		var stored_image = getSettings("image_" + woeid);
		if (stored_image != "") { // no refresh since last storing of image
			if (stored_image == "NA") { // not available
				stored_image = url; // use static image
			}

			SetWeatherBackGroud(stored_image, woeid);
			var stored_url = getSettings("imageurl_" + woeid);
			if (stored_url != "") {
				//$(".preload_image").html("<a href='" + stored_url + "' target='_blank'>" + chrome.i18n.getMessage("popup_text_viewimage") + " ...</a>");
				$(".preload_image").html("");
			}
			return;
		}
		else {
			$(".preload_image").html("<i class=\"wi loading_small wi-time-12 fa-spin\" />" + chrome.i18n.getMessage("popup_text_loadingimage") + " ...");

			GetWeatherBackground(woeid, weatherObj.Lat, weatherObj.Long,
				function (result) {
					if (result.success) {
						setSettings("image_" + woeid, result.url);
						setSettings("imageurl_" + woeid, result.imageurl);
						setSettings("imagetitle_" + woeid, result.title);
						SetWeatherBackGroud(result.url, woeid);
					} else {
						setSettings("image_" + woeid, "NA");
						setSettings("imageurl_" + woeid, "");
						setSettings("imagetitle_" + woeid, "");
						SetWeatherBackGroud(url, woeid);
					}
				},
				function () {
					setSettings("image_" + woeid, "NA");
					setSettings("imageurl_" + woeid, "");
					setSettings("imagetitle_" + woeid, "");
					SetWeatherBackGroud(url, woeid);
				});
		}
	}
	else {
		SetWeatherBackGroud(url, woeid);
		$(".preload_image").html("");
	}
}

function SetWeatherBackGroud(url, woeid) {
	
	var useFlickrImages = getSettings("useFlickrImages");
	// apply background image
	if (url != "") {
		preloadImage(url, function () {
			if (useFlickrImages == "0") {
				$(".preload_image").html("");
			}
			else {
				var image_url = getSettings("imageurl_" + woeid);
				var image_title = getSettings("imagetitle_" + woeid);
				//if (image_url != "") {
				//	$(".preload_image").html("<a href='" + image_url + "' target='_blank'>" + chrome.i18n.getMessage("popup_text_viewimage") + " ...</a>");
				//} else {
					$(".preload_image").html("");
				//}
			}

			console.log("[we] set_background sent ...");

			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					action: "set_background",
					image_url: image_url,
					image_title: image_title,
					url_text: chrome.i18n.getMessage("popup_text_viewimage"),
					url, url
				}, function (response) {
					console.log(response);
				});
			});
		});
	}
}

function StaticWeatherBackgroundImage(weatherObj) {

	// fill background array
	var bg = new Array();
	bg[0] = "storm.jpg"; // 'tornado'
	bg[1] = "storm.jpg"; // 'tropical storm'
	bg[2] = "storm.jpg"; // 'hurricane'
	bg[3] = "storm.jpg"; // 'severe thunderstorms'
	bg[4] = "storm.jpg"; // 'thunderstorms
	bg[5] = "rain_snow.jpg"; // 'mixed rain and snow'
	bg[6] = "rain_snow.jpg"; // 'mixed rain and sleet'
	bg[7] = "rain_snow.jpg"; // 'mixed snow and sleet'
	bg[8] = "freezing_drizzle.jpg"; // 'freezing drizzle'
	bg[9] = "freezing_drizzle.jpg"; // 'drizzle'
	bg[10] = "freezing_drizzle.jpg"; // 'freezing rain'
	bg[11] = "showers.jpg"; // 'showers'
	bg[12] = "showers.jpg"; // 'showers'
	bg[13] = "light_snow.jpg"; // 'snow flurries'
	bg[14] = "light_snow.jpg"; // 'light snow showers'
	bg[15] = "blowing_snow.jpg"; // 'blowing snow'
	bg[16] = "snow.jpg"; // 'snow'
	bg[17] = "hail.jpg"; // 'hail'
	bg[18] = "sleet.jpg"; // 'sleet'
	bg[19] = "dust.jpg"; // 'dust'
	bg[20] = "foggy.jpg"; // 'foggy'
	bg[21] = "haze.jpg"; // 'haze'
	bg[22] = "foggy.jpg"; // 'smoky'
	bg[23] = "blow.jpg"; // 'blustery'
	bg[24] = "windy.jpg"; // 'windy'
	bg[25] = "cold.jpg"; // 'cold'
	bg[26] = "cloudy.jpg"; // 'cloudy'
	bg[27] = "mostly-cloudy-night.jpg"; // 'mostly cloudy (night)'
	bg[28] = "mostly-cloudy-day.jpg"; // 'mostly cloudy (day)'
	bg[29] = "partly_cloudy_night.jpg"; // 'partly cloudy (night)'
	bg[30] = "partly_cloudy_day.jpg"; // 'partly cloudy (day)'
	bg[31] = "clear_night.jpg"; // 'clear (night)'
	bg[32] = "sunny.jpg"; // 'sunny'
	bg[33] = "fair_night.jpg"; // 'fair (night)'
	bg[34] = "fair_day.jpg"; // 'fair (day)'
	bg[35] = "rain_snow.jpg"; // 'mixed rain and hail'
	bg[36] = "hot.jpg"; // 'hot'
	bg[37] = "thunderstorms.jpg"; // 'isolated thunderstorms'
	bg[38] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[39] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[40] = "showers.jpg"; // 'scattered showers'
	bg[41] = "heavy_snow.jpg"; // 'heavy snow'
	bg[42] = "scattered_snow.jpg"; // 'scattered snow showers'
	bg[43] = "heavy_snow.jpg"; // 'heavy snow'
	bg[44] = "partly_cloudy_day.jpg"; // 'partly cloudy'
	bg[45] = "thunderstorms.jpg"; // 'thundershowers'
	bg[46] = "light_snow.jpg"; // 'snow showers'
	bg[47] = "thunderstorms.jpg"; // 'isolated thundershowers'
	//bg[3200] = ""; // 'not available'

	if (bg[weatherObj.ConditionCode] != undefined) {
		return chrome.runtime.getURL("images/backgrounds/" + bg[weatherObj.ConditionCode]);
	}
	else {
		return "";
	}
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

function goToPreviousLocation() {
    var locations = JSON.parse(getSettings("weatherLocations"));
    var current = getCurrentIndex();

    if (current == 0)
        current = locations.length - 1;
    else
        current--;
    setSettings("weatherLocation", JSON.stringify(locations[current]));

    var weatherObj = JSON.parse(getSettings("w_" + locations[current].woeid));
    if (!isValidWeatherObject(weatherObj)) {
        $(".loading").addClass("fa-spin");
        GetWeather();
    }
    else {
        ShowWeather();
    }
}

function goToNextLocation() {
	var locations = JSON.parse(getSettings("weatherLocations"));
	var current = getCurrentIndex();
	if(current == locations.length - 1)
		current = 0;
	else
	    current++;

	setSettings("weatherLocation", JSON.stringify(locations[current]));

	var weatherObj = JSON.parse(getSettings("w_" + locations[current].woeid));
	if (!isValidWeatherObject(weatherObj)) {
	    $(".loading").addClass("fa-spin");
	    GetWeather();
	}
	else {
	    ShowWeather();
	}
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

	$('i.wi, i.fa, a.glyphicon, [data-toggle="tooltip"]').tooltip();
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
		// try to show wather even if the object data is invalid (expired) - this means there has been and error
		ShowWeather(false);
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
