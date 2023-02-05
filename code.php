<?php

require_once('dbconnect.inc.php');

if(isset($_POST['save_board'])) {
    // $occasion = mysqli_real_escape_string($db, $_POST['occasion']);
    // $game = mysqli_real_escape_string($db, $_POST['game']);
    // $a_teamname = mysqli_real_escape_string($db, $_POST['a_teamname']);
    // $b_teamname = mysqli_real_escape_string($db, $_POST['b_teamname']);

    $insert_query = $db->prepare("INSERT INTO Scoreboards (Occasion, Game, A_Teamname, B_Teamname) VALUES (:occasion, :game, :a_teamname, :b_name)");

    $daten = array(
        "occasion" => $_POST['occasion'],
        "game" => $_POST['game'],
        "a_teamname" => $_POST['a_teamname'],
        "b_teamname" => $_POST['b_teamname'],
    );

    $insert_query_run = $insert_query->execute($daten);

    // echo $insert_query_run;

    if ($insert_query_run) {
        header("Location: index.php");
    } else {
        $fehler = $db->errorInfo();
        die("Folgender Datenbankfehler ist aufgetreten: " . $fehler[2]);
    }
}

?>