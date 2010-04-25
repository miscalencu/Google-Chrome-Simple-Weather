var req = new XMLHttpRequest();
var weatherInfo = new Array(4);
var weatherCity = "";
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
	if(!localStorage.weatherLocations)
		localStorage.weatherLocations = "";
		
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
		
	if(!localStorage.imgLocation)
		localStorage.imgLocation = "http://www.google.co.uk/ig/images/weather/";
	}
	
function fillData() 
	{
  	if(req.readyState != 4)
		return;	

	var docXML = req.responseXML;
  	var nodes = docXML.getElementsByTagName("forecast_information");
  	
  	if(!nodes || nodes == null || nodes.length == 0)
  		{
  		}
  	else
  		{
	  	AddGeneric(nodes[0]);
	
		nodes = docXML.getElementsByTagName("current_conditions");
	  	AddInfo(nodes[0], true);
	  	
	  	nodes = docXML.getElementsByTagName("forecast_conditions");
	  	for (var i = 0; i < nodes.length; i++) 
			AddInfo(nodes[i], false);
		}
		
		switch(currentPage)
			{
			case "popup":
				ShowWeather();
				break;
			case "options_updateicon":
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
	
	
function GetWeather(wlocation) 
	{
	weatherCity = "";
	totalItems = 0;
	weatherInfo = new Array(4);
	
	req.open("GET", "http://www.google.co.uk/ig/api?weather=" + wlocation);
	req.onreadystatechange = fillData;
	req.send(null);
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
	weatherObj.icon = localStorage.imgLocation + icon;
	
	weatherObj.condition = node.getElementsByTagName("condition")[0].getAttribute("data");
	weatherObj.label = current?"Now":(node.getElementsByTagName("day_of_week")[0].getAttribute("data"));
	weatherObj.temp = current?(node.getElementsByTagName("temp_c")[0].getAttribute("data")):"N/A";

	if(weatherUnitSystem == "US")
		{
		weatherObj.high = current?"N/A":toCelsius(node.getElementsByTagName("high")[0].getAttribute("data"));
		weatherObj.low = current?"N/A":toCelsius(node.getElementsByTagName("low")[0].getAttribute("data"));
		}
	else
		{
		weatherObj.high = current?"N/A":node.getElementsByTagName("high")[0].getAttribute("data");
		weatherObj.low = current?"N/A":node.getElementsByTagName("low")[0].getAttribute("data");
		}

	weatherObj.wind = current?(node.getElementsByTagName("wind_condition")[0].getAttribute("data")):"N/A";
	weatherObj.humidity = current?(node.getElementsByTagName("humidity")[0].getAttribute("data")):"N/A";
	weatherInfo[totalItems] = weatherObj;
	totalItems ++;
	}
	
function updateBadge()
	{
	timeOut = null;
	if(localStorage.weatherLocations == "")
		{
		chrome.browserAction.setBadgeText({ text: "?" });
		chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 255]});
		chrome.browserAction.setTitle({title: "No location defined!\nClick here to set a new location!" });
		chrome.browserAction.setIcon({path: "images/icon.png" });
		}
	else
		{
		var badgeTitle = "";
		var badgeText = "";
		badgeTitle += (getLabel("Weather in ") + weatherCity) + "\n";
		badgeTitle += getValue(weatherInfo[0].temp) + String.fromCharCode(176) + localStorage.weatherShowIn;
		if(weatherInfo[0].condition != "")
			badgeTitle += " - " + weatherInfo[0].condition;
		badgeTitle +=  "\n" + weatherInfo[0].wind + "\n";
		badgeTitle +=  weatherInfo[0].humidity + "\n";

		if(localStorage.weatherDate == "1")
			badgeTitle += "Valid for: " + (new Date(weatherDate)).toGMTString() + "\n";

		if(localStorage.weatherReadDate == "1")
			badgeTitle += "Last checked on: " + (new Date()).toGMTString();

		badgeText = getValue(weatherInfo[0].temp) + String.fromCharCode(176);
		
		if(badgeText.length < 4)
			badgeText += localStorage.weatherShowIn;

		chrome.browserAction.setBadgeText({ text: badgeText });
		chrome.browserAction.setBadgeBackgroundColor({color:[0, 153, 204, 255]});
		chrome.browserAction.setTitle({title: badgeTitle });
		if(weatherInfo[0].icon != "www.google.co.uk")
			chrome.browserAction.setIcon({path: weatherInfo[0].icon });
		else
			chrome.browserAction.setIcon({path: "images/icon.png" });	
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
	if(localStorage.weatherShowIn == "C")
		return feedValue;
	else
		return toFarenheit(feedValue);
	}
	
function getLabel(str)
	{
	return (localStorage.weatherLabels == "1") ? str : "";
	}
	
setDefaultVariables();	
