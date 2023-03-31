<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

var_dump($_POST);

require_once('dbconnect.inc.php');


$update_scoreboards = $db->prepare("UPDATE Scoreboards SET Occasion=:soccasion, Game=:sgame, A_Teamname=:sa_teamname, B_Teamname=:sb_teamname, A_Score_1=:sa_score_1, A_Score_2=:sa_score_2, A_Score_3=:sa_score_3, B_Score_1=:sb_score_1, B_Score_2=:sb_score_2, B_Score_3=:sb_score_3, Set_Count=:sset_count, Show_Team_Score=:sshow_team_score");
$daten_update = array(
    "soccasion" => $_POST['occasion'],
    "sgame" => $_POST['game'],
    "sa_teamname" => $_POST['a_teamname'],
    "sb_teamname" => $_POST['b_teamname'],
    "sa_score_1" => $_POST['score_a_1'],
    "sa_score_2" => $_POST['score_a_2'],
    "sa_score_3" => $_POST['score_a_3'],
    "sb_score_1" => $_POST['score_b_1'],
    "sb_score_2" => $_POST['score_b_2'],
    "sb_score_3" => $_POST['score_b_3'],
    "sset_count" => $_POST['set_count'],
    "sshow_team_score" => $_POST['show_team_score'],
);
$update_scoreboards->execute($daten_update);


?>