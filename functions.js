

// helper funtion to dertermine if a value is a number
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}


// helper function to convert rgb value to hex value
function rgb2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


// helper function to check if a color is "light"
function isLight(hexColor) {
    var r = parseInt(hexColor.substr(1, 2), 16);
    var g = parseInt(hexColor.substr(3, 2), 16);
    var b = parseInt(hexColor.substr(5, 2), 16);

    // change the value at the end of the formula to change the lightness threshold - lower is darker
    return (r * 299 + g * 587 + b * 114) / 1000 > 230;
}


// helper function to store all the css changes for the accessibility border centralized
function addAccessibilityBorder(elem) {
    var $elem = $(elem);
    $elem.css("border", "1px solid #bbbbbb");
    $elem.css("box-sizing", "content-box");
    $elem.css("margin-left", "-1px");
    $elem.css("width", "5px");
    // $elem.css("margin-right", "-1px");
}


// helper function to store all the css changes before the accessibility border centralized
function removeAccessibilityBorder(elem) {
    var $elem = $(elem);
    $elem.css("border", "0px");
    $elem.css("box-sizing", "border-box");
    $elem.css("margin-left", "0px");
    $elem.css("width", "6px");
    // $elem.css("margin-right", "0px");
}


// function that inserts the data from the database in the html
function insert_live_data(type) {
    $.ajax({
        type: "GET",
        url: "get_data.php",
        success: function (data) {
            
            // Go through all entries in the database response
            $.each((data[0]), function(key, value) {
    
                // Only use real DB returns - DB also returns values with a number count instead of key name (e.g. 0: 'teamname')
                if (!isNumeric(key)) {
    
                    // Handle background special variables
                    if (key == "Set_Count") {
                        active_set = value;
                        if (type == "admin") {
                            $('#Set_Count').val(active_set);
                        }
                    } else if (key == "Show_Team_Score") {
                        show_team_score = value;
                    } else if (key == "Show_Color") {
                        show_color = value;
                        
                    // Handly everything else
                    } else {
                        // Go through all html elements that have an id
                        $.each($("*[id]"), function(j, elem) {
    
                            // extract id value
                            var id = $(elem).attr("id")
    
                            // Check if element id matches key name
                            if (id == key) {
    
                                // Handle team colors
                                if (key.toLowerCase().includes("color")) {
                                    if (type == "board") {
                                        $(elem).css("background-color", value);
                                        if (isLight(rgb2hex(value))) {
                                            addAccessibilityBorder(elem);
                                        } else {
                                            removeAccessibilityBorder(elem);
                                        }
                                    } else if (type == "admin") {
                                        $(elem).val(value);
                                    }
    
                                // Handle everything else
                                } else {
                                    if (type == "board") {
                                        $(elem).text(value);
                                    } else if (type == "admin") {
                                        $(elem).val(value);
                                    }
                                }
    
                            }
                        });
                    }   
                }
            });
        }
    });
}


// helper function to update the active set
function update_set_visibilities() {

    // go through all html .set elements
    $.each($('.set'), function(i, set) {
        var $set = $(set);

        // extract scores from this set
        var $score_elems = $set.find('p.score');
        var $score_team_a = $($score_elems[0]);
        var $score_team_b = $($score_elems[1]);
        var score_1 = Number($score_team_a.text());
        var score_2 = Number($score_team_b.text());

        // select set elements that are below the active set - finished sets
        if (i+1 < active_set) {

            // show and make not active
            $set.show();
            $set.removeClass('active');

            // highlight winner team
            // if first team has the higher score
            if (score_1 > score_2) {
                $score_team_a.removeClass('loser').addClass('winner');
                $score_team_b.removeClass('winner').addClass('loser');

            // if second team has the higher score
            } else if (score_1 < score_2) {
                $score_team_a.removeClass('winner').addClass('loser');
                $score_team_b.removeClass('loser').addClass('winner');

            // if scores are equal
            } else {
                $score_team_a.removeClass('winner').addClass('lose');
                $score_team_b.removeClass('winner').addClass('loser');
            }

        // select active set
        } else if (i+1 == active_set) {

            // show and make active
            $set.show();
            $set.addClass('active');

            // remove classes for finished sets
            $score_team_a.removeClass('winner').removeClass('loser');
            $score_team_b.removeClass('winner').removeClass('loser');
        
        // select sets above the active set
        } else if (i+1 > active_set) {

            // hide and make not active
            $set.hide();
            $set.removeClass('active');
        }
    });
}


// helper function to update if the team counter get's shown
function update_team_counter_visibility() {
    if (show_team_score == 1) {
        $('.group_score').show();
        $('.group-indicator').show();
        $('#show_team_score').prop("checked", true);
    } else {
        $('.group_score').hide();
        $('.group-indicator').hide();
        $('#show_team_score').prop("checked", false);
    }
}


// helper function to update if the team colors get shown
function update_color_indicator_visibility() {
    if (show_color == 1) {
        $('.color-indicator').show();
        $('#show_color').prop("checked", true);
    } else {
        $('.color-indicator').hide();
        $('#show_color').prop("checked", false);
    }
}


// function that uploads all the local data to the database
function upload_local_data(elemList) {
    active_set = $('#Set_Count').val();

    if ($('#show_team_score').is(":checked")) {
        show_team_score = 1
    } else {
        show_team_score = 0
    }

    if ($('#show_color').is(":checked")) {
        show_color = 1
    } else {
        show_color = 0
    }

    // go through element list
    // TODO: wenn es keine elemList gibt, alle aktualisieren 
    console.log("elemList: ", elemList);
    var dataObject = {};
    $.each($(elemList), function(i, elem) {
        var $elem = $(elem);
        var id = $elem.attr("id");
        var value = $elem.val();
        dataObject[id] = value;
    });
    console.log(dataObject);

    // check if dataObject has entries and if so upload them
    if (Object.keys(dataObject).length > 0) {
        console.log("hat daten");
        
    // if the dataObject has no entries, upload all data
    } else {
        console.log("hat keine daten");
    }
    

    $.ajax({
        type: 'POST',
        url: 'update_data.php',
        data: {
            Occasion: $('#Occasion').val(),
            Game: $('#Game').val(),
            Mode: $('#Mode').val(),
            A_Teamname: $('#A_Teamname').val(),
            B_Teamname: $('#B_Teamname').val(),
            A_Score_1: $('#A_Score_1').val(),
            A_Score_2: $('#A_Score_2').val(),
            A_Score_3: $('#A_Score_3').val(),
            A_Score_4: $('#A_Score_4').val(),
            A_Score_5: $('#A_Score_5').val(),
            A_Score_6: $('#A_Score_6').val(),
            A_Score_7: $('#A_Score_7').val(),
            B_Score_1: $('#B_Score_1').val(),
            B_Score_2: $('#B_Score_2').val(),
            B_Score_3: $('#B_Score_3').val(),
            B_Score_4: $('#B_Score_4').val(),
            B_Score_5: $('#B_Score_5').val(),
            B_Score_6: $('#B_Score_6').val(),
            B_Score_7: $('#B_Score_7').val(),
            Set_Count: $('#Set_Count').val(),
            Show_Team_Score: show_team_score,
            Show_Color: show_color,
            A_Color: $('#A_Color').val(),
            B_Color: $('#B_Color').val(),
        },
        dataType: 'json',
    });

    update_set_visibilities();
    update_team_counter_visibility();
    update_color_indicator_visibility();
}