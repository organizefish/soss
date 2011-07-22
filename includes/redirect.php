<?php
/** Sends a header appropriate for redirection to a different page.
 */
function redirect($location) {
  $host  = $_SERVER['HTTP_HOST'];
  $uri  = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
  $extra = 'mypage.php';
  header("Location: http://$host$uri/$location");
  exit();
}
?>
