var isExtension = (typeof chrome.browserAction !== "undefined");
var currentPage = "unknown";
var debugEnabled = !('update_url' in chrome.runtime.getManifest());

if (!debugEnabled) {
    console.log = function () { };
}

function getSettings(name) {
	var default_val = "";
	var val = localStorage[name];
	
	switch (name) {
		case "weatherLocations":
			default_val = "[]";
			break;
		case "weatherLocation":
		    default_val = null;
		    break;
		case "weatherShowLinks":
			default_val = "1";
			break;
	    case "weatherShowIn":
	        default_val = "C";
	        break;
	    case "measurementSystem":
	        default_val = (getSettings("weatherShowIn") == "C") ? "Metric" : "Imperial";
	        break;
		case "weatherTimeout":
			{
				default_val = "60";
				if (val && parseInt(val) < 60) {
					val = "60";
				}
			}
			break;
		case "weatherLabels":
		case "weatherDate":
		case "weatherReadDate":
			default_val = "1";
			break;
	    case "useFlickrImages":
	        default_val = "1";
			break;
		case "TopSites":
			default_val = "[]";
			break;
		default:
			break;
	}

	if (name.indexOf("w_") == 0) {
		default_val = null;
	}

	if (!localStorage[name]) {
		val = default_val;
	}

	return val;
}

function setSettings(name, value) {
	localStorage[name] = value;
}

// this should be triggered only by the background page
function GetWeather(tries) {
	if (tries == undefined)
		tries = 1;

	var location = JSON.parse(getSettings("weatherLocation"));
	if (location != null) {
		var query = escape("select * from weather.forecast where woeid in (" + location.woeid + ") and u=\"F\"");
		var url = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml";
		console.log("getting weather from: " + url);

		$.ajax({
			type: "POST",
			dataType: "xml",
			url: url,
			success: function (result) {
			    if ($(result).find("query").attr("yahoo:count") != "0") { // if data received
			        console.log("complete fired ...");
			        // save weather object
					var weatherObj = getWeatherObject(result);
					setSettings("w_" + location.woeid, JSON.stringify(weatherObj));

			        // cache backgroud image
					GetWeatherBackground(location.woeid, weatherObj.Lat, weatherObj.Long,
                        function (result) {
                            if (result.success) {
                                setSettings("image_" + location.woeid, result.url);
								setSettings("imageurl_" + location.woeid, result.imageurl);
								setSettings("imagetitle_" + location.woeid, result.title);
                                preloadImage(result.url, function () { });
                            }
                        },
                        function () {
                            setSettings("image_" + location.woeid, "NA");
							setSettings("imageurl_" + location.woeid, "");
							setSettings("imagetitle_" + location.woeid, "");
                        });

                    // reset image and image URL
					setSettings("image_" + location.woeid, "");
					setSettings("imageurl_" + location.woeid, "");
					setSettings("imagetitle_" + location.woeid, "");

					$.event.trigger({
						type: "weather_complete",
						message: "complete fired.",
						time: new Date()
					});
				} else {
					console.error("Error with try " + tries);
					if (tries < 10) {
						GetWeather(++tries);
					}
					else {
						$.event.trigger({
							type: "weather_error",
							message: "error fired.",
							time: new Date()
						});
					}
				}
			},
			error: function (jqXHR, textStatus) {
				console.error("Error with try " + tries);
				if (tries < 10) {
					GetWeather(++tries);
				}
				//else {
				//	$.event.trigger({
				//		type: "weather_error",
				//		message: "error fired.",
				//		time: new Date()
				//	});
				//}
			}
		});
	}
	else {
		console.log("no location found fired ...");
		//$.event.trigger({
		//	type: "weather_nolocation",
		//	message: "no location fired.",
		//	time: new Date()
		//});
	}
}

function isValidWeatherObject(weatherObj) {
	if (weatherObj == null) {
		return false;
	}

	if (weatherObj.RefreshDate != null) {
		var diff = DateDiff(new Date(), new Date(weatherObj.RefreshDate)); // difference in seconds
		var timeout = getSettings("weatherTimeout"); // timeout in minutes
		if (diff / 60 > timeout) {
			return false;
		}
	}

	return true;
}

function findIfIsDay(weatherObj) {
	try
	{
		var sunrise = weatherObj.AstronomySunrise.replace(" ", ":").split(":");
		var sunset = weatherObj.AstronomySunset.replace(" ", ":").split(":");

		sunrise[0] = parseInt(sunrise[0]);
		sunrise[1] = parseInt(sunrise[1]);

		sunset[0] = parseInt(sunset[0]);
		sunset[1] = parseInt(sunset[1]);
		
		if(sunrise[2].toLowerCase() == "pm")
			sunrise[1] += 12;

		if (sunset[2].toLowerCase() == "pm")
			sunset[0] += 12;

		var span1 = sunrise[0] * 60 + sunrise[1];
		var span2 = sunset[0] * 60 + sunset[1];

		var currenttime = weatherObj.Date.match(/[0-1]?[0-9]:[0-5]?[0-9] [APap][mM]/).replace(" ", ":").split(":");
		currenttime[0] = parseInt(currenttime[0]);
		currenttime[1] = parseInt(currenttime[1]);
		if (currenttime[2].toLowerCase() == "pm")
			currenttime[0] += 12;

		var span = currenttime[0] * 60 + currenttime[1];

		if ((span1 <= span) && (span <= span2))
			return 1;
		else
			return 0;
	}
	catch(ex) // cannot convert
	{
		return -1;
	}
}

// store in farenheight always
function getWeatherObject(docXML) {

	var weatherObj = new Object();
	weatherObj = new Object();
    weatherObj.LocationCity = $(docXML).find("channel>yweather\\:location").attr("city");
    weatherObj.LocationCountry = $(docXML).find("channel>yweather\\:location").attr("country");
    weatherObj.LocationRegion = $(docXML).find("channel>yweather\\:location").attr("region");

	weatherObj.Lat = parseFloat($(docXML).find("item>geo\\:lat").text());
    weatherObj.Long = parseFloat($(docXML).find("item>geo\\:long").text());

    weatherObj.UnitDistance = $(docXML).find("channel>yweather\\:units").attr("distance");
    weatherObj.UnitPressure = $(docXML).find("channel>yweather\\:units").attr("pressure");
    weatherObj.UnitSpeed = $(docXML).find("channel>yweather\\:units").attr("speed");
    weatherObj.UnitTemperature = $(docXML).find("channel>yweather\\:units").attr("temperature");

    weatherObj.WindChill = $(docXML).find("channel>yweather\\:wind").attr("chill");
    weatherObj.WindDirection = $(docXML).find("channel>yweather\\:wind").attr("direction");
    weatherObj.WindSpeed = $(docXML).find("channel>yweather\\:wind").attr("speed");

    weatherObj.AtmosphereHumidity = $(docXML).find("channel>yweather\\:atmosphere").attr("humidity");
    weatherObj.AtmospherePressure = $(docXML).find("channel>yweather\\:atmosphere").attr("pressure");
    weatherObj.AtmosphereRising = $(docXML).find("channel>yweather\\:atmosphere").attr("rising");
    weatherObj.AtmosphereVisibility = $(docXML).find("channel>yweather\\:atmosphere").attr("visibility");

    weatherObj.AstronomySunrise = $(docXML).find("channel>yweather\\:astronomy").attr("sunrise");
    weatherObj.AstronomySunset = $(docXML).find("channel>yweather\\:astronomy").attr("sunset");

	weatherObj.PubDate = $(docXML).find("item>pubDate").text();
    weatherObj.Date = $(docXML).find("yweather\\:condition").attr("date");
	weatherObj.Description = $(docXML).find("item>description").text();
    weatherObj.Temp = $(docXML).find("yweather\\:condition").attr("temp");
    weatherObj.ConditionCode = $(docXML).find("yweather\\:condition").attr("code");
    weatherObj.Condition = $(docXML).find("yweather\\:condition").attr("text");

	weatherObj.WeatherLink = "http://www.weather.com/weather/today/l/" + $(docXML).find("link").text().split("/").pop().replace(".html", "");
	weatherObj.YahooLink = $(docXML).find("link").text().split("*").pop();
	
	weatherObj.RefreshDate = Date();

    var d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var ds = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// forecast
    weatherObj.Forecast = new Array();
    $.each($(docXML).find("yweather\\:forecast"), function () {
    	weatherObj.Forecast.push({
    		Code: $(this).attr("code"),
    		Date: $(this).attr("date"),
    		Condition: $(this).attr("text"),
    		Day: d[arrindex(ds, $(this).attr("day"))],
    		High: $(this).attr("high"),
    		Low: $(this).attr("low"),
    	});
    });
	
	setSettings("weatherRefreshDate", Date());
	
	return weatherObj;
}

function refreshBadge(showAnimation) {

	if(showAnimation == undefined) {
		showAnimation = false;
	}

	chrome.extension.sendMessage({ message: "update_badge", showAnimation: showAnimation }, function () { console.log("'update_badge' sent ..."); });
}

/// returns data: { success, url, imageurl }
function GetWeatherBackground(woeid, lat, lon, callback_success, callback_error) {

    var min_taken_date = new Date();
    min_taken_date.setDate(min_taken_date.getDate() - 30);
    var mm = min_taken_date.getMonth() + 1; // getMonth() is zero-based
    var dd = min_taken_date.getDate();

	var llrad = .5;
	var min_lon = lon - llrad; if (min_lon < -180) { min_lon = -min_lon + 180; }
	var max_lon = lon + llrad; if (max_lon > 180) { max_lon = -max_lon + 180; }
	var min_lat = lat - llrad; if (min_lat < -90) { min_lat = -min_lat - 90; }
	var max_lat = lat + llrad; if (max_lat > 90) { max_lat = 180 - max_lat; }

	var bbox = min_lon + "," + min_lat + "," + max_lon + "," + max_lat;

    var f_url = "https://api.flickr.com/services/rest";
	var f_data = "" +
		"api_key=d68a0a0edeac7e677f29e8243d778d66" +
		"&method=flickr.photos.search" +
		//"&woe_id=" + woeid +
		"&lat=" + lat + "&lon=" + lon + "&radius=32" +
		//"&bbox=" + bbox +
        //"&tags=landscape,nature,view,night,weather" +
		"&tag_mode=all&tags=-portrait,-people,-face,-fun,-instagramapp,-live,-painting" +
		"&safe_search=1" +
		"&extras=url_l,tags" +
        "&min_taken_date=" + [min_taken_date.getFullYear(), ((mm < 10) ? "0" : "") + mm, dd].join('-') +
        "&media=photos";

    console.log("get images from: " + f_url + "?" + f_data + "...");

    // get from flickr
	$.ajax({
		type: "POST",
        url: f_url,
        data: f_data,
        success: function (result) {
            var photos = $(result).find("photo");
			if (photos.length > 0) {
				var random = Math.floor(Math.random() * photos.length);
                var photo = $(photos).eq(random);
				var photo_url = $(photo).attr("url_l");
				var owner = $(photo).attr("owner");
				var photoid = $(photo).attr("id");
				var title = $(photo).attr("title");
				var url = "https://www.flickr.com/photos/" + owner + "/" + photoid + "/";

				if (photo_url != "") {
					if (callback_success != undefined) {
						callback_success({ success: true, url: photo_url, imageurl: url, title: title });
					}
				} else {
					if (callback_success != undefined) {
						callback_success({ success: false, url: "", imageurl: "", title: "" });
					}
				}
            }
            else {
                if (callback_success != undefined) {
                    callback_success({ success: false, url: "", imageurl: "", title: "" });
                }
            }
        },
        error: function (jqXHR, textStatus) {
            if (callback_error != undefined) {
                callback_error({ success: false, url: "", imageurl: "", title: "" });
            }
        }
    });
}

function getWeatherCondition(condition) {
    var lang = chrome.i18n.getUILanguage();
    if (lang.indexOf("en-") == 0) {
        return condition;
    }
    else {
        var condition_label = "condition_" + condition.toLowerCase().replace(/ /g, "_").replace("(", "").replace(")", "");
        return chrome.i18n.getMessage(condition_label);
    }
}

function getWeatherDay(day) {
    var lang = chrome.i18n.getUILanguage();
    if (lang.indexOf("en-") == 0) {
        return day;
    }
    else {
        var day_label = "dayofweek_" + day.toLowerCase();
        return chrome.i18n.getMessage(day_label);
    }
}

function preloadImage(source, callback) {
    var preloaderDiv = $('<div style="display: none;"></div>').prependTo(document.body);
    var image = $("<img/>").attr("src", source).appendTo(preloaderDiv);

    $(image).on("load", function () {
        $(preloaderDiv).remove();
        if (callback)
            callback();
    });
}
	
function getLabel(str, def) {
    if (def == undefined)
        def = "";
	return (getSettings("weatherLabels") == "1") ? str : def;
}

function DateDiff(date1, date2) {
    var datediff = date1.getTime() - date2.getTime(); //store the getTime diff - or +
    return (datediff / 1000); //Convert values to -/+ seconds and return value      
}

function OpenWindow(url) {
	if(url === "options") {
		chrome.tabs.create({url: chrome.extension.getURL('options.html')});
		return;
	}
	
	chrome.tabs.create({url: url});
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
        }
    }
    return -1;
}

function getIcon(code, isDay, day) {

	if (day === undefined)
		day = "";

	var daypart = (isDay == 1) ? "-day" : ((isDay == 0) ? "-night" : "");
	var icon = "";
	var title = "";

	switch (parseInt(code)) {
		case 0:
			icon = "<i class=\"wi wi-tornado\"></i>"; // 'tornado'
			title = "Tornado";
			break;
		case 1:
		    icon = "<i class=\"wi wi" + daypart + "-rain\"></i>"; // 'tropical storm'
			title = "Tropical Storm";
			break;
		case 2:
		    icon = "<i class=\"wi wi-hurricane\"></i>"; // 'hurricane'
		    title = "Hurricane";
			break;
		case 3:
		    icon = "<i class=\"wi wi" + daypart + "-thunderstorm\"></i>"; // 'severe thunderstorms'
		    title = "Severe Thunderstorms";
			break;
		case 4:
		    icon = "<i class=\"wi wi" + daypart + "-storm-showers\"></i>"; // 'thunderstorms
		    title = "Thunderstorms";
			break;
		case 5:
			icon = "<i class=\"wi wi" + daypart + "-rain-mix\"></i>"; // 'mixed rain and snow'
		    title = "Mixed rain and snow";
			break;
		case 6:
			icon = "<i class=\"wi wi" + daypart + "-sleet\"></i>"; // 'mixed rain and sleet'
			title = "Mixed rain and sleet";
			break;
		case 7:
			icon = "<i class=\"wi wi" + daypart + "-sleet\"></i>"; // 'mixed snow and sleet'
			title = "Mixed snow and sleet";
			break;
		case 8:
			icon = "<i class=\"wi wi-snowflake-cold\"></i>"; // 'freezing drizzle'
			title = "Freezing drizzle";
			break;
		case 9:
			icon = "<i class=\"wi wi-sprinkles\"></i>"; // 'drizzle'
			title = "Drizzle";
			break;
		case 10:
			icon = "<i class=\"wi wi" + daypart + "-hail\"></i>"; // 'freezing rain'
			title = "Freezing rain";
			break;
		case 11:
			icon = "<i class=\"wi wi" + daypart + "-showers\"></i>"; // 'showers'
			title = "Showers";
			break;
		case 12:
			icon = "<i class=\"wi wi" + daypart + "-sprinkle\"></i>"; // 'showers'
			title = "Showers";
			break;
		case 13:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'snow flurries'
			title = "Snow flurries";
			break;
		case 14:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'light snow showers'
			title = "Light snow showers";
			break;
		case 15:
			icon = "<i class=\"wi wi" + daypart + "-snow-wind\"></i>"; // 'blowing snow'
			title = "Blowing snow";
			break;
		case 16:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'snow'
			title = "Snow";
			break;
		case 17:
			icon = "<i class=\"wi wi" + daypart + "-hail\"></i>"; // 'hail'
			title = "Hail";
			break;
		case 18:
			icon = "<i class=\"wi wi" + daypart + "-sleet\"></i>"; // 'sleet'
			title = "Sleet";
			break;
		case 19:
			icon = "<i class=\"wi wi-dust\"></i>"; // 'dust'
			title = "Dust";
			break;
		case 20:
			icon = "<i class=\"wi wi" + daypart + "-fog\"></i>"; // 'foggy'
			title = "Foggy";
			break;
		case 21:
			icon = "<i class=\"wi wi-day-haze\"></i>"; // 'haze'
			title = "Haze";
			break;
		case 22:
			icon = "<i class=\"wi wi-smoke\"></i>"; // 'smoky'
			title = "Smoky";
			break;
		case 23:
			icon = "<i class=\"wi wi-strong-wind\"></i>"; // 'blustery'
			title = "Blustery";
			break;
		case 24:
			icon = "<i class=\"wi wi-windy\"></i>"; // 'windy'
			title = "Windy";
			break;
		case 25:
			icon = "<i class=\"wi wi-snowflake-cold\"></i>"; // 'cold'
			title = "Cold";
			break;
		case 26:
			icon = "<i class=\"wi wi" + daypart + "-cloudy\"></i>"; // 'cloudy'
			title = "Cloudy";
			break;
		case 27:
			icon = "<i class=\"wi wi-night-cloudy-windy\"></i>"; // 'mostly cloudy (night)'
			title = "Mostly cloudy (night)";
			break;
		case 28:
			icon = "<i class=\"wi wi-day-cloudy-windy\"></i>"; // 'mostly cloudy (day)'
			title = "Mostly cloudy (day)";
			break;
		case 29:
			icon = "<i class=\"wi wi-night-partly-cloudy\"></i>"; // 'partly cloudy (night)'
			title = "Partly cloudy (night)";
			break;
		case 30:
			icon = "<i class=\"wi wi-day-cloudy\"></i>"; // 'partly cloudy (day)'
			title = "Partly cloudy (day)";
			break;
		case 31:
			icon = "<i class=\"wi wi-stars\"></i>"; // 'clear (night)'
			title = "Clear (night)";
			break;
		case 32:
			icon = "<i class=\"wi wi-day-sunny\"></i>"; // 'sunny'
			title = "Sunny";
			break;
		case 33:
			icon = "<i class=\"wi wi-night-clear\"></i>"; // 'fair (night)'
			title = "Fair (night)";
			break;
		case 34:
			icon = "<i class=\"wi wi-day-sunny-overcast\"></i>"; // 'fair (day)'
			title = "Fair (day)";
			break;
		case 35:
			icon = "<i class=\"wi wi" + daypart + "-hail\"></i>"; // 'mixed rain and hail'
			title = "Mixed rain and hail";
			break;
		case 36:
			icon = "<i class=\"wi wi-hot\"></i>"; // 'hot'
			title = "Hot";
			break;
		case 37:
			icon = "<i class=\"wi wi" + daypart + "-thunderstorm\"></i>"; // 'isolated thunderstorms'
			title = "Isolated thunderstorms";
			break;
		case 38:
			icon = "<i class=\"wi wi-lightning\"></i>";// 'scattered thunderstorms'
			title = "Scattered thunderstorms";
			break;
		case 39:
			icon = "<i class=\"wi wi-lightning\"></i>"; // 'scattered thunderstorms'
			title = "Scattered thunderstorms";
			break;
		case 40:
			icon = "<i class=\"wi wi" + daypart + "-storm-showers\"></i>"; // 'scattered showers'
			title = "Scattered showers";
			break;
		case 41:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'heavy snow'
			title = "Heavy snow";
			break;
		case 42:
		    icon = "<i class=\"wi wi" + daypart + "-snow-thunderstorm\"></i>"; // 'scattered snow showers
		    if (daypart == "")
		        icon = "<i class=\"wi wi-snow\"></i>";
			title = "Scattered snow showers";
			break;
		case 43:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'heavy snow'
			title = "Heavy snow";
			break;
		case 44:
			icon = "<i class=\"wi wi" + daypart + "-cloudy\"></i>"; // 'partly cloudy'
			title = "Partly cloudy";
			break;
		case 45:
			icon = "<i class=\"wi wi" + daypart + "-thunderstorm\"></i>"; // 'thundershowers'
			title = "Thundershowers";
			break;
		case 46:
			icon = "<i class=\"wi wi" + daypart + "-snow\"></i>"; // 'snow showers'
			title = "Snow showers";
			break;
		case 47:
			icon = "<i class=\"wi wi" + daypart + "-storm-showers\"></i>"; // 'isolated thundershowers'
			title = "Isolated thundershowers";
			break;
		case 48:
		case 3200:
			icon = "<i class=\"wi wi-thermometer-exterior\"></i>"; // 'not available'
			title = "Not available";
			break;
		default:
			break;
	}

	title = getWeatherCondition(title);
	if (day != "") {
		title = getWeatherDay(day) + ": " + title;
	}

	if (icon != "") {
		icon = icon.replace("<i ", "<i title=\"" + title + "\" ");
	}

	return icon;
}

function FarenheightToCelsius(degrees) {
	return Math.round((degrees - 32) / 1.8);
}

function fillInTemperature(degrees) {
	var showin = getSettings("weatherShowIn").toLowerCase();
	if (showin.toUpperCase() === "C") {
		degrees = FarenheightToCelsius(degrees);
	}
	return degrees;
}

function fillPressure(pressure, unitPressure) {
    pressure = parseFloat(pressure);

    if (unitPressure == "in" && pressure > 500) { // fix Yahoo bug
        pressure =  Math.round(pressure / 33.8637526 * 100) / 100;
    }

    var system = getSettings("measurementSystem");
    if (system == "Metric" && unitPressure == "in") {
        pressure = Math.round(pressure * 33.8637526 * 100) / 100;
        unitPressure = "mb";
    }
    return pressure + " " + unitPressure;
}

function fillVisibility(distance, unitDistance) {
    distance = parseFloat(distance);
    var system = getSettings("measurementSystem");
    if (system == "Metric" && unitDistance == "mi") {
        distance = Math.round(distance * 1.60934 * 100) / 100;
        unitDistance = "km";
    }
    return distance + " " + unitDistance;
}

function fillWindSpeed(speed, unitSpeed) {
    speed = parseFloat(speed);
    var system = getSettings("measurementSystem");
    if (system == "Metric" && unitSpeed == "mph") {
        speed = Math.round(speed * 1.60934 * 100) / 100;
        unitSpeed = "kmh";
    }
    return speed + " " + unitSpeed;
}

function localizeHtmlPage() {
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++) {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if (valNewH != valStrH) {
            obj.innerHTML = valNewH;
        }
    }
}