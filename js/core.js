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
function GetWeather() {
	var location = JSON.parse(getSettings("weatherLocation"));
	if (location != null) {
		var query = escape("select * from weather.forecast where woeid in (" + location.woeid + ") and u=\"F\"");
		var url = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml";
		console.log("getting weather from: " + url);

		$.ajax({
			type: "GET",
			dataType: "xml",
			url: url,
			success: function (result) {
				if ($(result).find("query").attr("yahoo:count") != "0") { // if data received
					console.log("complete fired ...");
					// save weather object
					setSettings("w_" + location.woeid, JSON.stringify(getWeatherObject(result)));

                    // reset image and image URL
					setSettings("image_" + location.woeid, "");
					setSettings("imageurl_" + location.woeid, "");

					$.event.trigger({
						type: "weather_complete",
						message: "complete fired.",
						time: new Date()
					});
				} else {
					$.event.trigger({
						type: "weather_error",
						message: "error fired.",
						time: new Date()
					});
				}
			},
			error: function (jqXHR, textStatus) {
				$.event.trigger({
					type: "weather_error",
					message: "error fired.",
					time: new Date()
				});
			}
		});
	}
	else {
		console.log("no location fired ...");
		$.event.trigger({
			type: "weather_nolocation",
			message: "no location fired.",
			time: new Date()
		});
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
	weatherObj.LocationCity = $(docXML).find("channel>location").attr("city");
	weatherObj.LocationCountry = $(docXML).find("channel>location").attr("country");
	weatherObj.LocationRegion = $(docXML).find("channel>location").attr("region");

	weatherObj.UnitDistance = $(docXML).find("channel>units").attr("distance");
	weatherObj.UnitPressure = $(docXML).find("channel>units").attr("pressure");
	weatherObj.UnitSpeed = $(docXML).find("channel>units").attr("speed");
	weatherObj.UnitTemperature = $(docXML).find("channel>units").attr("temperature");

	weatherObj.WindChill = $(docXML).find("channel>wind").attr("chill");
	weatherObj.WindDirection = $(docXML).find("channel>wind").attr("direction");
	weatherObj.WindSpeed = $(docXML).find("channel>wind").attr("speed");

	weatherObj.AtmosphereHumidity = $(docXML).find("channel>atmosphere").attr("humidity");
	weatherObj.AtmospherePressure = $(docXML).find("channel>atmosphere").attr("pressure");
	weatherObj.AtmosphereRising = $(docXML).find("channel>atmosphere").attr("rising");
	weatherObj.AtmosphereVisibility = $(docXML).find("channel>atmosphere").attr("visibility");

	weatherObj.AstronomySunrise = $(docXML).find("channel>astronomy").attr("sunrise");
	weatherObj.AstronomySunset = $(docXML).find("channel>astronomy").attr("sunset");

	weatherObj.PubDate = $(docXML).find("item>pubDate").text();
	weatherObj.Date = $(docXML).find("condition").attr("date");
	weatherObj.Description = $(docXML).find("item>description").text();
	weatherObj.Temp = $(docXML).find("condition").attr("temp");
	weatherObj.ConditionCode = $(docXML).find("condition").attr("code");
	weatherObj.Condition = $(docXML).find("condition").attr("text");

	weatherObj.WeatherLink = "http://www.weather.com/weather/today/l/" + $(docXML).find("link").text().split("/").pop().replace(".html", "");
	weatherObj.YahooLink = $(docXML).find("link").text().split("*").pop();
	
	weatherObj.RefreshDate = Date();

    var d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var ds = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// forecast
    weatherObj.Forecast = new Array();
    $.each($(docXML).find("forecast"), function () {
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

function ShowWeatherBackground(weatherObj, woeid, isDay) {
    var url = StaticWeatherBackgroundImage(weatherObj);
    var useFlickrImages = getSettings("useFlickrImages");

    if (useFlickrImages == "1") {
        var stored_image = getSettings("image_" + woeid);
        if (stored_image != "") { // no refresh since last storing of image
            if (stored_image == "NA") { // not available
                stored_image = url; // use static image
            }

            SetWeatherBackGroud(stored_image, woeid);
            var stored_url = getSettings("imageurl_" + woeid);
            if (stored_url != "") {
                $(".preload_image").html("<a href='" + stored_url + "' target='_blank'>" + chrome.i18n.getMessage("popup_text_viewimage") + " ...</a>");
            }
            return;
        }
        else {
            $(".preload_image").html("<i class=\"wi loading_small wi-time-12 fa-spin\" />" + chrome.i18n.getMessage("popup_text_loadingimage") + " ...");

            var min_taken_date = new Date();
            min_taken_date.setDate(min_taken_date.getDate() - 30);
            var mm = min_taken_date.getMonth() + 1; // getMonth() is zero-based
            var dd = min_taken_date.getDate();

            var f_url = "https://api.flickr.com/services/rest";
            var f_data = "" +
                "api_key=d68a0a0edeac7e677f29e8243d778d66" +
                "&method=flickr.photos.search" +
                "&woe_id=" + woeid +
                "&text=landscape" +
                "&safe_search=1" +
                "&accuracy=11" +
                "&min_taken_date=" + [min_taken_date.getFullYear(), ((mm < 10) ? "0" : "") + mm, dd].join('-') +
                "&media=photos"; // +
                //"&tags=" + (isDay ? "day" : "night");

            console.log("get images from: " + f_url + "?" + f_data + "...");

            // get from flickr
            $.ajax({
                url: f_url,
                data: f_data,
                success: function (result) {
                    var photos = $(result).find("photo");
                    if (photos.length > 0) {
                        var random = Math.floor(Math.random() * photos.length);
                        var photo = $(photos).eq(random);
                        var photo_id = $(photo).attr("id");
                        var photo_owner = $(photo).attr("owner");

                        var image_url = "https://www.flickr.com/photos/" + photo_owner + "/" + photo_id + "/";
                        setSettings("imageurl_" + woeid, image_url);
                        
                        var f_data = "" +
                            "api_key=d68a0a0edeac7e677f29e8243d778d66" +
                            "&method=flickr.photos.getSizes" +
                            "&photo_id=" + photo_id;

                        console.log("get image from: " + f_url + "?" + f_data + "...");

                        $.ajax({
                            url: f_url,
                            data: f_data,
                            success: function (result) {
                                var image = $(result).find("[label='Medium 640']");
                                if (image.length > 0) {
                                    url = $(image).attr("source");
                                    SetWeatherBackGroud(url, woeid);
                                    setSettings("image_" + woeid, url);
                                }
                                else {
                                    SetWeatherBackGroud(url, woeid);
                                    $(".preload_image").html("");
                                }
                            },
                            error: function (jqXHR, textStatus) {
                                // an error occured - show default image
                                SetWeatherBackGroud(url, woeid);
                                $(".preload_image").html("");
                            }
                        });
                    }
                    else {
                        SetWeatherBackGroud(url, woeid);
                        setSettings("image_" + woeid, "NA"); // not available
                        $(".preload_image").html("");
                    }
                },
                error: function (jqXHR, textStatus) {
                    // an error occured - show default image
                    SetWeatherBackGroud(url, woeid);
                    $(".preload_image").html("");
                }
            });
        }
    }
    else {
        SetWeatherBackGroud(url, woeid);
        $(".preload_image").html("");
    }
}

function SetWeatherBackGroud(url, woeid) {
    var useFlickrImages = getSettings("useFlickrImages");
    // apply background image
    if (url != "") {
        preloadImage(url, function () {
            if (useFlickrImages == "0") {
                $(".preload_image").html("");
            }
            else {
                var image_url = getSettings("imageurl_" + woeid);
                if (image_url != "") {
                    $(".preload_image").html("<a href='" + image_url + "' target='_blank'>" + chrome.i18n.getMessage("popup_text_viewimage") + " ...</a>");
                } else {
                    $(".preload_image").html("");
                }
            }
            $("body").css("background-color", "rgb(52, 73, 94)");
            $("body").css("background-image", "url('" + url + "')");
        });
    }
}

function StaticWeatherBackgroundImage(weatherObj) {

	// fill background array
	var bg = new Array();
	bg[0] = "storm.jpg"; // 'tornado'
	bg[1] = "storm.jpg"; // 'tropical storm'
	bg[2] = "storm.jpg"; // 'hurricane'
	bg[3] = "storm.jpg"; // 'severe thunderstorms'
	bg[4] = "storm.jpg"; // 'thunderstorms
	bg[5] = "rain_snow.jpg"; // 'mixed rain and snow'
	bg[6] = "rain_snow.jpg"; // 'mixed rain and sleet'
	bg[7] = "rain_snow.jpg"; // 'mixed snow and sleet'
	bg[8] = "freezing_drizzle.jpg"; // 'freezing drizzle'
	bg[9] = "freezing_drizzle.jpg"; // 'drizzle'
	bg[10] = "freezing_drizzle.jpg"; // 'freezing rain'
	bg[11] = "showers.jpg"; // 'showers'
	bg[12] = "showers.jpg"; // 'showers'
	bg[13] = "light_snow.jpg"; // 'snow flurries'
	bg[14] = "light_snow.jpg"; // 'light snow showers'
	bg[15] = "blowing_snow.jpg"; // 'blowing snow'
	bg[16] = "snow.jpg"; // 'snow'
	bg[17] = "hail.jpg"; // 'hail'
	bg[18] = "sleet.jpg"; // 'sleet'
	bg[19] = "dust.jpg"; // 'dust'
	bg[20] = "foggy.jpg"; // 'foggy'
	bg[21] = "haze.jpg"; // 'haze'
	bg[22] = "foggy.jpg"; // 'smoky'
	bg[23] = "blow.jpg"; // 'blustery'
	bg[24] = "windy.jpg"; // 'windy'
	bg[25] = "cold.jpg"; // 'cold'
	bg[26] = "cloudy.jpg"; // 'cloudy'
	bg[27] = "mostly-cloudy-night.jpg"; // 'mostly cloudy (night)'
	bg[28] = "mostly-cloudy-day.jpg"; // 'mostly cloudy (day)'
	bg[29] = "partly_cloudy_night.jpg"; // 'partly cloudy (night)'
	bg[30] = "partly_cloudy_day.jpg"; // 'partly cloudy (day)'
	bg[31] = "clear_night.jpg"; // 'clear (night)'
	bg[32] = "sunny.jpg"; // 'sunny'
	bg[33] = "fair_night.jpg"; // 'fair (night)'
	bg[34] = "fair_day.jpg"; // 'fair (day)'
	bg[35] = "rain_snow.jpg"; // 'mixed rain and hail'
	bg[36] = "hot.jpg"; // 'hot'
	bg[37] = "thunderstorms.jpg"; // 'isolated thunderstorms'
	bg[38] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[39] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[40] = "showers.jpg"; // 'scattered showers'
	bg[41] = "heavy_snow.jpg"; // 'heavy snow'
	bg[42] = "scattered_snow.jpg"; // 'scattered snow showers'
	bg[43] = "heavy_snow.jpg"; // 'heavy snow'
	bg[44] = "partly_cloudy_day.jpg"; // 'partly cloudy'
	bg[45] = "thunderstorms.jpg"; // 'thundershowers'
	bg[46] = "light_snow.jpg"; // 'snow showers'
	bg[47] = "thunderstorms.jpg"; // 'isolated thundershowers'
	//bg[3200] = ""; // 'not available'

	if (bg[weatherObj.ConditionCode] != undefined) {
	    return "../images/backgrounds/" + bg[weatherObj.ConditionCode];
	}
	else {
	    return "";
	}
}

function getWeatherCondition(condition) {
    var lang = chrome.i18n.getUILanguage();
    if (lang.indexOf("en-") == 0) {
        return condition;
    }
    else {
        var condition_label = "condition_" + condition.toLowerCase().replace(/ /g, "_").replace("(", "").replace(")", "");
        console.log("condition label: " + condition_label);
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
            break;
        }
    }
    return -1;
}

function getIcon(code, isDay) {

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