<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
    <link rel="stylesheet" href="style.css">
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

<div class="board">
    <div class="top">
        <div class="content">
            <p class="occasion"><?php echo "$occasion" ?></p>
        </div>
        <div class="group-indicator"></div>
    </div>
    <div class="center">
        <div class="teams">
            <div class="team a_team">
                <p class="a_teamname"><?php echo "$a_teamname" ?></p>  
            </div>
            <div class="team b_team">
                <p class="a_teamname"><?php echo "$b_teamname" ?></p>
            </div>
        </div>
        <div class="scores">
            <div class="group_score">
                <div class="counter group">
                    <p>0</p>
                </div>
                <div class="counter group">
                    <p>1</p>
                </div>
            </div>
            <div class="team_score">
                <div class="set active">
                    <div class="counter a_team set1">
                        <p class="a_score1">1</p>
                    </div>
                    <div class="counter b_team set1">
                        <p class="b_score1">2</p>
                    </div>
                </div>
                <div class="set">
                    <div class="counter a_team set2">
                        <p class="a_score2"><?php echo "$a_score2" ?></p>
                    </div>
                    <div class="counter b_team set1">
                        <p class="b_score2"><?php echo "$b_score2" ?></p>
                    </div>
                </div>
                <div class="set">
                    <div class="counter a_team set1">
                        <p class="a_score3"><?php echo "$a_score3" ?></p>
                    </div>
                    <div class="counter b_team set1">
                        <p class="b_score3"><?php echo "$b_score3" ?></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="bottom">
        <div class="content">
            <p class="occasion"><?php echo "$game" ?></p>
            <span class="divider"></span>
            <p class="occasion"><?php echo "$game" ?></p>
        </div>
    </div>
</div>


<h3>Test Bottom</h3>

<a href="create_board.php">Neu erstellen</a>

<a href="board.php?id=2">Open Board</a>

</body>
</html>

