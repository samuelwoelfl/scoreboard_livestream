import { themes, readData, getPathsAndValues, getColorBrightness, rgb2hex, writeData, showToast } from "./main.js";

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
        this.$teamScoreSwitch = $('#Show_Team_Score');
        this.$colorSwitch = $('#Show_Color');
        this.$playerNamesSwitch = $('#Show_Players');
        this.$logoutButton = $('#logout');
        // Stored variables
        this.channel = channel;
        this.theme = theme;
        this.show_player_names = 1;
        this.show_color = 1;
        this.show_team_score = 1;
        this.active_set = 1;
        this.data_interval;
        this.update_interval;
        // Init function
        this.init();
    }

    init() {
        this.initEventListeners();
        this.setTheme(this.theme);
        this.insertLiveData();

        this.update_interval = setInterval(() => {
            this.updateUI();
        }, 300);

        if (this.type == 'input') {
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 600);
        } else {
            this.data_interval = setInterval(() => {
                this.insertLiveData();
            }, 300);
        }
    }

    updateUI() {
        this.updateSets();
        this.updateSetScore();
        this.updateTeamScore();
        this.updateActiveScore();
        this.updateColorIndicator();
        this.updatePlayerNames();
    }

    setTheme(theme) {        
        // backup theme
        if (!(theme in themes)) {
            theme = 'full';
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
            this.setTheme(this.theme);
        });

        // Channel input dropdown listener
        this.$channelInput.change((event) => {
            this.channel = $(event.target).val();
            this.updateUI();
        });

        // upload local data as any input values changes
        this.$scoreboardInputs.on('input', (event) => {
            this.uploadData([event.target]);
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
                this.uploadData([$score_elem]); // upload the new score
            }
        });

        // interaction for the set buttons
        this.$setChangeButtons.click((event) => {
            var $setButton = $(event.target);
            var change = Number($setButton.attr('change'));

            var set_now = Number(this.$setCounter.val()); // check set right now
            if (set_now + change > 0 && set_now + change <= 7) {
                this.active_set = set_now + change;
                this.updateSets();
                this.uploadData([this.$setCounter]); // upload the new set
            }
        });

        this.$teamScoreSwitch.click((event) => {
            this.show_team_score = this.$teamScoreSwitch.prop("checked") == true ? 1 : 0;
            this.updateTeamScore();
            this.uploadData($(event.target));
        });

        this.$playerNamesSwitch.click((event) => {
            this.show_player_names = this.$playerNamesSwitch.prop("checked") == true ? 1 : 0;
            this.updatePlayerNames();
            this.uploadData($(event.target));
        });

        this.$colorSwitch.click((event) => {
            this.show_color = this.$colorSwitch.prop("checked") == true ? 1 : 0;
            this.updateColorIndicator();
            this.uploadData($(event.target));
        });

        // function for the reset scores button
        this.$resetScoresButton.click((event) => {
            $.each($('[fb-data*="score"]'), function (i, elem) {
                $(elem).val(0);
            });

            this.active_set = 1;
            this.updateSets();

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

            if (path.includes('admin_settings')) {
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
        if (path.includes('show_color')) {
            this.show_color = value;
        } else if (path.includes('show_group_score')) {
            this.show_team_score = value;
        } else if (path.includes('show_player_names')) {
            this.show_player_names = value;
        }
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
        if (this.user && this.channel && this.channel in this.user.channels) {
            // upload all if there are no specific elements
            if (typeof elemList == 'undefined') {
                elemList = $("*[fb-data]");
            }

            // upload all data to firebase
            self = this;
            const newData = {};
            $.each($(elemList), function (i, elem) {
                let value;

                // Überprüfen, ob das Element eine Checkbox ist
                if ($(elem).is(":checkbox")) {
                    value = $(elem).is(":checked") ? 1 : 0; // Wert auf 1 oder 0 setzen
                } else {
                    value = $(elem).val(); // Wert des Elements abrufen
                }

                // Wenn der Wert nicht leer ist, weiter verarbeiten
                if (value !== "") {
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
        var score = Number($score_elem.text());
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
                } else {
                    $score_elem.removeClass('winner');
                    $score_elem.addClass('loser');
                }
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

    updateTeamScore() {
        if (this.show_team_score == 1) {
            $('.group_score').show();
            $('.group-indicator').show();
            this.$teamScoreSwitch.prop("checked", true);
        } else {
            $('.group_score').hide();
            $('.group-indicator').hide();
            this.$teamScoreSwitch.prop("checked", false);
        }
    }

    updateColorIndicator() {
        if (this.show_color == 1) {
            $('.color-indicator').show();
            this.$colorSwitch.prop("checked", true);
        } else if (this.show_color == 0) {
            $('.color-indicator').hide();
            this.$colorSwitch.prop("checked", false);
        }
    }

    updatePlayerNames() {
        if (this.show_player_names == 1) {
            $('body').attr('players', 'show');
            $('.players').show();
            this.$playerNamesSwitch.prop("checked", true);
        } else if (this.show_player_names == 0) {
            $('body').attr('players', 'hidden');
            $('.players').hide();
            this.$playerNamesSwitch.prop("checked", false);
        }
    }

    updateAvailableChannels() {
        let self = this;
        self.$channelInput.empty();

        if (self.user) {
            let channelExists = false;

            $.each(self.user.channels, function (i, c) {
                self.$channelInput.append($('<option></option>').val(c).html(c));
                if (c === self.channel) {
                    channelExists = true;
                }
            });

            if (channelExists) {
                self.$channelInput.val(self.channel);
            } else {
                self.channel = self.user.channels[0];
                self.$channelInput.val(self.channel);
                setTimeout(() => {
                    showToast("❌", `Due to authentification the channel got changed to "${self.user.channels[0]}".`, 2000);
                }, 2200);
            }
        }
    }
}
