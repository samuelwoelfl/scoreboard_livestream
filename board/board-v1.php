<?php include "board-header-start.php" ?>

<link rel="stylesheet" href="../css/style-v1.css">

<?php include "board-header-end.php" ?>


<div class="wrapper">
    <div class="board">
        <div class="top">
            <div class="content">
                <p class="text" id="Occasion">Occasion</p>
            </div>
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
                    <div class="group-indicator">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M9.74154 6.0015C9.7414 6.39553 9.66136 6.78568 9.50597 7.14967C9.35058 7.51365 9.12289 7.84435 8.8359 8.12288C8.54892 8.40141 8.20825 8.62232 7.83336 8.77298C7.45847 8.92365 7.05669 9.00113 6.65096 9.001C6.03991 9.0008 5.44263 8.82463 4.93467 8.49477C4.42671 8.16491 4.03088 7.69616 3.79723 7.14782C3.56358 6.59947 3.5026 5.99615 3.62201 5.41415C3.74142 4.83215 4.03586 4.29761 4.46808 3.87812C4.90031 3.45863 5.45091 3.17304 6.05026 3.05746C6.64961 2.94188 7.2708 3.0015 7.83526 3.22878C8.39972 3.45607 8.88211 3.84081 9.22143 4.33434C9.56074 4.82788 9.74174 5.40806 9.74154 6.0015V6.0015ZM11.8019 16.999H1.5V15.002C1.5 14.206 1.82561 13.4425 2.40521 12.8796C2.9848 12.3167 3.7709 12.0005 4.59058 12.0005H8.71135C9.53102 12.0005 10.3171 12.3167 10.8967 12.8796C11.4763 13.4425 11.8019 14.206 11.8019 15.002V17V16.999Z"
                                stroke="white" stroke-width="1.4" stroke-linecap="square" />
                            <path
                                d="M16.4396 6.0015C16.4395 6.39553 16.3594 6.78568 16.204 7.14967C16.0487 7.51365 15.821 7.84435 15.534 8.12288C15.247 8.40141 14.9063 8.62232 14.5314 8.77298C14.1565 8.92365 13.7548 9.00113 13.349 9.001C12.738 9.0008 12.1407 8.82463 11.6327 8.49477C11.1248 8.16491 10.729 7.69616 10.4953 7.14782C10.2617 6.59947 10.2007 5.99615 10.3201 5.41415C10.4395 4.83215 10.7339 4.29761 11.1662 3.87812C11.5984 3.45863 12.149 3.17304 12.7483 3.05746C13.3477 2.94188 13.9689 3.0015 14.5333 3.22878C15.0978 3.45607 15.5802 3.84081 15.9195 4.33434C16.2588 4.82788 16.4398 5.40806 16.4396 6.0015ZM18.5 16.999H8.19807V15.002C8.19807 14.206 8.52369 13.4425 9.10328 12.8796C9.68288 12.3167 10.469 12.0005 11.2887 12.0005H15.4094C16.2291 12.0005 17.0152 12.3167 17.5948 12.8796C18.1744 13.4425 18.5 14.206 18.5 15.002V17V16.999Z"
                                fill="var(--red)" stroke="white" stroke-width="1.4" stroke-linecap="square" />
                        </svg>
                    </div>
                    <div class="counter group">
                        <p class="score" id="A_Score_Team"></p>
                    </div>
                    <div class="counter group">
                    <p class="score" id="B_Score_Team"></p>
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