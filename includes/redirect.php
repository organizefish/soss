<?php

/** 
 * Sends a header appropriate for redirection to a different page then exits.
 * This function never returns!
 * 
 */
function redirect($location) {
    $host = $_SERVER['HTTP_HOST'];
    $uri = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
    header("Location: http://$host$uri/$location");
    exit();
}
