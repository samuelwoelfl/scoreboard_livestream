<?php

// Debug stuff
error_reporting(E_ALL);
ini_set('display_errors', 1);
var_dump($_POST);

// import databse connection file
require_once('dbconnect.inc.php');

// check if post variables are set and build dynamic sql query with them
if (isset($_POST) && !empty($_POST)) {
    $sql = "UPDATE Scoreboards SET ";
    $post_var_counter = 0;
    foreach($_POST as $key => $value) {
        $sql .= "$key=:$key";
        // don't set a comma if it's only one variable and if it's the last variable
        if (count($_POST) !== 1 && $post_var_counter !== count($_POST) - 1) {
            $sql .= ", ";
        }
        $post_var_counter += 1;
    }

    // prepare sql query
    $update_query = $db->prepare($sql);

    // fill values in sql query
    foreach($_POST as $key => $value) {
        $update_query->bindParam(":$key", $_POST[$key]);
    }

    // execute query
    $update_query->execute();
}




// $update_scoreboard = $db->prepare("UPDATE Scoreboards SET Occasion=:soccasion, Game=:sgame, Mode=:smode, A_Teamname=:sa_teamname, B_Teamname=:sb_teamname, A_Score_1=:sa_score_1, A_Score_2=:sa_score_2, A_Score_3=:sa_score_3, A_Score_4=:sa_score_4, A_Score_5=:sa_score_5, A_Score_6=:sa_score_6, A_Score_7=:sa_score_7, B_Score_1=:sb_score_1, B_Score_2=:sb_score_2, B_Score_3=:sb_score_3, B_Score_4=:sb_score_4, B_Score_5=:sb_score_5, B_Score_6=:sb_score_6, B_Score_7=:sb_score_7, Set_Count=:sset_count, Show_Team_Score=:sshow_team_score, A_Color=:sa_color, B_Color=:sb_color, Show_Color=:sshow_color");

// $daten_update = array(
//     "soccasion" => $_POST['Occasion'],
//     "sgame" => $_POST['Game'],
//     "smode" => $_POST['Mode'],
//     "sa_teamname" => $_POST['A_Teamname'],
//     "sb_teamname" => $_POST['B_Teamname'],
//     "sa_score_1" => $_POST['A_Score_1'],
//     "sa_score_2" => $_POST['A_Score_2'],
//     "sa_score_3" => $_POST['A_Score_3'],
//     "sa_score_4" => $_POST['A_Score_4'],
//     "sa_score_5" => $_POST['A_Score_5'],
//     "sa_score_6" => $_POST['A_Score_6'],
//     "sa_score_7" => $_POST['A_Score_7'],
//     "sb_score_1" => $_POST['B_Score_1'],
//     "sb_score_2" => $_POST['B_Score_2'],
//     "sb_score_3" => $_POST['B_Score_3'],
//     "sb_score_4" => $_POST['B_Score_4'],
//     "sb_score_5" => $_POST['B_Score_5'],
//     "sb_score_6" => $_POST['B_Score_6'],
//     "sb_score_7" => $_POST['B_Score_7'],
//     "sset_count" => $_POST['Set_Count'],
//     "sshow_team_score" => $_POST['Show_Team_Score'],
//     "sa_color" => $_POST['A_Color'],
//     "sb_color" => $_POST['B_Color'],
//     "sshow_color" => $_POST['Show_Color'],
// );
// $update_scoreboard->execute($daten_update);



?>