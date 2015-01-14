$(document).ready(function() {
	$("#showInC").on("click", function () {
		setSettings("weatherShowIn", "C");
		refreshBadge(true);
	});

	$("#showInF").on("click", function () {
		setSettings("weatherShowIn", "F");
		refreshBadge(true);
	});

	$("#updateTimeout").on("change", function () {
		setSettings("weatherTimeout", $(this).val());
		chrome.extension.sendMessage({ message: "updateTimeout" }, function () { console.log("'updateTimeout' sent ..."); });
	});
	$("#imgLocation").on("change", function () {
		setSettings("imgLocation", $(this).val());
		fillPreviewIcons();
		refreshBadge(false);
	});

	$("#showLabels").on("click", function () {
		setSettings("weatherLabels", ($(this).is(":checked") ? '1' : '0'));
		refreshBadge(false);
	});

	$("#showExternal").on("click", function () { setSettings("weatherShowLinks"($(this).is(":checked") ? '1' : '0')); });

	$("#showDate").on("click", function () {
		setSettings("weatherDate", ($(this).is(":checked") ? '1' : '0')); saveData();
		refreshBadge(false);
	});
	$("#showReadDate").on("click", function () {
		setSettings("weatherReadDate", ($(this).is(":checked") ? '1' : '0'));
		refreshBadge(false);
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
	refreshBadge(false);
})

function checkNewLocation() {

	$("message").html("");
	
	var woeid = "", name = "";
	var query = escape("select * from geo.places where text=\"" + $("#newLocation").val() + "\"")
	var strUrl = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml"

	var result = jQuery.ajax({
		type: "GET",
		url: strUrl,
		success: function (xmlDoc) {
			if (xmlDoc != null) {
				var nodes = xmlDoc.getElementsByTagName("place");
				if (nodes.length > 0) {
					woeid = nodes[0].getElementsByTagName("woeid")[0].textContent;
					name = nodes[0].getElementsByTagName("name")[0].textContent;
				}
			}

			if (woeid != "") {
				var locations = JSON.parse(getSettings("weatherLocations"));
				var location = { name: name, woeid: woeid };
				locations.push(location);
				setSettings("weatherLocations", JSON.stringify(locations));
				setSettings("weatherLocation", JSON.stringify(location));
				
				$("message").html(name + " added!");
				$("#newLocation").val("");
				fillLocations();
				GetWeather();
			}
			else {
				document.getElementById("message").innerHTML = "No location found! Please try to specify City, Country, Code...";
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			alert("Error: " + thrownError);
		}
	});
}

function fillLocations() {
	var content = "";
	var defaultIsPresent = false;
	var locations = JSON.parse(getSettings("weatherLocations"));
	var location = JSON.parse(getSettings("weatherLocation"));
	for (var i = 0; i < locations.length; i++) {
	    content += locations[i].name + "&nbsp;&nbsp;&nbsp;<a href=\"#\" id=\"removeLocation_" + i + "\">remove</a><br />";
	    if (location.woeid === locations[i].woeid)
	        defaultIsPresent = true;
	}
	
	$("#weather_locations").html(content);

	if (locations.length > 0) {
	    for (var i = 0; i < locations.length; i++) {
	        var ii = i;
	        $("#removeLocation_" + i).on("click", function () { removeLocation("loc_" + ii); });
	    }
	}

	if (!defaultIsPresent) {
	    setSettings("weatherLocation", JSON.stringify(locations[0]));
	}
}

function removeLocation(index) {
	index = index.replace("loc_", "");

	var content = "";
	var contentInitial = "";
	var locations = JSON.parse(getSettings("weatherLocations"));

	locations.splice(index, 1);
	setSettings("weatherLocations", JSON.stringify(locations));

	fillLocations();
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

function addLocation()
	{
	document.getElementById("add_location").style.display = "table-row";
	}

fillValues();
fillSkins();
fillLocations();
