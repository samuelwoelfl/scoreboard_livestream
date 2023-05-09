<?php include "board-header-start.php" ?>

    <link rel="stylesheet" href="../css/style-v2.css">

<?php include "board-header-end.php" ?>


    <div class="wrapper">
        <div class="board">

            <div class="top">

                <div class="team left">
                    <div class="score">
                        <p id="A_Score_Active"></p>
                    </div>
                    <div class="name">
                        <div class="content">
                            <p class="teamname text" id="A_Teamname">A Teamname</p>
                            <p class="players text" id="A_Players">N. Alt & D. Ameziane</p>
                        </div>
                    </div>
                </div>

                <div class="game">
                    <p class="text" id="Game">Game Name</p>
                    <div class="sets_counter">
                        <span id="a_sets_won">0</span>
                        <span>:</span>
                        <span id="b_sets_won">0</span>
                    </div>
                </div>

                <div class="team right">
                    <div class="name">
                        <div class="content">
                            <p class="teamname text" id="B_Teamname">A Teamname</p>
                            <p class="players text" id="B_Players">N. Alt & D. Ameziane</p>
                        </div>
                    </div>
                    <div class="score">
                        <p id="B_Score_Active"></p>
                    </div>
                </div>
                
            </div>

            <div class="bottom">
                <div class="content">
                    <p class="text" id="Occasion">Occasion</p>
                    <span class="divider"></span>
                    <p class="text" id="Mode">Game Mode</p>
                </div>
            </div>

        </div>
    </div>

    <div class="hidden">
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


</body>

</html>