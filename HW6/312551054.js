var data = [];

var header = ['house with 2 bedrooms', 'house with 3 bedrooms', 'house with 4 bedrooms', 'house with 5 bedrooms', 'unit with 1 bedroom', 'unit with 2 bedrooms', 'unit with 3 bedrooms']


function colorAttribute(attributeName) {
  if (attributeName == 'house with 2 bedrooms') {
    return '#1f77b4';
  }
  else if (attributeName == 'house with 3 bedrooms') {
    return '#ff7f0e';
  }
  else if (attributeName == 'house with 4 bedrooms') {
    return '#2ca02c';
  }
  else if (attributeName == 'house with 5 bedrooms') {
    return '#d62728';
  }
  else if (attributeName == 'unit with 1 bedroom') {
    return '#f5eb2c';
  }
  else if (attributeName == 'unit with 2 bedrooms') {
    return '#8c564b';
  }
  else if (attributeName == 'unit with 3 bedrooms') {
    return '#e377c2';
  }
}

const sortableList = document.querySelector(".sortable-list");
const items = sortableList.querySelectorAll(".item");

items.forEach(item => {
    item.addEventListener("dragstart", () => {
        setTimeout(() => item.classList.add("dragging"), 0);
    });
    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        updatePlot();
    });
});

const initSortableList = (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector(".dragging");
    let siblings = [...sortableList.querySelectorAll(".item:not(.dragging)")];
    let nextSibling = siblings.find(sibling => {
        return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
    });
    sortableList.insertBefore(draggingItem, nextSibling);
}
sortableList.addEventListener("dragover", initSortableList);
sortableList.addEventListener("dragenter", e => e.preventDefault());


function compareDates(date1, date2) {
  var parts1 = date1["saledate"].split('/');
  var parts2 = date2["saledate"].split('/');


  var d1 = new Date(parts1[2], parts1[1] - 1, parts1[0]);
  var d2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);

  if (d1 < d2) {
    return -1;
  } else if (d1 > d2) {
    return 1;
  } else {
    return 0;
  }
}

d3.csv("ma_lga_12345.csv").then(function (csvData) {

  csvData.forEach(function (d) {
    var classForThis = d.type + " with " + d.bedrooms + " ";

    if (+d.bedrooms == 1) {
      classForThis += "bedroom";
    }
    else {
      classForThis += "bedrooms";
    }
    d.class = classForThis;
  });

  var groupedData = {};

  for (var i = 0; i < csvData.length; i++) {
    var item = csvData[i];
    var saledate = item.saledate;

    if (groupedData[saledate]) {
      groupedData[saledate].push(item);
    } else {
      groupedData[saledate] = [item];
    }
  }

  Object.keys(groupedData).forEach(function(key) {
    var elements = groupedData[key];
    var newRow = {};
    newRow["saledate"] = key;
    for (var i = 0; i < header.length; i++)
    {
        var haveFound = false;
        for(var j = 0; j < elements.length; j++)
        {
            if(elements[j].class == header[i])
            {
                newRow[header[i]] = +elements[j].MA;
                haveFound = true;
                break;
            }
        }
        if(haveFound == false)
        {
            newRow[header[i]] = 0;
        }
    }
    data.push(newRow);
  })

  data.sort(compareDates);


  for(var i = 0; i < data.length; i++)
  {
    for(var j = 0; j < header.length; j++)
    {
        if(data[i][header[j]] == 0)
        {
            var haveValue = false;
            for(var k = i-1; k >= 0; k--)
            {
                if(data[k][header[j]] != 0)
                {
                  data[i][header[j]] = data[k][header[j]];
                  haveValue = true;
                  break;
                }
            }
            if(haveValue == false)
            {
                for(var k = i+1; k < data.length; k++)
                {
                  if(data[k][header[j]] != 0)
                  {
                    data[i][header[j]] = data[k][header[j]];
                    break;
                  }
                }
            }
        }
    }

  }

  updatePlot();

});


function updatePlot() {
  var originalSVG = d3.select("#plot");
  originalSVG.selectAll("*").remove();

  var margin = { top: 20, right: 30, bottom: 50, left: 30 };
  width = 660 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  header = [];
  var tags = document.getElementsByName("chosenLabel");
  for (var i = 0; i < tags.length; i++)
  {
    header.push(tags[i].id);
  }
  header = header.reverse();

  var svg = d3.select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  

  var parts1 = data[0]["saledate"].split('/');
  var parts2 = data[data.length-1]["saledate"].split('/');

  var d1 = new Date(parts1[2], parts1[1] - 1, parts1[0]);
  var d2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);

  // 繪製 X axis
  var x = d3.scaleTime()
    .domain([d1,d2])
    .range([0, width])
    .nice();

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5));

  // 添加x軸格線
  svg.selectAll("line.x-grid")
    .data(x.ticks()) 
    .enter()
    .append("line")
    .attr("class", "x-grid")
    .attr("x1", function(d) { return x(d); })
    .attr("x2", function(d) { return x(d); })
    .attr("y1", 0)
    .attr("y2", height)
    .style("stroke", "#ccc"); 

  // 繪製 Y axis
  const y = d3.scaleLinear()
    .domain([-3000000, 3000000])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(""));


  //stack the data
  var stackedData = d3.stack()
    .offset(d3.stackOffsetSilhouette)
    .keys(header)(data);

  //tooltip
  var Tooltip = svg
    .append("text")
    .attr("x", 220)
    .attr("y", 10)
    .style("opacity", 0)
    .style("text-align", "center")
    .style("font-size", 20);


  svg.append("text")
    .attr("x", width / 2) 
    .attr("y", height + margin.bottom-10)
    .style("text-anchor", "middle") 
    .style("font-size", 18)
    .text("Time (Year)");

  var mouseover = function(d) {
    Tooltip.style("opacity", 1);
    d3.selectAll(".myArea").style("opacity", .2);
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1);
  }
  var mousemove = function(d,i) {
    var currentType = i.key;
    Tooltip.text(currentType);
  }
  var mouseleave = function(d) {
    Tooltip.style("opacity", 0);
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none");
   }


  var area = d3.area()
  .x(function(d, i) {
    var parts = d.data.saledate.split('/');
    return x(new Date(parts[2], parts[1] - 1, parts[0])); 
  })
  .y0(function(d) { return y(d[0]); })
  .y1(function(d) { return y(d[1]); });

  svg.selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
      .attr("class", "myArea")
      .style("fill", function(d) { return colorAttribute(d.key); })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

}

