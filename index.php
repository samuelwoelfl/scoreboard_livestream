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
    <script src="functions.js"></script>
</head>

<body>
    <script>
        $(document).ready(function() {

            // initialize variables for global usage
            active_set = 1;
            show_team_score = 0;
            show_color = 0;
            var $channel_input = $("#channel");

            // insert live data on first load to get up to date
            insert_live_data(1, "admin");
            // apply all the special variables - with a bit delay so the database values are safely loaded
            setTimeout(function() {
                update_set_visibilities();
                update_team_counter_visibility();
                update_color_indicator_visibility();
            }, 750)


            $channel_input.change(function() {
                var selectedValue = $(this).val();
                console.log("Selected value: " + selectedValue);
                change_channel(selectedValue, "admin");
            });


            // upload local data as any input values changes
            $('input:not([type=submit]), textarea').on('input', function() {
                upload_local_data($channel_input.val(), [this]);
            });


            // interaction for the score buttons
            $('.controls .button').click(function() {
                var $button = $(this);
                var active_set_elem = $('.set.active'); // check which set is active - which determines which score will be changed
                var change = Number($button.attr('change')); // set the change amount based on the attribute on the button
                var score_elem;
                var team;

                // check for which team the button is
                if ($button.hasClass('team_a')) {
                    team = 0;
                } else {
                    team = 1;
                }

                score_elem = active_set_elem.find('.score')[team] // find correct score element based on team
                score_now = Number($(score_elem).val()); // check score right now
                $(score_elem).val(score_now + change); // update to new score
                
                // upload the new score
                upload_local_data($channel_input.val(), [score_elem]);
            });


            // function for the reset scores button
            $('#reset_scores').click(function() {

                // reset all score values
                $.each($("*[id]"), function(i, elem) {
                    var id = $(elem).attr("id");
                    if (id.toLowerCase().includes('score') && !id.toLowerCase().includes('show')) {
                        $(elem).val(0);
                    }
                });

                // reset the set count
                $('#Set_Count').val(1);

                // upload the reset changes
                upload_local_data($channel_input.val());
            });

        });
    </script>


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

    <div class="settings-container">
        <h3>Settings</h3>
        <div class="settings">
            <div class="setting_entry color_container">
                <span>Channel:</span>
                <select id="channel">
                    <option value="1">1</option>
                    <option value="2">2</option>
                </select>
            </div>
            <div class="setting_entry color_container">
                <span>Farben:</span>
                <input type="checkbox" id="Show_Color" database-variable checked>
            </div>
            <div class="setting_entry group_container">
                <span>Liga (tbd):</span>
                <input type="checkbox" id="Show_Team_Score" database-variable checked>
            </div>
            <div class="setting_entry">
                <button id="reset_scores">Reset Scores</button>
            </div>
        </div>
    </div>


</body>

</html>