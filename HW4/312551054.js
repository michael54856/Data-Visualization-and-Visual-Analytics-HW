var data;

dimensions = ["sepal length", "sepal width", "petal length", "petal width"];

flowerClass = ["Iris-virginica", "Iris-setosa", "Iris-versicolor"];

rowType = [];

for (var i = 0; i < dimensions.length; i++) {
  for (var j = 0; j < dimensions.length; j++) {
    rowType.push({
      x: dimensions[i],
      y: dimensions[j],
    });
  }
}

d3.csv("iris.csv").then(function (csvData) {

  // 過濾多餘的獵
  csvData = csvData.filter(function (d) {
    return d['sepal length'] != "";
  });

  data = csvData;

  updatePlot();

});

function colorScale(irisClass) {
  if (irisClass == 'Iris-virginica') {
    return '#ffb152';
  }
  else if (irisClass == 'Iris-setosa') {
    return '#52ff6c';
  }
  return '#6c52ff';
}

function updatePlot() {

  var size = 150;
  var padding = 20;

  var position = {}
  for (i in dimensions) {
    var name = dimensions[i];
    position[name] = d3.scaleLinear()
      .domain(d3.extent(data, function (d) { return +d[name]; }))
      .range([padding / 2, size - padding / 2])
      .nice();
  }

  // Root panel.
  var svg = d3.select("#plot")
    .append("svg")
    .attr("width", size * dimensions.length+80)
    .attr("height", size * dimensions.length + 50)

  var column = svg.selectAll("g")
    .data(dimensions)
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(" + (i * size + 20) + ",0)"; });

  var row = column.selectAll("g") //row裡面的資料是 {x: dimension, y: dimension}
    .data(cross(dimensions))
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(0," + i * size + ")"; });

  row.selectAll("line.x")
    .data(function (d) { return position[d.x].ticks(5).map(position[d.x]); })
    .enter().append("line")
    .attr("class", "x")
    .attr("x1", function (d) { return d; })
    .attr("x2", function (d) { return d; })
    .attr("y1", padding / 2)
    .attr("y2", size - padding / 2)
    .style("stroke", "#ccc");

  row.selectAll("line.y")
    .data(function (d) { return position[d.y].ticks(5).map(position[d.y]); })
    .enter().append("line")
    .attr("class", "y")
    .attr("x1", padding / 2)
    .attr("x2", size - padding / 2)
    .attr("y1", function (d) { return d; })
    .attr("y2", function (d) { return d; })
    .style("stroke", "#ccc");


  row.filter(function (d, i) { return d.x != d.y; })
    .append("rect")
    .attr("x", padding / 2)
    .attr("y", padding / 2)
    .attr("width", size - padding)
    .attr("height", size - padding)
    .style("fill", "none")
    .style("stroke", "#aaa")
    .style("stroke-width", 1.5)
    .attr("pointer-events", "all")
    .on("mousedown", mousedown);

  row.filter(function (d, i) { return d.x == d.y; })
    .append("rect")
    .attr("x", padding / 2)
    .attr("y", padding / 2)
    .attr("width", size - padding)
    .attr("height", size - padding)
    .style("fill", "none")
    .style("stroke", "#aaa")
    .style("stroke-width", 1.5)
    .attr("pointer-events", "all")

  let allData = getMyData(data);

  var bottomGroups = column.selectAll("g:last-child");

  var leftMostGroups = svg.selectAll("g:first-child").selectAll('g');

  var rightMostGroups = svg.selectAll("g:last-child").selectAll('g');

  for (var k = 0; k < 4; k++) {
    var yAxis = d3.axisLeft(position[dimensions[k]]).ticks(5);
    leftMostGroups.filter(function (d, i) { return d.y == dimensions[k]; })
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(10," + 0 + ")")
      .call(yAxis);
  }

  for (var k = 0; k < 4; k++) {
    var xAxis = d3.axisBottom(position[dimensions[k]]).ticks(5);
    bottomGroups.filter(function (d, i) { return d.x == dimensions[k]; })
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + 140 + ")")
      .call(xAxis);
  }

  row.filter(function (d, i) { return d.x == d.y; })
      .append("text")
      .attr("x", 50) 
      .attr("y", 30)
      .style("text-anchor", "middle") 
      .style("font-size", 14)
      .text(function(d){return d.x});

      
  var diagonalCell = row.filter(function (d, i) { return d.x == d.y; });


  var maxHeightForEachCell = {};


  diagonalCell.each(function(f, i) {
    var dataType = f.x;
    var maxHeight = 0;
    for(var j = 0; j < flowerClass.length; j++)
    {

      var histogram = d3.histogram()
          .domain(position[dataType].domain())
          .thresholds(position[dataType].ticks(10)); // 指定桶的数量

      var currentClass = [];

      for(var k = 0; k < allData.length; k++)
      {
          if(allData[k]["x"] == allData[k]["y"] && allData[k]["x"] == dataType && allData[k]["class"] == flowerClass[j])
          {
            currentClass.push(allData[k][allData[k]["x"]]);
          }
      }
      var bins = histogram(currentClass);

      for(var k = 0; k < bins.length; k++)
      {
        if(bins[k].length > maxHeight)
        {
          maxHeight = bins[k].length;
        }
      }
    }
    maxHeightForEachCell[dataType] = (maxHeight+5);
  });


  var axisAmountScale = {}
  for (i in dimensions) {
    var name = dimensions[i];
    axisAmountScale[name] = d3.scaleLinear()
      .domain([maxHeightForEachCell[dimensions[i]], 0])
      .range([padding / 2, size - padding / 2])
      .nice();
  }

  for (var k = 0; k < 4; k++) {
    var yAxis = d3.axisRight(axisAmountScale[dimensions[k]]).ticks(5);
    rightMostGroups.filter(function (d, i) { return d.y == dimensions[k]; })
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(140,0)")
      .call(yAxis);
  }

  svg.append("text")
      .attr("x", 300) 
      .attr("y", -640)
      .attr("transform", "rotate(90)") 
      .style("text-anchor", "middle") 
      .style("font-size", 20)
      .text("數量");

  diagonalCell.each(function(f, i) {
      var dataType = f.x;
      for(var j = 0; j < flowerClass.length; j++)
      {

        var histogram = d3.histogram()
          .domain(position[dataType].domain())
          .thresholds(position[dataType].ticks(10)); // 指定桶的数量

        var currentClass = [];

        for(var k = 0; k < allData.length; k++)
        {
            if(allData[k]["x"] == allData[k]["y"] && allData[k]["x"] == dataType && allData[k]["class"] == flowerClass[j])
            {
              currentClass.push(allData[k][allData[k]["x"]]);
            }
        }

        
        var bins = histogram(currentClass);

        var slotRange = d3.scaleLinear()
              .range([size - padding / 2, padding / 2])
              .domain([0, maxHeightForEachCell[dataType]]);  

        var g = d3.select(this).append("g"); 

        g.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return `translate(${position[dataType](d.x0)} , ${slotRange(d.length)})`})
            .attr("width", function(d) { return position[dataType](d.x1) - position[dataType](d.x0)})
            .attr("height", function(d) { return 140 - slotRange(d.length);})
            .attr("stroke", colorScale(flowerClass[j]))
            .attr("name", function(d) {return d.length.toString();})
            .attr("fill", "none");   
      }
  });

  // Dot plot.
  var dot = row.selectAll("circle")
    .data(function (d, i) {
      var thisData = allData.filter(function (f) {
        if (rowType[i].x == rowType[i].y) {
          return false;
        }
        if (rowType[i].x == f.x && rowType[i].y == f.y) {
          return true;
        }
        return false;
      });
      return thisData;
    })
    .enter().append("circle")
    .attr("cx", function (d) { return position[d.x](d[d.x]); })
    .attr("cy", function (d) { return size - position[d.y](d[d.y]); })
    .attr("r", 3)
    .style("fill", function (d) { return colorScale(d.class); })
    .style("fill-opacity", .5)
    .attr("pointer-events", "none");


  d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

  var rect, x0, x1, currentPlot, count;

  function mousedown() {
    x0 = d3.pointer(event);
    count = 0;

    currentPlot = this;

    rect = d3.select(this.parentNode)
      .append("rect")
      .style("fill", "#999")
      .style("fill-opacity", 0.5);

    event.preventDefault();
  }

  function mousemove() {
    if (!rect) return;
    x1 = d3.pointer(event);

    let rectBounds = currentPlot.getBoundingClientRect();

    x1[0] -= rectBounds.left;
    x1[1] -= rectBounds.top;

    x1[0] += 10;
    x1[1] += 10;

    x1[0] = Math.max(padding / 2, Math.min(size - padding / 2, x1[0]));
    x1[1] = Math.max(padding / 2, Math.min(size - padding / 2, x1[1]));


    let minx = Math.min(x0[0], x1[0]);
    let maxx = Math.max(x0[0], x1[0]);
    let miny = Math.min(x0[1], x1[1]);
    let maxy = Math.max(x0[1], x1[1]);

    rect
      .attr("x", minx - 0.5)
      .attr("y", miny - 0.5)
      .attr("width", maxx - minx + 1)
      .attr("height", maxy - miny + 1);


    var v = rect.node().__data__,
      x = position[v.x],
      y = position[v.y],
      mins = x.invert(minx),
      maxs = x.invert(maxx),
      mint = y.invert(size - maxy),
      maxt = y.invert(size - miny);

    count = 0;
    svg.selectAll("circle")
      .style("fill", function (d) {
        return mins <= d[v.x] && maxs >= d[v.x]
          && mint <= d[v.y] && maxt >= d[v.y]
          ? (count++, colorScale(d.class))
          : "#ccc";
      });

  }

  function mouseup() {
    if (!rect) return;
    rect.remove();
    rect = null;
    currentPlot = null;


    if (!count) svg.selectAll("circle")
      .style("fill", function (d) {
        return colorScale(d.class);
      });

    haveClicked = false;

  }

}

function cross(dataDimensions) {
  return function (d) {
    var c = [];
    for (var i = 0; i < dataDimensions.length; i++) {
      c.push({ x: d, y: dataDimensions[i] });
    }
    return c;
  };
}

function getMyData(data) {
  result = [];
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < dimensions.length; j++) {
      for (var k = 0; k < dimensions.length; k++) {
        result.push({
          x: dimensions[j],
          y: dimensions[k],
          xVal: +data[i][dimensions[j]],
          yVal: +data[i][dimensions[k]],
          "sepal length": +data[i]["sepal length"],
          "sepal width": +data[i]["sepal width"],
          "petal length": +data[i]["petal length"],
          "petal width": +data[i]["petal width"],
          class: data[i]['class']
        });
      }
    }
  }
  return result;

}
