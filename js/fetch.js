import { setServerInfo, setTitle } from './server.js';
import { getDiscordId, getSteamId } from './utils/user.js';
import { isSearching, serachPlayers } from './serach.js';

const refreshButton = document.querySelector('#refresh-button');
const refreshTimer = document.querySelector('#refresh-timer');
let currentPlayers = [];
let fetcher;
let seconds = 30;

export const getPlayers = () => currentPlayers;

export const fetchServer = (serverId) => {
  console.log(`Fetching server with ID: ${serverId}`);
  setTitle('Loading server data from FiveM API...');
  seconds = 30;
  refreshButton.onclick = () => fetchServer(serverId);
  const url = `https://servers-frontend.fivem.net/api/servers/single/${serverId}`;
  console.info(`Fetching server info`, serverId, url);
  fetch(url, {
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then((json) => {
      console.log('Server data fetched successfully:', json);
      setServerInfo(serverId, json.Data);
      let playersFetch = false; //Todo
      let url = `https://servers-frontend.fivem.net/api/servers/single/${serverId}`;
      fetchPlayers(url, playersFetch);
      startFetcher(serverId);
    })
    .catch((error) => console.error('Fetching server data failed:', error));
};

const startFetcher = (serverId) => {
  console.log(`Starting fetcher at ${seconds} seconds`);
  if (fetcher) clearInterval(fetcher);
  fetcher = setInterval(() => {
    refreshTimer.textContent = seconds + 's';
    if (seconds < 1) {
      clearInterval(fetcher);
      fetchServer(serverId);
    }
    seconds--;
  }, 1000);
};

const fetchPlayers = (url, playersFetch = false) => {
  console.info('Fetching players with method:', playersFetch ? 'players.json' : 'normal', url);
  fetch(url, {
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then((json) => {
      console.log('Players data fetched successfully:', json);
      let players = playersFetch ? json : json.Data.players;
      players = formatPlayers(players);
      currentPlayers = players;
      renderPlayers(players);
    })
    .catch((error) => console.error('Fetching players data failed:', error));
};

const formatPlayers = (players) => {
  const formattedPlayers = [];
  players.forEach((player) => {
    const socials = {};

    if (player.identifiers) {
      const steamIdentifier = getSteamId(player.identifiers);
      if (steamIdentifier) socials.steam = steamIdentifier;

      const discordIdentifier = getDiscordId(player.identifiers);
      if (discordIdentifier) socials.discord = discordIdentifier;
    }

    formattedPlayers.push({
      name: player.name,
      id: player.id,
      socials,
      ping: player.ping,
    });
  });
  return formattedPlayers.sort((a, b) => a.id - b.id);
};

const table = document.querySelector('table');

const resetTable = () => {
  [...table.querySelectorAll('tr')].filter((tr) => tr.id !== 'table-header').forEach((tr) => tr.remove());
};

const STEAM_LINK = 'https://steamcommunity.com/profiles/%id%';
const DISCORD_LINK = 'https://discord.com/users/%id%';

const getColorTag = (steamId) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  return colorTags[steamId] || '#ffffff';
};

const saveColorTag = (steamId, color) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  colorTags[steamId] = color;
  localStorage.setItem('colorTags', JSON.stringify(colorTags));
};

const removeColorTag = (steamId) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  delete colorTags[steamId];
  localStorage.setItem('colorTags', JSON.stringify(colorTags));
};

export const renderPlayers = (players, search = false) => {
  if (!players) {
    console.error('No players data available to render.');
    return;
  }

  resetTable();

  console.info('Rendering new players', players.length);
  let index = 1;
  players.forEach((player) => {
    const tr = document.createElement('tr');

    const no = document.createElement('td');
    const id = document.createElement('td');
    const name = document.createElement('td');
    const socials = document.createElement('td');
    const ping = document.createElement('td');

    no.className = 'table-no';
    id.className = 'table-id';
    name.className = 'table-name';
    socials.className = 'table-socials';
    ping.className = 'table-ping';

    no.textContent = index++ + '.';
    id.textContent = player.id;
    name.textContent = player.name;
    ping.textContent = `${player.ping}ms`;

    if (player.socials.steam) {
      const link = document.createElement('a');
      link.href = STEAM_LINK.replace('%id%', player.socials.steam);
      link.target = '_blank';
      link.innerHTML = '<img src="img/steam.svg" alt="Steam">';
      link.style.color = getColorTag(player.socials.steam);
      socials.appendChild(link);
      const color = getColorTag(player.socials.steam);
      if (color !== '#ffffff') {
        tr.style.backgroundColor = color; // Apply color to the row only if it's not white
      }
    }
    if (player.socials.discord) {
      const link = document.createElement('a');
      link.href = DISCORD_LINK.replace('%id%', player.socials.discord);
      link.target = '_blank';
      link.innerHTML = '<img src="img/discord.svg" alt="Discord">';
      socials.appendChild(link);
    }

    tr.appendChild(no);
    tr.appendChild(id);
    tr.appendChild(name);
    tr.appendChild(socials);
    tr.appendChild(ping);

    table.appendChild(tr);
  });
  // Footer
  table.innerHTML += `
        <tr class="table-footer" style="background: #171717">
            <td rowspan="5">
                <span>This page is not affiliated with FiveM or any other server.</span><br />
                <span>Created by <a href="https://github.com/igorovh" target="_blank">igorovh</a>.</span>
            </th>
        </tr>`;
  if (isSearching() && !search) serachPlayers();
};

// Event listener for applying color to multiple Steam IDs
document.querySelector('#apply-color').addEventListener('click', () => {
  const color = document.querySelector('#color-picker').value;
  const steamIds = prompt('Enter Steam IDs to tag (comma-separated):');
  if (steamIds) {
    steamIds.split(',').map(id => id.trim()).forEach(steamId => {
      if (steamId) {
        saveColorTag(steamId, color);
      }
    });
    renderPlayers(getPlayers());
  }
});

// Event listener for removing color from a Steam ID
document.querySelector('#remove-color').addEventListener('click', () => {
  const steamId = prompt('Enter Steam ID to remove tag:');
  if (steamId) {
    removeColorTag(steamId);
    renderPlayers(getPlayers());
  }
});

// Example usage to apply color to a group
//const group = ['76561199176934883', '76561198373825196'];
//applyColorToGroup(group, '#00ff00');