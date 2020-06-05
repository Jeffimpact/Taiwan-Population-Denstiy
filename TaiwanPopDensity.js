/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

// Define SVG element; and width and height

var width = 960,
    height = 980;


var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

//Define map projection https://bl.ocks.org/PM25/2674f28945c36a394aa4d4c9e410485a

var projection = d3
    .geoMercator() // Mercator projection
    .center([121, 24]) // Center point (latitude and longitude)
    .scale(8000) // magnification
    .translate([width / 2, height / 2]); 

//Define path generator
var path = d3.geoPath().projection(projection);

//Define quantize scale to sort data values into buckets of color
var color = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
//    .domain([1, 10, 100, 200, 300, 500, 1000, 2000])
    .range(d3.schemeOrRd[9]);


var x = d3.scaleSqrt()
    .domain([0, 4500])
    .rangeRound([450, 950]);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("font-size", "150%")
    .text("Population per square mile");

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

//    City,Population density
    
d3.csv("PopulationDensity.csv").then(function(data) {
    
    d3.json("gadm36_TWN_2_Topo.json").then(function(json) { // topojson
            
            // Define feature from topojson feature structures
            var topofeature = topojson.feature(json, json.objects.gadm36_TWN_2);
//            console.log("features in JSON are: ", topofeature);
            
            var geometry = json.objects.gadm36_TWN_2.geometries;
            console.log("geo len: ", geometry.length);
            
                    //Merge the ag. data and GeoJSON
					//Loop through once for each ag. data value
            // read data from csv file put into array
            for (var i = 0; i < data.length; i++) {
                
				//Grab cites name
				var dataCity = data[i].city;
				console.log("City name: ", dataCity);
				console.log("index is: ", i);
//                        
				//Grab data value, and convert from string to float
				var dataValue = parseFloat(data[i].density);
                console.log("City Density: ", dataValue);
//                    data[i].Density;

                for (var j = 0; j < geometry.length; j++) {

                    var jsonCity = geometry[j].properties.NAME_2;
                        
                        if (dataCity === jsonCity){
                            //Copy the data value into the JSON
                            geometry[i].properties.density = dataValue;

                            break;
                        }

                    } // end inner forloop
                                
				} // end outer forloop
                
            // fill density of cities
            svg.append("g")
                .selectAll("path")
                .data(topofeature.features)
                .enter().append("path")
                .attr("fill", function(d) {

                    var  value = d.properties.density;
                    if (value){
                        return color(value);
                    }
                    else{
                        return "#ccc";
                    }
                         })
                .attr("d", path);
        
        // modify the boundary 
          svg.append("path")
              .datum(topofeature)
              .attr("fill", "none")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.25)
              .attr("d", path);
          
        });  // end json
    
});  // end csv
