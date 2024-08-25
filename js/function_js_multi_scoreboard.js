import { get, ref, update } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";
import { db } from "./firebase_config.js";

$(document).ready(() => {
    const channels = getChannelsFromUrl();
    channels.forEach(channelId => fetchDataForChannel(channelId));
});

function getChannelsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('channels') ? params.get('channels').split(',') : [];
}

function fetchDataForChannel(channelId) {
    const matchRef = ref(db, `match-${channelId}`);
    get(matchRef).then(snapshot => {
        if (snapshot.exists()) {
            updateScoreboard(channelId, snapshot.val());
        }
    });
}

function updateScoreboard(channelId, data) {
    const wrapper = $('.wrapper');
    const boardHtml = `
    <div class="board" id="board-${channelId}">
        <div class="center">
            <div class="teams" id="teams-${channelId}">
            </div>
            <div class="scores" id="scores-${channelId}">
            </div>
        </div>
    </div>
`;

    wrapper.append(boardHtml);
    const teamsDiv = $(`#teams-${channelId}`);
    teamsDiv.empty();
    teamsDiv.append(`<div class="team" fb-data="${data.teams_info.team_a}">
        <div class="color-indicator" id="B_Color" style="background-color: ${data.teams_info.team_a.color};"></div>
        <div class="name">
            <p class="teamname">${data.teams_info.team_a.name || 'A Teamname'}</p>
            <p class="players text" id="A_Players">${data.teams_info.team_a.player_names || 'N. Alt & D. Ameziane'}</p>
        </div>
    </div>
    <div class="team" fb-data="${data.teams_info.team_b}">
        <div class="color-indicator" id="B_Color" style="background-color: ${data.teams_info.team_b.color};"></div>
        <div class="name">
            <p class="teamname">${data.teams_info.team_b.name || 'B Teamname'}</p>
            <p class="players text" id="B_Players">${data.teams_info.team_b.player_names || N. Alt & D. Ameziane}</p>
        </div>
    </div>`)
    const scoresDiv = $(`#scores-${channelId}`);
    scoresDiv.empty();

    const activeSet = parseInt(data.active_set);
    scoresDiv.append(`
        <div class="team_score">
            ${[...Array(activeSet).keys()].map(setIndex => {

                const setNumber = setIndex + 1;
                const teamAScore = data.score['set_' + setNumber] ? data.score['set_' + setNumber].team_a_score : 0;
                const teamBScore = data.score['set_' + setNumber] ? data.score['set_' + setNumber].team_b_score : 0;
    
                // Determine the winner and loser based on scores
                const aTeamClass = teamAScore > teamBScore ? 'winner' : 'loser';
                const bTeamClass = teamAScore < teamBScore ? 'winner' : 'loser';
    
                // Apply the active class only to the current active set
                const setActiveClass = setNumber === activeSet ? 'active' : '';
    
                return `
                    <div class="set ${setActiveClass}" fb-data="set_${setNumber}">
                        <div class="counter a_team">
                            <p class="score ${setNumber < activeSet ? aTeamClass : ''}">${teamAScore}</p>
                        </div>
                        <div class="counter b_team">
                            <p class="score ${setNumber < activeSet ? bTeamClass : ''}">${teamBScore}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `);
    
}
