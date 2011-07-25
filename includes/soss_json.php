<?php
// Response codes
define("SOSS_RESPONSE_ERROR", 100);
define("SOSS_RESPONSE_PERMISSION_DENIED", 110);
define("SOSS_RESPONSE_SUCCESS", 200);

/**
 * Creates a JSON object from a PHP array and sends that to the client by
 * sending it to standard out.  After sending the JSON, this function exits.
 * 
 * 
 * @param int $code the response code (one of SOSS_RESPONSE_ERROR, 
 *        SOSS_RESPONSE_PERMISSION_DENIED, or SOSS_RESPONSE_SUCCESS)
 * @param string $message a message
 * @param string $data an array containing the data to be encoded into JSON
 *        and sent to the client.
 */
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

