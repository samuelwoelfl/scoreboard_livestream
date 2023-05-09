</head>

<body>
    <script> 
        $(document).ready(function() {

            var urlParams = new URLSearchParams(window.location.search);
            var url_id = urlParams.get('channel');
            if (url_id == null) {
                url_id = 1;
            }
            console.log(url_id);

            // initialize variables for global usage
            active_set = 1;
            show_team_score = 0;
            show_color = 0;

            // update the page with the live data in the given interval
            setInterval(function () {
                insert_live_data(url_id, "board");
                update_set_visibilities_and_counter();
                update_team_counter_visibility();
                update_color_indicator_visibility();

            }, 250); // request every 1/4 seconds

        });
    </script>