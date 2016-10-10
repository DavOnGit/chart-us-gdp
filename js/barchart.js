
var padding = 45,
	h = parseInt(d3.select("#chart").style("height")) - padding*2,
	w = parseInt(d3.select("#chart").style("width")) - padding*2;

var parseDate = d3.timeParse("%Y-%m-%d");
var formatDate = d3.timeFormat("%Y %B");
var formatValue = d3.format("^ ,.5r");

var colScale = d3.scaleLinear().rangeRound([0, 255]);
var xScale = d3.scaleBand().range([0, w]);
var tScale = d3.scaleTime().range([0, w]);
var yScale = d3.scaleLinear().range([h, 0]);

var xAxis = d3.axisBottom(tScale);
var yAxis = d3.axisLeft(yScale)
	.tickFormat(d3.formatPrefix(",.0", 1e3));

var line = d3.line()
	.x(function(d) { return tScale(d.date); })
    .y(function(d) { return yScale(d.val); });

var chart = d3.select("#chart")
	.attr("width",w + padding*2)
	.attr("height",h + padding*2)
	.append("g")
    .attr("transform", "translate(" + padding + "," + padding + ")");

var tooltip = d3.select("body")
	.append("div")
	.attr("id", "tooltip")
	.classed("hidden", true)

tooltip.append("p")
	.attr("id", "tvalue");

tooltip.append("p")
	.attr("id", "tdate");

var title = chart.append("text")
	.attr("id", "title")
	.attr("x", w/4)
	.attr("y", h/2)
	.text("USA GDP");


d3.json("./js/dummyset.js", function(error, jdata) {
	if (error) throw error;

	var data = jdata.data;
	data.forEach(function(d) {
	    d.date = parseDate(d[0]);
	    d.val = +d[1];
	  });

	colScale.domain([0, d3.max(data, function(d) { return d.val })]);
	xScale.domain(data.map(function(d, i) { return i; }));
	tScale.domain([new Date(data[0][0]), new Date(data[data.length - 1][0])]);
	yScale.domain([0, d3.max(data, function(d) { return d.val })]);

	chart.append("g")
		.attr("class", "xAxis")
		.attr("transform", "translate(0, " + h + ")")
		.call(xAxis);

	chart.append("g")
		.attr("class", "yAxis")
		.call(yAxis)

	chart.append("text")
		.attr("id", "y-label")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.text("USA Gross Domestic Product");

	chart.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line(data));

	d3.select(window).on('resize', function() {
		resize(data);
	});
});

function resize(data) {
	var h = parseInt(d3.select("#chart").style("height")) - padding * 2,
		w = parseInt(d3.select("#chart").style("width")) - padding * 2;

	// Update the range of the scale with new width/height
	colScale.rangeRound([0, 255]);
	xScale.range([0, w]);
	tScale.range([0, w]);
	yScale.range([h, 0]);

	// Update the axis, line and rects and tooltip with new scale
	chart.select('.xAxis')
		.attr("transform", "translate(0, " + h + ")")
		.call(xAxis);

	chart.select('.yAxis')
		.call(yAxis);

	chart.select(".line")
		.attr("d", line(data));

	chart.selectAll('.show')
		.attr("x", function(d, i) {
			return xScale(i);
		})
		.attr("y",  function(d, i) {
			return yScale(d.val);
		})
		.attr("width", xScale.bandwidth())
		.attr("height", function(d) {
			return h - yScale(d.val);
		})
		.attr("fill", "transparent");

	chart.selectAll(".no-show")
		.attr("x", function(d, i) { return xScale(i); })
		.attr("y",  0)
		.attr("width", xScale.bandwidth())
		.attr("height", function(d) { return yScale(d.val); })
		.attr("fill", "transparent");

	title.attr("x", w/4)
		.attr("y", h/1.8);
}

var inter = setTimeout(function() {
                updateData();
        }, 300);

function updateData() {

	d3.json("./js/dataset.js", function(error, jdata) {
		if (error) throw error;

		var data = jdata.data;
		data.forEach(function(d) {
		    d.date = parseDate(d[0]);
		    d.val = +d[1];
		  });

		// Scale the range of the data again
		colScale.domain([0, d3.max(data, function(d) { return d.val })]);
		xScale.domain(data.map(function(d, i) { return i; }));
  		tScale.domain([new Date(data[0][0]), new Date(data[data.length - 1][0])]);
  		yScale.domain([0, d3.max(data, function(d) { return d.val })]);

		// Select the section we want to apply our changes to
    	var svg = d3.select("body").transition();

		svg.select(".line")   // change the line
            .duration(750)
            .attr("d", line(data));

        svg.select(".xAxis") // change the x axis
            .duration(750)
            .call(xAxis);
        svg.select(".yAxis") // change the y axis
            .duration(750)
            .call(yAxis);

		var rectGroup =	chart.append("g")
			.attr("class", "rects")
			.selectAll("g")
			.data(data)
			.enter()
			.append("g")
			.on("mouseover", function(d, i) {
				var h = parseInt(d3.select("#chart").style("height")) - padding * 2,
					w = parseInt(d3.select("#chart").style("width")) - padding * 2;
				var target = d3.select(this)
					.select(".show")
					.attr("fill", function() {
						return "rgba(" + colScale(d.val) + ",112,97,1)";
					});
				// Get this bar's x/y values, then augment for the tooltip
				var x = parseInt(target.attr("x"));
				var y = parseInt(target.attr("y"));

				var xPosition = function() {
					if (x < w / 8) return parseInt(x) + 30;
					else if (x < w / 1.5) return parseInt(x) - 40;
					else return parseInt(+x) - 160;
				}
				var yPosition = function() {
					if (x < w / 1.5) return parseInt(+y) - 70;
					else return parseInt(+y) + 0;
				}

				//Update the tooltip position and value
				tooltip.style("left", xPosition() + "px")
					.style("top", yPosition() + "px")
					.select("#tvalue")
					.text("$ " + formatValue(d.val) + " Billion");

				d3.select("#tdate")
					.text(formatDate(new Date(d.date)));

				//Show the tooltip
				d3.select("#tooltip").classed("hidden", false);
			})
			.on("mouseout", function(d) {
				d3.select(this)
					.select(".show")
					.transition()
					.duration(850)
					.attr("fill", "transparent");

					//Hide the tooltip
					d3.select("#tooltip").classed("hidden", true);
			});

		rectGroup.append("rect")
			.attr("class", "no-show")
			.attr("x", function(d, i) {
				return xScale(i);
			})
			.attr("y",  0)
			.attr("width", xScale.bandwidth())
			.attr("height", function(d) {
		        return yScale(d.val);
		    })
			.attr("fill", "transparent");

		rectGroup.append("rect")
			.attr("class", "show")
			.attr("x", function(d, i) {
				return xScale(i);
			})
			.attr("y",  function(d, i) {
				return yScale(d.val);
			})
			.attr("width", xScale.bandwidth())
		    .attr("height", function(d) {
		        return h - yScale(d.val);
		    })
			.attr("fill", "transparent");

			d3.select(window).on('resize', function() {
				resize(data);
			});
	})
}
