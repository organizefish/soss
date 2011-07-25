<?php
/*
    Copyright (c) 2011 David Wolff

    Permission is hereby granted, free of charge, to any person obtaining a copy of 
    this software and associated documentation files (the "Software"), to deal in 
    the Software without restriction, including without limitation the rights to 
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
    of the Software, and to permit persons to whom the Software is furnished to do 
    so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all 
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
    SOFTWARE.
 */

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

