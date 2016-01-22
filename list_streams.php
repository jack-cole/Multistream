<?php
/*
	list_streams.php
	This is accessed by the front page of the multistream site to see what streams are marked as online in the database.
	At the same time, it puts in the database that certain streams were checked at the current time. This lets the cron jobs
	running the hitbox and twitch calls to know what streams to check.
*/

if(isset($_GET["test"]))
{
	error_reporting(-1);
	ini_set('display_errors', 1);
}

require_once("multi_logins.php");
header('Content-Type: application/json');

$MultistreamLoginInfo = new MultiLogins();

//SQL login information
$SQL_data = array(
		"user" => $MultistreamLoginInfo->DatabaseLogin(),
		"password" => $MultistreamLoginInfo->DatabasePassword(),
		"database" => $MultistreamLoginInfo->DatabaseName(),
		"domain" => "localhost"
	);

// Connect to SQL Database
$mysqli = new mysqli($SQL_data["domain"], $SQL_data["user"], $SQL_data["password"], $SQL_data["database"]);

if(isset($_GET["testing"]))
	$_POST = $_GET;

// function to parse the stream list from the URL variables
function URLvarsParsedIntosqlQuery($stream_names, $website, $SelectOrInsert)
{
	global $mysqli;
	// Return a falase value of the URL variable isn't set or if it has no streams
	if(!isset($stream_names))
		return 0;

	$website_underscored = str_replace(".", "_", $website);

	// Splits the streams into an escaped an unescaped lists, and insert and selects which will be used to add the SQL parsed streams.
	$streams = array(
		"unescaped" => explode(',' , strtolower($stream_names)),
		"escaped" => array(),
		"selects" => array(),
		"inserts" => array()
		);
	foreach($streams as $value)
	{
		$streams['escaped'][$value] = mysqli_real_escape_string($mysqli, $value);
	}
	if(count($streams) <= 0)
		return 0;


	// SELECT Statement
	if($SelectOrInsert == 'select')
	{
		
		foreach($streams["unescaped"] as $value)
			$streams['selects'][$value] = "username = '$value'";
		$sql_response = "SELECT username, online, displayName\n".
		"FROM Streams_".$website_underscored."_u7dz2\n".
		"WHERE ".implode(" OR " , $streams['selects']);
	}
	// INSERT or UPDATE statement
	else if($SelectOrInsert == 'insert')
	{
		
		foreach($streams["unescaped"] as $value)
		{

			$streams['inserts'][$value] = "( '$value' , NOW() )";
		}
		$sql_response = "INSERT INTO Streams_".$website_underscored."_u7dz2 (username, lastRequest)\n" .
		"VALUES ".implode("," , $streams['inserts'])."\n" .
		"ON DUPLICATE KEY UPDATE lastRequest = NOW()";
		
	}
	// print_r( $sql_response . "\n\n");
	return $sql_response;
}

// Insert new streams and Update lastRequest field so the caller for the websites knows which streams to look out for.
$Insert_twitch = URLvarsParsedIntosqlQuery($_POST['twitch_tv'], "twitch.tv", 'insert');
$Insert_hitbox = URLvarsParsedIntosqlQuery($_POST['hitbox_tv'], "hitbox.tv", 'insert');


if($Insert_twitch !== 0)
	$mysqli->query($Insert_twitch);
if($Insert_hitbox !== 0)
	$mysqli->query($Insert_hitbox);


// $mysqli->query( URLvarsParsedIntosqlQuery($_POST['hitbox_tv'], "hitbox.tv", 'select'));


$stream_data = array('streams' => array());

// Request query for each website
foreach ($_POST as $website => $streams) {
	
	// Skip if not any of the streaming sites
	if($website != 'twitch_tv' && $website != "hitbox_tv")
		continue;
	$Select_query = URLvarsParsedIntosqlQuery($streams, $website, 'select');

	$stream_list = $mysqli->query($Select_query);

	// Put each line item in the stream array
	for($i = 1; $i <= $stream_list->num_rows; $i++)
	{
		$row = $stream_list->fetch_assoc();
		
		if(!isset($stream_data['streams'][$website]))
			$stream_data['streams'][$website] = array();
		$website = str_replace(".", "_", $website);
		$stream_data['streams'][$website][$row["username"]] = array("Online" => $row["online"], "Website" => $website, "displayName" => $row["displayName"]);		
	}

}

$mysqli->close();

// For debugging
$stream_data['POST'] = $_POST;

// Output the data
echo json_encode($stream_data);

?>