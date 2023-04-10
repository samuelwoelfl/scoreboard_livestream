<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

var_dump($_POST);

require_once('dbconnect.inc.php');


$update_scoreboards = $db->prepare("UPDATE Scoreboards SET Occasion=:soccasion, Game=:sgame, Mode=:smode, A_Teamname=:sa_teamname, B_Teamname=:sb_teamname, A_Score_1=:sa_score_1, A_Score_2=:sa_score_2, A_Score_3=:sa_score_3, A_Score_4=:sa_score_4, A_Score_5=:sa_score_5, A_Score_6=:sa_score_6, A_Score_7=:sa_score_7, B_Score_1=:sb_score_1, B_Score_2=:sb_score_2, B_Score_3=:sb_score_3, B_Score_4=:sb_score_4, B_Score_5=:sb_score_5, B_Score_6=:sb_score_6, B_Score_7=:sb_score_7, Set_Count=:sset_count, Show_Team_Score=:sshow_team_score, A_Color=:sa_color, B_Color=:sb_color, Show_Color=:sshow_color");
$daten_update = array(
    "soccasion" => $_POST['occasion'],
    "sgame" => $_POST['game'],
    "smode" => $_POST['mode'],
    "sa_teamname" => $_POST['a_teamname'],
    "sb_teamname" => $_POST['b_teamname'],
    "sa_score_1" => $_POST['score_a_1'],
    "sa_score_2" => $_POST['score_a_2'],
    "sa_score_3" => $_POST['score_a_3'],
    "sa_score_4" => $_POST['score_a_4'],
    "sa_score_5" => $_POST['score_a_5'],
    "sa_score_6" => $_POST['score_a_6'],
    "sa_score_7" => $_POST['score_a_7'],
    "sb_score_1" => $_POST['score_b_1'],
    "sb_score_2" => $_POST['score_b_2'],
    "sb_score_3" => $_POST['score_b_3'],
    "sb_score_4" => $_POST['score_b_4'],
    "sb_score_5" => $_POST['score_b_5'],
    "sb_score_6" => $_POST['score_b_6'],
    "sb_score_7" => $_POST['score_b_7'],
    "sset_count" => $_POST['set_count'],
    "sshow_team_score" => $_POST['show_team_score'],
    "sa_color" => $_POST['color_a'],
    "sb_color" => $_POST['color_b'],
    "sshow_color" => $_POST['show_color'],
);
$update_scoreboards->execute($daten_update);


?>