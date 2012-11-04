var currentPage = "options";

// event listeners

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("showInC").addEventListener("click", function () { localStorage.weatherShowIn = "C"; saveData(); });
    document.getElementById("showInF").addEventListener("click", function () { localStorage.weatherShowIn = "F"; saveData(); });

    document.getElementById("updateTimeout").addEventListener("click", function () { localStorage.weatherTimeout = this[this.selectedIndex].value; });
    document.getElementById("imgLocation").addEventListener("click", function () { localStorage.imgLocation = this[this.selectedIndex].value; fillPreviewIcons(); });
    document.getElementById("showLabels").addEventListener("click", function () { localStorage.weatherLabels = (this.checked ? '1' : '0'); saveData(); });
    document.getElementById("showExternal").addEventListener("click", function () { localStorage.weatherShowLinks = (this.checked ? '1' : '0'); saveData(); });
    document.getElementById("showDate").addEventListener("click", function () { localStorage.weatherDate = (this.checked ? '1' : '0'); saveData(); });
    document.getElementById("showReadDate").addEventListener("click", function () { localStorage.weatherReadDate = (this.checked ? '1' : '0'); saveData(); });

    document.getElementById("btnAdd").addEventListener("click", checkNewLocation);
    document.getElementById("addLocationLink").addEventListener("click", addLocation);
});

function fillPreviewIcons()
	{
	var divobj = document.getElementById("preview_icons");

	var icons = new Array ( 
		"chance_of_rain.gif",
		"chance_of_snow.gif", 
		"chance_of_storm.gif",
		"cloudy.gif",
		"dust.gif",
		"flurries.gif",
		"fog.gif",
		"haze.gif",
		"icy.gif",
		"mist.gif",
		"mostly_cloudy.gif",
		"mostly_sunny.gif",
		"partly_cloudy.gif",
		"rain.gif",
		"rain_snow.gif",
		"showers.gif",
		"sleet.gif",
		"smoke.gif",
		"snow.gif",
		"storm.gif",
		"sunny.gif",
		"thunderstorm.gif"
		);

	var content = "";
	var foldericons = localStorage.imgLocation;
	if(foldericons == "http://g0.gstatic.com/images/icons/onebox/")
		foldericons = "images/weather_icons/new/google/";

	for(var i = 0; i < icons.length; i++)
		{
		content += "<img src=\"" + foldericons + icons[i] + "\" />";
		}

	divobj.innerHTML = content;
	}

fillPreviewIcons();

function saveData()
	{
	updateBadge();
	currentPage = "options";
	}

function checkNewLocation()
	{
	var strLocation = document.getElementById("newLocation").value;
	document.getElementById("message").innerHTML = "";
	GetWeather(strLocation);
	}

function checkIfValid()
	{
	if(weatherCity  == "")
		document.getElementById("message").innerHTML = "No location found! Please try to specify City, Country, Code...";
	else
		{
		document.getElementById("message").innerHTML = weatherCity  + " added!";
		var InitialLocation = document.getElementById("newLocation").value.replace("|", "");
		
		if(localStorage.weatherLocations == "")
		    localStorage.weatherLocations = weatherCity + "#" + weatherCityCode;
		else
		    localStorage.weatherLocations += "|" + weatherCity + "#" + weatherCityCode;
			
		if(localStorage.weatherLocationsInitial == "")
			localStorage.weatherLocationsInitial = InitialLocation;
		else
			localStorage.weatherLocationsInitial += "|" + InitialLocation;

		document.getElementById("newLocation").value = "";
		fillLocations();
		}
	}

function fillLocations()
	{
	var content = "";
	var defaultIsPresent = false;
	var locations = localStorage.weatherLocations.split("|");
	if(locations != "")
		{
		for(var i = 0; i < locations.length; i++)
			{
			content += locations[i] + "&nbsp;&nbsp;&nbsp;<a href=\"javascript:removeLocation(" + i + ")\">remove</a><br />";
			if(localStorage.weatherLocation == locations[i])
				defaultIsPresent = true;
			}
        }

	document.getElementById("weather_locations").innerHTML = content;

	if(!defaultIsPresent)
		{
		localStorage.weatherLocation = locations[0];
		}
	currentPage = "options_updateicon";
	//GetWeather(localStorage.weatherLocation);
	}

function fillValues()
	{
	document.getElementById("showIn" + localStorage.weatherShowIn).checked = true;
	if(localStorage.weatherShowLinks == "1")
		document.getElementById("showExternal").checked = true;

	if(localStorage.weatherLabels == "1")
		document.getElementById("showLabels").checked = true;

	if(localStorage.weatherDate == "1")
		document.getElementById("showDate").checked = true;

	if(localStorage.weatherReadDate == "1")
		document.getElementById("showReadDate").checked = true;

	for(var i=0; i<document.getElementById("updateTimeout").length; i++)
		{
		if(localStorage.weatherTimeout == document.getElementById("updateTimeout")[i].value)
			{
			document.getElementById("updateTimeout")[i].selected = true;
			}
		}
		
	for(var i=0; i<document.getElementById("imgLocation").length; i++)
		{
		if(localStorage.imgLocation == document.getElementById("imgLocation")[i].value)
			{
			document.getElementById("imgLocation")[i].selected = true;
			}
		}	
	
	//document.getElementById("compactMode" + localStorage.compactMode).checked = true;
	}

function removeLocation(index)
	{
	var content = "";
	var contentInitial = "";
	var locations = localStorage.weatherLocations.split("|");
	var locationsInitial = localStorage.weatherLocationsInitial.split("|");
	
	for(var i = 0; i < locations.length; i++)
		{
		if(i != index)
			{
			content += (content != "") ? "|" : "";
			content += locations[i];
			
			contentInitial += (contentInitial != "") ? "|" : "";
			contentInitial += locationsInitial[i];
			}
		}

	localStorage.weatherLocations = content;
	localStorage.weatherLocationsInitial = contentInitial;
	fillLocations();
	}

function addLocation()
	{
	document.getElementById("add_location").style.display = "block";
	}

fillValues();
fillLocations();
