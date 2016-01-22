# Multistream
Displays hitbox and twitch streams that are currently online in a single browser window. It will continue to monitor the streams and update when they come online or go offline.


## Installation

* Extract files to folder on server
* Create database on your server and save the name, login, password
* Open **multi_logins_example.php** and change the values to match your database information
* Rename it to **multi_logins.php**
* Open **call_template.php** and **save_load_list.php** and set *$buildDatabase = true*
* set **/calls/call_hitbox.php** and **/calls/call_twitch.php** to be on a cron job every minute

Then to test it, go to index.html, then find an online stream on hitbox.tv or twitch.tv and then add it to the list and wait 10 seconds.
Click the save button, then try opening the link and seeing if your list of Streams were saved and loaded. Once you have done that, you can set *$buildDatabase = false* in **call_template.php** and **save_load_list.php**.