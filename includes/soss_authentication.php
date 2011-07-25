<?php

/**
 * Returns the authorization level of the user that is currently logged in.
 * If the current session is not logged in, this returns -1.
 * 
 * @return int the authorization level (AUTH_FACULTY, AUTH_STUDENT, etc.)
 */
function soss_auth() {
    if( isset($_SESSION) && array_key_exists('auth', $_SESSION ) ) {
        $auth = $_SESSION['auth'];
    } else {
        $auth = -1;
    }
    return $auth;
}

