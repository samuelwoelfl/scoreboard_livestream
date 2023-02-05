<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Board</title>
</head>

<body>
    <h2>Board</h2>


<?php

require_once('dbconnect.inc.php');

$board_id = $_GET["id"];

$select_board = $db->prepare("SELECT * FROM Scoreboards WHERE ID=?");
$select_board->execute(array($board_id));
$board_cols = $select_board->fetchAll();


foreach ($board_cols as $b) {
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
<a href="board.php?id=2">Open Board</a>

</body>
</html>
