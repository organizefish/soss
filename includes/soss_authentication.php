<?php

function soss_auth() {
    if( isset($_SESSION) && array_key_exists('auth', $_SESSION ) ) {
        $auth = $_SESSION['auth'];
    } else {
        $auth = -1;
    }
    return $auth;
}

