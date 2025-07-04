document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const showAllBtn = document.getElementById('showAllBtn');
    const showIpoBtn = document.getElementById('showIpoBtn');
    const showRightsBtn = document.getElementById('showRightsBtn');
    const addIpoBtn = document.getElementById('addIpoBtn');
    const addRightBtn = document.getElementById('addRightBtn');
    const stockInputForm = document.getElementById('stockInputForm');
    const formTitle = document.getElementById('formTitle');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const stockTypeSelect = document.getElementById('stockType');
    const rightsPercentageGroup = document.querySelector('.rights-only');
    const stockSymbolInput = document.getElementById('stockSymbol');
    const rightsPercentageInput = document.getElementById('rightsPercentage');
    const saveStockBtn = document.getElementById('saveStockBtn');
    const ipoRightsTreeMap = document.getElementById('ipoRightsTreeMap');
    const ipoRightsTable = document.getElementById('ipoRightsTable');
    const uploadExcel = document.getElementById('uploadExcel');
    const uploadExcelBtn = document.getElementById('uploadExcelBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    
    // State variables
    let currentView = 'all'; // 'all', 'ipo', 'rights'
    let ipoRightsStocks = []; // Array to store IPO and Rights stocks
    let stockHistoricalData = {}; // Store historical data for charts
    let currentEditingStock = null; // Track which stock is being edited
    let analysisDays = 7; // Default number of days for analysis
    
    // Initialize
    initEventListeners();
    
    // Load saved analysis days setting
    const savedDays = localStorage.getItem('analysisDays');
    if (savedDays) {
        analysisDays = parseInt(savedDays);
        const daysSelector = document.getElementById('daysSelector');
        if (daysSelector) {
            daysSelector.value = analysisDays;
        }
    }
    
    loadIpoRightsStocks();
    fetchHistoricalData();
    
    // Set up event listeners
    function initEventListeners() {
        // View toggle buttons
        showAllBtn.addEventListener('click', () => setActiveView('all'));
        showIpoBtn.addEventListener('click', () => setActiveView('ipo'));
        showRightsBtn.addEventListener('click', () => setActiveView('rights'));
        
        // Add stock buttons
        addIpoBtn.addEventListener('click', () => showStockForm('ipo'));
        addRightBtn.addEventListener('click', () => showStockForm('rights'));
        
        // Close form button
        closeFormBtn.addEventListener('click', hideStockForm);
        
        // Stock type select change
        stockTypeSelect.addEventListener('change', function() {
            if (this.value === 'rights') {
                rightsPercentageGroup.style.display = 'block';
            } else {
                rightsPercentageGroup.style.display = 'none';
            }
        });
        
        // Save stock button
        saveStockBtn.addEventListener('click', saveStock);
        
        // Apply days button functionality
        const applyDaysBtn = document.getElementById('applyDaysBtn');
        if (applyDaysBtn) {
            applyDaysBtn.addEventListener('click', function() {
                const daysSelector = document.getElementById('daysSelector');
                if (daysSelector) {
                    const newDays = parseInt(daysSelector.value);
                    if (newDays >= 1) {
                        analysisDays = newDays;
                        // Save to localStorage
                        localStorage.setItem('analysisDays', String(analysisDays));
                        // Update visualizations with new days setting
                        updateVisualizations();
                        console.log(`Analysis days updated to ${analysisDays}`);
                    }
                }
            });
        }
        
        // Excel/CSV Upload and Download functionality
        uploadExcelBtn.addEventListener('click', function() {
            uploadExcel.click();
        });
        
        uploadExcel.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
        
        downloadExcelBtn.addEventListener('click', downloadStocksAsExcel);
    }
    
    // Set active view (all, ipo, rights)
    function setActiveView(view) {
        currentView = view;
        
        // Update UI active state
        showAllBtn.classList.toggle('active', view === 'all');
        showIpoBtn.classList.toggle('active', view === 'ipo');
        showRightsBtn.classList.toggle('active', view === 'rights');
        
        // Update visualizations with new view
        updateVisualizations();
    }
    
    // Show stock form for adding new stock
    function showStockForm(type = 'ipo') {
        // Reset form
        stockSymbolInput.value = '';
        rightsPercentageInput.value = '';
        stockTypeSelect.value = type;
        currentEditingStock = null;
        
        // Set title
        formTitle.textContent = type === 'ipo' ? 'Add IPO Stock' : 'Add Rights Stock';
        
        // Show/hide rights percentage field
        rightsPercentageGroup.style.display = type === 'rights' ? 'block' : 'none';
        
        // Show form
        stockInputForm.style.display = 'block';
    }
    
    // Show stock form for editing existing stock
    function showEditForm(stock) {
        // Set form values
        stockSymbolInput.value = stock.symbol;
        rightsPercentageInput.value = stock.rightsPercentage || '';
        stockTypeSelect.value = stock.type;
        currentEditingStock = stock;
        
        // Set title
        formTitle.textContent = `Edit ${stock.symbol}`;
        
        // Show/hide rights percentage field
        rightsPercentageGroup.style.display = stock.type === 'rights' ? 'block' : 'none';
        
        // Show form
        stockInputForm.style.display = 'block';
    }
    
    // Hide stock form
    function hideStockForm() {
        stockInputForm.style.display = 'none';
        currentEditingStock = null;
    }
    
    // Save stock (add new or update existing)
    function saveStock() {
        const symbol = stockSymbolInput.value.trim().toUpperCase();
        const type = stockTypeSelect.value;
        const rightsPercentage = parseFloat(rightsPercentageInput.value) || 0;
        
        // Validate inputs
        if (!symbol) {
            alert('Please enter a stock symbol');
            return;
        }
        
        if (type === 'rights' && rightsPercentage <= 0) {
            alert('Please enter a valid rights percentage');
            return;
        }
        
        // Create stock object
        const stock = {
            symbol,
            type,
            rightsPercentage: type === 'rights' ? rightsPercentage : null
        };
        
        // If editing existing stock, update it
        if (currentEditingStock) {
            const index = ipoRightsStocks.findIndex(s => s.symbol === currentEditingStock.symbol);
            if (index !== -1) {
                ipoRightsStocks[index] = stock;
            }
        } else {
            // Check if stock already exists
            const existingStock = ipoRightsStocks.find(s => s.symbol === symbol);
            if (existingStock) {
                alert(`Stock ${symbol} already exists`);
                return;
            }
            
            // Add new stock
            ipoRightsStocks.push(stock);
        }
        
        // Save to localStorage
        saveIpoRightsStocks();
        
        // Hide form and update visualizations
        hideStockForm();
        updateVisualizations();
    }
    
    // Delete stock
    function deleteStock(symbol) {
        if (!confirm(`Are you sure you want to delete ${symbol}?`)) {
            return;
        }
        
        // Remove stock from array
        ipoRightsStocks = ipoRightsStocks.filter(stock => stock.symbol !== symbol);
        
        // Save to localStorage
        saveIpoRightsStocks();
        
        // Update visualizations
        updateVisualizations();
    }
    
    // Load IPO and Rights stocks from localStorage
    function loadIpoRightsStocks() {
        try {
            const savedStocks = localStorage.getItem('ipoRightsStocks');
            if (savedStocks) {
                ipoRightsStocks = JSON.parse(savedStocks);
                updateVisualizations();
            }
        } catch (e) {
            console.error('Error loading IPO/Rights stocks from localStorage:', e);
        }
    }
    
    // Save IPO and Rights stocks to localStorage
    function saveIpoRightsStocks() {
        try {
            localStorage.setItem('ipoRightsStocks', JSON.stringify(ipoRightsStocks));
        } catch (e) {
            console.error('Error saving IPO/Rights stocks to localStorage:', e);
        }
    }
    
    // Update visualizations based on current view
    function updateVisualizations() {
        // Filter stocks based on current view
        let filteredStocks = [...ipoRightsStocks];
        if (currentView === 'ipo') {
            filteredStocks = filteredStocks.filter(stock => stock.type === 'ipo');
        } else if (currentView === 'rights') {
            filteredStocks = filteredStocks.filter(stock => stock.type === 'rights');
        }
        
        // Get current market prices if available
        filteredStocks = filteredStocks.map(stock => {
            // Try to find historical data for this stock
            if (stockHistoricalData[stock.symbol] && stockHistoricalData[stock.symbol].length > 0) {
                const histData = stockHistoricalData[stock.symbol];
                const latestData = histData[histData.length - 1];
                
                // Calculate percentage change based on data from previous days
                let percentChange = 0;
                if (histData.length > 1) {
                    const prevCloseIndex = Math.max(0, histData.length - (analysisDays + 1));
                    const prevClose = histData[prevCloseIndex].close;
                    percentChange = ((latestData.close - prevClose) / prevClose) * 100;
                }
                
                return {
                    ...stock,
                    currentPrice: latestData.close,
                    percentChange: percentChange,
                    volume: calculateTotalVolume(stock.symbol)
                };
            }
            
            // No historical data available
            return {
                ...stock,
                currentPrice: 0,
                percentChange: 0,
                volume: 0
            };
        });
        
        // Update treemap visualization
        createTreeMap(filteredStocks);
        
        // Update detailed table
        updateDetailedTable(filteredStocks);
    }
    
    // Create treemap visualization
    function createTreeMap(stocks) {
        // Clear previous visualization
        ipoRightsTreeMap.innerHTML = '';
        
        if (!stocks || stocks.length === 0) {
            ipoRightsTreeMap.innerHTML = '<div class="no-data">No stocks available</div>';
            return;
        }
        
        // Get stocks with volume data only (for valid visualization)
        const stocksWithVolume = stocks.filter(stock => stock.volume > 0);
        
        if (stocksWithVolume.length === 0) {
            ipoRightsTreeMap.innerHTML = '<div class="no-data">No volume data available for selected stocks</div>';
            return;
        }
        
        // Group stocks by type
        const stocksByType = {
            ipo: stocksWithVolume.filter(s => s.type === 'ipo'),
            rights: stocksWithVolume.filter(s => s.type === 'rights')
        };
        
        // Prepare data in hierarchical structure for treemap
        const treeData = {
            name: "Stocks",
            children: []
        };
        
        // Only add categories that have stocks
        if (stocksByType.ipo.length > 0) {
            treeData.children.push({
                name: "IPO",
                color: "#90CAF9", // Light blue for IPO (updated to lighter color)
                children: stocksByType.ipo.map(stock => ({
                    name: stock.symbol,
                    value: stock.volume,
                    symbol: stock.symbol,
                    type: stock.type,
                    currentPrice: stock.currentPrice,
                    percentChange: stock.percentChange,
                    volume: stock.volume
                }))
            });
        }
        
        if (stocksByType.rights.length > 0) {
            treeData.children.push({
                name: "Rights",
                color: "#CE93D8", // Light purple for Rights (updated to lighter color)
                children: stocksByType.rights.map(stock => ({
                    name: stock.symbol,
                    value: stock.volume,
                    symbol: stock.symbol,
                    type: stock.type,
                    currentPrice: stock.currentPrice,
                    percentChange: stock.percentChange,
                    volume: stock.volume,
                    rightsPercentage: stock.rightsPercentage
                }))
            });
        }
        
        // Set up dimensions
        const width = ipoRightsTreeMap.clientWidth;
        const height = 800; // Fixed height for treemap
        
        // Create the SVG container
        const svg = d3.select('#ipoRightsTreeMap')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('font-family', 'sans-serif')
            .style('border-radius', '6px')
            .style('overflow', 'hidden');
        
        // Create the treemap layout
        const treemap = d3.treemap()
            .size([width, height])
            .paddingTop(25)
            .paddingBottom(2)
            .paddingRight(2)
            .paddingLeft(2)
            .paddingInner(3)
            .round(true);
        
        // Format the data for d3 hierarchy
        const root = d3.hierarchy(treeData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        // Apply the treemap layout
        treemap(root);
        
        // Add sector background colors
        svg.selectAll('.type-background')
            .data(root.children || [])
            .enter()
            .append('rect')
            .attr('class', 'type-background')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => d.data.color ? `${d.data.color}33` : '#f5f5f5') // Add 33 (20% opacity) to hex color
            .attr('stroke', d => d.data.color || '#ddd')
            .attr('stroke-width', 1);
        
        // Add parent group labels
        svg.selectAll('.parent')
            .data(root.children || [])
            .enter()
            .append('text')
            .attr('class', 'treemap-parent-label')
            .attr('x', d => d.x0 + 5)
            .attr('y', d => d.y0 + 15)
            .text(d => `${d.data.name} (${d.children ? d.children.length : 0})`)
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#333');
        
        // Create the treemap cells
        const cell = svg.selectAll('.cell')
            .data(root.leaves() || [])
            .enter()
            .append('g')
            .attr('class', 'treemap-cell')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);
        
        // Create tooltip div
        const tooltip = d3.select('body').append('div')
            .attr('class', 'treemap-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('box-shadow', '0 0 10px rgba(0,0,0,0.2)')
            .style('font-size', '12px')
            .style('z-index', 1000);
            
        // Add rectangles for each cell
        cell.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('fill', d => {
                // Check if stock is near support level
                const supportLevel = isNearSupportLevel(d.data.symbol, d.data.currentPrice);
                if (supportLevel > 0) {
                    // Different colors based on support level
                    switch (supportLevel) {
                        case 1: return '#90CAF9'; // Light blue for Support 1
                        case 2: return '#FFCC80'; // Light orange for Support 2
                        case 3: return '#BCAAA4'; // Light brown for Support 3
                        default: return d.data.percentChange >= 0 ? "#C8E6C9" : "#FFCDD2"; 
                    }
                } else {
                    // Color based on price change
                    return d.data.percentChange >= 0 ? "#C8E6C9" : "#FFCDD2";
                }
            })
            .attr('stroke', d => d.parent.data.color) // Use the category color for stroke
            .attr('stroke-width', 1)
            .attr('class', 'treemap-cell')
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                // Add hover effect
                d3.select(this)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 2);
                
                // Get support prices
                const supportPrices = getSupportPrices(d.data.symbol);
                
                // Build tooltip content
                let tooltipContent = `
                    <div class="tooltip-header">${d.data.symbol} (${d.data.type.toUpperCase()})</div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Current Price:</span>
                        <span>${d.data.currentPrice ? d.data.currentPrice.toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Change:</span>
                        <span style="color: ${d.data.percentChange >= 0 ? 'green' : 'red'}">
                            ${d.data.percentChange !== undefined ? d.data.percentChange.toFixed(2) + '%' : 'N/A'}
                        </span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">Volume:</span>
                        <span>${d.data.volume ? formatNumber(d.data.volume) : 'N/A'}</span>
                    </div>
                `;
                
                // Add rights percentage if applicable
                if (d.data.type === 'rights' && d.data.rightsPercentage) {
                    tooltipContent += `
                        <div class="tooltip-row">
                            <span class="tooltip-label">Rights %:</span>
                            <span>${d.data.rightsPercentage}%</span>
                        </div>
                    `;
                }
                
                // Add support price information if available
                if (supportPrices) {
                    tooltipContent += `<div class="tooltip-divider"></div>`;
                    
                    if (supportPrices.supportPrice1) {
                        const diff1 = ((d.data.currentPrice - supportPrices.supportPrice1) / supportPrices.supportPrice1) * 100;
                        tooltipContent += `
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 1:</span>
                                <span>${parseFloat(supportPrices.supportPrice1).toFixed(2)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 1 Diff:</span>
                                <span style="color: ${diff1 >= 0 ? 'green' : 'red'}">${diff1.toFixed(2)}%</span>
                            </div>
                        `;
                    }
                    
                    if (supportPrices.supportPrice2) {
                        const diff2 = ((d.data.currentPrice - supportPrices.supportPrice2) / supportPrices.supportPrice2) * 100;
                        tooltipContent += `
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 2:</span>
                                <span>${parseFloat(supportPrices.supportPrice2).toFixed(2)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 2 Diff:</span>
                                <span style="color: ${diff2 >= 0 ? 'green' : 'red'}">${diff2.toFixed(2)}%</span>
                            </div>
                        `;
                    }
                    
                    if (supportPrices.supportPrice3) {
                        const diff3 = ((d.data.currentPrice - supportPrices.supportPrice3) / supportPrices.supportPrice3) * 100;
                        tooltipContent += `
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 3:</span>
                                <span>${parseFloat(supportPrices.supportPrice3).toFixed(2)}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Support 3 Diff:</span>
                                <span style="color: ${diff3 >= 0 ? 'green' : 'red'}">${diff3.toFixed(2)}%</span>
                            </div>
                        `;
                    }
                }
                
                // Show tooltip
                tooltip.html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9);
            })
            .on('mouseout', function() {
                // Remove hover effect
                d3.select(this)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1);
                
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(event, d) {
                // Open chart popup when clicked
                showFullScreenChart(d.data.symbol);
                event.stopPropagation();
            });
        
        // Add stock symbol labels
        cell.append('text')
            .attr('class', 'treemap-cell-label')
            .attr('x', 3)
            .attr('y', 12)
            .text(d => d.data.symbol)
            .attr('font-size', d => {
                const cellWidth = d.x1 - d.x0;
                return cellWidth < 60 ? '8px' : '10px';
            })
            .attr('font-weight', 'bold')
            .attr('fill', '#fff');
        
        // Add percent change labels
        cell.append('text')
            .attr('class', 'treemap-value-label')
            .attr('x', 3)
            .attr('y', 24)
            .text(d => d.data.percentChange !== undefined ? `${d.data.percentChange.toFixed(1)}%` : 'N/A')
            .attr('font-size', '9px')
            .attr('fill', '#fff');
        
        // Add volume labels
        cell.append('text')
            .attr('class', 'treemap-volume-label')
            .attr('x', 3)
            .attr('y', 36)
            .text(d => {
                const cellHeight = d.y1 - d.y0;
                return cellHeight > 50 ? `Vol: ${d.data.volume ? formatNumber(d.data.volume) : 'N/A'}` : '';
            })
            .attr('font-size', '8px')
            .attr('fill', '#fff');
    }
    
    // Update detailed table
    function updateDetailedTable(stocks) {
        const tbody = ipoRightsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (!stocks || stocks.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" class="no-data">No stocks available</td>`;
            tbody.appendChild(row);
            return;
        }
        
        stocks.forEach(stock => {
            const row = document.createElement('tr');
            row.className = stock.type === 'ipo' ? 'ipo-row' : 'rights-row';
            
            const changeClass = stock.percentChange >= 0 ? 'positive-change' : 'negative-change';
            
            row.innerHTML = `
                <td>${stock.symbol}</td>
                <td>${stock.type.toUpperCase()}</td>
                <td>${stock.currentPrice ? stock.currentPrice.toFixed(2) : 'N/A'}</td>
                <td class="${changeClass}">${stock.percentChange !== undefined ? stock.percentChange.toFixed(2) + '%' : 'N/A'}</td>
                <td>${stock.volume ? formatNumber(stock.volume) : 'N/A'}</td>
                <td>${stock.type === 'rights' && stock.rightsPercentage ? stock.rightsPercentage + '%' : '-'}</td>
                <td class="actions-cell">
                    <span class="action-icon edit-icon" title="Edit">✏️</span>
                    <span class="action-icon delete-icon" title="Delete">🗑️</span>
                    <span class="action-icon chart-icon" title="View Chart">📈</span>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Add event listeners to action icons
            const editIcon = row.querySelector('.edit-icon');
            const deleteIcon = row.querySelector('.delete-icon');
            const chartIcon = row.querySelector('.chart-icon');
            
            editIcon.addEventListener('click', () => showEditForm(stock));
            deleteIcon.addEventListener('click', () => deleteStock(stock.symbol));
            chartIcon.addEventListener('click', () => showFullScreenChart(stock.symbol));
        });
    }
    
    // Show full screen chart for a stock
    function showFullScreenChart(symbol) {
        console.log(`Showing full screen chart for ${symbol}`);
        
        const popupContainer = document.querySelector('.chart-popup');
        const popupChartContainer = document.getElementById('popupChartContainer');
        const popupTitle = document.getElementById('popupChartTitle');
        
        // Set popup title
        if (popupTitle) {
            popupTitle.textContent = `${symbol} Stock Chart`;
        }
        
        // Show popup
        popupContainer.style.display = 'flex';
        
        // Ensure close button works
        const closeButton = document.querySelector('.chart-popup-close');
        if (closeButton) {
            closeButton.onclick = () => {
                popupContainer.style.display = 'none';
            };
        }
        
        // Clear existing chart
        popupChartContainer.innerHTML = '';
        
        // Check if we have data for this stock
        if (!stockHistoricalData[symbol] || stockHistoricalData[symbol].length === 0) {
            const noDataLabel = document.createElement('div');
            noDataLabel.textContent = 'No data available';
            noDataLabel.style.position = 'absolute';
            noDataLabel.style.top = '50%';
            noDataLabel.style.left = '50%';
            noDataLabel.style.transform = 'translate(-50%, -50%)';
            noDataLabel.style.color = '#999';
            noDataLabel.style.fontSize = '16px';
            popupChartContainer.appendChild(noDataLabel);
            return;
        }
        
        // Get selected stock information
        const stock = ipoRightsStocks.find(s => s.symbol === symbol);
        
        // Display chart using d3
        setTimeout(() => {
            // Process data
            const data = stockHistoricalData[symbol];
            
            // Set up dimensions
            const width = popupChartContainer.clientWidth || 800;
            const height = popupChartContainer.clientHeight || 400;
            const margin = {top: 20, right: 80, bottom: 30, left: 50};
            
            // Create SVG
            const svg = d3.select(popupChartContainer)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height]);
            
            // X scale - use index for simplicity
            const x = d3.scaleLinear()
                .domain([0, data.length - 1])
                .range([margin.left, width - margin.right]);
            
            // Y scale
            const minY = d3.min(data, d => d.low) * 0.99;
            const maxY = d3.max(data, d => d.high) * 1.01;
            
            const y = d3.scaleLinear()
                .domain([minY, maxY])
                .range([height - margin.bottom, margin.top]);
            
            // Add x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).ticks(5));
            
            // Add y-axis
            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));
            
            // Add line
            const line = d3.line()
                .x((d, i) => x(i))
                .y(d => y(d.close))
                .curve(d3.curveMonotoneX);
            
            // Draw line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "#2196F3")
                .attr("stroke-width", 2)
                .attr("d", line);
            
            // Add candlesticks
            svg.selectAll("rect.candle")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "candle")
                .attr("x", (d, i) => x(i) - 2)
                .attr("y", d => y(Math.max(d.open, d.close)))
                .attr("width", 4)
                .attr("height", d => Math.abs(y(d.open) - y(d.close)))
                .attr("fill", d => d.open > d.close ? "#f44336" : "#4caf50");
        }, 100);
    }
    
    // Fetch historical data from the JSON file
    async function fetchHistoricalData() {
        try {
            const response = await fetch('/organized_nepse_data.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            processHistoricalData(data);
            
            // Update visualizations after loading data
            updateVisualizations();
            
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }
    }
    
    // Process historical data
    function processHistoricalData(data) {
        console.log("Processing historical data");
        
        // Reset the historical data object
        stockHistoricalData = {};
        
        // Check if data is an array
        if (!Array.isArray(data)) {
            console.error("Data is not an array");
            return;
        }
        
        // Create a more efficient data structure
        data.forEach(item => {
            // Extract the symbol
            const symbol = item.symbol;
            
            // Skip if missing data
            if (!symbol || item.open === undefined || item.high === undefined || 
                item.low === undefined || item.close === undefined) {
                return;
            }
            
            // Initialize array for this symbol if needed
            if (!stockHistoricalData[symbol]) {
                stockHistoricalData[symbol] = [];
            }
            
            // Add the data point
            stockHistoricalData[symbol].push({
                time: item.time,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume || 0)
            });
        });
        
        console.log("Processed historical data");
    }
    
    // Calculate total volume for a given stock
    function calculateTotalVolume(symbol) {
        if (!stockHistoricalData[symbol]) return 0;
        
        // Calculate the total volume over the custom number of days
        return stockHistoricalData[symbol]
            .slice(-analysisDays) // Get last X days
            .reduce((sum, day) => sum + (day.volume || 0), 0);
    }
    
    // Format number as K, M
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toFixed(0);
    }
    
    // Get support prices for a stock from userStocks
    function getSupportPrices(symbol) {
        try {
            const userStocksData = localStorage.getItem('userStocks');
            if (!userStocksData) return null;
            
            const userStocks = JSON.parse(userStocksData);
            if (!Array.isArray(userStocks)) return null;
            
            const stockInfo = userStocks.find(s => s && s.symbol === symbol);
            if (!stockInfo) return null;
            
            return {
                supportPrice1: stockInfo.supportPrice1,
                supportPrice2: stockInfo.supportPrice2,
                supportPrice3: stockInfo.supportPrice3,
                upperLimit: stockInfo.upperLimit
            };
        } catch (e) {
            console.error('Error getting support prices:', e);
            return null;
        }
    }
    
    // Function to check if a stock is near support levels
    // Returns 1, 2, or 3 for the respective support level, or 0 if not near any support
    function isNearSupportLevel(symbol, currentPrice) {
        const supportPrices = getSupportPrices(symbol);
        if (!supportPrices) return 0;
        
        // Default thresholds - if you want to make this adjustable like in heatmap,
        // you would need to add similar UI controls
        const minThreshold = -3; // Percentage
        const maxThreshold = 4; // Percentage
        
        if (supportPrices.supportPrice1 && !isNaN(supportPrices.supportPrice1)) {
            const diff = ((currentPrice - supportPrices.supportPrice1) / supportPrices.supportPrice1) * 100;
            if (diff >= minThreshold && diff <= maxThreshold) return 1;
        }
        
        if (supportPrices.supportPrice2 && !isNaN(supportPrices.supportPrice2)) {
            const diff = ((currentPrice - supportPrices.supportPrice2) / supportPrices.supportPrice2) * 100;
            if (diff >= minThreshold && diff <= maxThreshold) return 2;
        }
        
        if (supportPrices.supportPrice3 && !isNaN(supportPrices.supportPrice3)) {
            const diff = ((currentPrice - supportPrices.supportPrice3) / supportPrices.supportPrice3) * 100;
            if (diff >= minThreshold && diff <= maxThreshold) return 3;
        }
        
        return 0;
    }

    // Handle Excel/CSV file upload
    function handleFileUpload(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const fileName = file.name.toLowerCase();
                let processedData;
                
                if (fileName.endsWith('.csv')) {
                    // Process CSV data
                    processedData = processCSVData(data);
                } else {
                    // Process Excel data
                    processedData = processExcelData(data);
                }
                
                if (!processedData || processedData.length === 0) {
                    alert('No valid data found in the uploaded file');
                    return;
                }
                
                // Import the stocks
                importStocks(processedData);
                
                // Refresh the visualizations
                updateVisualizations();
            } catch (error) {
                console.error('Error processing file:', error);
                alert('Error processing file. Please check the format.');
            }
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
    
    // Process CSV data
    function processCSVData(data) {
        const rows = data.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        // Check for required headers
        if (!headers.includes('symbol') || !headers.includes('type')) {
            alert('CSV file must contain "symbol" and "type" columns');
            return [];
        }
        
        const symbolIndex = headers.indexOf('symbol');
        const typeIndex = headers.indexOf('type');
        const rightsPercentageIndex = headers.indexOf('rights percentage');
        
        const stocks = [];
        
        // Start from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(',').map(cell => cell.trim());
            
            // Skip empty rows
            if (row.length <= 1 || !row[symbolIndex]) continue;
            
            const symbol = row[symbolIndex].toUpperCase();
            const type = (row[typeIndex] || 'ipo').toLowerCase();
            let rightsPercentage = null;
            
            // Only process rights percentage if the type is 'rights'
            if (type === 'rights' && rightsPercentageIndex !== -1) {
                rightsPercentage = parseFloat(row[rightsPercentageIndex]) || 0;
            }
            
            stocks.push({
                symbol,
                type: type === 'rights' ? 'rights' : 'ipo', // Default to 'ipo' if not 'rights'
                rightsPercentage: type === 'rights' ? rightsPercentage : null
            });
        }
        
        return stocks;
    }
    
    // Process Excel data
    function processExcelData(data) {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert worksheet to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
            alert('Excel file must contain a header row and at least one data row');
            return [];
        }
        
        // Get header row and convert to lowercase
        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        
        // Check for required headers
        if (!headers.includes('symbol') || !headers.includes('type')) {
            alert('Excel file must contain "symbol" and "type" columns');
            return [];
        }
        
        const symbolIndex = headers.indexOf('symbol');
        const typeIndex = headers.indexOf('type');
        const rightsPercentageIndex = headers.indexOf('rights percentage');
        
        const stocks = [];
        
        // Start from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip empty rows
            if (!row || row.length === 0 || !row[symbolIndex]) continue;
            
            const symbol = String(row[symbolIndex]).toUpperCase().trim();
            const type = (row[typeIndex] ? String(row[typeIndex]).toLowerCase().trim() : 'ipo');
            let rightsPercentage = null;
            
            // Only process rights percentage if the type is 'rights'
            if (type === 'rights' && rightsPercentageIndex !== -1 && row[rightsPercentageIndex]) {
                rightsPercentage = parseFloat(row[rightsPercentageIndex]) || 0;
            }
            
            stocks.push({
                symbol,
                type: type === 'rights' ? 'rights' : 'ipo', // Default to 'ipo' if not 'rights'
                rightsPercentage: type === 'rights' ? rightsPercentage : null
            });
        }
        
        return stocks;
    }
    
    // Import stocks from processed data
    function importStocks(stocks) {
        if (!stocks || stocks.length === 0) return;
        
        // Load existing stocks
        let existingStocks = [];
        try {
            const savedStocks = localStorage.getItem('ipoRightsStocks');
            if (savedStocks) {
                existingStocks = JSON.parse(savedStocks);
            }
        } catch (e) {
            console.error('Error loading existing stocks:', e);
        }
        
        let addedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        
        // Process each stock from the imported data
        for (const stock of stocks) {
            // Validate the stock object
            if (!stock.symbol) {
                errorCount++;
                continue;
            }
            
            // Check if the stock already exists
            const existingIndex = existingStocks.findIndex(s => s.symbol === stock.symbol);
            
            if (existingIndex !== -1) {
                // Update existing stock
                existingStocks[existingIndex] = {
                    ...existingStocks[existingIndex],
                    ...stock
                };
                updatedCount++;
            } else {
                // Add new stock
                existingStocks.push(stock);
                addedCount++;
            }
        }
        
        // Update the global stocks array
        ipoRightsStocks = existingStocks;
        
        // Save to localStorage
        saveIpoRightsStocks();
        
        // Show result message
        alert(`Import complete: ${addedCount} stocks added, ${updatedCount} stocks updated, ${errorCount} errors.`);
    }
    
    // Download stocks as Excel/CSV
    function downloadStocksAsExcel() {
        // Filter stocks based on current view
        let stocksToExport = [...ipoRightsStocks];
        if (currentView === 'ipo') {
            stocksToExport = stocksToExport.filter(stock => stock.type === 'ipo');
        } else if (currentView === 'rights') {
            stocksToExport = stocksToExport.filter(stock => stock.type === 'rights');
        }
        
        // Format the data for export
        const exportData = stocksToExport.map(stock => {
            const stockData = {
                Symbol: stock.symbol,
                Type: stock.type
            };
            
            // Add rights percentage if available
            if (stock.type === 'rights' && stock.rightsPercentage) {
                stockData['Rights Percentage'] = stock.rightsPercentage;
            }
            
            // Add current price and change if available
            if (stockHistoricalData[stock.symbol] && stockHistoricalData[stock.symbol].length > 0) {
                const histData = stockHistoricalData[stock.symbol];
                const latestData = histData[histData.length - 1];
                
                stockData['Current Price'] = latestData.close;
                stockData['Volume'] = calculateTotalVolume(stock.symbol);
            }
            
            return stockData;
        });
        
        if (exportData.length === 0) {
            alert('No stocks to export');
            return;
        }
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'IPO_Rights_Stocks');
        
        // Generate file name with date
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        const fileName = `ipo_rights_stocks_${dateStr}.xlsx`;
        
        // Save the file
        XLSX.writeFile(wb, fileName);
    }
});