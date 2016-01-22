<?php

	$log = file_get_contents('error_log');
	echo "<pre>" . print_r($log,1) . "</pre>";
?>