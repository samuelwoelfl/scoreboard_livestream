<?php
# Zugangsdaten
$db_server = 'rdbms.strato.de';
$db_benutzer = 'dbu2565954';
$db_passwort = 'A%D^C^z6*b$hb84bG5no';
$db_name = 'dbs9955104'; # Verbindungsaufbau

$DSN = "mysql:host=$db_server;dbname=$db_name";
$optionen = array();

try {
    $db = new PDO($DSN, $db_benutzer, $db_passwort, $optionen);
} catch(Exception $e) {
    echo $e->getMessage();
    echo 'Kein Verbindung';
}
?>