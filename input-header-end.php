</head>

<body>
    <script>
        $(document).ready(function() {

            // initialize variables for global usage
            active_set = 1;
            show_team_score = 0;
            show_color = 0;

            var $channel_input = $("#channel");
            var urlParams = new URLSearchParams(window.location.search);
            var url_id = urlParams.get('channel');
            if (url_id == null) {
                url_id = 1;
            }
            change_channel(url_id, "admin");
            $channel_input.val(url_id);

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