var data;

var chooseType = "M";

dimensions = ["Length", "Diameter", "Height", "Whole weight", "Shucked weight", "Viscera weight", "Shell weight", "Rings"];

var tagCheckboxes = document.querySelectorAll(".tagCheckBox");
tagCheckboxes.forEach(function(tagCheckbox) {
    tagCheckbox.addEventListener("click", tagCheckboxClicked);
});

function tagCheckboxClicked(event) 
{
    tagCheckboxes.forEach(function(checkbox) {
      checkbox.checked = false;
    });

    var thisCheckbox = event.target;
    var name = thisCheckbox.getAttribute("name");
    if(name == "Male")
    {
        thisCheckbox.checked = true;
        chooseType = "M";
    }
    else if(name == "Female")
    {
        thisCheckbox.checked = true;
        chooseType = "F";
    }
    else if(name == "Infant")
    {
        thisCheckbox.checked = true;
        chooseType = "I";
    }
    updatePlot();
}


function getCorrelation(xData, yData)
{
    function getMean(numbers) 
    {
        var sum = 0;
        for(var i = 0; i < numbers.length; i++)
        {
            sum += numbers[i];
        }
        return sum / numbers.length;
    }

    function getDiffWithMean(numbers, mean) 
    {
        return numbers.map(val => val - mean);
    }

    var xMean = getMean(xData);
    var yMean = getMean(yData);
      
    var xDiff = getDiffWithMean(xData, xMean);
    var yDiff = getDiffWithMean(yData, yMean);


    const sumXYDiff = xDiff.map((val, i) => val * yDiff[i]).reduce((acc, val) => acc + val, 0);
    
    const sumXSquaredDiff = xDiff.reduce((acc, val) => acc + val ** 2, 0);
    const sumYSquaredDiff = yDiff.reduce((acc, val) => acc + val ** 2, 0);
    
    var correlation = sumXYDiff / Math.sqrt(sumXSquaredDiff * sumYSquaredDiff);

    return correlation;

}


//讀取資料
d3.text("abalone.data").then(function(csvData){
    var dataArray = d3.csvParseRows(csvData, function(d) {
        return {
            "Sex": d[0],
            "Length": +d[1],
            "Diameter": +d[2],
            "Height": +d[3], 
            "Whole weight": +d[4],
            "Shucked weight": +d[5],
            "Viscera weight": +d[6],
            "Shell weight": +d[7],
            "Rings": +d[8]
        };
    });

    data = dataArray;
    updatePlot();
})

function updatePlot()
{
    var sexSelected = [];
    for (var i = 0; i < data.length; i++)
    {
        if(data[i]["Sex"] == chooseType)
        {
            sexSelected.push(data[i]);
        }
    }

    //先計算相關係數
    //2個資料配對
    var correleationList = [];
    for(var i = 0; i < dimensions.length; i++)
    {
        var xData = [];
        for(var j = 0; j < sexSelected.length; j++)
        {
            xData.push(sexSelected[j][dimensions[i]]);
        }

        for(var j = 0; j < dimensions.length; j++)
        {
            if(i == j)
            {
                correleationList.push({
                    x: dimensions[i],
                    y: dimensions[j],
                    value: 1
                });
            }
            else
            {
                var yData = [];
                for(var k = 0; k < sexSelected.length; k++)
                {
                    yData.push(sexSelected[k][dimensions[j]]);
                }

                correleationList.push({
                    x: dimensions[i],
                    y: dimensions[j],
                    value: getCorrelation(xData,yData)
                });
            }
        }
    }

    let originalSVG = d3.select("#plot");
    originalSVG.selectAll("*").remove();

    let margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 700 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;


    let svg = d3.select("#plot")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left*2},${margin.top*2})`);

    // List of all variables and number of them
    let domain = Array.from(new Set(correleationList.map(function(d) { return d.x })))

    // Create a color scale
    let color = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(["#ff0000", "#000000", "#15ff00"]);

    // Create a size scale for bubbles on top right
    let size = d3.scaleSqrt()
    .domain([0, 1])
    .range([0, 16]);

    // X scale
    let x = d3.scalePoint()
    .range([0, width])
    .domain(domain);

    // Y scale
    let y = d3.scalePoint()
    .range([0, height])
    .domain(domain);

    var xSpace = width/8;
    var ySpace = height/8;

    // Create one 'g' element for each cell of the correlogram
    const cor = svg.selectAll(".cor")
    .data(correleationList)
    .join("g")
      .attr("class", "cor")
      .attr("transform", function(d) {
        return `translate(${domain.indexOf(d.x)*xSpace}, ${domain.indexOf(d.y)*ySpace})`;
    });

    // outer rectangle on each grid space
    cor.append("rect")
    .attr("width", xSpace-5)
    .attr("height", ySpace-5)
    .attr("x", -xSpace / 2)
    .attr("y", -ySpace / 2)
    .style("fill", "rgba(198, 198, 198, 0.1)");


    //diagonal
    cor.filter(function(d){
      const ypos = domain.indexOf(d.y);
      const xpos = domain.indexOf(d.x);
      return xpos == ypos;
    })
    .append("text")
      .attr("y", 5)
      .attr("text-anchor", "middle") 
      .attr("alignment-baseline", "middle") 
      .text(function(d) {
        return d.x;
      })
      .style("font-size", 14)
      .style("text-align", "center")
      .style("fill", "#e3aa00");

      //bottom-left
      cor.filter(function(d){
        const ypos = domain.indexOf(d.y);
        const xpos = domain.indexOf(d.x);
        return xpos < ypos;
      })
      .append("text")
        .attr("y", 5)
        .attr("text-anchor", "middle") 
        .attr("alignment-baseline", "middle") 
        .text(function(d) {
            return d.value.toFixed(2);
        })
        .style("font-size", 20)
        .style("text-align", "center")
        .style("fill", function(d){
          return color(d.value);
        });


    // top-right
    cor.filter(function(d){
        const ypos = domain.indexOf(d.y);
        const xpos = domain.indexOf(d.x);
        return xpos > ypos;
    })
    .append("circle")
      .attr("r", function(d){ return size(Math.abs(d.value)) })
      .style("fill", function(d){
        if (d.x === d.y) {
            return "#000";
        } else {
          return color(d.value);
        }
      })
      .style("opacity", 0.75);
}

let svgWidth = 660;
let svgHeight = 60;
let barWidth = 600;
let barHeight = 15;
let xOffest = (svgWidth - barWidth) / 2;

let svg_bar = d3.select("#bar")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Define the gradient
let gradient = svg_bar.append("defs")
  .append("linearGradient")
  .attr("id", "bar-gradient")
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "100%")
  .attr("y2", "0%");

  gradient.append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#ff0000");

  gradient.append("stop")
  .attr("offset", "50%")
  .attr("stop-color", "#000000");

  gradient.append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#15ff00");
  
let gradientBar = svg_bar.append("rect")
    .attr("x", xOffest) 
    .attr("y", 0) 
    .attr("width", barWidth)
    .attr("height", barHeight)
    .style("fill", "url(#bar-gradient)");

let barScale = d3.scaleLinear()
.domain([-1, 1]) 
.range([0, barWidth]);

const ticks = barScale.ticks(5);

const tickGroup = svg_bar.selectAll(".tick")
  .data(ticks)
  .enter()
  .append("g")
  .attr("class", "tick")
  .attr("transform", d => `translate(${barScale(d)+xOffest}, ${barHeight + 5})`);

tickGroup.append("line")
  .attr("x1", 0)
  .attr("x2", 0)
  .attr("y1", 0)
  .attr("y2", 10)
  .style("stroke", "black");

tickGroup.append("text")
  .attr("x", 0)
  .attr("y", 30)
  .style("text-anchor", "middle")
  .text(d => d);

