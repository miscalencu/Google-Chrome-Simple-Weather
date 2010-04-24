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
			localStorage.weatherLocations = weatherCity;
		else
			localStorage.weatherLocations += "|" + weatherCity;
			
		if(localStorage.weatherLocationsInitial == "")
			localStorage.weatherLocationsInitial = InitialLocation;
		else
			localStorage.weatherLocationsInitial += "|" + InitialLocation ;

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
	content += "<a href=\"javascript:addLocation()\">add new location</a><br />";
	document.getElementById("weather_locations").innerHTML = content;

	if(!defaultIsPresent)
		{
		localStorage.weatherLocation = locations[0];
		}
	currentPage = "options_updateicon";
	GetWeather(localStorage.weatherLocation);
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
