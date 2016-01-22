<?php

/*
	call_template.php
	This file gets stream info from the streaming servers. It will then update the SQL database with the online streams.
	Database will have the following colums: username, website, lastRequest, online.
	This file is included in call_twitch.php and call_hitbox.php.
	The $website variable must be defined or this program will terminate.
*/

/*
	MAIN PROGRAM OPERATIONS
*/

//error_reporting(-1);
//ini_set('display_errors', 1);

// Check if $website is defined, and exit the program if it isn't.
if(!isset($website))
	exit("\$website was not defined.");
require_once("../multi_logins.php");
date_default_timezone_set('America/Los_Angeles');

// Builds the database. Set this to true if first time running or else this wont work.
$buildDatabase = false;


$website_underscored = str_replace(".", "_", $website);

$MultistreamLoginInfo = new MultiLogins();

//SQL login information
$SQL_data = array(
		"user" => $MultistreamLoginInfo->DatabaseLogin(),
		"password" => $MultistreamLoginInfo->DatabasePassword(),
		"database" => $MultistreamLoginInfo->DatabaseName(),
		"domain" => "localhost",
		"table" => "Streams_".$website_underscored."_u7dz2"
	);

// Connect to SQL Database
ini_set('mysql.connect_timeout', 300);
ini_set('default_socket_timeout', 300);
$mysqli = new mysqli($SQL_data["domain"], $SQL_data["user"], $SQL_data["password"], $SQL_data["database"]);

// Output error on failed connect
if ($mysqli->connect_errno)
		file_put_contents ( "{$website_underscored}_error.txt" , date('l jS \of F Y h:i:s A')." "."Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error."\n", FILE_APPEND);

// Creates table if it doesn't exist.
if($buildDatabase)
{
	$mysqli->query("
		CREATE TABLE `{$SQL_data["table"]}` (
		`username` varchar(255) NOT NULL COMMENT 'lowercase username of the streamer',
		`displayName` varchar(255) NOT NULL COMMENT 'The display name relating to case sensitivity',
		`lastUpdate` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
		`lastRequest` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'The last time someone requested an update on this stream',
		`online` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Online Status',
		`error` timestamp NULL DEFAULT NULL COMMENT 'Last time a channel had an error when calling for it',
		`errortype` varchar(11) NOT NULL DEFAULT '0' COMMENT 'The reason that the channel errored out. Usually does not exist',
		PRIMARY KEY (`username`),
		KEY `lastUpdate` (`lastUpdate`)
		) ENGINE=MyISAM DEFAULT CHARSET=latin1;
	");
}

// Decides whether to delay the program
$lastStreamRun = false;
// Loops the program for 60 seconds
$start_time =  time();
while((time() - $start_time) < 60)
{
		
	// Get streams from database that either are offline and haven't been updated in 10 seconds, or online and haven't been updated in 30 seconds
	// And there has to have been a request for them by a user in the last 60 seconds
	$stream_list = $mysqli->query(
		"SELECT *
		FROM {$SQL_data["table"]}
		WHERE 
			(
				error is null
					OR 
				UNIX_TIMESTAMP(error) < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 20 minute))
			)
				AND
			UNIX_TIMESTAMP(lastRequest) > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 60 second)) 
				AND
			(
				(online = 1 and UNIX_TIMESTAMP(lastUpdate) < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 second)) )
					OR
				(online = 0 and UNIX_TIMESTAMP(lastUpdate) < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 10 second)) )

			)               
			");

	//file_put_contents ( "{$website_underscored}_error.txt" , date('l jS \of F Y h:i:s A')." "." | ".print_r($stream_list, 1)."\n", FILE_APPEND);
	$number_of_results = $stream_list->num_rows;
	// Operates on each result from the SQL call
	for($i = 1; $i <= $number_of_results; $i++)
	{
		$row = $stream_list->fetch_assoc();
		$row["username"] = strtolower($row["username"]);



		switch($website)
		{
			case "hitbox.tv":
				// Download stream information from hitbox
				$streamdata = file_get_contents("http://api.hitbox.tv/media/live/".$row["username"]);
				$streaminfo = json_decode($streamdata);

				// Error means a 20 minute delay before next check
				if($streaminfo == "no_media_found")
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=0, error=CURRENT_TIMESTAMP() WHERE username='".$row["username"]."'");

				// Reconnects to database if disconnected
				if(!mysqli_ping($mysqli))
					$mysqli = new mysqli($SQL_data["domain"], $SQL_data["user"], $SQL_data["password"], $SQL_data["database"]);

				// Update database with online status
				if((string)$streaminfo->livestream[0]->media_is_live == "1")
				{
					$displayName = $streaminfo->livestream[0]->media_user_name;
					
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=1, lastUpdate = CURRENT_TIMESTAMP(), displayName = '$displayName' WHERE username='".$row["username"]."'");
				
				}
				else if((string)$streaminfo->livestream[0]->media_is_live == "0")
				{
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=0, lastUpdate = CURRENT_TIMESTAMP() WHERE username='".$row["username"]."'");
				}

				break;
			case "twitch.tv":

				// Download stream information from twitch
				$streamdata = file_get_contents("https://api.twitch.tv/kraken/streams/".$row["username"]);
				$streaminfo = json_decode($streamdata);
				
				// Reconnects to database if disconnected
				if(!mysqli_ping($mysqli))
					$mysqli = new mysqli($SQL_data["domain"], $SQL_data["user"], $SQL_data["password"], $SQL_data["database"]);

				// Error means a 20 minute delay before next check
				if(isset($streaminfo->error))
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=0, error=CURRENT_TIMESTAMP() WHERE username='".$row["username"]."'");
				// Update database with online status
				elseif(isset($streaminfo->stream->channel->name))
				{
					$displayName = $streaminfo->stream->channel->display_name;
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=1, lastUpdate = CURRENT_TIMESTAMP(), displayName = '$displayName' WHERE username='".$row["username"]."'");

				}
				else
					$mysqli->query("UPDATE {$SQL_data["table"]} SET online=0, lastUpdate = CURRENT_TIMESTAMP() WHERE username='".$row["username"]."'");
				break;
		}
	}// for($i = 1; $i <= $number_of_results; $i++)

	// Pauses between loops so as not to spam the API links. If there are no entries updated,
	// then the loop is paused for 5 seconds so the MySQL server isn't spammed with requests.
	if ($number_of_results > 0)
		sleep(3);
	else
		sleep(5);
		
	
}// while((time() - $start_time) < 60)

$mysqli->close();

?>