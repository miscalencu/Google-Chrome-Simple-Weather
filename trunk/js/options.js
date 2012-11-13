var currentPage = "options";

// event listeners

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("showInC").addEventListener("click", function () { localStorage.weatherShowIn = "C"; saveData(); });
    document.getElementById("showInF").addEventListener("click", function () { localStorage.weatherShowIn = "F"; saveData(); });

    document.getElementById("updateTimeout").addEventListener("click", function () { localStorage.weatherTimeout = this[this.selectedIndex].value; });
    document.getElementById("imgLocation").addEventListener("change", function () { localStorage.imgLocation = this[this.selectedIndex].value; fillPreviewIcons(); });
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

	if (provider == "GOOGLE") {
	    var icons = new Array(
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
	}

	if (provider == "YAHOO") {
	    var icons = new Array(48);
        for (var i = 0; i <= 47; i++) {
            icons[i] = i + ".gif";
        }
	}

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

	function fillLocations() {
	    var content = "";
	    var defaultIsPresent = false;
	    var locations = localStorage.weatherLocations.split("|");
	    if (locations != "") {
	        for (var i = 0; i < locations.length; i++) {
	            content += locations[i].split("#")[0] + "&nbsp;&nbsp;&nbsp;<a href=\"#\" id=\"removeLocation_" + i + "\">remove</a><br />";
	            if (localStorage.weatherLocation == locations[i])
	                defaultIsPresent = true;
	        }
	    }

	    document.getElementById("weather_locations").innerHTML = content;

	    if (locations != "") {
	        for (var i = 0; i < locations.length; i++) {
	            var ii = i;
	            document.getElementById("removeLocation_" + i).addEventListener("click", function () { removeLocation("loc_" + ii); });
	        }
	    }

	    if (!defaultIsPresent) {
	        localStorage.weatherLocation = locations[0];
	    }

	    currentPage = "options_updateicon";
	    //GetWeather(localStorage.weatherLocation);
	}

function fillSkins() {
    var ddl = document.getElementById("imgLocation");
    if (provider == "YAHOO") {
        ddl.options[0] = new Option("Default (from Yahoo)", "images/weather_icons/YAHOO/Yahoo/");
        ddl.options[1] = new Option("Simple", "images/weather_icons/YAHOO/Simple/");
        ddl.options[2] = new Option("Nice", "images/weather_icons/YAHOO/Nice/");
    }

    if (provider == "GOOGLE") {
        ddl.options[0] = new Option("Default (from Google)", "images/weather_icons/GOOGLE/Google/");
        ddl.options[1] = new Option("HTC (Black)", "images/weather_icons/GOOGLE/HTC/");
        ddl.options[2] = new Option("Dotvoid", "images/weather_icons/GOOGLE/Dotvoid/");
        ddl.options[3] = new Option("KWeather", "images/weather_icons/GOOGLE/KWeather/");
        ddl.options[4] = new Option("New York Times", "images/weather_icons/GOOGLE/NYTimes/");
    }

    for (var i = 0; i < document.getElementById("imgLocation").length; i++) {
        if (localStorage.imgLocation == document.getElementById("imgLocation")[i].value) {
            document.getElementById("imgLocation")[i].selected = true;
        }
    }
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
		
	//document.getElementById("compactMode" + localStorage.compactMode).checked = true;

    var poweredby = document.getElementById("poweredby");
    if (provider == "GOOGLE")
        poweredby.innerHTML = "<a href=\"http://code.google.com/\" target=\"_blank\"><img align=\"middle\" border=\"0\" src=\"images/code_logo.png\" alt=\"Google APIs\" title=\"Google APIs\" /></a>";

    if (provider == "YAHOO")
        poweredby.innerHTML = "<a href=\"http://developer.yahoo.com/weather/\" target=\"_blank\"><img align=\"middle\" border=\"0\" src=\"images/yahoo_logo.png\" alt=\"Yahoo Weather API\" title=\"Yahoo Weather API\" /></a>";

	}

function removeLocation(index) {
    index = index.replace("loc_", "");

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
fillSkins();
fillLocations();
