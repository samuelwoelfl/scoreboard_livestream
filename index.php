<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
</head>

<body>
    <h2>Test</h2>


<?php

require_once('dbconnect.inc.php');

$select_scoreboards = $db->prepare("SELECT * FROM Scoreboards");
$select_scoreboards->execute();

// Fehlerüberprüfung
if ($select_scoreboards == false) {
    $fehler = $db->errorInfo();
    die("Folgender Datenbankfehler ist aufgetreten: " . $fehler[2]);
}

echo "3333";

$scoreboards = $select_scoreboards->fetchAll();

echo "$scoreboards";

echo "34444";


foreach ($scoreboards as $b) {
    $occasion = $b['Occasion'];
    $game = $b['Game'];
    $a_teamname = $b['A_Teamname'];
    $b_teamname = $b['B_Teamname'];
    $a_score_1 = $b['A_Score_1'];
    $a_score_2 = $b['A_Score_2'];
    $a_score_3 = $b['A_Score_3'];
    $b_score_1 = $b['B_Score_1'];
    $b_score_2 = $b['B_Score_2'];
    $b_score_3 = $b['B_Score_3'];

    echo "<p>$occasion</p>";
    echo "<p>$game</p>";
    echo "<p>$a_teamname</p>";
    echo "<p>$b_teamname</p>";
    echo "<p>$a_score_1</p>";
    echo "<p>$a_score_2</p>";
    echo "<p>$a_score_3</p>";
    echo "<p>$b_score_1</p>";
    echo "<p>$b_score_2</p>";
    echo "<p>$b_score_3</p>";
}


?>


<h3>Test Bottom</h3>

<a href="create_board.php">Neu erstellen</a>

<a href="board.php?id=2">Open Board</a>

</body>
</html>

