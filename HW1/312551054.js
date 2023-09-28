var data;

function colorScale(irisClass)
{
    if(irisClass == 'Iris-virginica')
    {
        return '#ffb152';
    }
    else if(irisClass == 'Iris-setosa')
    {
        return '#52ff6c';
    }
    return '#6c52ff';
}


window.addEventListener("resize", function() {
    updatePlot();
});

// 讀取CSV文件
d3.csv("iris.csv").then(function(csvData) {

    // 過濾多餘的獵
    csvData = csvData.filter(function(d) {
        return d['sepal length'] != "";
    });

    data = csvData;

    updatePlot();

});


function updatePlot()
{
    var xLabels = document.getElementsByName('xLabel');
    var xAxisName;
    for(var i = 0; i < xLabels.length; i++)
    {
        if(xLabels[i].checked)
        {
            xAxisName = xLabels[i].value;
            break;
        }
    }
    

    var yLabels = document.getElementsByName('yLabel');
    var yAxisName;
    for(var i = 0; i < yLabels.length; i++)
    {
        if(yLabels[i].checked)
        {
            yAxisName = yLabels[i].value;
            break;
        }
    }

    var originalSVG = d3.select("#scatter-plot");
    originalSVG.selectAll("*").remove();

    // 定義畫布大小和邊緣空白
    var margin = { top: 20, right: 30, bottom: 60, left: 100},
    width = $("#scatter-plot").width() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    // 選擇容器
    var svg = d3.select("#scatter-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // 設置X和Y比例尺
    var x = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return +d[xAxisName]; }), d3.max(data, function(d) { return +d[xAxisName]; })])
        .range([0, width])
        .nice();

    var y = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return +d[yAxisName]; }), d3.max(data, function(d) { return +d[yAxisName]; })])
        .range([height, 0])
        .nice();

    // 創建X軸和Y軸
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);

    // 添加X軸和Y軸到畫布
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

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
    
    // 添加y軸格線
    svg.selectAll("line.y-grid")
        .data(y.ticks()) // 選擇y軸刻度的位置
        .enter()
        .append("line")
        .attr("class", "y-grid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", function(d) { return y(d); })
        .attr("y2", function(d) { return y(d); })
        .style("stroke", "#ccc"); // 設置網格線的顏色
    
    svg.append("text")
        .attr("x", width / 2) 
        .attr("y", height + margin.bottom-10)
        .style("text-anchor", "middle") 
        .style("font-size", 25)
        .text(xAxisName);
    
    svg.append("text")
        .attr("transform", "rotate(-90)") 
        .attr("x", -height / 2) 
        .attr("y", -margin.left + 30)
        .style("text-anchor", "middle") 
        .style("font-size", 25)
        .text(yAxisName); 

    // 繪製散點
    var circles = svg.selectAll("circle")
                    .data(data)
                    .enter().append("circle")
                    .attr("cx", function(d) { return x(+d[xAxisName]); })
                    .attr("cy", function(d) { return y(+d[yAxisName]); })
                    .attr("r", 3) 
                    .attr('fill-opacity', 0.25)
                    .style("fill", function(d) { return colorScale(d['class']);}); // 圓點顏色
    
    // 添加動畫效果
    circles.transition()
    .duration(500) 
    .attr("r", 10) 
    .attr('fill-opacity', 0.5)

}
