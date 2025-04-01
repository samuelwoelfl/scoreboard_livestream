import { themes, readData, getPathsAndValues, getColorBrightness, rgb2hex, writeData, showToast, copyToClipboard } from "./main.js";

export class Scoreboard {
    // Konstruktor
    constructor(type = 'input', $html_frame = $('.scoreboard'), $led_control_html_frame, channel, theme = 'rg', user = null) {
        this.type = type;
        this.user = user;
        // Frontend elements
        this.$html_frame = $html_frame;
        this.$led_control_html_frame = $led_control_html_frame;
        this.$themeInput = $('#theme');
        this.$channelInput = $('#channel');
        this.$scoreChangeButtons = $('.button[team][change]');
        this.$setChangeButtons = $('.set_controls_container .button');
        this.$scoreboardInputs = this.$html_frame.find($('input:not([type=submit]), textarea'));
        this.$ledControlInputs = this.$led_control_html_frame.find('input:not([type=submit])');
        this.$setCounter = $('#Set_Count');
        this.$resetScoresButton = $('#reset_scores');
        this.$sets = $('.set');
        this.$setScoreCounterA = $('.a_sets_won');
        this.$setScoreCounterB = $('.b_sets_won');
        this.$activeScoreCounterA = $('.a_score_active');
        this.$activeScoreCounterB = $('.b_score_active');
        this.$settingsEntries = $('.setting_entry.boolean input');
        this.$urlOutputContainer = $('.url_output_container');
        this.$urlOutput = $('.url_output');
        this.$logoutButton = $('#logout');
        this.$ledBrightness = $('#brightness_value');
        this.$useTeamColors = $('#use_team_colors');
        this.use_team_colors = 1;
        this.prev_use_team_colors = 0;
        this.$useTeamColors.prop('checked', this.use_team_colors);
        this.teamAColor = null;
        this.teamBColor = null;
        this.teamAColorLED = "#0000ff";
        this.teamBColorLED = "#ff0000";
        this.$teamAColorLED = $('#team_a_color_led');
        this.$teamBColorLED = $('#team_b_color_led');
        this.$teamAColorLED.val(this.teamAColorLED);
        this.$teamBColorLED.val(this.teamBColorLED);
        this.channel = Number(channel);
        this.theme = theme;
        this.settings = {
            "show_player_names": 1,
            "show_color": 1,
            "show_group_score": 0,
            "show_serve_indicator": 0,
        }
        this.led_brightness = 100;
        this.active_set = 1;
        this.event_history = [];
        this.data_interval;
        this.update_interval;
        // Init function
        this.init();
    }

    init() {
        this.initEventListeners();
        this.updateAvailableChannels();
        this.uploadInitialData();
        this.insertLiveData();

        this.update_interval = setInterval(() => {
            this.updateUI();
        }, 300);

        if (this.type == 'input') {
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 1500);
        } else {
            this.setTheme(this.theme);
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 300);
        }
    }

    uploadInitialData(){
        this.uploadData([this.$useTeamColors]);
        this.uploadData([this.$teamAColorLED, this.$teamBColorLED])
    }

    updateUI() {
        this.updateSets();
        this.updateSetScore();
        this.updateActiveScore();
        this.updateIndicators();
        this.updateSettings();
        this.updateLedSettings()
        this.handleEventHistory();
    }

    setTheme(theme) {
        // fallback theme
        if (!(theme in themes)) {
            if (this.type == 'output') {
                theme = 'full';
            } else {
                theme = 'rg';
            }
        }

        // set corresponding css
        var css_path = themes[theme]['css_path'];
        var extensionIndex = css_path.lastIndexOf('.');
        var css_path_input = css_path.slice(0, extensionIndex) + "_input" + css_path.slice(extensionIndex);

        // remove all stylesheets
        $('link[rel="stylesheet"]').remove();

        // add relevant stylesheets
        $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', '../css/base.css').appendTo('head');
        $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', css_path).appendTo('head');
        if (this.type == 'input') {
            $('<link>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', css_path_input).appendTo('head');
        } else if (this.type == 'output') {
            // set corresponding html
            var html_structure = themes[theme]['html_structure'];
            $('.scoreboard').hide();
            $(`.scoreboard[theme="${html_structure}"]`).show();
        }
    }


    initEventListeners() {
        // Theme input dropdown listener
        this.$themeInput.change((event) => {
            this.theme = $(event.target).val();
            this.updateUrlOutput();
        });

        // Channel input dropdown listener
        this.$channelInput.change((event) => {
            this.channel = $(event.target).val();
            this.insertLiveData();
            this.updateUI();
        });

        this.$urlOutputContainer.click((event) => {
            var text = this.$urlOutput.attr('href');
            copyToClipboard(text);
            showToast('📋', 'Copied url to clipboard')
        });

        this.$scoreboardInputs.filter('[fb-data*="score"]').on('input', (event) => {
            var team = this.getScoreElemDetails($(event.target))['team'];
            this.event_history.push(`score_${team}`);
            // this.event_history.push($(event.target));
        });
        
        // upload local data as any board input values changes
        this.$scoreboardInputs.on('input', (event) => {
            const $target = $(event.target);
            if (this.use_team_colors){
                if ($target.attr("fb-data") === "teams_info.team_a.color"){
                    this.teamAColor = $target.val()
                    $('#digit1 .segment').css('background-color', this.teamAColor);
                    $('#digit2 .segment').css('background-color', this.teamAColor);
                } else if ($target.attr("fb-data") === "teams_info.team_b.color"){
                    this.teamBColor = $target.val()
                    $('#digit3 .segment').css('background-color', this.teamBColor);
                    $('#digit4 .segment').css('background-color', this.teamBColor);
                }
            }
            this.uploadData([$(event.target)]);
        });

        // upload local data as any led control input values changes
        this.$ledControlInputs.on('input', (event) => {
            const $target = $(event.target);
            if ($target.attr("fb-data") === "led_board_settings.brightness"){
                this.led_brightness = $target.val()
                this.$ledBrightness.text(this.led_brightness);
                $('input[type="range"][fb-data="led_board_settings.brightness"]').val(this.led_brightness);
            } else if ($target.attr("fb-data") === "led_board_settings.use_team_colors") {
                this.use_team_colors = $target[0].checked;
            }
            this.uploadData([$target]);
        });

        // Event listener for color change
        $('.led-color-indicator').off('input').on('input', (event) => {
            const $target = $(event.target);
            const selectedColor = $target.val();
            const isTeamA = $target.attr('fb-data') === 'led_board_settings.team_a_color';

            // Store and apply the selected color
            if (isTeamA) {
                this.teamAColorLED = selectedColor;
                this.$teamAColorLED.val(this.teamAColorLED);
                this.uploadData([this.$teamAColorLED]);
                $('#digit1 .segment').css('background-color', selectedColor);
                $('#digit2 .segment').css('background-color', selectedColor);
            } else {
                this.teamBColorLED = selectedColor;
                this.$teamBColorLED.val(this.teamBColorLED);
                this.uploadData([this.$teamBColorLED]);
                $('#digit3 .segment').css('background-color', selectedColor);
                $('#digit4 .segment').css('background-color', selectedColor);
            }
        });

        // interaction for the score buttons
        this.$scoreChangeButtons.click((event) => {
            var $scoreButton = $(event.target);
            var $active_set_elem = $('.set.active'); // check which set is active - which determines which score will be changed
            var team = $scoreButton.attr('team'); // set the team based on the attribute on the button
            var change = Number($scoreButton.attr('change')); // set the change amount based on the attribute on the button

            var $score_elem = $active_set_elem.find(`.score[fb-data*="team_${team}"]`);

            var score_now = Number($($score_elem).val()); // check score right now
            if (score_now + change >= 0) {
                $score_elem.val(score_now + change); // update to new score
                $score_elem.trigger('input');
            }
        });

        this.$setCounter.on('input', (event) => {
            this.event_history.push('set');
            this.updateSets();
        })

        // interaction for the set buttons
        this.$setChangeButtons.click((event) => {
            var $setButton = $(event.target);
            var change = Number($setButton.attr('change'));

            var set_now = Number(this.$setCounter.val()); // check set right now
            if (set_now + change > 0 && set_now + change <= 7) {
                this.active_set = set_now + change;
                this.$setCounter.trigger('input');
                this.updateSets();
                this.uploadData([this.$setCounter]); // upload the new set
            }
        });

        this.$settingsEntries.click((event) => {
            var $trigger = $(event.target);
            var value = $trigger.prop('checked') == true ? 1 : 0;
            var part = $trigger.attr('fb-data').split('.').pop();
            this.settings[part] = value;
            this.updateSettings();
            this.uploadData([$trigger]);
        });

        // function for the reset scores button
        this.$resetScoresButton.click((event) => {
            $.each($('[fb-data*="score"]'), function (i, elem) {
                $(elem).val(0);
            });

            this.active_set = 1;
            this.updateSets();
            this.event_history.push('reset');

            this.uploadData();
        });

        // logout button
        this.$logoutButton.click(function () {
            localStorage.clear();
            location.reload();
        });
    }

    async insertLiveData() {
        console.log("inserting live data for channel ", this.channel);

        // receive data from firebase
        var data = await readData(this.channel);
        var pathsAndValues = getPathsAndValues(data);

        let self = this;
        // go through values and insert them
        $.each(pathsAndValues, function (path, value) {
            var $elem = $('[fb-data="' + path + '"]'); // Element mit passendem fb-data Attribut finden

            if (path.includes('event_history')) {
                if (value.length > 0) {
                    value = value.split(";")
                } else {
                    value = []
                }
                self.event_history = value;
            } else if (path.includes('admin_settings')) {
                self.insertAdminSetting(path, value);
            } else if (path.includes('teams_info') && path.includes('color')) {
                self.insertColor($elem, path, value);
            } else if (path.includes('active_set')) {
                self.active_set = value;
            } else if (path.includes('led_board_settings.brightness')){
                self.led_brightness = value
            } else if (path.includes('led_board_settings.use_team_colors')){
                self.use_team_colors = value
            } else if (path.includes('led_board_settings.team_a_color')){
                self.teamAColorLED = value
            } else if (path.includes('led_board_settings.team_b_color')){
                self.teamBColorLED = value
            } else {
                if ($elem.is('input')) {
                    $elem.val(value);
                } else {
                    $elem.text(value);
                }
            }
        });
    }

    async insertAdminSetting(path, value) {
        var part = path.split('.').pop();
        this.settings[part] = value;
    }

    async insertColor($elem, path, value) {
        var color = value;
        var brightness = getColorBrightness(rgb2hex(value));

        if (brightness <= 23) { // clip at dark values to prevent complete black
            color = '#222222';
        }

        if (path.includes('team_a')) {
            var team = 'a';
            this.teamAColor = color
        } else if (path.includes('team_b')) {
            var team = 'b';
            this.teamBColor = color
        }

        if ($elem.is('input')) {
            $elem.val(value);
        } else {
            $('html').css("--" + team.toUpperCase() + "_Color", color); // Add color to css variable

            var $team_elems = $(`.team.team_${team}`); // All elements from this team

            if (brightness >= 230) {
                $elem.addClass('light');
                $team_elems.addClass('light');
            } else if (brightness >= 150) {
                $elem.removeClass('light');
                $team_elems.addClass('light');
            } else {
                $elem.removeClass('light');
                $team_elems.removeClass('light');
            }
        }
    }

    async uploadData(elemList) {
        // check if selected channel is allowed
        if (this.user && this.channel && this.user.channels.includes(Number(this.channel))) {
            // upload all if there are no specific elements
            if (typeof elemList == 'undefined') {
                elemList = $("*[fb-data]");
            }

            // upload all data to firebase
            self = this;
            const newData = {};
            this.handleEventHistory();
            newData[`/match-${self.channel}/event_history`] = this.event_history.join(';');
            $.each($(elemList), function (i, elem) {
                let value;

                // Check if the element is a checkbox
                if ($(elem).is(":checkbox")) {
                    value = $(elem).is(":checked") ? 1 : 0; // Set the value to 1 or 0
                } else {
                    value = $(elem).val(); // Retrieve the value of the element
                }

                // Create a path based on the fb-data attribute
                let fbDataAttr = $(elem).attr("fb-data");
                if (fbDataAttr) {
                    // Replace the dots in the fb-data attribute with a slash
                    let dbSelector = fbDataAttr.replace(/\./g, '/');
                    // Create the full path for Firebase
                    let path_to_variable = `/match-${self.channel}/${dbSelector}`;

                    // Check if the value can be converted to an integer
                    if (path_to_variable.includes('score') || path_to_variable.includes('active_set')) {
                        try {
                            value = parseInt(value);
                        } catch (error) {
                            console.error(value, " can't be converted to integer");
                        }
                    }

                    // Add the path and the value to the newData object
                    newData[path_to_variable] = value;
                }
            });

            writeData(newData);

        } else if (channel) {
            showToast("❌", "You're not authenticated for this channel");
        }
    }

    getPlayedSets() {
        let playedSets = [];
        let self = this;

        $.each(self.$sets, function (i, set) {
            if (i + 1 < self.active_set) {
                playedSets.push(set);
            }
        });

        return playedSets;
    }

    getScoreElem(set, team) {
        return $(this.$sets[set - 1]).find(`[fb-data*="score"][fb-data*="team_${team}"]`);
    }

    getScoreElemDetails($score_elem) {
        const fbDataAttr = $score_elem.attr('fb-data');

        if (!fbDataAttr) {
            return null; // Rückgabe, falls das Attribut nicht vorhanden ist
        }

        // Prüfe, welches Team im Attribut enthalten ist
        const team = fbDataAttr.includes('team_a') ? 'a' : (fbDataAttr.includes('team_b') ? 'b' : null);

        // Extrahiere die Set-Nummer mit einem regulären Ausdruck
        const setMatch = fbDataAttr.match(/set_(\d+)/);
        const set = setMatch ? setMatch[1] : null;

        // Gebe Team und Set-Nummer als Objekt zurück
        return {
            team: team,
            set: set
        };
    }

    getScore(set, team) {
        var $score_elem = this.getScoreElem(set, team);
        if ($score_elem.is('input')) {
            var score = Number($score_elem.val());
        } else {
            var score = Number($score_elem.text());
        }
        
        return score;
    }

    getWinner(set) {
        var score_a = this.getScore(set, 'a');
        var score_b = this.getScore(set, 'b');
        if (score_a > score_b) {
            return 'a';
        } else if (score_b > score_a) {
            return 'b';
        } else {
            return null;
        }
    }

    getSetScore(team) {
        var set_score = 0;
        let self = this;

        $.each((self.getPlayedSets()), function (i, set) {
            if (self.getWinner(i + 1) == team) {
                set_score += 1;
            }

        });

        return set_score;
    }

    updateSets() {
        this.$setCounter.val(this.active_set);
        this.updateSetsVisibility();
        this.updateSetWinners();
    }

    updateSetsVisibility() {
        let self = this;
        $.each(self.$sets, function (i, set) {
            var $set = $(set);
            $set.hide();
            $set.removeClass('active');
            if (i + 1 <= self.active_set) {
                $set.show();
                if (i + 1 == self.active_set) {
                    $set.addClass('active');
                }
            }
        });
    }

    updateSetWinners() {
        let self = this;
        var $score_elems = $(self.$html_frame).find(`[fb-data*="score"]`);

        $.each($score_elems, function (i, elem) {
            var $score_elem = $(elem);
            var se_details = self.getScoreElemDetails($score_elem);
            if (se_details.set != self.active_set) {
                if (se_details.team == self.getWinner(se_details.set)) {
                    $score_elem.removeClass('loser');
                    $score_elem.addClass('winner');
                } else if (self.getWinner(se_details.set) != null) {
                    $score_elem.removeClass('winner');
                    $score_elem.addClass('loser');
                } else {
                    $score_elem.removeClass('winner');
                    $score_elem.removeClass('loser');
                }
            } else {
                $score_elem.removeClass('winner');
                $score_elem.removeClass('loser');
            }
        });
    }

    updateSetScore() {
        this.$setScoreCounterA.text(this.getSetScore('a'));
        this.$setScoreCounterB.text(this.getSetScore('b'));
    }

    updateActiveScore() {
        this.$activeScoreCounterA.text(this.getScore(this.active_set, 'a'));
        this.$activeScoreCounterB.text(this.getScore(this.active_set, 'b'));
    }

    getServingTeam() {
        if (this.event_history.length > 0) {
            var last_action = this.event_history[this.event_history.length -1];
            if (last_action.includes('score')) {
                return last_action.slice(-1);
            } else {
                return null;
            }
        }
    }

    updateIndicators() {
        this.updateServeIndicator();
    }

    updateServeIndicator() {
        var serving_team = this.getServingTeam();
        var $serverIndicators = $('.serve_indicator');
        $serverIndicators.removeClass('active');
        if (serving_team != '') {
            $serverIndicators.filter(`.team_${serving_team}`).addClass('active');
        }
    }

    updateSettings() {
        $.each(this.settings, (key, value) => {
            var $settingsEntry = this.$settingsEntries.filter(`[fb-data*="${key}"]`);
            $settingsEntry.prop('checked', value === 1);
        });
        this.updateGroupScoreVisibility();
        this.updateColorIndicatorVisibility();
        this.updatePlayerNamesVisibility();
        this.updateServeIndicatorVisibility();
        this.updateUrlOutput();
    }

    updateLedSettings(){
    // Check if the use_team_colors flag has changed
        if (this.use_team_colors !== this.prev_use_team_colors) {
            if (this.use_team_colors === 1) {
                // Apply team colors and hide the color indicators
                $('.led-color-indicator').hide();
                $('#digit1 .segment').css('background-color', this.teamAColor);
                $('#digit2 .segment').css('background-color', this.teamAColor);
                $('#digit3 .segment').css('background-color', this.teamBColor);
                $('#digit4 .segment').css('background-color', this.teamBColor);
            } else {
                // Apply the last selected colors and show the indicators
                $('.led-color-indicator').show();
                $('#digit1 .segment').css('background-color', this.teamAColorLED);
                $('#digit2 .segment').css('background-color', this.teamAColorLED);
                $('#digit3 .segment').css('background-color', this.teamBColorLED);
                $('#digit4 .segment').css('background-color', this.teamBColorLED);
            }
            // Update the previous state to the current one
            this.prev_use_team_colors = this.use_team_colors;
        }
    }

    updateGroupScoreVisibility() {
        if (this.settings['show_group_score'] == 1) {
            $('.group_score').show();
            $('.group-indicator').show();
        } else if (this.settings['show_group_score'] == 0) {
            $('.group_score').hide();
            $('.group-indicator').hide();
        }
    }

    updateColorIndicatorVisibility() {
        if (this.settings['show_color'] == 1) {
            $('.color-indicator').show();
        } else if (this.settings['show_color'] == 0) {
            $('.color-indicator').hide();
        }
    }

    updatePlayerNamesVisibility() {
        if (this.settings['show_player_names'] == 1) {
            $('body').attr('players', 'show');
            $('.players').show();
        } else if (this.settings['show_player_names'] == 0) {
            $('body').attr('players', 'hidden');
            $('.players').hide();
        }
    }

    updateServeIndicatorVisibility() {
        if (this.settings['show_serve_indicator'] == 1) {
            $('.serve_indicator').show();
        } else if (this.settings['show_serve_indicator'] == 0) {
            $('.serve_indicator').hide();
        }
    }

    updateUrlOutput() {
        var baseUrl = window.location.origin + window.location.pathname;
        var newUrl = baseUrl.replace("input.html", "output.html");
        var url_output = newUrl + '?channel=' + this.channel;

        if (this.theme) {
            url_output = url_output + '&theme=' + this.theme;
        }

        this.$urlOutput.text(url_output);
        this.$urlOutput.attr('href', url_output);
    }

    updateAvailableChannels() {
        let self = this;
        self.$channelInput.empty();

        if (self.user) {
            let channelExists = false;

            $.each(self.user.channels, function (i, c) {
                self.$channelInput.append($('<option></option>').val(c).html(c));
                if (c == self.channel) {
                    channelExists = true;
                }
            });

            if (channelExists) {
                self.$channelInput.val(self.channel);
            } else {
                self.channel = self.user.channels[0];
                self.$channelInput.val(self.channel);
                setTimeout(() => {
                    showToast("ℹ️", `Due to authentification the channel got changed to "${self.user.channels[0]}".`, 2000);
                }, 2200);
            }
        }
    }

    handleEventHistory() {
        if (this.event_history.length > 3) {
            this.event_history = this.event_history.slice(-3);
        }
    }
}
