<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
</head>

<body>
    <h2>Create Board</h2>


<?php

require_once('dbconnect.inc.php');

?>


<a href="index.php">Zurück zur Übersicht</a>
<form action="code.php" method="POST">

    <label>Occasion</label>
    <input type="text" name="occasion" id="occasion">

    <label>Game</label>
    <input type="text" name="game" id="game">

    <label>Team A</label>
    <input type="text" name="a_teamname" id="a_teamname">

    <label>Team B</label>
    <input type="text" name="b_teamname" id="b_teamname">

    <button type="submit" name="save_board">Speichern</button>

</form>



<h3>Test Bottom</h3>


</body>
</html>