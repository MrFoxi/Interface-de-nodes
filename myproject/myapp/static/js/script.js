// Définir les chemins des images dans le script
var imageUrl = "/static/images/Capture.png";
console.log(imageUrl);

// Charger les données du graphe depuis l'URL /get_graph_data/
d3.json("/get_graph_data/").then(function (data) {
    const width = window.innerWidth;
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
        .attr("xlink:href", imageUrl)
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
            d3.select(event.target.parentNode).select(".selected-circle").style("display", "block");
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
                                <button type="submit">Sauvegarder</button>
                            </form>`);

        d3.select("#editForm").on("submit", function (event) {
            event.preventDefault();
            const formData = new FormData(this);
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

                        // Update the displayed node text
                        d3.select(`.node text`).filter(d => d.id === nodeData.id)
                            .text(nodeData.label);

                        // Close the edit form
                        menu.style("display", "none");
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
