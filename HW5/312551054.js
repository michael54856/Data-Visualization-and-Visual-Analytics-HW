var data;

var offsetX = 300;

var attribute = [];

var sortType = "descending";

function colorAttribute(attributeName) {
  if (attributeName == 'scores_teaching') {
    return '#e41a1c';
  }
  else if (attributeName == 'scores_research') {
    return '#377eb8';
  }
  else if (attributeName == 'scores_citations') {
    return '#4daf4a';
  }
  else if (attributeName == 'scores_industry_income') {
    return '#ffc800';
  }
  else if (attributeName == 'scores_international_outlook') {
    return '#f200ff';
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




function checkboxClicked(event) 
{
    var checkbox = event.target;
    var name = checkbox.getAttribute("name");
    if(checkbox.checked)
    {
        document.getElementById(name).style.display = "flex";
        document.getElementById(name+"_select").style.display = "block";
    }
    else
    {
        document.getElementById(name).style.display = "none";
        document.getElementById(name+"_select").style.display = "none";

        var selectMenu = document.querySelector('.selectMenu');
        var options =  document.querySelector('.selectMenu').querySelectorAll('option');
    
        if(selectMenu.value == name)//要換value
        {
            for(var i = 0; i < options.length; i++) 
            {
                if(options[i].style.display != "none")
                {
                  selectMenu.value = options[i].value;
                  break;
                }
            }
        }
    }


    updatePlot();
    updatePlot();

}

function sortRuleBoxClicked(event) 
{
    var ascendingBox = document.getElementById("ascending");
    var descendingBox = document.getElementById("descending");

    ascendingBox.checked = false;
    descendingBox.checked = false;

    var thisCheckBox = event.target;

    thisCheckBox.checked = true;

    sortType = thisCheckBox.id;

    updatePlot();
    updatePlot();

}

var checkboxes = document.querySelectorAll(".myCheckbox");
checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener("click", checkboxClicked);
});

var sortRuleBoxes = document.querySelectorAll(".sortRule");
sortRuleBoxes.forEach(function(sortRuleBox) {
  sortRuleBox.addEventListener("click", sortRuleBoxClicked);
});



var selectElement = document.querySelector('.selectMenu');


selectElement.addEventListener('change', function() {
    updatePlot();
    updatePlot();
});


d3.csv("TIMES_WorldUniversityRankings_2024.csv").then(function (csvData) {

  // 過濾多餘的row
  csvData = csvData.filter(function (d) {
    return d['scores_overall'] != "n/a";
  });

  data = csvData;

  updatePlot();
  updatePlot();

});

function updatePlot() {
  var originalSVG = d3.select("#plot");
    originalSVG.selectAll("*").remove();

  attribute = [];

  var tags = document.getElementsByName("chosenLabel");
  for (var i = 0; i < tags.length; i++)
  {
      if(tags[i].style.display != "none")
      {
        attribute.push(tags[i].id);
      }
  }

  var margin = { top: 10, right: 30, bottom: 30, left: 50 },
    width = 1200 - margin.left - margin.right,
    height = 20000 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var school = data.map(function (d) { return d.name; });

  const y = d3.scaleBand()
    .domain(school)
    .range([0, height])
    .padding([0.1]);

  svg.append("g")
    .attr("transform", `translate(${offsetX}, 20)`)
    .call(d3.axisLeft(y));

  const x = d3.scaleLinear()
    .domain([0, 500])
    .range([0, width - offsetX]);

  svg.append("g")
    .attr("transform", `translate(${offsetX}, 20)`)
    .call(d3.axisTop(x).tickSizeOuter(0));


  var sortAttribute = selectElement.value;
  console.log(sortAttribute);

  data.sort(function(a, b) {

    if(sortAttribute == "scores_overall") //直接算加權
    {
      var totalA = (+a["scores_teaching"]) + (+a["scores_research"]) + (+a["scores_citations"]) + (+a["scores_industry_income"]) + (+a["scores_international_outlook"]);
      var totalB = (+b["scores_teaching"]) + (+b["scores_research"]) + (+b["scores_citations"]) + (+b["scores_industry_income"]) + (+b["scores_international_outlook"]);
      if(sortType == "descending")
      {
          if(totalA > totalB)
          {
              return -1;
          }
          else if(totalA < totalB)
          {
              return 1;
          }
          return 0;
      }
      else
      {
          if(totalA > totalB)
          {
              return 1;
          }
          else if(totalA < totalB)
          {
              return -1;
          }
          return 0;
      }
    }
    else
    {
      if(sortType == "descending")
      {
        if((+a[sortAttribute]) > (+b[sortAttribute]))
        {
            return -1;
        }
        else if((+a[sortAttribute]) < (+b[sortAttribute]))
        {
            return 1;
        }
        return 0;
      }
      else
      {
        if((+a[sortAttribute]) > (+b[sortAttribute]))
        {
            return 1;
        }
        else if((+a[sortAttribute]) < (+b[sortAttribute]))
        {
            return -1;
        }
        return 0;
      }
    }

    
  });

  console.log(data);


  //stack the data? --> stack per subgroup
  var stackedData = d3.stack().keys(attribute)(data);

  // Show the bars
  svg.append("g")
    .attr("transform", `translate(${offsetX}, 20)`)
    .attr("id", "barGraph")
    .selectAll("g")
    .data(stackedData)
    .enter().append("g")
    .attr("fill", function (d) { return colorAttribute(d.key); })
    .attr("name", function (d) { return d.key; })
    .selectAll("rect")
    .data(function (d) { return d; })
    .enter().append("rect")
    .attr("x", function (d) {return (x(d[0])); })
    .attr("y", function (d) { return y(d.data.name); })
    .attr("width", function (d) { return x(d[1]) - x(d[0]); })
    .attr("height", y.bandwidth())
    .style("pointer-events", "all") 
    .on("mousemove", highlightAttribute) 
    .on("mouseout", resetHighlights); 


  
  function highlightAttribute(event) {

    var colorName = event.target.parentNode.getAttribute("name");

    var allBars = d3.select("#barGraph").selectAll("g");

    allBars.each(function(d, i) {
        if(this.getAttribute("name") == colorName)
        {
            this.setAttribute("fill-opacity", "1.0");
        }
        else
        {
            this.setAttribute("fill-opacity", "0.5");
        }
    });
      

  }

  function resetHighlights() 
  {
    var allBars = d3.select("#barGraph").selectAll("g");

    allBars.each(function(d, i) {
      this.setAttribute("fill-opacity", "1.0");
    });
  }
  
}
