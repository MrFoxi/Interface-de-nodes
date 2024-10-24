
if(typeof windowValue === 'undefined') {
    loadGraphDataByWindow(1)
}

let isMenuOpen = true;

function loadGraphDataByWindow(windowValue) {
    
    // Construire l'URL avec la valeur de 'window' en tant que paramètre GET
    const url = `/graph_data_by_window/?window=${windowValue}`;

    

    d3.select("#graph-container").html('');

    



// Fonction pour créer une flèche
function createArrow() {
    var position_arrow = false;
    
    const arrow = d3.select("#graph-container svg").append("g")
        .attr("class", "arrow")
        .attr("transform", "translate(1890, 490)"); // Positionnez la flèche à droite

    arrow.append("polygon")
        .attr("points", "0,0 20,-10 20,10")
        .attr("fill", "white") // Couleur de la flèche
        .style("cursor", "pointer") // Changer le curseur pour indiquer que c'est cliquable
        .on("click", () => {
            toggleMenu(); // Appelle la fonction pour afficher/masquer le menu
            // Mettre à jour la position de la flèche
            updateArrowPosition(position_arrow, arrow);
            position_arrow = !position_arrow; // Inverser l'état de la flèche
        });
}

function updateArrowPosition(isMenuOpen, arrow) {
    if (isMenuOpen) {
        arrow.attr("transform", "translate(1890, 490)"); // Position de la flèche quand le menu est fermé
    } else {
        arrow.attr("transform", "translate(1510, 490)"); // Position de la flèche quand le menu est ouvert
    }
}

function loadWindows() {
    // Charger les fenêtres existantes
    d3.json('/get_windows/').then(function (windows) {
        const menu = d3.select("#menu-right");
        menu.html(''); // Effacer le contenu du menu avant de recharger les fenêtres
        
        // Ajouter un titre pour le menu
        menu.append("h3").text("Liste des fenêtres:").attr("class", "menutitre");
        
        // Créer un div contenant la liste des fenêtres
        const windowsList = menu.append("div").attr("class", "list-windows");

        windows.forEach(windowValue => {
            const windowDiv = windowsList.append("div") // Ajouter chaque fenêtre dans un div avec la classe 'menulabel-right'
                .text(`Window: ${windowValue}`)
                .attr("class", "menulabel-right")
                .style("cursor", "pointer") // Indiquer que c'est cliquable
                .on("click", () => {
                    loadGraphDataByWindow(windowValue); // Recharger la page avec la valeur de la fenêtre
                    toggleMenu();
                });
        });

        menu.append("H4").text("Recharger la Page").attr("id", "reload-button").attr("class", "reload-button").style("cursor", "pointer").on("click", () => {
            location.reload(true);
        });
        
        // Ajouter un bouton pour ouvrir le modal
        const addGraphBtn = menu.append("h4")
            .text("Ajouter un graphique à cette fenêtre")
            .attr("class", "add-window")
            .style("cursor", "pointer")
            .on("click", () => {
                document.getElementById('uploadModal').style.display = "block"; // Ouvrir le modal
            });

        menu.append("a").text("Retour au menu").attr("class", "return-menu").attr("href", `/menu/`);
    });

    // Gérer la fermeture du modal
    const modal = document.getElementById('uploadModal');
    const span = document.getElementsByClassName('close')[0];

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}






function toggleMenu() {
    const menu = d3.select("#menu-right");
    // Initialiser le display si ce n'est pas défini
    if (!menu.style("display")) {
        menu.style("display", "none");
    }
    
    const isDisplayed = menu.style("display") === "block";
    
    // Afficher ou masquer le menu
    menu.style("display", isDisplayed ? "none" : "block");
    
    // Charger les fenêtres uniquement si le menu est affiché
    if (!isDisplayed) {
        loadWindows();
    }
    
    // Mettre à jour la position de la flèche
    updateArrowPosition(!isDisplayed, d3.select(".arrow")); // Passer l'état actuel du menu
} 

// Charger les données du graphe depuis l'URL /get_graph_data/
d3.json(url).then(function (data) {
    const width = 1920;
    const height = window.innerHeight - 5;

    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", function (event) {
            svg.attr("transform", event.transform);
        }))
        .append("g");  // Group for zooming

    // Grouper les nœuds et les liens par leur fichier JSON d'origine
    const jsonGroups = {};
    data.nodes.forEach(node => {
        if (!jsonGroups[node.json]) {
            jsonGroups[node.json] = { nodes: [], edges: [] };
        }
        jsonGroups[node.json].nodes.push(node);
    });

    data.edges.forEach(edge => {
        const sourceNode = data.nodes.find(node => node.id === edge.source);
        if (sourceNode) {
            jsonGroups[sourceNode.json].edges.push(edge);
        }
    });

    createArrow();

    // Fonction pour créer une simulation par groupe JSON
    function createSimulation(nodes, edges) {
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(edges).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter(width / 1.5, height / 2));

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        return simulation;
    }

    const simulations = [];
    for (const json in jsonGroups) {
        const group = jsonGroups[json];
        const simulation = createSimulation(group.nodes, group.edges);
        simulations.push(simulation);
    }

    const link = svg.selectAll(".link")
        .data(data.edges)
        .enter().append("line")
        .attr("class", "link");

    const node = svg.selectAll(".node")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("image")
        .attr("xlink:href", d => `/static/images/${d.image_node}.png`)  // Utilisation de l'ID de l'image
        .attr("x", -25)
        .attr("y", -25)
        .attr("width", 50)
        .attr("height", 50)
        .on("click", imageClicked)
        .on("mouseover", function () {
            d3.select(this.parentNode).select(".text").style("display", "block");
        })
        .on("mouseout", function () {
            d3.select(this.parentNode).select(".text").style("display", "none");
        });

    node.append("circle")
        .attr("class", "selected-circle")
        .attr("r", 33)
        .attr("cx", 0)
        .attr("cy", 0);

    node.append("text")
        .attr("dx", 30)
        .attr("dy", "0.35em")
        .text(d => d.label)
        .attr("class", "text")
        .attr("x", 30)
        .attr("y", 0)
        .style("display", "none");

    let lastClickedNodeId = null;

    function imageClicked(event, d) {
        const isDifferentNode = lastClickedNodeId !== d.id;

        if (!isDifferentNode) {
            svg.selectAll(".selected-circle").style("display", "none");
            d3.select("#menu").style("display", "none");
            lastClickedNodeId = null;
            simulations.forEach(simulation => {
                simulation.alpha(1).restart();
            });
        } else {
            svg.selectAll(".selected-circle").style("display", "none");
            if (event) {
                d3.select(event.target.parentNode).select(".selected-circle").style("display", "block");
            } else {
                svg.select(`.node[id="${d.id}"]`).select(".selected-circle").style("display", "block");
            }
            simulations.forEach(simulation => {
                simulation.alpha(1).restart();
            });

            const menu = d3.select("#menu");
            menu.html("");
            menu.append("div").html(`<h1 class="menutitre">INFORMATIONS</h1>
                                <div class="pinfo">
                                    <p class="menulabel"><span class="bold">Titre :</span><br/> ${d.label}</p>
                                    <p class="menudescription"><span class="bold">Description :</span><br/> ${d.concise_description}</p>
                                    <p class="menutype"><span class="bold">Type :</span><br/> ${d.type}</p>
                                </div>
                                <button id="editButton">Modifier</button>`);

            menu.style("display", "block");
            if (lastClickedNodeId !== null) {
                menu.style("left", "0");
            } else {
                menu.style("left", "-800px")
                    .transition()
                    .duration(100)
                    .style("left", "0");
            }

            lastClickedNodeId = d.id;

            d3.select("#editButton").on("click", () => openEditForm(d));
        }

        // Empêcher le déplacement du nœud lorsque le menu est affiché
        d.fx = d.x;
        d.fy = d.y;
    }

    function openEditForm(nodeData) {
        const menu = d3.select("#menu");
        const csrfToken = getCookie("csrftoken");
        const images = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Les noms des images sans extension
        const imageSize = 50; // La taille des images dans le tableau
    
        let selectedImage = nodeData.image_node ? nodeData.image_node : null; // Récupérer l'ID de l'image actuelle
    
        menu.html("");
        menu.append("div").html(`<h1 class="menutitre">Modifier Informations</h1>
                                <form id="editForm">
                                    <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                    <div class="pinfo">
                                        <label class="bold" for="label">Titre :</label><br/>
                                        <input type="text" id="label" name="label" value="${nodeData.label}"><br/>
                                        <label class="bold" for="concise_description">Description :</label><br/>
                                        <textarea id="concise_description" name="concise_description">${nodeData.concise_description}</textarea><br/>
                                        <label class="bold" for="type">Type :</label><br/>
                                        <input type="text" id="type" name="type" value="${nodeData.type}"><br/>
                                    </div>
                                    <div class="image-selector">
                                        <p class="bold">Choisir une image :</p>
                                        <div class="image-grid"></div>
                                    </div>
                                    <button type="submit">Sauvegarder</button>
                                </form>`);
    
        const imageGrid = menu.select(".image-grid");
        images.forEach(imageNum => {
            imageGrid.append("img")
                .attr("src", `/static/images/${imageNum}.png`)
                .attr("alt", `${imageNum}`)
                .attr("width", imageSize)
                .attr("height", imageSize)
                .attr("class", "selectable-image")
                .style("border", imageNum === selectedImage ? "5px solid rgb(78,78,78)" : "none")
                .on("click", function () {
                    selectedImage = imageNum;
                    d3.selectAll(".selectable-image").style("border", "none");
                    d3.select(this).style("border", "5px solid rgb(78,78,78)").style("border-radius", "50em");
                });
        });
    
        d3.select("#editForm").on("submit", function (event) {
            event.preventDefault();
            const formData = new FormData(this);
            formData.append("image_node", selectedImage); // Ajouter l'image sélectionnée aux données du formulaire
    
            fetch(`/update_node/${nodeData.id}/`, {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": csrfToken
                }
            }).then(response => response.json())
                .then(response => {
                    if (response.success) {
                        // Update the node data in the local D3 graph
                        nodeData.label = response.node.label;
                        nodeData.concise_description = response.node.concise_description;
                        nodeData.type = response.node.type;
                        nodeData.image_node = response.node.image_node; // Mettre à jour l'ID de l'image
    
                        // Update the displayed node text and image
                        d3.selectAll(".node text").filter(d => d.id === nodeData.id)
                            .text(nodeData.label);
                        d3.selectAll(".node image").filter(d => d.id === nodeData.id)
                            .attr("xlink:href", `/static/images/${selectedImage}.png`);
    
                        // Call imageClicked with updated data to refresh the menu
                        imageClicked(null, nodeData);
                        imageClicked(null, nodeData);
                    } else {
                        console.log("Errors:", response.errors);
                    }
                }).catch(error => {
                    console.error("Error:", error);
                });
        });
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    node.on("contextmenu", imageRightClicked);
    let selectedNodes = [];

    function imageRightClicked(event, d) {
        event.preventDefault();
        const currentImage = d3.select(event.target.parentNode).select("image");
        const newWidth = 60;
        const newHeight = 60;

        currentImage.transition()
            .duration(0)
            .attr("x", -30)
            .attr("y", -30)
            .attr("width", newWidth)
            .attr("height", newHeight);

        setTimeout(() => {
            currentImage.transition()
                .duration(200)
                .attr("x", -25)
                .attr("y", -25)
                .attr("width", 50)
                .attr("height", 50);
        }, 200);

        if (selectedNodes.length < 2) {
            selectedNodes.push(d.id);
            svg.select(`.node[id="${d.id}"]`).classed("node-inactive", false);
            if (selectedNodes.length === 2) {
                findAndHighlightPath(selectedNodes[0], selectedNodes[1]);
            }
        } else {
            selectedNodes.forEach(selectedNode => {
                svg.select(`.node[id="${selectedNode}"]`).classed("node-inactive", false);
            });
            selectedNodes = [d.id];
            svg.select(`.node[id="${d.id}"]`).classed("node-inactive", false);
        }
    }

    function findAndHighlightPath(startId, endId) {
        const queue = [{ node: startId, path: [startId] }];
        const visited = new Set();

        while (queue.length > 0) {
            const { node, path } = queue.shift();

            if (node === endId) {
                highlightPath(path);
                return;
            }

            if (!visited.has(node)) {
                visited.add(node);
                const neighbors = data.edges.filter(edge => edge.source === node || edge.target === node);
                neighbors.forEach(neighbor => {
                    const neighborNode = neighbor.source === node ? edge.target : edge.source;
                    if (!visited.has(neighborNode)) {
                        queue.push({ node: neighborNode, path: [...path, neighborNode] });
                    }
                });
            }
        }
    }

    function highlightPath(path) {
        const allNodes = svg.selectAll(".node");
        const allLinks = svg.selectAll(".link");

        allNodes.classed("node-inactive", true);
        allLinks.classed("link-inactive", true);

        path.forEach(nodeId => {
            allNodes.filter(d => d.id === nodeId).classed("node-inactive", false);
        });

        for (let i = 0; i < path.length - 1; i++) {
            const sourceId = path[i];
            const targetId = path[i + 1];
            allLinks.filter(d => (d.source.id === sourceId && d.target.id === targetId) || (d.source.id === targetId && d.target.id === sourceId)).classed("link-inactive", false);
        }
    }

    function dragstarted(event, d) {
        if (!event.active) {
            simulations.forEach(simulation => simulation.alphaTarget(0.3).restart());
        }
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) {
            simulations.forEach(simulation => simulation.alphaTarget(0));
        }
        if (lastClickedNodeId !== d.id) {
            d.fx = null;
            d.fy = null;
        }
    }
});

}

// // Exemple d'appel de la fonction avec une valeur par défaut
// loadGraphDataByWindow(2);

