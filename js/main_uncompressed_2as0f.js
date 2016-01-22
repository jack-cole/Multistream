/*
	main.js
*/

/*
stream_list contains the full list of streams that the user wants to watch
The streams are stored as objects, and the important data is contained within.
The objects will always have lowercase names.

The stream names have to be split into different sites, due to the off chance that
two of the same name is used.
*/
var stream_list = { twitch_tv: {} , hitbox_tv: {} };
var vid_alignment = "boxed";
var TotalStreams;

// Have to wait for the jQuery library to load
$( document ).ready(function() {

	// Load the saved stream list from the URL
	LoadSavedStreamList();

	// Header buttons
	EnableHeaderButtons();

	ScrollToSteamInputBox();
	InterruptSaveLinkLink()

	// Take inputted streams and add them to stream list
	SubmitNewStreams();
	CheckLiveStreams();
	setInterval('CheckLiveStreams()',10*1000) // seconds * 1000
});

// Returns the names of all the objects in an object as an array
function ObjectToArray(obj)
{
	var objectList = [];
	$.each(obj, function(name){
		objectList.push(name)
	});
	return objectList;
}

// Counts the number of streams in the list and returns a true value if greater than 0.
function CountStreams(streams)
{
	if(typeof streams == 'undefined')
		streams = stream_list;
	var count = 0;
	$.each(streams, function(key, value){
		count += ObjectToArray(value).length;
	});
	if(count > 0)
		return true;
	else
		return false;
}

function ParseURLVariables()
{
	var url = document.URL.split("?");
	var ParsedVars = {};
	if(url.length > 1)
		$.each(url[1].split("&"), function(key, val)
		{
			val = val.split("=");
			ParsedVars[val[0]] = val[1];
		});
	return ParsedVars;
}

function EnableHeaderButtons()
{
	// Clears all the streams on clicking this
	$(".header_link.clear_streams").click(function()
	{
		stream_list = { twitch_tv: {} , hitbox_tv: {} };
		HideOrShowSaveButton()
		CheckLiveStreams(); // Cleans up the page
	});

	$(".header_link.auto_hide")
	.click(function()
	{
		var enabled = $(this).data("enabled");
		if(enabled)
		{
			enabled = false;
			$(this).text("O")
		}
		else
		{
			enabled = true;
			$(this).text("-")
		}
		$(this).data("enabled", enabled);
	});

	$(".header_link.add_streams").click(function(){
		ScrollToSteamInputBox();
	});
}

function ResizeStreams(){
	var count = $('.live_stream_container').length;
	var wid = 100;
	var hit = 100;
	if(vid_alignment == 'boxed'){
		switch(count){
			case 0:
			break
			case 1:
				wid = 100;hit=100;
			break
			case 2:
				wid = 50;hit=100;
			break
			case 3:
				wid = 50;hit=50;
			break
			case 4:
				wid = 50;hit=50;
			break
			case 5:
				wid = 33;hit=50;
			break
			case 6:
				wid = 33;hit=50;
			break
		}
		$('.live_stream_container').width(wid+'%').height(hit+'%')
	}
	else if(vid_alignment == 'horizontal')
	{
		$('.live_stream_container').width((wid/count)+'%').height(hit+'%')
	}
	else if(vid_alignment == 'vertical')
	{
		$('.live_stream_container').width(wid+'%').height((hit/count)+'%')
	}
	
}

function CheckLiveStreams(){
	// If stream list is empty, don't bother
	if(CountStreams()){
		var url =  "list_streams.php?";
		var data = "";
		$.ajax({
			type: "POST",
			data: "twitch_tv=" + ObjectToArray(stream_list.twitch_tv).join(",") + "&hitbox_tv=" + ObjectToArray(stream_list.hitbox_tv).join(","),
			dataType: "json",
			url: url,
			crossDomain: true,
			cache: false,
			error: function(data, error, a){
				console.log(error+'\n'+a)
			},
			success: function(data){
				if((typeof data) !== 'undefined')
				{
					// NormalizeData(data.streams)
					AppendStreams(data.streams);
				}
			}
		})
	}
	else
	{
		RemoveStreamElements();
		UpdateDisplayList();
	}
}

// Remove streams not in the steam_list
function RemoveStreamElements(){
	var StreamChangeBool = false;
	$('.stream_windows > .live_stream_container').each(function(){
		stream_name = $(this).data('stream-name').toLowerCase();
		website = $(this).data('website');
		if(typeof stream_list[website][stream_name] == "undefined" || stream_list[website][stream_name].Online == "0"){
			$(this).remove();			
			StreamChangeBool = true;
		};
	});
	if(StreamChangeBool)
		ResizeStreams();
}

// Adds the stream elements to the page, and removes any offline streams.
function AppendStreams(websites){
	var StreamChangeBool = 0;

	RemoveStreamElements()

	// Add new streams and update data
	$.each(websites, function(website,streams){
		$.each(streams, function(stream_name,value){

			// Add the stream data to stream_list object
			if(stream_name.length > 0)
			{
				// Just use the lowercase name if the stream's display name isn't to be found. This is
				// usually when it's the first time the stream has been requested.
				if(value.displayName.length <= 0)
					value.displayName = stream_name;

				stream_list[website][stream_name] = value;

				// Add the stream elements to the site
				if($('.live_stream_container[data-stream-name="'+value.displayName+'"][data-website="'+value.Website+'"]').length < 1 && value.Online == "1")
				{
					// Twitch embedded flash stream
					var stream_container = $('body .stream_windows');
					var appending_HTML = '<div class="holder live_stream_container '+value.displayName+'_stream" '+
							'data-stream-name="'+value.displayName+'" data-website="'+value.Website+'">'
					if(value.Website == 'twitch_tv'){				
						appending_HTML +='<object type="application/x-shockwave-flash" '+
								'class="twitch_tv_stream live_stream" '+
								'data="http://www.twitch.tv/widgets/live_embed_player.swf?channel='+value.displayName+'" '+
								'bgcolor="#000000">'+
								'<param  name="allowFullScreen" '+
										  'value="true" />'+
								'<param  name="allowScriptAccess" '+
										  'value="always" />'+
								'<param  name="allowNetworking" '+
										  'value="all" />'+
								'<param  name="movie" '+
										  'value="http://www.twitch.tv/widgets/live_embed_player.swf" />'+
								'<param  name="flashvars" '+
										  'value="hostname=www.twitch.tv&channel='+value.displayName+'&auto_play=true&start_volume=0" />'+
								'</object>';
						StreamChangeBool = 1;
					// Hitbox iframe window
					}else if(value.Website == 'hitbox_tv'){
						appending_HTML +='<iframe src="http://hitbox.tv/#!/embed/'+value.displayName+'?autoplay=true" '+
								'frameborder="0" '+
								'allowfullscreen '+
								'class="hitbox_tv_stream live_stream">'+
								'</iframe>';
						StreamChangeBool = 1;
					};
					appending_HTML += '</div>';
					stream_container.append(appending_HTML);
				}
			}
		});
	});
		//Appends to the interface
	if(StreamChangeBool)
		ResizeStreams();

	// Updates the stream display list
	UpdateDisplayList()
};

// Take inputted streams and add them to stream list
function SubmitNewStreams(){
	$(".add_twitch_tv_streams,.add_hitbox_tv_streams").submit(function( event ) {
	
		var website = $(this).data('website');
		// get the values and replaces the spaces with commas, then split it into an array and delete any empty values
		var form_values = $(this).serializeArray()[0].value.replace(/ /g, ",").split(",").filter(function(e) {
			if (e === 0) e = '0'
			return e
		});


		// Insert unique names into stream list
		form_values.forEach(function(val) {
			val = val.toLowerCase();
			if(typeof stream_list[website][val] == "undefined")
				stream_list[website][val] = {};
		});

		// Clear the fields
		$('.input_text', this).val("");

		// Enable the save button
		HideOrShowSaveButton()

		// Check for new streams
		CheckLiveStreams()

		event.preventDefault();
	});
}

// Hide interface and scroll to top when no mouse movement is detected for 5 seconds
var timeout;
var timeUntilHide = 5 * 1000;
var currently_animating = false;
document.onmousemove = function (){HideOrDisplayInterface()};
window.onkeydown = function (){HideOrDisplayInterface()};
window.onkeypress = function (){HideOrDisplayInterface()};
window.onkeyup = function (){HideOrDisplayInterface()};

function HideOrDisplayInterface(){
	
	clearTimeout(timeout);
	$('body').css('overflow-y', 'visible')
	if(!currently_animating)
	{
		currently_animating = true
		$('.header').stop().animate({opacity:1}, 500, function() {currently_animating = false});
	}
	if($(".header_link.auto_hide").data("enabled"))
	{
		timeout = setTimeout(function(){
			$('body').css('overflow-y', 'hidden')
			$('.header').animate({opacity:0.1}, 2000);
			currently_animating = false;
			window.scrollTo(0,0);
		}, timeUntilHide);
	}
}

// This scrolls to the input box to add streams. It will take the height of the box and the window in order to center it on the screen.
function ScrollToSteamInputBox()
{
	var WindowHeight = $(".stream_windows").height();
	var InputBoxHeight = $(".input_box").height();
	var InputBoxTopMargin = parseInt($(".input_box").css('marginTop'))
	var DesiredYOffset = (WindowHeight + InputBoxHeight + InputBoxTopMargin) / 2;
	window.scrollTo(0,DesiredYOffset);
}

// Updates the list of streams
function UpdateDisplayList()
{
	var online_element = $(".display_list .online")
	var offline_element = $(".display_list .offline")

	$.each(stream_list, function(website, streams)
	{
		$.each(streams, function(index,stream_data)
		{
			var stream_display_name = stream_data.displayName;
			var active_stream_element = $("."+stream_display_name+"_stream[data-website='"+website+"']")

			// detect stream online status using the elements displayed
			if(stream_data.Online == 1)
				var status = "online";
			else
				var status = "offline";

			if($('.display_list .'+status + ' .stream_status[data-stream-name="'+stream_display_name+'"][data-website="'+website+'"]').length < 1)
			{
				$('.display_list .stream_status[data-stream-name="'+stream_display_name+'"][data-website="'+website+'"]').remove();
				// The nonbreaking space at the end allows the list to be copy and pasted with spaces between the stream names. It's hidden by setting the font-size to 0pt
				$(".display_list ." + status).append('<div class="stream_status '+website+'" data-stream-name="'+stream_display_name+'" data-website="'+website+'"">'+stream_display_name+'<a class="close" onClick="javascript:CloseStream(this);return false;" data-stream-name-close="'+stream_display_name+'" data-website="'+website+'"">x</a></div>')
			}

		});
	});
	// Remove items not in list
	$('.stream_status').each(function()
	{
		var stream_lowercase_name = $(this).data('stream-name').toLowerCase();
		var website = $(this).data('website');
		if(ObjectToArray(stream_list[website]).indexOf(stream_lowercase_name) == -1 || stream_list[website][stream_lowercase_name].displayName != $(this).data('stream-name'))
		{
			$(this).remove()
		}
	});
}

// Generate the POST data containing all the streams
function SaveStream_GeneratePOST(streams)
{
	var post_array = [ "action=insert" ];
	$.each(streams, function(website, stream)
	{
		var website_link = website+ "=";
		var stream_list_array = [];
		$.each(stream, function(stream_name, stream_data)
		{
			stream_list_array.push(stream_name);
		});
		website_link += stream_list_array.join(",");
		post_array.push(website_link)
	});

	return post_array.join("&");
}


// Saves the list of streams and gets it's name back
function SaveStream_SaveAndGetName(){
	// If stream list is empty, don't bother
	if(CountStreams()){
		$(".stream_input .display_list .save_container .link").addClass("loading").show()
		$.ajax({
			type: "POST",
			data: SaveStream_GeneratePOST(stream_list),
			dataType: "json",
			url: "save_load_list.php",
			crossDomain: false,
			cache: false,
			error: function(data, error, a){
				console.log(error+'\n'+a);
				$(".stream_input .display_list .save_container .link").removeClass("loading");
			},
			success: function(data){
				console.log("data : ",data);
				if((typeof data) !== 'undefined' && data.insertion == "success")
				{
					EnableLinkAndBookmarkButtons( data.name );
					
				}
				$(".stream_input .display_list .save_container .link").removeClass("loading");
			}
		})
	}
}

// This will be called every time a new stream is added to the list. The save button wont be visible until at least 1 stream is added.
function HideOrShowSaveButton()
{
	var save_button = $(".stream_input .display_list .save_container .save");
	if(CountStreams())
		save_button.show()
	else
		save_button.hide()
}


// Unhides the buttons after a link is generated, and sets the correct hyperlink reference
function EnableLinkAndBookmarkButtons(name)
{
	var saved_streams_url = document.URL.split("?")[0]
	saved_streams_url += "?saved_list=" + name;
	$(".stream_input .display_list .save_container .link").attr('href', saved_streams_url).show()
}

// Allows a user to click the link without it refreshing the page
function InterruptSaveLinkLink(){
	$(".stream_input .display_list .save_container .link").click(function(){
		window.history.replaceState( '' , '' , $(this).attr('href') );
		return false;
	})
	
}
// If a link with a saved stream list is used, then load the list and apply the streams before anything is done.
function LoadSavedStreamList()
{
	var URLvars = ParseURLVariables();
	
	if(typeof URLvars.saved_list != "undefined"){
		var Postdata = "action=retrieve&name="+ URLvars.saved_list;
		$.ajax({
			type: "POST",
			data: Postdata,
			dataType: "json",
			url: "save_load_list.php",
			crossDomain: false,
			cache: false,
			error: function(data, error, a){
				console.log(error+'\n'+a)
			},
			success: function(data){
				console.log("data : ",data);
				if((typeof data) !== 'undefined')
				{
					ParseDownloadedSavedList(data.retrieved_lists);
				}
			}
		})
	}
}

function ParseDownloadedSavedList(retrieved_lists){
	$.each(retrieved_lists , function(website, names)
	{
		names = names.split(",");
		$.each(names , function(a, name)
		{
			if(name.length > 0)
				stream_list[website][name] = {};
		});
	})
	CheckLiveStreams()
	HideOrShowSaveButton()
}

// Clicking the little red button with an x will delete the stream from the list.
function CloseStream(element)
{	
	var name = $(element).data("stream-name-close").toLowerCase();
	var website = $(element).data("website");


	delete stream_list[website][name];
	RemoveStreamElements();
	UpdateDisplayList();
};