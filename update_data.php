<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

var_dump($_POST);

require_once('dbconnect.inc.php');


$update_scoreboards = $db->prepare("UPDATE Scoreboards SET Occasion=:soccasion, Game=:sgame, A_Teamname=:sa_teamname, B_Teamname=:sb_teamname");
$daten_update = array(
    "soccasion" => $_POST['occasion'],
    "sgame" => $_POST['game'],
    "sa_teamname" => $_POST['a_teamname'],
    "sb_teamname" => $_POST['b_teamname'],
);
$update_scoreboards->execute($daten_update);


?>