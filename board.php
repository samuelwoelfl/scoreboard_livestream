<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="functions.js"></script>
</head>

<body>
    <script> 
        $(document).ready(function() {

            // initialize variables for global usage
            active_set = 1;
            show_team_score = 0;
            show_color = 0;

            // update the page with the live data in the given interval
            setInterval(function () {
                insert_live_data("board");
                update_set_visibilities();
                update_team_counter_visibility();
                update_color_indicator_visibility();

            }, 250); // request every 1/4 seconds

        });
    </script>


    <div class="wrapper">
        <div class="board">
            <div class="top">
                <div class="content">
                    <p class="text" id="Occasion">Occasion</p>
                </div>
                <div class="group-indicator"></div>
            </div>
            <div class="center">
                <div class="teams">
                    <div class="team">
                        <div class="color-indicator" id="A_Color"></div>
                        <p class="teamname" id="A_Teamname">A Teamname</p>
                    </div>
                    <div class="team">
                        <div class="color-indicator" id="B_Color"></div>
                        <p class="teamname" id="B_Teamname">B Teamname</p>
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
                                <p class="score" id="A_Score_1"></p>
                            </div>
                            <div class="counter b_team set1">
                                <p class="score" id="B_Score_1"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set2">
                                <p class="score" id="A_Score_2"></p>
                            </div>
                            <div class="counter b_team set2">
                                <p class="score" id="B_Score_2"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set3">
                                <p class="score" id="A_Score_3"></p>
                            </div>
                            <div class="counter b_team set3">
                                <p class="score" id="B_Score_3"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set4">
                                <p class="score" id="A_Score_4"></p>
                            </div>
                            <div class="counter b_team set4">
                                <p class="score" id="B_Score_4"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set5">
                                <p class="score" id="A_Score_5"></p>
                            </div>
                            <div class="counter b_team set5">
                                <p class="score" id="B_Score_5"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set6">
                                <p class="score" id="A_Score_6"></p>
                            </div>
                            <div class="counter b_team set6">
                                <p class="score" id="B_Score_6"></p>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set7">
                                <p class="score" id="A_Score_7"></p>
                            </div>
                            <div class="counter b_team set7">
                                <p class="score" id="B_Score_7"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bottom">
                <div class="content">
                    <p class="text" id="Game">Game Name</p>
                    <span class="divider"></span>
                    <p class="text" id="Mode">Game Mode</p>
                </div>
            </div>
        </div>
    </div>


</body>

</html>