import { themes, readData, getPathsAndValues, getColorBrightness, rgb2hex, writeData, showToast, copyToClipboard } from "./main.js";

export class Scoreboard {
    // Konstruktor
    constructor(type = 'input', $html_frame = $('.scoreboard'), channel, theme = 'rg', user = null) {
        this.type = type;
        this.user = user;
        // Frontend elements
        this.$html_frame = $html_frame;
        this.$themeInput = $('#theme');
        this.$channelInput = $('#channel');
        this.$scoreChangeButtons = $('.button[team][change]');
        this.$setChangeButtons = $('.set_controls_container .button');
        this.$scoreboardInputs = this.$html_frame.find($('input:not([type=submit]), textarea'));
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
        this.$scoreHistoryContainer = $('.score_history');
        // Stored variables
        this.channel = Number(channel);
        this.theme = theme;
        this.settings = {
            "show_player_names": 1,
            "show_color": 1,
            "show_group_score": 0,
            "show_serve_indicator": 0,
        }
        this.active_set = 1;
        this.ScoreHistoryChart = null;
        this.event_history = [];
        this.data_interval;
        this.update_interval;
        // Init function
        this.init();
    }

    init() {
        this.initEventListeners();
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
            let slow_update_interval = setInterval(() => {
                this.updateScoreHistory();
                this.updateScoreHistoryChart();
            }, 2500);
        }
    }

    updateUI() {
        this.updateSets();
        this.updateSetScore();
        this.updateActiveScore();
        this.updateIndicators();
        this.updateSettings();
        this.handleEventHistory();
        this.updateOldScoreInputCounter();
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
            $(`.scoreboard.score_history`).show();
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
            var self = this;
            var $target = $(event.target);
            var team = self.getScoreElemDetails($target)['team'];
            var newScore = Number($target.val());
            var oldScore = Number(self.$html_frame.find('.team_score').attr(`score_${team}`));

            // if its a "-" input, remove corresponding history event
            if (newScore < oldScore) {
                $.each(self.event_history.slice().reverse(), (index, event) => {
                    if (event.type === 'score' && event.team === team && event.score > newScore) {
                        self.event_history.splice(self.event_history.length - 1 - index, 1);
                        return false; // break the loop
                    }
                });
            // otherwise normally push the event
            } else {
                self.event_history.push({
                    type: 'score',
                    team: team,
                    score: newScore
                });
            }

            this.updateOldScoreInputCounter();
        });
        

        // upload local data as any input values changes
        this.$scoreboardInputs.on('input', (event) => {
            this.uploadData([$(event.target)]);
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
            this.updateSets();
            this.event_history.push({
                type: 'set',
                set: this.active_set,
            });
            // this.event_history.push('set_'+ this.active_set);
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
            // this.event_history.push('reset');
            this.event_history.push({
                type: 'reset',
            });

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
                    if (typeof(value) == 'string') {
                        value = [];
                    } else {
                        value = value
                    }
                    value = value
                } else {
                    value = []
                }
                self.event_history = value;
            } else if (path.includes('admin_settings')) {
                self.insertAdminSetting(path, value);
            } else if (path.includes('team') && path.includes('color')) {
                self.insertColor($elem, path, value);
            } else if (path.includes('active_set')) {
                self.active_set = value;
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
        } else if (path.includes('team_b')) {
            var team = 'b';
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
            newData[`/match-${self.channel}/event_history`] = this.event_history;
            $.each($(elemList), function (i, elem) {
                let value;

                // Überprüfen, ob das Element eine Checkbox ist
                if ($(elem).is(":checkbox")) {
                    value = $(elem).is(":checked") ? 1 : 0; // Wert auf 1 oder 0 setzen
                } else {
                    value = $(elem).val(); // Wert des Elements abrufen
                }

                // Erstelle einen Pfad basierend auf dem fb-data Attribut
                let fbDataAttr = $(elem).attr("fb-data");
                if (fbDataAttr) {
                    // Ersetze die Punkte im fb-data Attribut mit einem Schrägstrich
                    let dbSelector = fbDataAttr.replace(/\./g, '/');
                    // Erstelle den vollständigen Pfad für Firebase
                    let path_to_variable = `/match-${self.channel}/${dbSelector}`;

                    // Überprüfen, ob der Wert in einen Integer umgewandelt werden kann
                    if (path_to_variable.includes('score') || path_to_variable.includes('active_set')) {
                        try {
                            value = parseInt(value);
                        } catch (error) {
                            console.error(value, " can't be converted to integer");
                        }
                    }

                    // Füge den Pfad und den Wert zum newData Objekt hinzu
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
            if (last_action['type'] == 'score') {
                return last_action['team'];
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

    updateOldScoreInputCounter() {
        this.$html_frame.find('.team_score').attr('score_a', this.getScore(this.active_set, 'a'));
        this.$html_frame.find('.team_score').attr('score_b', this.getScore(this.active_set, 'b'));
    }

    handleEventHistory() {
        if (this.event_history.length > 50) {
            this.event_history = this.event_history.slice(-50);
        }
        // console.log(this.event_history);
    }

    getScoreHistory(set = -1) {
        let self = this;
        let slicedEventHistory = [];

        if (set == -1) {
            let startIndex = -1;
            $.each(self.event_history.slice().reverse(), function (i, event) {
                if (event['type'] == 'set' || event['type'] == 'reset') {
                    startIndex = self.event_history.length - 1 - i;
                    return false; // break the loop
                }
            });
            slicedEventHistory = self.event_history.slice(startIndex + 1);
        } else {
            
        }

        return slicedEventHistory;
    }

    scoreHistoryToTeamPoints(slicedEventHistory, team) {
        let self = this;
        let teamPointsList = [];

        let lastScore = 0;
        $.each(slicedEventHistory, function (i, event) {
            if(event['type'] == 'score') {
                if (event['team'].toLowerCase() == team.toLowerCase()) {
                    lastScore = Number(event['score']);
                    teamPointsList.push(lastScore);
                } else {
                    teamPointsList.push(lastScore);
                }
            }
        });

        return teamPointsList;
    }

    updateScoreHistory() {
        let self = this;

        $.each(self.$scoreHistoryContainer.find('.scores').find('.team'), function (i, container) {
            let $container = $(container);
            $container.empty();
            let team = $container.attr('team');
            let scores_list = self.scoreHistoryToTeamPoints(self.getScoreHistory(), team);
            $.each(scores_list, function (i, score) {
                let status = score > (i > 0 ? scores_list[i-1] : 0) ? 'active' : ''; 
                let element = `<div class="score_item ${status}">${score}</div>`;
                $container.append(element);
            });
        });
    }

    updateScoreHistoryChart() {
        let self = this;
        let scoresTeamA = self.scoreHistoryToTeamPoints(self.getScoreHistory(), 'a');
        let scoresTeamB = self.scoreHistoryToTeamPoints(self.getScoreHistory(), 'b');

        let labels = scoresTeamA.map((_, i) => `${i + 1}`);

        let ctx = document.getElementById('scoreChart').getContext('2d');

        try {
            self.scoreChart.destroy();
        } catch {}

        self.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Team A",
                        data: scoresTeamA,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        segment: {
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue("--A_Color").trim(),
                            backgroundColor: ctx => {
                                if (!ctx.p1 || !ctx.chart.data.datasets[1]) return '#000000'; // Fallback-Farbe
                                const dataset2Value = ctx.chart.data.datasets[1].data[ctx.p0DataIndex]; // Wert aus Dataset 2
                                return ctx.p1.parsed.y > dataset2Value ?
                                `${getComputedStyle(document.documentElement).getPropertyValue("--A_Color").trim()}44` :
                                `${getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim()}44`;
                            },
                        },
                        fill: '+1',
                    },
                    {
                        label: "Team B",
                        data: scoresTeamB,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim(),
                        backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue("--B_Color").trim()}22`,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: "false"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Setzt die Dauer der Animation auf 0ms, wodurch die Animation deaktiviert wird
                },
                plugins: {
                    legend: { display: false }, // Versteckt die Legende
                    tooltip: { enabled: false } // Versteckt die Tooltips
                },
                scales: {
                    x: {
                        display: false,
                        title: { display: false, text: 'Punkt' },
                        grid: { display: false }
                    },
                    y: {
                        display: false,
                        title: { display: false, text: 'Punkte' },
                        grid: { display: false },
                        beginAtZero: true
                    }
                }
            }
        });

        self.scoreChart.update();
    }
}
