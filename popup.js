let currentVideoId = '';
let currentVideoTitle = '';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const url = new URL(tab.url);

        if (url.hostname === "www.youtube.com" && url.pathname === "/watch") {
            currentVideoId = url.searchParams.get("v");
            if (currentVideoId) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: "getVideoInfo" });
                    if (response && response?.title) {
                        currentVideoTitle = response.title;
                        document.getElementById("videoTitle").textContent = currentVideoTitle;
                        document.getElementById('noteInputContainer').style.display = 'block';
                    } else {
                        handleNonYouTubeVideo("Unable to fetch video title");
                    }
                } catch (error) {
                    console.error("Error communicating with content script:", error);
                    handleNonYouTubeVideo("Error loading video information");
                }
            } else {
                handleNonYouTubeVideo("Invalid YouTube video URL");
            }
        } else {
            handleNonYouTubeVideo("YouTube Notes");
        }
        await displayCurrentVideoNotes();
        await displayAllNotes();
    } catch (error) {
        console.error("Error initializing popup:", error);
        handleNonYouTubeVideo("Error loading video information");
    }

    // delete event listener
    document.addEventListener('click', handleDeleteClick);
});

// function to show if it's not a YouTube video
function handleNonYouTubeVideo(message) {
    document.getElementById('videoTitle').textContent = message;
    document.getElementById('noteInputContainer').style.display = 'none';
    currentVideoId = '';
    currentVideoTitle = '';
}

// save notes
document.getElementById('saveNote').addEventListener('click', async function () {
    if (!currentVideoId) return;
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getCurrentTime" });
        if (response && response?.currentTime) {
            let noteText = document.getElementById('noteText').value;
            let noteTime = formatTime(response?.currentTime);
            let note = `${noteTime} - ${noteText}`;

            const result = await chrome.storage.sync.get([currentVideoId]);
            let notes = result[currentVideoId] || [];
            notes.push({ time: response.currentTime, note: note, videoTitle: currentVideoTitle });
            let data = {};
            data[currentVideoId] = notes;

            await chrome.storage.sync.set(data);
            await displayCurrentVideoNotes();
            await displayAllNotes();
            document.getElementById('noteText').value = '';
        }
    }
    catch (error) {
        console.error("Error saving note:", error);
    }
});

// display current video notes
async function displayCurrentVideoNotes() {
    if (!currentVideoId) {
        document.getElementById('notesList').innerHTML = '<p>No current YouTube video.</p>';
        return;
    }
    try {
        const result = await chrome.storage.sync.get([currentVideoId]);
        let notes = result[currentVideoId] || [];
        let notesList = document.getElementById('notesList');
        notesList.innerHTML = '';

        if (notes.length === 0) {
            notesList.innerHTML = '<p>No notes yet for this video.</p>';
        } else {
            notes.forEach(function (note, index) {
                let noteElement = document.createElement('li');
                noteElement.innerHTML = `
                    <a href="https://www.youtube.com/watch?v=${currentVideoId}&t=${Math.floor(note.time)}" target="_blank">${note.note}</a>
                    <button class="delete-note" data-video-id="${currentVideoId}" data-note-index="${index}">Delete</button>
                `;
                let anchorElement = noteElement.querySelector('a');
                anchorElement.classList.add('single-note');
                notesList.appendChild(noteElement);
            });
        }
    } catch (error) {
        console.error("Error displaying notes:", error);
        document.getElementById('notesList').innerHTML = '<p>Error loading notes.</p>';
    }
}

// display all notes
async function displayAllNotes() {
    try {
        const result = await chrome.storage.sync.get(null);
        let allNotesList = document.getElementById('allNotesList');
        allNotesList.innerHTML = '';
        let hasNotes = false;
        for (let videoId in result) {
            let notes = result[videoId];
            if (notes && notes.length > 0) {
                hasNotes = true;
                let videoElement = document.createElement('div');
                videoElement.className = 'video-notes';
                videoElement.innerHTML = `
                    <h3>${notes[0].videoTitle}</h3>
                    <button class="delete-video" data-video-id="${videoId}">Delete Video</button>
                `;

                let notesList = document.createElement('ul');
                notes.forEach(function (note, index) {
                    let noteElement = document.createElement('li');
                    noteElement.innerHTML = `
                        <a href="https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(note.time)}" target="_blank">${note.note}</a>
                        <button class="delete-note" data-video-id="${videoId}" data-note-index="${index}">Delete</button>
                    `;
                    let anchorElement = noteElement.querySelector('a');
                    anchorElement.classList.add('single-note');
                    notesList.appendChild(noteElement);
                });
                videoElement.appendChild(notesList);
                allNotesList.appendChild(videoElement);
            }
        }

        if (!hasNotes) {
            allNotesList.innerHTML = '<p>No notes found for any videos.</p>';
        }
    } catch (error) {
        console.error("Error displaying all notes:", error);
        document.getElementById('allNotesList').innerHTML = '<p>Error loading notes.</p>';
    }
}

// functionality to format time
function formatTime(seconds) {
    let date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
}

// handle delete
function handleDeleteClick(event) {
    if (event.target.classList.contains('delete-note')) {
        deleteNote(event.target.dataset.videoId, parseInt(event.target.dataset.noteIndex));
    } else if (event.target.classList.contains('delete-video')) {
        deleteVideo(event.target.dataset.videoId);
    }
}

// New function to delete a single note
async function deleteNote(videoId, noteIndex) {
    try {
        const result = await chrome.storage.sync.get([videoId]);
        let notes = result[videoId] || [];
        notes.splice(noteIndex, 1);

        if (notes.length === 0) {
            await chrome.storage.sync.remove(videoId);
        } else {
            await chrome.storage.sync.set({ [videoId]: notes });
        }

        await displayCurrentVideoNotes();
        await displayAllNotes();
    } catch (error) {
        console.error("Error deleting note:", error);
    }
}

// New function to delete an entire video list
async function deleteVideo(videoId) {
    try {
        await chrome.storage.sync.remove(videoId);
        await displayCurrentVideoNotes();
        await displayAllNotes();
    } catch (error) {
        console.error("Error deleting video:", error);
    }
}