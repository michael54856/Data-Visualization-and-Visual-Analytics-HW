d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target);
          }
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    //
    moveSinksRight(x);
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};

//============Sankey==============


var data = { "links": [], "nodes": [] };

var nameToInt = {};
var globalCounter = 0;
var globalNameDic = {};

var attributes = ["buying", "maint", "doors", "persons", "lug_boot", "safety"];

function colorName(name)
{
    if(name == 'buying')
    {
        return "#fc0303";
    }
    else if(name == "maint")
    {
      return "#fc7f03";
    }
    else if(name == "doors")
    {
      return "#fcec03";
    }
    else if(name == "persons")
    {
      return "#41fc03";
    }
    else if(name == "lug")
    {
      return "#03ecfc";
    }
    else if(name == "safety")
    {
      return "#ba03fc";
    }
}



function readTextFile(filePath) {
  return new Promise(function (resolve, reject) {
    d3.text(filePath, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

readTextFile("http://vis.lab.djosix.com:2023/data/car.data").then(function (csvData) {
  var dataArray = d3.csvParseRows(csvData, function (d) {
    return {
      "buying": d[0],
      "maint": d[1],
      "doors": d[2],
      "persons": d[3],
      "lug_boot": d[4],
      "safety": d[5],
      "class": d[6],
    };
  });

  var item = {};

  for (var i = 0; i < dataArray.length; i++) 
  {
    for (var j = 0; j < attributes.length - 1; j++) 
    {
      var k = j+1;
      var label;
      label = attributes[j] + "_" + dataArray[i][attributes[j]] + "-" + attributes[k] + "_" + dataArray[i][attributes[k]];
      if (label in item) {
        item[label] += 1;
      }
      else {
        item[label] = 1;
      }
      
    }
  }


  Object.keys(item).forEach(function (key) {

    var source = key.split('-')[0];
    var target = key.split('-')[1];

    if (source in nameToInt) {
      source = nameToInt[source];
    }
    else {
      nameToInt[source] = globalCounter;
      globalCounter += 1;
      source = nameToInt[source];
    }

    if (target in nameToInt) {
      target = nameToInt[target];
    }
    else {
      nameToInt[target] = globalCounter;
      globalCounter += 1;
      target = nameToInt[target];
    }

    var newLink = {};
    newLink['source'] = source;
    newLink['target'] = target;
    newLink['value'] = item[key];


    if (key.split('-')[0] in globalNameDic) 
    {

    }
    else 
    {
      var nameNode = {};
      nameNode.name = key.split('-')[0];
      nameNode.node = nameToInt[key.split('-')[0]];
      globalNameDic[key.split('-')[0]] = 1;
      data["nodes"].push(nameNode);
    }

    if (key.split('-')[1] in globalNameDic)
    {

    }
    else 
    {
      var nameNode = {};
      nameNode.name = key.split('-')[1];
      nameNode.node = nameToInt[key.split('-')[1]];
      globalNameDic[key.split('-')[1]] = 1;
      data["nodes"].push(nameNode);
    }

    data["links"].push(newLink);

  })

  updatePlot();


}).catch(function (error) {
  console.error("Error reading the file: " + error);
});

function updatePlot() {

  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var margin = { top: 10, right: 10, bottom: 10, left: 10 },
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

  var svg = d3.select("#plot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");


  var sankey = d3.sankey()
    .nodeWidth(26)
    .nodePadding(50)
    .size([width, height]);


  // Constructs a new Sankey generator with the default settings.
  sankey
    .nodes(data.nodes)
    .links(data.links)
    .layout(1);

  // add in the links
  var link = svg.append("g")
    .selectAll(".link")
    .data(data.links)
    .enter()
    .append("path")
    .attr("class", function (d) {return "link"; })
    .attr("d", sankey.link())
    .style("stroke-width", function (d) { return Math.max(1, d.dy); })
    .sort(function (a, b) { return b.dy - a.dy; })
    .on("mouseover", function (d) {

      var tooltipText =  "<span>Source: " + d.source.name + "</span>";
      tooltipText += "<span>Target: " + d.target.name + "</span>";
      tooltipText += "<span>Frequency: " + d.value + "</span>";

      var xPosition = d3.event.pageX  + 10; 
      var yPosition = d3.event.pageY  - 90; 


      tooltip.html(tooltipText)
        .style("left", xPosition + "px")
        .style("top", yPosition + "px")
        .style("opacity", 1);
    })
    .on("mousemove", function (d) {

      var tooltipText =  "<span>Source: " + d.source.name + "</span>";
      tooltipText += "<span>Target: " + d.target.name + "</span>";
      tooltipText += "<span>Frequency: " + d.value + "</span>";

      var xPosition = d3.event.pageX  + 10; 
      var yPosition = d3.event.pageY  - 90; 


      tooltip.html(tooltipText)
        .style("left", xPosition + "px")
        .style("top", yPosition + "px")
        .style("opacity", 1);
    })
    .on("mouseout", function (d) {
      tooltip.style("opacity", 0);
    });


  var node = svg.append("g")
    .selectAll(".node")
    .data(data.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
    .call(d3.drag()
      .subject(function (d) { return d; })
      .on("start", function () { this.parentNode.appendChild(this); })
      .on("drag", dragmove));


  node
    .append("rect")
    .attr("height", function (d) { return d.dy; })
    .attr("width", sankey.nodeWidth())
    .style("fill", function (d) {console.log(d.name); return d.color = colorName(d.name.split('_')[0]); })
    .style("stroke", function (d) { return d3.rgb(d.color).darker(2); })
    .append("title")
    .text(function (d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });

  node
    .append("text")
    .attr("x", -6)
    .attr("y", function (d) { return d.dy / 2; })
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function (d) { return d.name; })
    .filter(function (d) { return d.x < width / 2; })
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");


  function dragmove(d) {
    d3.select(this)
      .attr("transform",
        "translate("
        + d.x + ","
        + (d.y = Math.max(
          0, Math.min(height - d.dy, d3.event.y))
        ) + ")");
    sankey.relayout();
    link.attr("d", sankey.link());
  }


}