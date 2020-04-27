// Simon Rhe
// April 2020

const DATA_URL = 'global-temperature.json';
const PADDING = {
	top: 40,
	bottom: 50,
	left: 90,
	right: 90
};

const SVG_DIV = d3.select('#chart-div');
let svgElement = d3.select('#chart-svg');
let dataset = undefined;

d3
	.json(DATA_URL)
	.then((parsedData) => {
		dataset = parsedData.monthlyVariance;
		console.log(`dataset.length = ${dataset.length}`);
		generateGraph(svgElement, dataset, PADDING);
	})
	.catch((error) => console.log('error: ' + error));

// TODO: redraw SVG when window size changes
/*
window.onresize = () => {
    console.log('Window resized ' + Date.now());
    if (dataYear != undefined) {
        generateGraph(SVG_ITEM, dataYear, PADDING);
    }
};
*/

function generateGraph(svg, dataset, padding, svgDiv = SVG_DIV) {
	const regexPx = /\d+/; // ignores decimals, 'px'
	const svgWidth = parseInt(svg.style('width').match(regexPx));
	const svgHeight = parseInt(svg.style('height').match(regexPx));

	let tooltipDiv = undefined;

	console.log(`dataset.length: ${dataset.length}
    svgWidth: ${svgWidth}
    svgHeight: ${svgHeight}`);

	// Generate axes and labels
	const yearMin = d3.min(dataset, (d) => d.year);
	const yearMax = d3.max(dataset, (d) => d.year);
	const cellWidth = (svgWidth - padding.left - padding.right) / (yearMax - yearMin);
	const xScale = d3.scaleBand().domain(dataset.map((d) => d.year)).range([ padding.left, svgWidth - padding.right ]);
	const months = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
	const monthsText = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const yScale = d3.scaleBand().domain(months).range([ padding.top, svgHeight - padding.bottom ]); // inverted y-axis with January on top
	const cellHeight = yScale.bandwidth();
	const xAxis = d3
		.axisBottom(xScale)
		.tickValues(xScale.domain().filter((year) => (svgWidth < 1000 ? year % 40 == 0 : year % 10 == 0)));

	svg
		.append('g')
		.attr('transform', 'translate(0, ' + (svgHeight - padding.bottom) + ')')
		.attr('id', 'x-axis')
		.call(xAxis);
	const yAxis = d3.axisLeft(yScale).tickFormat((month) => monthsText[month - 1]);
	svg.append('g').attr('transform', 'translate(' + padding.left + ', 0)').attr('id', 'y-axis').call(yAxis);
	svg
		.append('text')
		.attr('class', 'axis-label')
		.attr('y', 20)
		.attr('x', -svgHeight / 2)
		.text('Month')
		.attr('transform', 'rotate(-90)');
	svg
		.append('text')
		.attr('class', 'axis-label')
		.attr('x', svgWidth / 2)
		.attr('y', svgHeight - padding.bottom + 40)
		.text('Year');

	// Generate color scale
	const colorScheme = d3.schemeRdBu[11].reverse();
	const varianceExtent = d3.extent(dataset, (d) => d.variance);
	const colorScale = d3.scaleQuantize(varianceExtent, colorScheme);

	// Generate color legend based on color scheme
	let legendG = svg
		.append('g')
		.attr('id', 'legend')
		.attr('transform', 'translate(' + (svgWidth - padding.right) + ', ' + (padding.top + 20) + ')');
	legendG
		.selectAll('rect')
		.data(colorScheme)
		.enter()
		.append('rect')
		.attr('x', 20)
		.attr('y', (d, i) => 20 + i * 20)
		.attr('width', 20)
		.attr('height', 20)
		.attr('fill', (d) => d);
	let firstTick = colorScale.invertExtent(colorScheme[0])[0];
	const colorScaleTicks = colorScheme.map((v) => colorScale.invertExtent(v)[1]);
	colorScaleTicks.unshift(firstTick);
	const colorLegendScale = d3.scaleLinear(varianceExtent, [ 0, colorScheme.length * 20 ]);
	const colorLegendAxis = d3.axisRight(colorLegendScale).tickValues(colorScaleTicks).tickFormat(d3.format('+.1f'));
	legendG.append('g').attr('transform', 'translate(40, 19.5)').attr('id', 'color-legend-axis').call(colorLegendAxis);
	legendG.append('text').attr('x', 10).attr('y', 3).attr('class', 'legend-text').text('Variance (°C)');
	svg
		.selectAll('rect')
		.data(dataset)
		.enter()
		.append('rect')
		.attr('class', 'cell')
		.attr('x', (d, i) => xScale(d.year))
		.attr('y', (d, i) => yScale(d.month))
		.attr('height', cellHeight)
		.attr('width', cellWidth)
		.attr('fill', (d) => colorScale(d.variance))
		.attr('data-year', (d) => d.year)
		.attr('data-month', (d) => d.month)
		.attr('data-temp', (d) => d.variance)
		.on('mouseover', (d, i) => {
			let newHtml = '<strong>' + monthsText[d.month - 1] + ' ' + d.year + '</strong><br>' + d.variance + ' °C';
			tooltipDiv
				.html(newHtml)
				.attr('data-year', d.year)
				.style('opacity', 0.9)
				.style('left', d3.event.pageX + 10 + 'px')
				.style('top', d3.event.pageY - 28 + 'px');
		})
		.on('mouseout', (d, i) => {
			tooltipDiv.style('opacity', 0);
		});

	// Generate tooltip
	tooltipDiv = svgDiv.append('div').attr('id', 'tooltip').attr('class', 'tooltip-div').style('opacity', 0);
}
