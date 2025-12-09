// ==========================================
//   YOUTUBE MUSIC PLAYLIST EXTRACTOR (v2.0)
//             FunWolfgun998© 2025
// ==========================================

(function() {
    console.log("Starting extraction process...");

    // --- USER CONFIGURATION ---
    const includeTitle = confirm("Do you want to extract the TITLE of each song?");
    const includeArtist = confirm("Do you want to extract the ARTIST of each song?");
    const includeAlbum = confirm("Do you want to extract the ALBUM of each song?");
    const includeLink = confirm("Do you want to extract the full LINK of each song?");
    const includeId = confirm("Do you want to extract the VIDEO ID of each song?");

    // File Format Selection
    let fileFormat = prompt("Choose file format between:\nType 'txt', 'csv', or 'json'", "txt");
    if (!fileFormat) fileFormat = "txt"; // Default to txt
    fileFormat = fileFormat.toLowerCase().trim();

    // Separator (Only for TXT)
    let separator = " - ";
    if (fileFormat === "txt") {
        separator = prompt("Choose a separator for the txt file:", " - ");
        if (separator === null) separator = " - ";
    }

    // Filename
    let fileName = prompt("Enter the filename (without extension):", "my_playlist");
    if (!fileName) fileName = "playlist_export";

    
    // Select all song rows
    const songElements = document.querySelectorAll('ytmusic-playlist-shelf-renderer ytmusic-responsive-list-item-renderer');
    let extractedData = [];

    console.log(`Found ${songElements.length} songs. Processing...`);

    songElements.forEach(song => {
        try {
            let songData = {};

            // Get Title
            if (includeTitle) {
                const titleEl = song.querySelector('.title-column yt-formatted-string');
                songData.title = titleEl ? titleEl.innerText.replace(/[\n\r]/g, "").trim() : "";
            }

            // Get Secondary Artist / Album
            const secondaryCols = song.querySelectorAll('.secondary-flex-columns yt-formatted-string');
            
            if (includeArtist) {
                // Artist is usually the first element in secondary columns
                songData.artist = secondaryCols.length > 0 ? secondaryCols[0].innerText.replace(/[\n\r]/g, "").trim() : "";
            }

            if (includeAlbum) {
                // Album is usually the second element (if it exists)
                // Note: Sometimes the second element is views or duration, this is a best-effort guess
                songData.album = secondaryCols.length > 1 ? secondaryCols[1].innerText.replace(/[\n\r]/g, "").trim() : "";
            }

            // Get Link and ID of the video
            if (includeLink || includeId) {
                const linkTag = song.querySelector('a[href*="watch?v="]');
                const href = linkTag ? linkTag.href : "";
                let videoId = "";

                if (href) {
                    try {
                        videoId = new URL(href).searchParams.get("v");
                    } catch (e) {
                        console.warn("Could not parse URL");
                    }
                }

                if (includeLink) songData.link = videoId ? `https://music.youtube.com/watch?v=${videoId}` : "";
                if (includeId) songData.id = videoId || "";
            }

            // Check if object is not empty
            if (Object.keys(songData).length > 0) {
                extractedData.push(songData);
            }

        } catch (err) {
            console.error("Error processing a row:", err);
        }
    });

    if (extractedData.length === 0) {
        alert("No songs found! Make sure to scroll down the playlist to load all tracks before running the script.");
        return;
    }

    // --- FORMATTING THE FILE AND DOWNLOADING ---

    let finalContent = "";
    let mimeType = "text/plain";
    let fullFileName = `${fileName}.${fileFormat}`;

    // Formatting Logic
    switch (fileFormat) {
        case "json":
            mimeType = "application/json";
            finalContent = JSON.stringify(extractedData, null, 2);
            break;

        case "csv":
            mimeType = "text/csv";
            // Create CSV Header
            const headers = [];
            if (includeTitle) headers.push("Title");
            if (includeArtist) headers.push("Artist");
            if (includeAlbum) headers.push("Album");
            if (includeLink) headers.push("Link");
            if (includeId) headers.push("ID");
            
            finalContent += headers.join(",") + "\n";

            // Add all rows
            extractedData.forEach(item => {
                let row = [];
                // Helper to escape CSV quotes. Return "" if it dosen't find a text in that section. replace(/"/g, '""')}"` => return a double "" so it can be shown in the file Es: name song "Hello" => ""Hello"".
                const esc = (txt) => `"${(txt || "").replace(/"/g, '""')}"`;

                if (includeTitle) row.push(esc(item.title));
                if (includeArtist) row.push(esc(item.artist));
                if (includeAlbum) row.push(esc(item.album));
                if (includeLink) row.push(esc(item.link));
                if (includeId) row.push(esc(item.id));

                finalContent += row.join(",") + "\n";
            });
            break;

        case "txt":
        default:
            mimeType = "text/plain";
            // Simple text lines
            extractedData.forEach(item => {
                let parts = [];
                if (includeTitle) parts.push(item.title);
                if (includeArtist) parts.push(item.artist);
                if (includeAlbum) parts.push(item.album);
                if (includeLink) parts.push(item.link);
                if (includeId) parts.push(item.id);

                // Join with the user-selected separator
                finalContent += parts.filter(p => p).join(separator) + "\n";
            });
            break;
    }

    // Download of file
    const blob = new Blob([finalContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = fullFileName;
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    console.log(`Success! Downloaded ${extractedData.length} songs as ${fullFileName}`);
})();
