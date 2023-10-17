var data;

dimensions = ["sepal length", "sepal width", "petal length", "petal width"];
visable = [true,true,true];

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


function checkboxClicked(event) 
{
    var checkbox = event.target;
    var name = checkbox.getAttribute("name");
    if(checkbox.checked)
    {
        document.getElementById(name).style.display = "flex";
    }
    else
    {
        document.getElementById(name).style.display = "none";
    }
    updatePlot();

}

function tagCheckboxClicked(event) 
{
    var checkbox = event.target;
    var name = checkbox.getAttribute("name");
    if(name == "Iris-setosa")
    {
        if(checkbox.checked)
        {
            visable[0] = true;
        }
        else
        {
            visable[0] = false;
        }
    }
    else if(name == "Iris-versicolor")
    {
        if(checkbox.checked)
        {
            visable[1] = true;
        }
        else
        {
            visable[1] = false;
        }
    }
    else if(name == "Iris-virginica")
    {
        if(checkbox.checked)
        {
            visable[2] = true;
        }
        else
        {
            visable[2] = false;
        }
    }
    updatePlot();
}

function visableClass(irisClass)
{
    if(irisClass == "Iris-setosa")
    {
        if(visable[0] == true)
        {
            return 0.5;
        }
        return 0;
    }
    else if(irisClass == "Iris-versicolor")
    {
        if(visable[1] == true)
        {
            return 0.5;
        }
        return 0;
    }
    else if(irisClass == "Iris-virginica")
    {
        if(visable[2] == true)
        {
            return 0.5;
        }
        return 0;
    }
}

var checkboxes = document.querySelectorAll(".myCheckbox");
checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener("click", checkboxClicked);
});

var tagCheckboxes = document.querySelectorAll(".tagCheckBox");
tagCheckboxes.forEach(function(tagCheckbox) {
    tagCheckbox.addEventListener("click", tagCheckboxClicked);
});


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


window.addEventListener("resize", function() {
    updatePlot();
});

// 讀取CSV文件
d3.csv("iris.csv").then(function(csvData) {

    // 過濾多餘的列
    csvData = csvData.filter(function(d) {
        return d['sepal length'] != "";
    });

    data = csvData;

    updatePlot();

});




function updatePlot()
{
    var originalSVG = d3.select("#plot");
    originalSVG.selectAll("*").remove();

    var margin = {top: 30, right: 10, bottom: 10, left: 0},
    width = $("#plot").width() - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

    var svg = d3.select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tags = document.getElementsByName("chosenLabel");
    dimensions = [];
    for (var i = 0; i < tags.length; i++)
    {
        if(tags[i].style.display != "none")
        {
            dimensions.push(tags[i].id);
        }
    }

    var y = {}
    for (i in dimensions) 
    {
        var name = dimensions[i];
        y[name] = d3.scaleLinear()
            .domain( d3.extent(data, function(d) { return +d[name]; }) )
            .range([height, 0])
            .nice()
    }


    var x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);
    

    function path(d) 
    {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }



    svg
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", function(d) { return colorScale(d['class']);})
    .style("opacity", function(d) { return visableClass(d['class']);});



    svg.selectAll("myAxis")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    .each(function(d) { 
        d3.select(this).call(d3.axisLeft().scale(y[d]))
        .selectAll("text") // 選擇所有刻度文字
        .style("font-size", "16px"); // 設置文字大小
    })
    .append("text")
    .style("text-anchor", "middle")
    .style("font-size", "22px")
    .text(function(d) { return d; })
    .attr("y", -12) 
    .style("fill", "black");
}