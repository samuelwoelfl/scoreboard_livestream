<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>
    <script> 
        $(document).ready(function() {

        $set_count = 1;
        $show_team_score = 0;
        $sets = $('.set');

        function update_set() {
            $.each($sets, function(i, set) {
                if (i+1 < $set_count) {
                    $(this).show();
                    $(this).removeClass('active');
                    // highlight winner team in finished sets
                    $scores = $(this).find('p.score');
                    if ($($scores[0]).text() >= $($scores[1]).text()) {
                        $($scores[0]).addClass('winner');
                        $($scores[0]).removeClass('loser');
                        $($scores[1]).removeClass('winner');
                        $($scores[1]).addClass('loser');
                    } else {
                        $($scores[0]).addClass('loser');
                        $($scores[0]).removeClass('winner');
                        $($scores[1]).removeClass('loser');
                        $($scores[1]).addClass('winner');
                    }
                } else if (i+1 == $set_count) {
                    $(this).show();
                    $(this).addClass('active');
                    $scores = $(this).find('p.score');
                    $($scores[0]).removeClass('winner');
                    $($scores[0]).removeClass('loser');
                    $($scores[1]).removeClass('winner');
                    $($scores[1]).removeClass('loser');
                } else if (i+1 > $set_count) {
                    $(this).hide();
                    $(this).removeClass('active');
                }
            });
        }

        function update_team_counter() {
            if ($show_team_score == 1) {
                $('.group_score').show();
                $('.group-indicator').show();
            } else {
                $('.group_score').hide();
                $('.group-indicator').hide();
            }
        }
        
        setInterval(function () {
            $.ajax({
                type: "GET",
                url: "get_data.php",
                success: function (data) {
                    // update the page with the current scores
                    console.log(data);
                    $('#occasion').text(data[0]['Occasion']);
                    $('#a_teamname').text(data[0]['A_Teamname']);
                    $('#b_teamname').text(data[0]['B_Teamname']);
                    $('#score_a_1').text(data[0]['A_Score_1']);
                    $('#score_a_2').text(data[0]['A_Score_2']);
                    $('#score_a_3').text(data[0]['A_Score_3']);
                    $('#score_b_1').text(data[0]['B_Score_1']);
                    $('#score_b_2').text(data[0]['B_Score_2']);
                    $('#score_b_3').text(data[0]['B_Score_3']);
                    $('#game').text(data[0]['Game']);
                    $set_count = data[0]['Set_Count'];
                    $show_team_score = data[0]['Show_Team_Score'];
                    console.log($show_team_score);
                }
            });

            update_set();
            update_team_counter();

        }, 1000); // request every 1 seconds

        });
    </script>


    <div class="board">
        <div class="top">
            <div class="content">
                <p class="text" id="occasion">Occasion</p>
            </div>
            <div class="group-indicator"></div>
        </div>
        <div class="center">
            <div class="teams">
                <div class="team">
                    <p class="teamname" id="a_teamname">A Teamname</p>
                </div>
                <div class="team">
                    <p class="teamname" id="b_teamname">B Teamname</p>
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
                            <p class="score" id="score_a_1">1</p>
                        </div>
                        <div class="counter b_team set1">
                            <p class="score" id="score_b_1">2</p>
                        </div>
                    </div>
                    <div class="set">
                        <div class="counter a_team set2">
                            <p class="score" id="score_a_2"></p>
                        </div>
                        <div class="counter b_team set1">
                            <p class="score" id="score_b_2"></p>
                        </div>
                    </div>
                    <div class="set">
                        <div class="counter a_team set1">
                            <p class="score" id="score_a_3"></p>
                        </div>
                        <div class="counter b_team set1">
                            <p class="score" id="score_b_3"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom">
            <div class="content">
                <p class="text" id="game">Game Name</p>
                <span class="divider"></span>
                <p class="text" id="mode">Game Mode</p>
            </div>
        </div>
    </div>


</body>

</html>