# Multistream
Displays hitbox and twitch streams that are currently online in a single browser window. It will continue to monitor the streams and update when they come online or go offline.

### Working Example

[Multistream on jack-cole.com](http://www.jack-cole.com/multistream/)

Head over to [hitbox.tv](http://www.hitbox.tv/) or [twitch.tv](http://www.twitch.tv/) and find some live channels to add. Click the ? for more help.


## Using the Stream Page

![Instructions on using the front end of the Multistream](http://www.jack-cole.com/multistream/img/help.jpg)



## Installation on your own server

* Extract files to folder on server
* Create database on your server and save the name, login, password
* Open **multi_logins_example.php** and change the values to match your database information
* Rename it to **multi_logins.php**
* Open **call_template.php** and **save_load_list.php** and set *$buildTable = true*
* set **/calls/call_hitbox.php** and **/calls/call_twitch.php** to be on a cron job every minute

Then to test it, go to **index.html**, then find an online stream on [hitbox.tv](http://www.hitbox.tv/) or [twitch.tv](http://www.twitch.tv/) and then add it to the list and wait 10 seconds. If a stream appears, then the everything works with the streams table.

To test the saved list table, click the save button, then try opening the link and seeing if your list of Streams were saved and loaded.

Once you have done that, you can set *$buildTable = false* in **call_template.php** and **save_load_list.php**.