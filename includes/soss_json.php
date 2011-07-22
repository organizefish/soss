<?php
// Response codes
define("SOSS_RESPONSE_ERROR", 100);
define("SOSS_RESPONSE_PERMISSION_DENIED", 110);
define("SOSS_RESPONSE_SUCCESS", 200);

function soss_send_json_response( $code, $message, $data=array() ) {

	$response = array(
		"ResponseCode" => $code,
		"Message" => $message,
		"Data" => $data
	);

	$response = json_encode($response);

	print($response);
	exit();
}
?>
