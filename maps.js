/*

Author: Cliff Hewitt

11-Dec-2024  Inception
14-Dec-2024  Initial release with maps Asia, Europe, USA

*/

const CANVAS = "#imageCanvas";
const DIALOG = "#mapDialog";
const MAPSTORE = "mapStore";
const image = new Image();
const maps = [asia, europe, usa];
let selMap = maps[0];
let hoverMap;
let $info;

function init() {
    $info = $("#info");
    initDropdown();
    loadImage();
    initMapDialog();

    $(CANVAS).on('click', function() {
        mapInfo();
    });
}

function initDropdown() {
    const mapName = localStorage.getItem(MAPSTORE);
    const $dropdown = $("#dropdown");

    for (var i = 0; i < maps.length; i++) {
        const entry = maps[i];
        const $li = $("<li></li>")
            .text(entry.name)
            .addClass("entry")
        $dropdown.append($li);
    }

    highlightEntry(mapName);

    // Show dropdown on mouseover
    $("#map").on("mouseenter", function () {
        highlightEntry(selMap.name);
        $dropdown.fadeIn(200);
    });

    // Highlight entries on mouseover
    $dropdown.on("mouseenter", ".entry", function () {
        $("#dropdown .entry").removeClass("highlight");
        $(this).addClass("highlight");
    });

    // Remember selected entry and hide dropdown on click
    $dropdown.on("click", ".entry", function () {
        highlightEntry($(this).text());
        loadImage();
        $dropdown.fadeOut(200);
    });

    // Hide dropdown if mouse leaves the dropdown
    $dropdown.on("mouseleave", function () {
        $(this).fadeOut(200);
    });

    // Hide dropdown if mouse leaves the button and dropdown
    $(".overlay").on("mouseleave", function () {
        $dropdown.fadeOut(200);
    });
}

function highlightEntry(entryText) {
    if (!entryText) {
        entryText = maps[0].name;
    }

    for (var i = 0; i < maps.length; i++) {
        if (entryText === maps[i].name) {
            selMap = maps[i];
        }
    }

    // Remove highlight from all entries
    $("#dropdown .entry").removeClass("highlight");

    // Find the entry with the specified text and add the highlight class
    $("#dropdown .entry").filter(function () {
        return $(this).text().trim() === entryText;
    }).addClass("highlight");
}

function initMapDialog() {
    const btnInfo = $("<button>")
        .addClass("btnInfo")
        .text("Info")
        .on("click", function() {
            alert("Info button clicked");
        });

    $(DIALOG).dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        draggable: true,
        open: function () {
            customButton = $("<button>")
                .addClass("btnInfo")
                .html("&#x1F6C8;")
                .on("click", function () {
                    openWiki();
                });
            const dialogTitleBar = $(this).dialog("widget").find(".ui-dialog-titlebar");

            // Append the custom button to the title bar if it's not already there
            if (!dialogTitleBar.find(".btnInfo").length) {
                dialogTitleBar.prepend(customButton);
            }

            // Center the dialog
            $(this).dialog("widget").position({
                my: "center",
                at: "center",
                of: window,
            });
        }
    });
}

function openWiki() {
    const url = "https://en.wikipedia.org/wiki/" + hoverMap.name;
    window.open(url, "_blank");
}

function adjustDialogSize(image) {
    const maxDialogWidth = $(window).width() * 0.8; // 80% of window width
    const maxDialogHeight = $(window).height() * 0.8; // 80% of window height
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;

    let dialogWidth, dialogHeight;

    // Fit image within max dialog dimensions
    if (maxDialogWidth / maxDialogHeight > imageAspectRatio) {
        dialogHeight = maxDialogHeight;
        dialogWidth = dialogHeight * imageAspectRatio;
    } else {
        dialogWidth = maxDialogWidth;
        dialogHeight = dialogWidth / imageAspectRatio;
    }

    // Apply size to the dialog
    $("#imageModal").dialog("option", {
        width: Math.round(dialogWidth),
        height: Math.round(dialogHeight)
    });

    $("#mapImage").css({
        width: Math.round(dialogWidth) + "px",
        height: Math.round(dialogHeight) + "px"
    });
}

function mapInfo() {
    if (hoverMap) {
        const $mapImage = $("#mapImage");
        const name = hoverMap.key ? hoverMap.key : hoverMap.name.toLowerCase().replace(/\s+/g, '-');
        let url;

        if (hoverMap.url) {
            url = hoverMap.url;
        }
        else if (usa === selMap) {
            url = 'https://geology.com/cities-map/map-of-' + name + '-cities.gif';
        }
        else if (asia === selMap || hoverMap.asia) {
             url = 'https://www.freeworldmaps.net/asia/' + name + '/' + name + '-physical-map.jpg';
        }
        else if (europe === selMap) {
            url = 'https://www.freeworldmaps.net/europe/' + name + '/' + name + '.jpg';
        }

        if (url) {
            $mapImage.off("load error");  // Remove any existing handlers to avoid multiple calls
            $mapImage.attr('src', url);

            $mapImage.on("load", function () {
                openDialog(this);
            });

            $mapImage.on("error", function () {
                $mapImage.off("load error");
                if (asia === selMap || hoverMap.asia) {
                    url = 'https://www.freeworldmaps.net/asia/' + name + '/' + name + '-map-physical.jpg';
                    $mapImage.attr('src', url);
                    $mapImage.on("load", function () {
                        openDialog(this);
                    });
                }
                else {
                    console.error("Unable to open: " + url);
                }
            });
        }
    }
}

function openDialog(img) {
    adjustDialogSize(img);
    $(DIALOG).dialog("option", "title", hoverMap.name);
    $(DIALOG).dialog("open");
}

function loadImage() {
    const canvas = $(CANVAS)[0];
    const context = canvas.getContext('2d', { willReadFrequently: true }); // Add willReadFrequently here
    const $info = $("#info");

    localStorage.setItem(MAPSTORE, selMap.name);

    // Load an image into the canvas
    image.src = "images/" + selMap.png + ".png";

    image.onload = function () {
        drawScaledImage();

        // Add mousemove event listener
        $(CANVAS).on('mousemove', function (e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const selColor = [0,0,255];
            const pixelColor = context.getImageData(mouseX, mouseY, 1, 1).data;

            // Extract RGBA values
            const [r, g, b, a] = pixelColor;

            // Log the color to the console
            //console.log(selMap.png + ": " + `RGBA: (${r}, ${g}, ${b}, ${a / 255})`);

            if (!sameColor(selColor, pixelColor) && hoverMap) {
                let color = [255, 255, hoverMap.color];
                changeColor(canvas, context, selColor, color);
                $info.hide();
                hoverMap = undefined;
            }

            list = selMap.list;
            for (var i = 0; i < list.length; i++) {
                const map = list[i];
                const mapColor = [255, 255, map.color];
                if (sameColor(pixelColor, mapColor)) {
                    changeColor(canvas, context, pixelColor, selColor);
                    hoverMap = map;
                    const html = map.name + '<br>' + map.info + "<br>" + map.capital;
                    $info.html(html);
                    $info.show();
                    break;
                }
            }
        });

        // Redraw the image on window resize
        $(window).on('resize', drawScaledImage);
    };

    image.onerror = function () {
        console.error('Failed to load the image.');
    };
}

function sameColor(c1, c2) {
    for (var i = 0; i < c1.length && i < c2.length; i++) {
        if (c1[i] !== c2[i]) {
            return false;
        }
    }
    return true;
}

function changeColor(canvas, context, fromColor, toColor) {
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Loop through all pixels and check if the color is yellow
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];     // Red
            const g = data[i + 1]; // Green
            const b = data[i + 2]; // Blue

            if (r === fromColor[0] && g === fromColor[1] && b === fromColor[2]) {
                // Change yellow pixels to blue
                data[i] = toColor[0];       // Red
                data[i + 1] = toColor[1];   // Green
                data[i + 2] = toColor[2];   // Blue
                data[i + 3] = 255;          // alpha
            }
        }

        // Put the modified pixel data back onto the canvas
        context.putImageData(imgData, 0, 0);
}

function drawScaledImage() {
    const canvas = $(CANVAS)[0];
    const context = canvas.getContext('2d');

    // Get the dimensions of the image
    const imgWidth = image.width;
    const imgHeight = image.height;

    // Calculate scaling to fit the browser without clipping
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scale = Math.min(windowWidth / imgWidth, windowHeight / imgHeight);

    // Calculate scaled dimensions and position
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const offsetX = (windowWidth - scaledWidth) / 2;
    const offsetY = (windowHeight - scaledHeight) / 2;

    // Resize and center the canvas
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;

    // Draw the image scaled to fit the canvas
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing
    context.drawImage(image, 0, 0, scaledWidth, scaledHeight);
}
