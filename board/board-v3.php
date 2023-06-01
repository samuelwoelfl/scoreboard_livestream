<?php include "board-header-start.php" ?>

    <link rel="stylesheet" href="../css/style-v3.css">
    <link rel="manifest" href="../manifest.json">

<?php include "board-header-end.php" ?>


    <div class="wrapper">
        <div class="board">

        <div class="top">
            <div class="content">
                <p lang="de" class="text" id="Game">Game</p>
                <span class="divider"></span>
                <p lang="de" class="text" id="Mode">Mode</p>
            </div>
        </div>

        <div class="bottom">

            <div class="team team_a">
                <div class="name">
                    <p lang="de" class="teamname text" id="A_Teamname">A Teamname</p>
                </div>
                <div class="score">
                    <div class="active_card">
                      <p lang="de" id="A_Score_Active">0</p>
                    </div>
                    <div class="sets_card">
                      <span id="a_sets_won">0</span>
                    </div>
                </div>
            </div>

            <div class="team team_b">
                <div class="name">
                    <p lang="de" class="teamname text" id="B_Teamname">B Teamname</p>
                </div>
                <div class="score">
                  <div class="sets_card">
                    <span id="b_sets_won">0</span>
                  </div>
                  <div class="active_card">
                    <p lang="de" id="B_Score_Active">0</p>
                  </div>
                </div>
            </div>
            
        </div>  

        </div>
    </div>

    <div class="hidden">
        <div class="color-indicator" id="A_Color"></div>
        <div class="color-indicator" id="B_Color"></div>
        <div class="team_score">
            <div class="set active">
                <div class="counter a_team set1">
                    <p lang="de" class="score" id="A_Score_1"></p>
                </div>
                <div class="counter b_team set1">
                    <p lang="de" class="score" id="B_Score_1"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set2">
                    <p lang="de" class="score" id="A_Score_2"></p>
                </div>
                <div class="counter b_team set2">
                    <p lang="de" class="score" id="B_Score_2"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set3">
                    <p lang="de" class="score" id="A_Score_3"></p>
                </div>
                <div class="counter b_team set3">
                    <p lang="de" class="score" id="B_Score_3"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set4">
                    <p lang="de" class="score" id="A_Score_4"></p>
                </div>
                <div class="counter b_team set4">
                    <p lang="de" class="score" id="B_Score_4"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set5">
                    <p lang="de" class="score" id="A_Score_5"></p>
                </div>
                <div class="counter b_team set5">
                    <p lang="de" class="score" id="B_Score_5"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set6">
                    <p lang="de" class="score" id="A_Score_6"></p>
                </div>
                <div class="counter b_team set6">
                    <p lang="de" class="score" id="B_Score_6"></p>
                </div>
            </div>
            <div class="set">
                <div class="counter a_team set7">
                    <p lang="de" class="score" id="A_Score_7"></p>
                </div>
                <div class="counter b_team set7">
                    <p lang="de" class="score" id="B_Score_7"></p>
                </div>
            </div>
        </div>
    </div>


</body>

</html>