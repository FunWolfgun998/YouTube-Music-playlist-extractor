// ==========================================
//   YOUTUBE MUSIC PLAYLIST EXTRACTOR (v3.0)
//             FunWolfgun998© 2026
// ==========================================

(function() {
    console.clear();
    console.log("Starting extraction process...");

    // --- USER CONFIGURATION ---
    
    // Field selection and ordering
    let fieldsPrompt = prompt(
        "1/5. Which fields do you want to extract and in what ORDER?\n" +
        "(Type the numbers consecutively, e.g., '214' for Artist, Title, Link)\n" +
        "1: Title\n2: Artist\n3: Album\n4: Link\n5: Video ID", 
        "12345"
    ) || "12345";
    
    // Remove invalid characters and duplicates to create a clean sequence
    let sequence = Array.from(new Set(fieldsPrompt.replace(/[^1-5]/g, '').split('')));
    if (sequence.length === 0) sequence = ["1", "2", "3", "4", "5"]; // Fallback if empty

    // Map numbers to actual data keys and column names
    const fieldMap = {
        "1": { key: "title", label: "Title" },
        "2": { key: "artist", label: "Artist" },
        "3": { key: "album", label: "Album" },
        "4": { key: "link", label: "Link" },
        "5": { key: "id", label: "ID" }
    };

    const selectedFields = sequence.map(num => fieldMap[num]);

    // File Format Selection
    let fileFormat = prompt("2/5. Choose file format (type 'txt', 'csv', or 'json'):", "txt") || "txt";
    fileFormat = fileFormat.toLowerCase().trim();
    if (!['txt', 'csv', 'json'].includes(fileFormat)) fileFormat = 'txt';

    // Separator (Only needed for TXT)
    let separator = " - ";
    if (fileFormat === "txt") {
        separator = prompt("3/5. Choose a separator for the TXT file (e.g., ' - '):", " - ") || " - ";
    }

    // Sorting and Grouping
    let sortBy = prompt(
        "4/5. How do you want to sort the rows?\n" +
        "1: Original (No sorting)\n" +
        "2: Alphabetical (By Artist)\n" +
        "3: Alphabetical (By Title)\n" +
        "4: Alphabetical (By Album)\n" +
        "5: Artist Frequency (Descending - Most songs first)\n" +
        "6: Artist Frequency (Ascending - Least songs first)", 
        "1"
    ) || "1";

    // Filename
    let fileName = prompt("5/5. Enter the filename (without extension):", "my_playlist") || "playlist_export";

    // --- HELPER FUNCTION: SPLIT COLLABORATIONS ---
    // This splits strings like "Artist A & Artist B" or "Singer feat. Rapper" into arrays for accurate frequency counting
    function getIndividualArtists(artistString) {
        if (!artistString) return ["Unknown"];
        // Regex to split by: comma, &, e, and, x, feat., ft. (with word boundaries)
        const separators = /,\s*|\s+&\s+|\s+\be\b\s+|\s+\band\b\s+|\s+\bx\b\s+|\s+\bfeat\.?\b\s+|\s+\bft\.?\b\s+/i;
        let artists = artistString.split(separators).map(a => a.trim()).filter(a => a);
        return artists.length > 0 ? artists : ["Unknown"];
    }

    // --- EXTRACTION PROCESS ---
    
    // Select only the actual playlist items, ignoring "Suggested Songs" panels
    const songElements = document.querySelectorAll('ytmusic-playlist-shelf-renderer ytmusic-responsive-list-item-renderer');
    let extractedData = [];

    console.log(`Found ${songElements.length} songs strictly in the playlist. Processing...`);

    songElements.forEach(song => {
        try {
            const titleEl = song.querySelector('.title-column yt-formatted-string');
            const secondaryCols = song.querySelectorAll('.secondary-flex-columns yt-formatted-string');
            const linkTag = song.querySelector('a[href*="watch?v="]');
            
            let rawTitle = titleEl ? titleEl.innerText.replace(/[\n\r]/g, "").trim() : "";
            let rawArtist = secondaryCols.length > 0 ? secondaryCols[0].innerText.replace(/[\n\r]/g, "").trim() : "";
            let rawAlbum = secondaryCols.length > 1 ? secondaryCols[1].innerText.replace(/[\n\r]/g, "").trim() : "";
            
            // Skip "Deleted" or "Private" videos that lose their title data
            if (!rawTitle || rawTitle.includes("[Deleted") || rawTitle.includes("[Private") || rawTitle.includes("[Video ")) {
                return; 
            }

            let rawLink = "";
            let rawId = "";
            if (linkTag && linkTag.href) {
                try {
                    rawId = new URL(linkTag.href).searchParams.get("v") || "";
                    if (rawId) rawLink = `https://music.youtube.com/watch?v=${rawId}`;
                } catch (e) {
                    console.warn("Could not parse URL, skipping ID extraction for a row.");
                }
            }

            const rawDataMap = { title: rawTitle, artist: rawArtist, album: rawAlbum, link: rawLink, id: rawId };

            // Ensure the object contains at least a valid Title or Artist
            if (rawTitle || rawArtist) {
                let finalSongObject = {};
                
                // Populate the final object exactly in the user's chosen order
                selectedFields.forEach(field => {
                    finalSongObject[field.key] = rawDataMap[field.key];
                });

                // Attach hidden properties (prefixed with _) for accurate sorting logic
                const splitArtists = getIndividualArtists(rawArtist);
                
                finalSongObject._rawTitle = rawTitle || "";
                finalSongObject._rawAlbum = rawAlbum || "";
                finalSongObject._fullArtistString = rawArtist || "Unknown";
                finalSongObject._primaryArtist = splitArtists[0]; // Used to group collab songs under the main artist
                finalSongObject._allArtists = splitArtists; // Array of all artists to calculate exact frequency

                extractedData.push(finalSongObject);
            }
        } catch (err) {
            console.error("Error processing a row:", err);
        }
    });

    if (extractedData.length === 0) {
        alert("No songs found! Make sure you are on a playlist page and have scrolled down manually to load the tracks.");
        return;
    }

    // --- DATA ANALYTICS & SORTING ---
    
    // Calculate how many songs each INDIVIDUAL artist has
    const artistFreq = {};
    extractedData.forEach(song => {
        song._allArtists.forEach(artist => {
            artistFreq[artist] = (artistFreq[artist] || 0) + 1;
        });
    });

    // Apply sorting based on the Primary Artist (so collabs are grouped with the main artist)
    switch (sortBy) {
        case "2":
            extractedData.sort((a, b) => a._primaryArtist.localeCompare(b._primaryArtist));
            break;
        case "3":
            extractedData.sort((a, b) => a._rawTitle.localeCompare(b._rawTitle));
            break;
        case "4":
            extractedData.sort((a, b) => a._rawAlbum.localeCompare(b._rawAlbum));
            break;
        case "5":
            // Descending frequency based on the Primary Artist
            extractedData.sort((a, b) => {
                let diff = artistFreq[b._primaryArtist] - artistFreq[a._primaryArtist];
                return diff === 0 ? a._primaryArtist.localeCompare(b._primaryArtist) : diff;
            });
            break;
        case "6":
            // Ascending frequency based on the Primary Artist
            extractedData.sort((a, b) => {
                let diff = artistFreq[a._primaryArtist] - artistFreq[b._primaryArtist];
                return diff === 0 ? a._primaryArtist.localeCompare(b._primaryArtist) : diff;
            });
            break;
    }
    
    // Remove the hidden sorting fields before exporting (crucial for JSON format)
    extractedData.forEach(item => {
        delete item._rawTitle;
        delete item._rawAlbum;
        delete item._fullArtistString;
        delete item._primaryArtist;
        delete item._allArtists;
    });

    // --- FORMATTING & DOWNLOADING ---
    
    let finalContent = "";
    let mimeType = "text/plain";
    let fullFileName = `${fileName}.${fileFormat}`;

    switch (fileFormat) {
        case "json":
            mimeType = "application/json";
            finalContent = JSON.stringify(extractedData, null, 2);
            break;

        case "csv":
            mimeType = "text/csv";
            // Create CSV Header based on user order
            const headers = selectedFields.map(f => f.label);
            finalContent += headers.join(",") + "\n";
            
            // Add all rows and escape double quotes
            extractedData.forEach(item => {
                let row = selectedFields.map(field => {
                    const txt = item[field.key] || "";
                    return `"${txt.replace(/"/g, '""')}"`; 
                });
                finalContent += row.join(",") + "\n";
            });
            break;

        case "txt":
        default:
            mimeType = "text/plain";
            // Join lines with the user-selected separator
            extractedData.forEach(item => {
                let row = selectedFields
                    .map(field => item[field.key])
                    .filter(val => val !== undefined && val !== ""); // Remove empty parts
                finalContent += row.join(separator) + "\n";
            });
            break;
    }

    // File Download Logic
    const blob = new Blob([finalContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = fullFileName;
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url); // Clean memory

    // --- CONSOLE DASHBOARD & LEADERBOARD ---
    
    // Sort individuals artists by frequency (highest to lowest) for the console
    const sortedLeaderboard = Object.entries(artistFreq)
        .sort((a, b) => b[1] - a[1]);

    console.log("==========================================");
    console.log("🎉 EXTRACTION COMPLETE!");
    console.log(`📁 File downloaded: ${fullFileName}`);
    console.log(`🎵 Total Valid Songs Processed: ${extractedData.length}`);
    console.log(`🎤 Total Individual Artists Found: ${Object.keys(artistFreq).length}`);
    console.log("==========================================");
    console.log("🏆 ARTIST LEADERBOARD (By number of songs):");
    
    sortedLeaderboard.forEach((entry, index) => {
        let count = entry[1];
        console.log(`${index + 1}. ${entry[0]} - ${count} song${count > 1 ? 's' : ''}`);
    });
    console.log("==========================================");

})();
