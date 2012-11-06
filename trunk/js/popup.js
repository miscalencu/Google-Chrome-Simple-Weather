var currentPage = "popup";

function ShowWeather() 
	{
	if(localStorage.weatherLocations == "")
		{
		document.getElementById("title").innerHTML = "No locations defined!";
		document.getElementById("weather").innerHTML = "<a href=\"javascript:showUrl(chrome.extension.getURL('options.html'))\">Click here to set locations.</a>";
		return;
		}

	var totalLocations = localStorage.weatherLocations.split("|").length;
	var headerContent = "";
	headerContent += "<table width=\"100%\" cellspacing=\"3\" cellpadding=\"3\" border=\"0\">";
	headerContent += "	<tr>";
	headerContent += "		<td align=\"left\">" + getLabel("Weather in ") + weatherCity + "</td>";
	headerContent += "		<td align=\"right\" style=\"white-space:nowrap\">";
	headerContent += "			<a href=\"javascript:goToPreviousLocation()\"><img align=\"absmiddle\" src=\"images/arrow_left.png\" alt=\"View previous location\" title=\"View previous location\" /></a>";
	headerContent += "			<b>" + (1 + getCurrentIndex()) + "/" + totalLocations + "</b> ";
	headerContent += "			<a href=\"javascript:goToNextLocation()\"><img align=\"absmiddle\" src=\"images/arrow_right.png\" alt=\"View next location\" title=\"View next location\" /></a>";
	headerContent += "		</td>";
	headerContent += "	</tr>";
	headerContent += "</table>";

	document.getElementById("title").innerHTML = headerContent;
	
	//****************
	document.getElementById("weather").innerHTML = "";
	
	var content = "";
	for(var i = 0; i < weatherInfo.length; i++) 
		{
		content += "<div class=\"box" + ((weatherInfo[i].label == "Now")?"_now":"") + "\">";
		
		if(weatherInfo[i].icon != "www.google.co.uk" && weatherInfo[i].icon != "")
			content += "<img align=\"left\" width=\"45\" src=\"" + weatherInfo[i].icon + "\" alt=\"" + weatherInfo[i].condition + "\" title=\"" + weatherInfo[i].condition + "\" />";
		
		if(weatherInfo[i].label == "Now") {

		    if (provider == "YAHOO")
		        content += "<div style=\"height:10px\"></div>";

			content +=  getLabel("<b>" + weatherInfo[i].label + "</b>: ");
			content += "<span class=\"now\">" + getValue(weatherInfo[i].temp) + "&deg;" + localStorage.weatherShowIn + "</span>";

			if(weatherInfo[i].condition != "")
			    content += " - " + weatherInfo[i].condition;

            if(weatherInfo[i].wind != "")
                content += "<br />" + weatherInfo[i].wind;

            if (weatherInfo[i].humidity != "")
			    content +=  "<br />" + weatherInfo[i].humidity;
			}
		else
			{
			content +=  "<b>" + weatherInfo[i].label + "</b>: ";
			content +=  weatherInfo[i].condition + "<br />";
			content += getLabel("High/Low: ");
			content += "<span class=\"high\">" + getValue(weatherInfo[i].high) + "&deg;" + localStorage.weatherShowIn + "</span> / ";
			content += "<span class=\"low\">" + getValue(weatherInfo[i].low) + "&deg;" + localStorage.weatherShowIn + "</span>";
			}

        content += "<br clear=\"all\" />";
		content += "</div>";
		}

	if(localStorage.weatherShowLinks == "1")
	{
		content += "<div style=\"border-top:1px solid #CCCCCC; margin-top:5px; padding-top: 10px;\">";
		content += "	View extended forecast details at: ";
		content += "	<a href=\"javascript:showUrl('http://www.weather.com/search/enhancedlocalsearch?where=" + getDefaultLocation() + "')\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/twc.png\" alt=\"Weather.com\" title=\"Weather.com\" /></a>";
		content += "	<a href=\"javascript:showUrl('http://www.wunderground.com/cgi-bin/findweather/getForecast?query=" + getDefaultLocation() + "')\"><img hspace=\"5\" align=\"absmiddle\" border=\"0\" src=\"images/icons/wu.png\" alt=\"Wunderground.com\" title=\"Wunderground.com\" /></a>";
		content += "</div>";
	}
	
	var footerContent = "";
	if(localStorage.weatherDate == "1")
		footerContent += "Valid for " + formatToLocalTimeDate(new Date(weatherDate)) + ".<br/>";
	if(localStorage.weatherReadDate == "1")
		footerContent += "Last time checked on: " + formatToLocalTimeDate(new Date()) + ".<br/>";

	if(footerContent != "")
		content += "<div class=\"footer\">" + footerContent + "</div>";

	document.getElementById("weather").innerHTML = content;	
		
	//****************
			
	updateBadge();
}

function getCurrentIndex()
	{
	var current = -1;
	var locations = localStorage.weatherLocationsInitial.split("|");
	for(var i=0; i < locations.length; i++)
		{
		if(locations[i] == getDefaultLocation())
			current = i;
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
	var locations = localStorage.weatherLocationsInitial.split("|");
	var current = getCurrentIndex();
	
	if(current == 0)
		current = locations.length - 1;
	else
		current --;
	localStorage.weatherLocation = locations[current];
	Init();
	}

function goToNextLocation()
	{
	var locations = localStorage.weatherLocationsInitial.split("|");
	var current = getCurrentIndex();
	if(current == locations.length - 1)
		current = 0;
	else
		current ++;
	localStorage.weatherLocation = locations[current];
	Init();
}

function Init() {
    var dlocation = getDefaultLocation();
    GetWeather(dlocation);
}

Init();