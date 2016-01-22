<?php

/*
	call_twitch.php
	This file gets stream info from the twitch servers. It will then update the SQL database with the online streams.
	Database will have the following colums: username, website, lastRequest, online.
*/

$website = "twitch.tv";
include('call_template.php');

?>