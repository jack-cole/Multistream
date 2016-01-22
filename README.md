# Multistream
Displays [hitbox.tv](http://www.hitbox.tv/) and [twitch.tv](http://www.twitch.tv/) streams that are currently online in a single browser window. It will continue to monitor the streams and update when they come online or go offline.

### Working Example

[Multistream on jack-cole.com](http://www.jack-cole.com/multistream/) Click the question mark at the top right for more help.

Head over to [hitbox.tv](http://www.hitbox.tv/) or [twitch.tv](http://www.twitch.tv/) and find some live channels to add. 


## Using the Stream Page

![Instructions on using the front end of the Multistream](http://www.jack-cole.com/multistream/img/help.jpg)



## Installation on your own server

1. Extract files to folder on server
2. Create database on your server and save the name, login, password
3. Open **multi_logins_example.php** and change the values to match your database information
4. Rename it to **multi_logins.php**
5. Open **call_template.php** and **save_load_list.php** and set *$buildTable = true*
6. set **/calls/call_hitbox.php** and **/calls/call_twitch.php** each as a cron job that executes every minute
	1. \*	\*	\*	\*	\*	php -q /youwebserver/multistream/calls/call_twitch.php
	2. \*	\*	\*	\*	\*	php -q /youwebserver/multistream/calls/call_hitbox.php

Then to test it, go to **index.html**, then find an online stream on [hitbox.tv](http://www.hitbox.tv/) or [twitch.tv](http://www.twitch.tv/) and then add it to the list and wait 10 seconds. If a stream appears, then the everything works with the streams table.

To test the saved list table, click the save button, then try opening the link and seeing if your list of Streams were saved and loaded.

Once you have done that, you can set *$buildTable = false* in **call_template.php** and **save_load_list.php**.