import cytoscape from "cytoscape";
import React, { Component } from "react";
import ReactJson from "react-json-view";
import _ from "underscore";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: {},
      error: "",
      graph: props.dataset.defaultgraph || "",
      graphs: [],
      elements: {
        nodess: [],
        edges: [],
      },
      cyElements: null,
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.schemaQuery = this.schemaQuery.bind(this);
    this.listGraphs = this.listGraphs.bind(this);
    this.build = this.build.bind(this);
  }

  listGraphs() {
    console.log("listing graphs...");
    fetch("/v1/graph", {
      method: "GET",
    })
      .then(
        function (response) {
          if (!response.ok) {
            var err =
              "ERROR: GET " +
              response.url +
              " " +
              response.status +
              " " +
              response.statusText;
            console.log(err);
            this.setState({ error: err });
          }
          return response.json();
        }.bind(this),
      )
      .then(
        function (json) {
          var graphs = json["graphs"]
            .filter(function (g) {
              return g.endsWith("__schema__");
            })
            .map((x) => x.replace("__schema__", ""));
          console.log("found graphs:", graphs);
          if (graphs.includes(this.state.graph)) {
            this.setState({ graphs: graphs });
          } else {
            console.log("default graph", this.state.graph, "not found");
            this.setState({ graphs: graphs, graph: "" });
          }
        }.bind(this),
      )
      .catch((err) => {
        console.log("ERROR:", err);
        err = "ERROR: No graphs found";
        console.log(err);
        this.setState({ error: err });
      });
  }

  schemaQuery(graph) {
    console.log("Getting the schema for graph: ", graph);
    fetch("/v1/graph/" + graph + "/schema", {
      method: "GET",
    })
      .then(
        function (response) {
          if (!response.ok) {
            var err =
              "ERROR: GET " +
              response.url +
              " " +
              response.status +
              " " +
              response.statusText;
            console.log(err);
            this.setState({ error: err });
          }
          return response.json();
        }.bind(this),
      )
      .then(
        function (json) {
          var edges = json["edges"].map(function (x) {
            return {
              data: {
                id: x["id"],
                label: x["label"],
                source: x["from"],
                target: x["to"],
              },
              classes: "autorotate",
            };
          });
          var nodes = json["vertices"].map(function (x) {
            return { data: { id: x["id"] } };
          });
          this.setState({
            elements: { nodes: nodes, edges: edges },
            schema: json,
          });
        }.bind(this),
      )
      .catch((err) => {
        console.log("ERROR:", err);
        err = "ERROR: Failed to load the schema";
        console.log(err);
        this.setState({ error: err });
      });
    console.log("Loaded the schema for graph: ", graph);
  }

  // handle graph selections
  handleSelect(event) {
    console.log("selected graph:", event.target.value);
    this.setState({ graph: event.target.value, error: "", selection: {} });
    this.schemaQuery(event.target.value);
  }

  componentDidMount() {
    this.listGraphs();
    if (!_.isEqual(this.state.graph, "")) {
      this.schemaQuery(this.state.graph);
    }
    this.build();
  }

  componentDidUpdate() {
    this.build();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  build() {
    if (_.isEqual(this.state.graph, "")) {
      return;
    }
    if (_.isEqual(this.state.elements, this.state.cyElements)) {
      return;
    }

    console.log("Cytoscape.js is rendering the graph...");

    var cy = cytoscape({
      container: document.getElementById("cy"),

      boxSelectionEnabled: false,
      autounselectify: false,

      minZoom: 0.1,
      maxZoom: 10,

      elements: this.state.elements,

      style: cytoscape
        .stylesheet()
        .selector("node")
        .css({
          height: 80,
          width: 80,
          "background-fit": "cover",
          "background-color": "#bcbcbc",
          "border-color": "#bcbcbc",
          "font-size": "14px",
          "border-width": 3,
          "border-opacity": 1,
          "text-valign": "center",
          label: "data(id)",
        })
        .selector("node:selected")
        .css({
          "background-color": "#4286f4",
          "border-color": "#4286f4",
        })
        .selector("edge")
        .css({
          width: 6,
          "target-arrow-shape": "triangle",
          "line-color": "#ffaaaa",
          "target-arrow-color": "#ffaaaa",
          "curve-style": "bezier",
          label: "data(label)",
        })
        .selector("edge:selected")
        .css({
          "line-color": "#4286f4",
          "target-arrow-color": "#4286f4",
        })
        .selector(".autorotate")
        .css({
          "edge-text-rotation": "autorotate",
        }),

      layout: {
        name: "cose",
      },
    });

    cy.on("tap", "edge", (event) => {
      var targetEdge = event.target.data().id;
      var data = {};
      for (var i = 0; i < this.state.schema.edges.length; i++) {
        if (this.state.schema.edges[i].id === targetEdge) {
          data = this.state.schema.edges[i];
        }
      }
      this.setState({ selection: data });
    });
    cy.on("tap", "node", (event) => {
      var targetVertex = event.target.data().id;
      var data = {};
      for (var i = 0; i < this.state.schema.vertices.length; i++) {
        if (this.state.schema.vertices[i].id === targetVertex) {
          data = this.state.schema.vertices[i];
          // add some custom logic
          if (_.isEqual(data.label, "GeneExpression")) {
            data.data.values = { ENSG00000004059: "STRING", "...": "STRING" };
          } else if (_.isEqual(data.label, "TranscriptExpression")) {
            data.data.values = { ENST00000000233: "STRING", "...": "STRING" };
          } else if (_.isEqual(data.label, "CopyNumberAlteration")) {
            data.data.values = { ENSG00000004059: "STRING", "...": "STRING" };
          }
        }
      }
      this.setState({ selection: data });
    });
    this.cy = cy;
    this.setState({ cyElements: this.state.elements });
  }

  render() {
    let selectStyle = {
      width: "15%",
      height: "2em",
      fontSize: "1.25em",
      margin: "10px auto",
      display: "block",
    };
    let optionItems = this.state.graphs.map((graph) => (
      <option key={graph}>{graph}</option>
    ));
    let cyStyle = {
      height: this.props.dataset.height,
      width: this.props.dataset.width,
      margin: "5px auto",
      borderStyle: "solid",
      borderColor: "#D3D3D3",
      borderWidth: "thin",
    };
    return (
      <div>
        <div id="selectGraph">
          <select
            style={selectStyle}
            value={this.state.graph}
            onChange={this.handleSelect}
          >
            <option value="" disabled>
              Select Graph
            </option>
            {optionItems}
          </select>
        </div>
        <div id="errorMessage">
          <h4 style={{ color: "red", textAlign: "center" }}>
            {this.state.error}
          </h4>
        </div>
        <div style={cyStyle} id="cy"></div>
        <div
          style={{ width: this.props.dataset.width, margin: "5px auto" }}
          id="reactJson"
        >
          <ReactJson
            src={this.state.selection}
            name={false}
            enableClipboard={false}
            displayDataTypes={false}
          />
        </div>
      </div>
    );
  }
}

export default App;
