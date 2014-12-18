var provider = "YAHOO"; // YAHOO, GOOGLE

var req = new XMLHttpRequest();
var weatherInfo = new Array(4);
var weatherCity = "";
var weatherCityCode = "";
var weatherDate = "";
var weatherUnitSystem = ""; 
var totalItems = 0;
var timeOut;

function getDefaultLocation()
	{
	if(!localStorage.weatherLocation)
		if(!localStorage.weatherLocationsInitial)
			return localStorage.weatherLocation = "";
		else
			return localStorage.weatherLocationsInitial.split("|")[0];
	else
		return localStorage.weatherLocation;
	}
	
function setDefaultVariables()
	{
	    if (!localStorage.weatherLocations) {
	        localStorage.weatherLocations = "";
	        localStorage.weatherLocation = "";
	    }
		
	if(!localStorage.weatherLocationsInitial)
		localStorage.weatherLocationsInitial = localStorage.weatherLocations;

	if(!localStorage.weatherShowLinks)
		localStorage.weatherShowLinks = "0";

	if(!localStorage.weatherShowIn)
		localStorage.weatherShowIn = "C";

	if(!localStorage.weatherTimeout)
		localStorage.weatherTimeout = "10";

	if(!localStorage.weatherLabels)
		localStorage.weatherLabels = "1";

	if(!localStorage.weatherDate)
		localStorage.weatherDate = "1";

	if(!localStorage.weatherReadDate)
		localStorage.weatherReadDate = "1";
		
	if(!localStorage.compactMode)
		localStorage.compactMode = "1";

	if (!localStorage.imgLocation || localStorage.imgLocation.indexOf("/weather_icons/" + provider + "/") == -1)
		localStorage.imgLocation = "images/weather_icons/" + provider + "/" + provider + "/";
	}

function GetWeather(wlocation, wlocationcode) {
    weatherCity = "";
    weatherCityCode = "";
    totalItems = 0;

    if (wlocation == "") {
        GoAfterWeather();
        return;
    }

	if (provider == "GOOGLE") {
	    weatherInfo = new Array(4);
	    req.open("GET", "http://www.google.co.uk/ig/api?weather=" + wlocation);
	    req.onreadystatechange = fillData;

	    req.send(null);
	}

	if (provider == "YAHOO") {
	    weatherInfo = new Array(1);
	    //alert(wlocationcode);
	    if (arguments[1] == undefined || wlocationcode == undefined || wlocationcode == "") {
	        wlocationcode = GetWoeid(wlocation);
	    }

	    weatherCityCode = wlocationcode;

	    if (wlocationcode != "") {
	        var query = escape("select item from weather.forecast where woeid=\"" + wlocationcode + "\" and u=\"" + localStorage.weatherShowIn.toLowerCase() + "\"")
	        req.open("GET", "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml");
	        req.onreadystatechange = fillData;
	        req.send(null);
	    }
	    else {
	        alert("No location found! Please try to specify City, Country, Code...");
        }
	}
}

function fillData() {
	if (req.readyState != 4)
	    return;

	var docXML = req.responseXML;

	if (provider == "GOOGLE") {
	    FillGoogleWeather(docXML);
	}

	if (provider == "YAHOO") {
	    FillYahooWeather(docXML);
    }

    GoAfterWeather();
}

function GoAfterWeather() {
    switch (currentPage) {
        case "popup":
            ShowWeather();
            AddListeners();
            break;
        case "options_updateicon":
            checkIfValid();
            saveData();
            break;
        case "options":
            checkIfValid();
            break;
        case "background":
            setBadge();
            break;
    }
}

// YAHOO FUNCTIONS

function GetWoeid(wlocation) {
    var ret = "";

    var query = escape("select * from geo.places where text=\"" + wlocation + "\"")
    var strUrl = "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml"

	var result = jQuery.ajax({ url: strUrl, async: false, timeout: 2000 }).responseText; // sync
	var xmlDoc = null;

	xmlDoc = jQuery.parseXML(result);
	if (xmlDoc != null) {
	    var nodes = xmlDoc.getElementsByTagName("place");
	    if (nodes.length > 0) {
	        ret = nodes[0].getElementsByTagName("woeid")[0].textContent;
	    }
	}

	return ret;
}

var rr;

function FillYahooWeather(docXML) {
    var item = docXML.getElementsByTagName("item")[0];
    var title = item.getElementsByTagName("title")[0].textContent;

    weatherCity = title.replace("Conditions for ", "").split(" at ")[0];
    weatherUnitSystem = "N/A";
    weatherDate = item.getElementsByTagName("pubDate")[0].textContent;

    weatherCity = weatherCity.replace("|", "");
    weatherCity = weatherCity.replace("_", "");

    var item = docXML.getElementsByTagName("channel")[0].getElementsByTagName("item")[0];
    var weatherObj = new Object();

    var description = item.getElementsByTagName("description")[0].textContent;

    //alert(description);
    //weatherObj.icon = ExtractString(description, "<img src=\"", "\"");

    var condition = item.getElementsByTagName("condition")[0];
    var d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var ds = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weatherObj.icon = localStorage.imgLocation + condition.getAttribute("code") + ".gif";
    weatherObj.condition = condition.getAttribute("text");
    weatherObj.label = "Now";
    weatherObj.temp = condition.getAttribute("temp");
    weatherObj.wind = "";
    weatherObj.high = "";
    weatherObj.low = "";
    weatherObj.humidity = "";
    weatherInfo[0] = weatherObj;

    // forecast
    var forecast = ExtractString(description, "Forecast:", "<a href=").replace("</b>", "").replace("<BR />", "");
    var forecasts = forecast.split("<br />");

    weatherObj = new Object();

    if (forecasts.length > 0) {
        weatherObj.icon = "";
        weatherObj.condition = ExtractString(forecasts[0].split(" - ")[1], "", ".");
        weatherObj.label = d[arrindex(ds, forecasts[0].split(" - ")[0])];
        weatherObj.temp = "";
        weatherObj.wind = "";
        weatherObj.high = ExtractString(forecasts[0], "High: ", " ");
        weatherObj.low = ExtractString(forecasts[0], "Low: ", "[end]");
        weatherObj.humidity = "";
        weatherInfo[1] = weatherObj;
    }

    if (forecasts.length > 1) {
        weatherObj = new Object();
        weatherObj.icon = "";
        weatherObj.condition = ExtractString(forecasts[1].split(" - ")[1], "", ".");
        weatherObj.label = d[arrindex(ds, forecasts[1].split(" - ")[0])];
        weatherObj.temp = "";
        weatherObj.wind = "";
        weatherObj.high = ExtractString(forecasts[1], "High: ", " ");
        weatherObj.low = ExtractString(forecasts[1], "Low: ", "[end]");
        weatherObj.humidity = "";
        weatherInfo[2] = weatherObj;
    }
}

// END YAHOO FUNCTIONS

// GOOGLE FUNCTIONS

function FillGoogleWeather(docXML) {
    var nodes = docXML.getElementsByTagName("forecast_information");
    if (!nodes || nodes == null || nodes.length == 0) {
    }
    else {
        AddGeneric(nodes[0]);

        nodes = docXML.getElementsByTagName("current_conditions");
        AddInfo(nodes[0], true);

        nodes = docXML.getElementsByTagName("forecast_conditions");
        for (var i = 0; i < nodes.length; i++)
            AddInfo(nodes[i], false);
    }
}

function AddGeneric(node)
	{
	weatherCity = node.getElementsByTagName("city")[0].getAttribute("data");
	weatherUnitSystem = node.getElementsByTagName("unit_system")[0].getAttribute("data");
	weatherDate = node.getElementsByTagName("current_date_time")[0].getAttribute("data");
	
	weatherCity = weatherCity.replace("|", "");
	weatherCity = weatherCity.replace("_", "");
	}
	
function AddInfo(node, current) 
	{
	var weatherObj = new Object();
	
	var icon = node.getElementsByTagName("icon")[0].getAttribute("data");
	if(icon.indexOf("/") > -1)
		icon = icon.split("/")[icon.split("/").length - 1];

	if(icon != "")
		weatherObj.icon = localStorage.imgLocation + icon;
	else
		weatherObj.icon = "";
	
	weatherObj.condition = node.getElementsByTagName("condition")[0].getAttribute("data");
	weatherObj.label = current?"Now":(node.getElementsByTagName("day_of_week")[0].getAttribute("data"));
	weatherObj.temp = current?(node.getElementsByTagName("temp_c")[0].getAttribute("data")):"N/A";

	try
	{
		weatherObj.wind = current?(node.getElementsByTagName("wind_condition")[0].getAttribute("data")):"N/A";		
	}
	catch (ex)
	{
		weatherObj.wind = "Wind not available";
	}

	// calculate wind chill using the formulas here: http://en.wikipedia.org/wiki/Wind_chill
	// var dWind = 

	if(weatherUnitSystem == "US")
		{
		weatherObj.high = current?"N/A":toCelsius(node.getElementsByTagName("high")[0].getAttribute("data"));
		weatherObj.low = current?"N/A":toCelsius(node.getElementsByTagName("low")[0].getAttribute("data"));
		//weatherObj.windChill = 35.74 + 0.6215 * weatherObj.temp - 
		}
	else
		{
		weatherObj.high = current?"N/A":node.getElementsByTagName("high")[0].getAttribute("data");
		weatherObj.low = current?"N/A":node.getElementsByTagName("low")[0].getAttribute("data");
		}

	try
	{
		weatherObj.humidity = current?(node.getElementsByTagName("humidity")[0].getAttribute("data")):"N/A";
	}
	catch (ex)
	{
		weatherObj.humidity = "Humidity not available";
	}
	
	weatherInfo[totalItems] = weatherObj;
	totalItems ++;
}

// END GOOGLE FUNCTIONS
	
function updateBadge()
	{
	timeOut = null;
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

	    badgeText = getValue(weatherInfo[0].temp) + String.fromCharCode(176);

	    if (badgeText.length < 4)
	        badgeText += localStorage.weatherShowIn;

	    chrome.browserAction.setBadgeText({ text: badgeText });
	    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 153, 204, 255] });
	    chrome.browserAction.setTitle({ title: badgeTitle });
	    if (weatherInfo[0].icon != "www.google.co.uk" && provider == "GOOGLE") {
	        chrome.browserAction.setIcon({ path: localStorage.imgLocation + weatherInfo[0].icon.split("/")[weatherInfo[0].icon.split("/").length - 1] });
	    }
	    else {
	        if (weatherInfo[0].icon != "" && provider == "YAHOO") {
	            chrome.browserAction.setIcon({ path: localStorage.imgLocation + weatherInfo[0].icon.split("/")[weatherInfo[0].icon.split("/").length - 1] });
	        }
	        else
	            chrome.browserAction.setIcon({ path: "images/icon.png" });
	    }
	}
	}	

function toCelsius(fromFarenheit)
	{
	return parseInt(5 * ((parseInt(fromFarenheit) - 32) / 9));
	}

function toFarenheit(fromCelsius)
	{
	return 32 + (parseInt(9 * parseInt(fromCelsius) / 5));
	}

function getValue(feedValue)
	{
	if(provider == "GOOGLE")
		{
		if(localStorage.weatherShowIn == "C")
			return feedValue;
		else
			return toFarenheit(feedValue);
		}

	if(provider == "YAHOO")
		return feedValue;
	}
	
function getLabel(str)
	{
	return (localStorage.weatherLabels == "1") ? str : "";
	}

// Format to local time from UTC
function formatToLocalTimeDate(inDate) {
	try {
	    return dateFormat(inDate, "ddd, d mmmm yyyy, h:MM:ss TT");
	}
	catch (err) {
	    return inDate;
	}
}

function ExtractString(content, start, end) {
    var index1 = content.indexOf(start);
    var index2 = content.indexOf(end, index1 + start.length + 1);

    if (end == "[end]")
        index2 = content.length;

    if (index1 > -1 && index2 > -1 && index2 > index1 + start.length) {
        return content.substring(index1 + start.length, index2);
    }
    else
        return "";
}

function arrindex(arr, obj) {
    obj = obj.replace("\n", "").replace("\r", "");
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) {
            return i;
            break;
        }
    }
    return -1;
}

setDefaultVariables();