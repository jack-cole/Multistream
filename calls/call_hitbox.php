<?php

/*
	call_hitbox.php
	This file gets stream info from the hitbox servers. It will then update the SQL database with the online streams.
	Database will have the following colums: username, website, lastRequest, online.
*/

$website = "hitbox.tv";
include('call_template.php');

?>