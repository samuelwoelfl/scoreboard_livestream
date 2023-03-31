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
    <h2>Input</h2>

    <script> 
        $(document).ready(function() {

            $.ajax({
                type: "GET",
                url: "get_data.php",
                success: function (data) {
                    // update the page with the current data
                    console.log(data);
                    $('#occasion').val(data[0]['Occasion']);
                    $('#a_teamname').val(data[0]['A_Teamname']);
                    $('#b_teamname').val(data[0]['B_Teamname']);
                    $('#score_a_1').val(data[0]['A_Score_1']);
                    $('#score_a_2').val(data[0]['A_Score_2']);
                    $('#score_a_3').val(data[0]['A_Score_3']);
                    $('#score_b_1').val(data[0]['B_Score_1']);
                    $('#score_b_2').val(data[0]['B_Score_2']);
                    $('#score_b_3').val(data[0]['B_Score_3']);
                    $('#game').val(data[0]['Game']);
                }
            });

            $inputs = $('input:not([type=submit]), textarea');

            $inputs.on('input', function() {
                console.log('changed');
                $.ajax({
                    type: 'POST',
                    url: 'update_data.php',
                    data: {
                        occasion: $('#occasion').val(),
                        game: $('#game').val(),
                        a_teamname: $('#a_teamname').val(),
                        b_teamname: $('#b_teamname').val(),
                        // score_a_1: $('#score_a_1').val(),
                        // score_a_2: $('#score_a_2').val(),
                        // score_a_3: $('#score_a_3').val(),
                        // score_b_1: $('#score_b_1').val(),
                        // score_b_2: $('#score_b_2').val(),
                        // score_b_3: $('#score_b_3').val(),
                    },
                    dataType: 'json',
                    // success: function(data) {
                    //     $('#debug').text(data);
                    // }
                });
            });
        });
    </script>



    <div class="board">
        <div class="top">
            <div class="content">
                <input type="text" class="text" id="occasion" value="occasion"></input>
            </div>
            <div class="group-indicator"></div>
        </div>
        <div class="center">
            <div class="teams">
                <div class="team">
                    <input type="text" class="teamname" id="a_teamname" value="A Teamname"></input>
                </div>
                <div class="team">
                    <input type="text" class="teamname" id="b_teamname" value="B Teamname"></input>
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
                            <input type="number" class="score" id="score_a_1" value="0"></input>
                        </div>
                        <div class="counter b_team set1">
                            <input type="number" class="score" id="score_b_1" value="0"></input>
                        </div>
                    </div>
                    <div class="set">
                        <div class="counter a_team set2">
                            <input type="number" class="score" id="score_a_2" value="0"></input>
                        </div>
                        <div class="counter b_team set1">
                            <input type="number" class="score" id="score_b_2" value="0"></input>
                        </div>
                    </div>
                    <div class="set">
                        <div class="counter a_team set1">
                            <input type="number" class="score" id="score_a_3" value="0"></input>
                        </div>
                        <div class="counter b_team set1">
                            <input type="number" class="score" id="score_b_3" value="0"></input>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom">
            <div class="content">
                <input type="text" class="text" id="game" value="Game Name"></input>
                <span class="divider"></span>
                <input type="text" class="text" id="mode" value="Game Mode"></input>
            </div>
        </div>
    </div>


</body>

</html>