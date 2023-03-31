<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once('dbconnect.inc.php');

$select_scoreboards = $db->prepare("SELECT * FROM Scoreboards");
$select_scoreboards->execute();

// Fehlerüberprüfung
if ($select_scoreboards == false) {
    $fehler = $db->errorInfo();
    die("Folgender Datenbankfehler ist aufgetreten: " . $fehler[2]);
}

$scoreboards = $select_scoreboards->fetchAll();

header('Content-Type: application/json');
echo json_encode($scoreboards);


?>