function ShowWeather(weatherObj) {
	var locations = JSON.parse(getSettings("weatherLocations"));
	var showin = getSettings("weatherShowIn");

	if (locations.length == 0)
		{
		$("#title").html("No locations defined!");
		$("#weather").html("<a href=\"#\" id=\"set_locations\">Click here to set locations.</a>");
		return;
		}

	var headerContent = "";
	headerContent += "<table width=\"100%\" cellspacing=\"3\" cellpadding=\"3\" border=\"0\">";
	headerContent += "	<tr>";
	headerContent += "		<td align=\"left\">" + getLabel("Weather in ") + weatherObj.LocationCity + "</td>";
	headerContent += "		<td align=\"right\" style=\"white-space:nowrap\">";
	headerContent += "			<a href=\"#\" id=\"link_previous\"><img align=\"absmiddle\" src=\"images/arrow_left.png\" alt=\"View previous location\" title=\"View previous location\" /></a>";
	headerContent += "			<b>" + (1 + getCurrentIndex()) + "/" + locations.length + "</b> ";
	headerContent += "			<a href=\"#\" id=\"link_next\"><img align=\"absmiddle\" src=\"images/arrow_right.png\" alt=\"View next location\" title=\"View next location\" /></a>";
	headerContent += "		</td>";
	headerContent += "	</tr>";
	headerContent += "</table>";

	$("#title").html(headerContent);
	$("#weather").html("");
	
	var content = "<div class=\"box_now\">";
		
	if(weatherObj.Icon != "")
		content += "<img align=\"left\" width=\"45\" src=\"" + weatherObj.Icon + "\" alt=\"" + weatherObj.Condition + "\" title=\"" + weatherObj.Condition + "\" />";
		
	content += "<div style=\"height:10px\"></div>" + getLabel("<b>Now</b>: ");
	content += "<span class=\"now\">" + weatherObj.Temp + "&deg;" + showin + "</span>";

	if(weatherObj.Condition != "")
		content += " - " + weatherObj.Condition;

	if(weatherObj.WindSpeed != "")
		content += "<br />Wind speed: " + weatherObj.WindSpeed + " " + weatherObj.UnitSpeed;

	if (weatherObj.AtmosphereHumidity != "")
		content +=  "<br />Humidity: " + weatherObj.AtmosphereHumidity + " g/m<sup>3</sup>";

	for (var i = 0; i < weatherObj.Forecast.length; i++) {

		var weatherForecast = weatherObj.Forecast[i];

		content += "<div class=\"box\">";
		content += "<b>" + weatherForecast.Day + "</b>: ";
		content += weatherForecast.Condition + "<br />";
		content += getLabel("High/Low: ");
		content += "<span class=\"high\">" + weatherForecast.High + "&deg;" + showin + "</span> / ";
		content += "<span class=\"low\">" + weatherForecast.Low + "&deg;" + showin + "</span>";
		content += "</div>";
		}

    content += "<br clear=\"all\" />";
	content += "</div>";

	if(getSettings("weatherShowLinks") == "1")
	{
		content += "<div style=\"border-top:1px solid #CCCCCC; margin-top:5px; padding-top: 10px;\">";
		content += "	View extended forecast details at: ";
		content += "	<a href=\"#\" id=\"add_link_twc\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/twc.png\" alt=\"Weather.com\" title=\"Weather.com\" /></a>";
		content += "	<a href=\"#\" id=\"add_link_wund\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/wu.png\" alt=\"Wunderground.com\" title=\"Wunderground.com\" /></a>";
		content += "</div>";
	}
	
	var footerContent = "";
	if(getSettings("weatherDate") == "1")
		footerContent += "Valid for " + weatherObj.Date + ".<br/>";
	if (getSettings("weatherReadDate") == "1")
		footerContent += "Last time checked on: " + formatToLocalTimeDate(new Date()) + ".<br/>";

	if(footerContent != "")
		content += "<div class=\"footer\">" + footerContent + "</div>";

	$("#weather").html(content);	
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

function showUrl(url)
{
	chrome.tabs.create({url: url});
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
	var location = getSettings("weatherLocation");
    if ($("#set_locations").length > 0) {
        $("#set_locations").on("click", function () { showUrl(chrome.extension.getURL('options.html')); });
    }
    else {
        $("#link_previous").on("click", function () { goToPreviousLocation(); });
        $("#link_next").on("click", function () { goToNextLocation(); });
        $("#add_link_twc").on("click", function () { showUrl("http://www.weather.com/search/enhancedlocalsearch?where=" + location); });
        $("#add_link_wund").on("click", function () { showUrl("http://www.wunderground.com/cgi-bin/findweather/getForecast?query=" + location); });
    }
}

$(document).ready(function () {
	GetWeather();

	$(document).on("weather_complete", function (event) {
		console.log("complete received ...");
		ShowWeather(event.weather);
		AddListeners();
		try { // could not be an extension
			refreshBadge(event.weather);
		}
		catch(e) {
			console.log("Sorry, cannot update badge ... ");
		}
	});

	$(document).on("keyup", function (e) {
		if (e.keyCode == 27) {   // esc
			window.top.postMessage({ args: "close" }, '*');
		}
	});
});
