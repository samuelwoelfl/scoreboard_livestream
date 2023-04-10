<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoreboards</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="style_input.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>
    <script>
        $(document).ready(function() {

            $set_count = 1;
            $show_team_score = 0;
            $show_color = 0;
            $sets = $('.set');
            $inputs = $('input:not([type=submit]), textarea');
            $add_point_a_button = $('#add_point_a');
            $remove_point_a_button = $('#remove_point_a');
            $add_point_b_button = $('#add_point_b');
            $remove_point_b_button = $('#remove_point_b');
            $reset_scores_button = $('#reset_scores');

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
                console.log('update team counter');
                console.log($show_team_score);
                if ($show_team_score == 1) {
                    $('.group_score').show();
                    $('.group-indicator').show();
                } else {
                    $('.group_score').hide();
                    $('.group-indicator').hide();
                }
            }


            function update_color() {
                console.log('update show color');
                console.log($show_color);
                if ($show_color == 1) {
                    $('.color-indicator').show();
                } else {
                    $('.color-indicator').hide();
                }
            }


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
                    $('#score_a_4').val(data[0]['A_Score_4']);
                    $('#score_a_5').val(data[0]['A_Score_5']);
                    $('#score_a_6').val(data[0]['A_Score_6']);
                    $('#score_a_7').val(data[0]['A_Score_7']);
                    $('#score_b_1').val(data[0]['B_Score_1']);
                    $('#score_b_2').val(data[0]['B_Score_2']);
                    $('#score_b_3').val(data[0]['B_Score_3']);
                    $('#score_b_4').val(data[0]['B_Score_4']);
                    $('#score_b_5').val(data[0]['B_Score_5']);
                    $('#score_b_6').val(data[0]['B_Score_6']);
                    $('#score_b_7').val(data[0]['B_Score_7']);
                    $('#a_color').val(data[0]['A_Color']);
                    $('#b_color').val(data[0]['B_Color']);
                    $('#game').val(data[0]['Game']);
                    $('#mode').val(data[0]['Mode']);
                    $set_count = data[0]['Set_Count'];
                    $('#set_counter').val($set_count);

                    $show_team_score = data[0]['Show_Team_Score'];
                    if ($show_team_score == 1) {
                        $('#show_team_score').prop("checked", true);
                    } else {
                        $('#show_team_score').prop("checked", false);
                    }

                    $show_color = data[0]['Show_Color'];
                    if ($show_color == 1) {
                        $('#show_color').prop("checked", true);
                    } else {
                        $('#show_color').prop("checked", false);
                    }
                }
            });

            function update_count() {
                $set_count = $('#set_counter').val();

                if ($('#show_team_score').is(":checked")) {
                    $show_team_score = 1
                } else {
                    $show_team_score = 0
                }

                if ($('#show_color').is(":checked")) {
                    $show_color = 1
                } else {
                    $show_color = 0
                }

                $.ajax({
                    type: 'POST',
                    url: 'update_data.php',
                    data: {
                        occasion: $('#occasion').val(),
                        game: $('#game').val(),
                        mode: $('#mode').val(),
                        a_teamname: $('#a_teamname').val(),
                        b_teamname: $('#b_teamname').val(),
                        score_a_1: $('#score_a_1').val(),
                        score_a_2: $('#score_a_2').val(),
                        score_a_3: $('#score_a_3').val(),
                        score_a_4: $('#score_a_4').val(),
                        score_a_5: $('#score_a_5').val(),
                        score_a_6: $('#score_a_6').val(),
                        score_a_7: $('#score_a_7').val(),
                        score_b_1: $('#score_b_1').val(),
                        score_b_2: $('#score_b_2').val(),
                        score_b_3: $('#score_b_3').val(),
                        score_b_4: $('#score_b_4').val(),
                        score_b_5: $('#score_b_5').val(),
                        score_b_6: $('#score_b_6').val(),
                        score_b_7: $('#score_b_7').val(),
                        set_count: $('#set_counter').val(),
                        show_team_score: $show_team_score,
                        show_color: $show_color,
                        color_a: $('#a_color').val(),
                        color_b: $('#b_color').val(),
                    },
                    dataType: 'json',
                    // success: function(data) {
                    //     $('#debug').text(data);
                    // }
                });

                update_set();
                update_team_counter();
                update_color();
            }


            setTimeout(function() {
                update_set();
                update_team_counter();
                update_color();
            }, 500)


            $inputs.on('input', function() {
                update_count();
            });


            $add_point_a_button.click(function() {
                active_set = 0;
                $.each($sets, function(i, set) {
                    if (this.classList.contains('active')) {
                        active_set = i+1;
                        score_to_change = $(this).find('.score')[0];
                        score_now = Number($(score_to_change).val());
                        $(score_to_change).val(score_now + 1);
                    }
                });
                update_count();
            });


            $remove_point_a_button.click(function() {
                active_set = 0;
                $.each($sets, function(i, set) {
                    if (this.classList.contains('active')) {
                        active_set = i+1;
                        score_to_change = $(this).find('.score')[0];
                        score_now = Number($(score_to_change).val());
                        $(score_to_change).val(score_now - 1);
                    }
                });
                update_count();
            });

            $add_point_b_button.click(function() {
                active_set = 0;
                $.each($sets, function(i, set) {
                    if (this.classList.contains('active')) {
                        active_set = i+1;
                        score_to_change = $(this).find('.score')[1];
                        score_now = Number($(score_to_change).val());
                        $(score_to_change).val(score_now + 1);
                    }
                });
                update_count();
            });

            $remove_point_b_button.click(function() {
                active_set = 0;
                $.each($sets, function(i, set) {
                    if (this.classList.contains('active')) {
                        active_set = i+1;
                        score_to_change = $(this).find('.score')[1];
                        score_now = Number($(score_to_change).val());
                        $(score_to_change).val(score_now - 1);
                    }
                });
                update_count();
            });

            $reset_scores_button.click(function() {
                $('#score_a_1').val(0);
                $('#score_a_2').val(0);
                $('#score_a_3').val(0);
                $('#score_a_4').val(0);
                $('#score_a_5').val(0);
                $('#score_a_6').val(0);
                $('#score_a_7').val(0);
                $('#score_b_1').val(0);
                $('#score_b_2').val(0);
                $('#score_b_3').val(0);
                $('#score_b_4').val(0);
                $('#score_b_5').val(0);
                $('#score_b_6').val(0);
                $('#score_b_7').val(0);
                $('#set_counter').val(1);
                update_count();
            });
        });
    </script>


    <div class="wrapper">
        <div class="board">
            <div class="top">
                <div class="content">
                    <input type="text" class="text" id="occasion" value="occasion"></input>
                </div>
                <div class="set_counter_container">
                    <span>Satz:</span>
                    <input type="number" id="set_counter" min="1" max="7">
                </div>
            </div>
            <div class="center">
                <div class="teams">
                    <div class="team">
                        <input type="color" class="color-indicator" id="a_color"></input>
                        <input type="text" class="teamname" id="a_teamname" value="A Teamname"></input>
                    </div>
                    <div class="team">
                        <input type="color" class="color-indicator" id="b_color"></input>
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
                            <div class="counter b_team set2">
                                <input type="number" class="score" id="score_b_2" value="0"></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set3">
                                <input type="number" class="score" id="score_a_3" value="0"></input>
                            </div>
                            <div class="counter b_team set3">
                                <input type="number" class="score" id="score_b_3" value="0"></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set4">
                                <input type="number" class="score" id="score_a_4" value="0"></input>
                            </div>
                            <div class="counter b_team set4">
                                <input type="number" class="score" id="score_b_4" value="0"></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set5">
                                <input type="number" class="score" id="score_a_5" value="0"></input>
                            </div>
                            <div class="counter b_team set5">
                                <input type="number" class="score" id="score_b_5" value="0"></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set6">
                                <input type="number" class="score" id="score_a_6" value="0"></input>
                            </div>
                            <div class="counter b_team set6">
                                <input type="number" class="score" id="score_b_6" value="0"></input>
                            </div>
                        </div>
                        <div class="set">
                            <div class="counter a_team set7">
                                <input type="number" class="score" id="score_a_7" value="0"></input>
                            </div>
                            <div class="counter b_team set7">
                                <input type="number" class="score" id="score_b_7" value="0"></input>
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
        <div class="controls">
            <div class="team_container">
                <button class="button add" id="add_point_a">+1</button>
                <button class="button remove" id="remove_point_a">-1</button>
            </div>
            <div class="team_container">
                <button class="button add" id="add_point_b">+1</button>
                <button class="button remove" id="remove_point_b">-1</button>
            </div>
        </div>
    </div>

    <div class="settings-container">
        <h3>Settings</h3>
        <div class="settings">
            <div class="setting_entry color_container">
                <span>Farben:</span>
                <input type="checkbox" id="show_color" checked>
            </div>
            <div class="setting_entry group_container">
                <span>Liga (tbd):</span>
                <input type="checkbox" id="show_team_score" checked>
            </div>
            <div class="setting_entry">
                <button id="reset_scores">Reset Scores</button>
            </div>
        </div>
    </div>


</body>

</html>