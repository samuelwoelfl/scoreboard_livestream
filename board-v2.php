<?php include "header.php" ?>

    <link rel="stylesheet" href="style-v2.css">

<?php include "body.php" ?>


    <div class="wrapper">
        <div class="board">

            <div class="top">

                <div class="team left">
                    <div class="score">
                        <p id="A_Score_1"></p>
                    </div>
                    <div class="name">
                        <div class="content">
                            <p class="teamname" id="A_Teamname">A Teamname</p>
                            <p class="teammembers" id="A_Teammembers">N. Alt & D. Ameziane</p>
                        </div>
                    </div>
                </div>

                <div class="game">
                    <p class="text" id="Game">Game Name</p>
                    <div class="sets_counter">
                        <span id="a_sets_won">1</span>
                        <span>:</span>
                        <span id="b_sets_won">0</span>
                    </div>
                </div>

                <div class="team right">
                    <div class="name">
                        <div class="content">
                            <p class="teamname" id="B_Teamname">A Teamname</p>
                            <p class="teammembers" id="B_Teammembers">N. Alt & D. Ameziane</p>
                        </div>
                    </div>
                    <div class="score">
                        <p id="B_Score_1"></p>
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


</body>

</html>