const getColorTag = (steamId) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  return colorTags[steamId] || '#ffffff';
};

const getGroupName = (color) => {
  const groupNames = JSON.parse(localStorage.getItem('groupNames')) || {};
  return groupNames[color] || '';
};

const saveColorTag = (steamId, color) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  colorTags[steamId] = color;
  localStorage.setItem('colorTags', JSON.stringify(colorTags));
};

const saveGroupName = (color, groupName) => {
  const groupNames = JSON.parse(localStorage.getItem('groupNames')) || {};
  groupNames[color] = groupName;
  localStorage.setItem('groupNames', JSON.stringify(groupNames));
  renderTaggedSteamIds();
};

const removeColorTag = (steamId) => {
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  delete colorTags[steamId];
  localStorage.setItem('colorTags', JSON.stringify(colorTags));
};

const renderTaggedSteamIds = () => {
  const taggedSteamIdsTableBody = document.querySelector('#tagged-steamids-table tbody');
  const colorTags = JSON.parse(localStorage.getItem('colorTags')) || {};
  const groupNames = JSON.parse(localStorage.getItem('groupNames')) || {};
  taggedSteamIdsTableBody.innerHTML = '';

  const groupedByColor = {};

  // Group Steam IDs by color
  Object.keys(colorTags).forEach((steamId) => {
    const color = colorTags[steamId];
    if (!groupedByColor[color]) {
      groupedByColor[color] = [];
    }
    groupedByColor[color].push(steamId);
  });

  // Render grouped Steam IDs
  Object.keys(groupedByColor).forEach((color) => {
    const groupName = groupNames[color] || '';
    const steamIds = groupedByColor[color];
    const colorRow = document.createElement('tr');
    const colorTd = document.createElement('td');
    colorTd.colSpan = 3;
    colorTd.textContent = `Color: ${color} - Group: ${groupName}`;
    colorTd.style.backgroundColor = color;
    colorRow.appendChild(colorTd);
    taggedSteamIdsTableBody.appendChild(colorRow);

    steamIds.forEach((steamId) => {
      const tr = document.createElement('tr');

      const steamIdTd = document.createElement('td');
      steamIdTd.textContent = steamId;

      const colorTd = document.createElement('td');
      colorTd.textContent = color;
      colorTd.style.backgroundColor = color;

      const actionsTd = document.createElement('td');
      actionsTd.className = 'actions';

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.onclick = () => {
        removeColorTag(steamId);
        renderTaggedSteamIds();
      };

      actionsTd.appendChild(removeButton);

      tr.appendChild(steamIdTd);
      tr.appendChild(colorTd);
      tr.appendChild(actionsTd);

      taggedSteamIdsTableBody.appendChild(tr);
    });
  });
};

document.querySelector('#apply-color').addEventListener('click', () => {
  const color = document.querySelector('#color-picker').value;
  const steamIds = document.querySelector('#steam-id-input').value.trim().split('\n');
  steamIds.forEach(steamId => {
    if (steamId) {
      saveColorTag(steamId.trim(), color);
    }
  });
  renderTaggedSteamIds();
});

document.querySelector('#remove-color').addEventListener('click', () => {
  const steamIds = document.querySelector('#steam-id-input').value.trim().split('\n');
  steamIds.forEach(steamId => {
    if (steamId) {
      removeColorTag(steamId.trim());
    }
  });
  renderTaggedSteamIds();
});

document.querySelector('#apply-group-name').addEventListener('click', () => {
  const color = document.querySelector('#color-picker').value;
  const groupName = document.querySelector('#group-name-input').value.trim();
  if (color && groupName) {
    saveGroupName(color, groupName);
  }
});

renderTaggedSteamIds();