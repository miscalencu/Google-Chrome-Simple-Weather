var currentPage = "options";

// event listeners

$(document).ready(function() {
	$("#showInC").on("click", function () {
		setSettings("weatherShowIn", "C");
		var location = getSettings("weatherLocation");
		GetWeather();
	});

	$("#showInF").on("click", function () {
		setSettings("weatherShowIn", "F");
		GetWeather();
	});

	$("#updateTimeout").on("change", function () {
		setSettings("weatherTimeout", $(this).val());
		chrome.extension.sendMessage({ message: "updateTimeout" }, function () { console.log("'updateTimeout' sent ..."); });
	});
	$("#imgLocation").on("change", function () {
		setSettings("imgLocation", $(this).val());
		fillPreviewIcons();
		refreshBadge();
	});

	$("#showLabels").on("click", function () {
		setSettings("weatherLabels", ($(this).is(":checked") ? '1' : '0'));
		refreshBadge();
	});

	$("#showExternal").on("click", function () { setSettings("weatherShowLinks"($(this).is(":checked") ? '1' : '0')); });

	$("#showDate").on("click", function () {
		setSettings("weatherDate", ($(this).is(":checked") ? '1' : '0')); saveData();
		refreshBadge();
	});
	$("#showReadDate").on("click", function () {
		setSettings("weatherReadDate", ($(this).is(":checked") ? '1' : '0'));
		refreshBadge();
	});

	$("#btnAdd").on("click", function () { checkNewLocation() } );
	$("#addLocationLink").on("click", function () { addLocation(); });

	fillPreviewIcons();
});

function fillPreviewIcons() {
	var icons = new Array(48);
	var foldericons = getSettings("imgLocation");
	var content = "";

	for (var i = 0; i <= 47; i++) {
		icons[i] = i + ".gif";
	}

	for (var i = 0; i < icons.length; i++) {
		content += "<img src=\"" + foldericons + icons[i] + "\" />";
	}

	$("#preview_icons").html(content);
}

$(document).on("weather_complete", function () {
	console.log("complete received ...");
	updateBadge();
})

function checkNewLocation()	{
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

	    //GetWeather(localStorage.weatherLocation);
	}

function fillSkins() {
    var ddl = document.getElementById("imgLocation");
    ddl.options[0] = new Option("Default (from Yahoo)", "images/weather_icons/YAHOO/Yahoo/");
    ddl.options[1] = new Option("Simple", "images/weather_icons/YAHOO/Simple/");
    ddl.options[2] = new Option("Nice", "images/weather_icons/YAHOO/Nice/");
    
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
		
    var poweredby = document.getElementById("poweredby");
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
	document.getElementById("add_location").style.display = "table-row";
	}

fillValues();
fillSkins();
fillLocations();
