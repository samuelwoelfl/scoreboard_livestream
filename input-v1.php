<?php include "input-header-start.php" ?>

    <link rel="stylesheet" href="style-v1.css">

<?php include "input-header-end.php" ?>



    <div class="wrapper">
        <div class="board">
            <div class="top">
                <div class="content">
                    <input type="text" class="text" id="Occasion" value="Occasion" database-variable></input>
                </div>
                <div class="set_counter_container">
                    <span>Satz:</span>
                    <input type="number" id="Set_Count" min="1" max="7" database-variable>
                </div>
            </div>
            <div class="center">
                <div class="teams">
                    <div class="team">
                        <input type="color" class="color-indicator" id="A_Color" database-variable></input>
                        <input type="text" class="teamname" id="A_Teamname" value="A Teamname" database-variable></input>
                    </div>
                    <div class="team">
                        <input type="color" class="color-indicator" id="B_Color" database-variable></input>
                        <input type="text" class="teamname" id="B_Teamname" value="B Teamname" database-variable></input>
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
                                <input type="number" class="score" id="A_Score_1" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set1">
                                <input type="number" class="score" id="B_Score_1" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set2">
                                <input type="number" class="score" id="A_Score_2" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set2">
                                <input type="number" class="score" id="B_Score_2" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set3">
                                <input type="number" class="score" id="A_Score_3" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set3">
                                <input type="number" class="score" id="B_Score_3" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set4">
                                <input type="number" class="score" id="A_Score_4" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set4">
                                <input type="number" class="score" id="B_Score_4" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set5">
                                <input type="number" class="score" id="A_Score_5" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set5">
                                <input type="number" class="score" id="B_Score_5" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set6">
                                <input type="number" class="score" id="A_Score_6" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set6">
                                <input type="number" class="score" id="B_Score_6" value="0" database-variable></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set7">
                                <input type="number" class="score" id="A_Score_7" value="0" database-variable></input>
                            </div>
                            <div class="counter b_team set7">
                                <input type="number" class="score" id="B_Score_7" value="0" database-variable></input>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bottom">
                <div class="content">
                    <input type="text" class="text" id="Game" value="" database-variable></input>
                    <span class="divider"></span>
                    <input type="text" class="text" id="Mode" value="" database-variable></input>
                </div>
            </div>
        </div>
        <div class="controls">
            <div class="team_container">
                <button class="button add team_a" id="add_point_a" change="+1">+1</button>
                <button class="button remove team_a" id="remove_point_a" change="-1">-1</button>
            </div>
            <div class="team_container">
                <button class="button add team_b" id="add_point_b" change="+1">+1</button>
                <button class="button remove team_b" id="remove_point_b" change="-1">-1</button>
            </div>
        </div>
    </div>

    <?php include "admin-settings.php" ?>

</body>

</html>