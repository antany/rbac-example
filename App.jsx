import React, { useState, useEffect } from 'react';

// Main App component containing all dashboard logic and components
const App = () => {
    const rowsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [pipelineData, setPipelineData] = useState([]);
    const [dailySummaryData, setDailySummaryData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    // Function to format milliseconds into a human-readable duration string
    const formatDuration = (milliseconds) => {
        if (milliseconds === null || isNaN(milliseconds)) {
            return 'N/A';
        }
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
        
        return parts.length > 0 ? parts.join(' ') : '0s';
    };

    // Function to generate mock pipeline data
    const generateMockData = (count, dateString) => {
        const date = new Date(dateString);
        const statuses = ['Running', 'Succeeded', 'Failed'];
        const data = [];
        for (let i = 1; i <= count; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const totalRows = Math.floor(Math.random() * 5000000) + 5000;
            const processedRows = Math.floor(totalRows * (Math.random() * 0.9 + 0.1));
            const filteredRows = totalRows - processedRows;
            const filterPercent = (filteredRows / totalRows) * 100;
            
            let startDtObj, endDtObj, durationMs = null, slaMet = false;
            
            // Generate start date based on the selected date
            startDtObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(Math.random() * 10) + 9);

            if (status !== 'Running') {
                endDtObj = new Date(startDtObj.getTime() + Math.random() * 1000 * 60 * 60 * 3);
                durationMs = endDtObj.getTime() - startDtObj.getTime();
                slaMet = durationMs < (1000 * 60 * 60 * 1.5);
            }

            data.push({
                name: `Pipeline ${String(i).padStart(3, '0')}`,
                status: status,
                startDt: startDtObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + startDtObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                endDt: endDtObj ? (endDtObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + endDtObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })) : 'N/A',
                duration: formatDuration(durationMs),
                durationMs: durationMs,
                slaMet: slaMet,
                totalRows: totalRows,
                processedRows: processedRows,
                filterPercent: filterPercent
            });
        }
        return data;
    };

    // Function to generate mock daily data
    const generateDailyDataBySource = (dateString) => {
        const today = new Date(dateString);
        const getPreviousBusinessDay = (date) => {
            let prevBusinessDay = new Date(date);
            do {
                prevBusinessDay.setDate(prevBusinessDay.getDate() - 1);
            } while (prevBusinessDay.getDay() === 0 || prevBusinessDay.getDay() === 6);
            return prevBusinessDay;
        };
        const currentDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const prevBusinessDay = getPreviousBusinessDay(today).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const sourceSystems = ['Salesforce CRM', 'SAP ECC', 'Google Analytics', 'Custom Database'];
        const data = [];
        sourceSystems.forEach(source => {
            let todayCount = 0;
            let prevCount = 0;
            if (source === 'Salesforce CRM') {
                todayCount = Math.floor(Math.random() * 5000000) + 15000000;
                prevCount = todayCount - Math.floor(Math.random() * 2000000) + 500000;
            } else if (source === 'SAP ECC') {
                todayCount = Math.floor(Math.random() * 200000) + 3000000;
                prevCount = todayCount - Math.floor(Math.random() * 100000) + 20000;
            } else if (source === 'Google Analytics') {
                todayCount = Math.floor(Math.random() * 10000000) + 5000000;
                prevCount = todayCount + Math.floor(Math.random() * 1000000) - 500000;
            } else if (source === 'Custom Database') {
                todayCount = Math.floor(Math.random() * 1000000) + 500000;
                prevCount = todayCount + Math.floor(Math.random() * 500000) - 100000;
            }

            data.push({
                sourceSystem: source,
                currentDay: { date: currentDay, count: todayCount },
                prevDay: { date: prevBusinessDay, count: prevCount }
            });
        });
        return data;
    };

    // On component mount or date change, generate mock data
    useEffect(() => {
        setPipelineData(generateMockData(150, selectedDate));
        setDailySummaryData(generateDailyDataBySource(selectedDate));
        setCurrentPage(1); // Reset to first page on date change
    }, [selectedDate]);

    // Effect for handling theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // --- Sorting Logic ---
    const sortedData = [...pipelineData].sort((a, b) => {
        if (sortKey === null) return 0;

        let aValue = a[sortKey];
        let bValue = b[sortKey];

        // Custom sorting for specific keys
        if (sortKey === 'slaMet') {
            aValue = a.slaMet;
            bValue = b.slaMet;
        }
        if (sortKey === 'duration') {
            aValue = a.durationMs;
            bValue = b.durationMs;
        }

        if (aValue === null || aValue === 'N/A') return 1;
        if (bValue === null || bValue === 'N/A') return -1;

        if (typeof aValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
    });

    // --- Pagination Logic ---
    const pageCount = Math.ceil(sortedData.length / rowsPerPage);
    const paginatedItems = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('...');
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < pageCount) {
            if (endPage < pageCount - 1) pages.push('...');
            pages.push(pageCount);
        }
        return pages;
    };
    
    // This PipelineTable component could be moved to a separate file, e.g., 'PipelineTable.jsx'
    const PipelineTable = ({ data, handleSort, sortKey, sortDirection }) => {
        const getSortIcon = (key) => {
            if (sortKey !== key) {
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
            }
            return sortDirection === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            );
        };

        return (
            <div className="bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800">
                <h2 className="text-xl md:text-2xl font-semibold mb-6 dark:text-gray-100">Pipeline Status and Metrics</h2>
                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-200">
                        <thead>
                            <tr>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Pipeline Name{getSortIcon('name')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('status')}>
                                    <div className="flex items-center">Status{getSortIcon('status')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('startDt')}>
                                    <div className="flex items-center">Start DT{getSortIcon('startDt')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('endDt')}>
                                    <div className="flex items-center">End DT{getSortIcon('endDt')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('duration')}>
                                    <div className="flex items-center">Duration{getSortIcon('duration')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('slaMet')}>
                                    <div className="flex items-center">SLA{getSortIcon('slaMet')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('totalRows')}>
                                    <div className="flex items-center">Total Rows{getSortIcon('totalRows')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('processedRows')}>
                                    <div className="flex items-center">Processed Rows{getSortIcon('processedRows')}</div>
                                </th>
                                <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150" onClick={() => handleSort('filterPercent')}>
                                    <div className="flex items-center">Filtered %{getSortIcon('filterPercent')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-6 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                                    <td className="py-3 px-6 text-sm">
                                        <span className={`status-badge ${item.status === 'Running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : item.status === 'Succeeded' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-sm dark:text-gray-200">{item.startDt}</td>
                                    <td className="py-3 px-6 text-sm dark:text-gray-200">{item.endDt === 'N/A' ? <span className="text-na">N/A</span> : item.endDt}</td>
                                    <td className="py-3 px-6 text-sm dark:text-gray-200">{item.duration === 'N/A' ? <span className="text-na">N/A</span> : item.duration}</td>
                                    <td className="py-3 px-6 text-sm">
                                        <span className={`status-badge ${item.status === 'Running' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : (item.slaMet ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100')}`}>
                                            {item.status === 'Running' ? 'N/A' : (item.slaMet ? 'Met' : 'Violated')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">{item.totalRows.toLocaleString()}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">{item.processedRows.toLocaleString()}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">{item.filterPercent.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // This DailySummaryTable component could be moved to a separate file, e.g., 'DailySummaryTable.jsx'
    const DailySummaryTable = ({ data }) => {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800">
                <h2 className="text-xl md:text-2xl font-semibold mb-6 dark:text-gray-100">Daily Row Processing Summary</h2>
                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-200">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 text-left">Source System</th>
                                <th className="py-2 px-4 text-left">{data.length > 0 ? data[0].currentDay.date : 'Current Day'}</th>
                                <th className="py-2 px-4 text-left">{data.length > 0 ? data[0].prevDay.date : 'Previous Day'}</th>
                                <th className="py-2 px-4 text-left">Difference</th>
                                <th className="py-2 px-4 text-left">% Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => {
                                const diff = item.currentDay.count - item.prevDay.count;
                                const percentDiff = (diff / item.prevDay.count) * 100;
                                const diffClass = diff > 0 ? 'text-green-500' : 'text-red-500';
                                const diffSign = diff > 0 ? '+' : '';
                                return (
                                    <tr key={index}>
                                        <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">{item.sourceSystem}</td>
                                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{item.currentDay.count.toLocaleString()} rows</td>
                                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{item.prevDay.count.toLocaleString()} rows</td>
                                        <td className="py-2 px-4 text-sm font-semibold dark:text-gray-200">
                                            <span className={diffClass}>{diffSign}{diff.toLocaleString()}</span>
                                        </td>
                                        <td className="py-2 px-4 text-sm font-semibold dark:text-gray-200">
                                            <span className={diffClass}>{diffSign}{percentDiff.toFixed(2)}%</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex flex-col h-screen overflow-hidden font-inter ${theme === 'dark' ? 'dark' : ''}`}>
            <style>{`
                /* Base Styles */
                body {
                    font-family: 'Inter', sans-serif;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    padding: 12px 24px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                th {
                    background-color: #f3f4f6;
                    color: #4b5563;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                tr:last-child td {
                    border-bottom: none;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                .text-na {
                    color: #9ca3af;
                }
                .pagination-link {
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .pagination-link:hover {
                    background-color: #e5e7eb;
                }
                .pagination-link.active {
                    background-color: #3b82f6;
                    color: white;
                }
                .pagination-ellipsis {
                    padding: 8px 4px;
                    cursor: default;
                }
                /* Dark Mode Styles */
                .dark .bg-gray-100 { background-color: #1a202c; }
                .dark .bg-white { background-color: #2d3748; }
                .dark .text-gray-800 { color: #e2e8f0; }
                .dark .text-gray-900 { color: #f7fafc; }
                .dark .text-gray-600 { color: #a0aec0; }
                .dark .border-gray-200 { border-color: #4a5568; }
                .dark .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.25); }
                .dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.25); }
                .dark .bg-gray-900 { background-color: #171923; }
                .dark .bg-gray-800 { background-color: #2d3748; }
                .dark .text-gray-300 { color: #cbd5e0; }
                .dark .text-gray-400 { color: #a0aec0; }
                .dark .hover\\:bg-gray-800\\:hover { background-color: #2d3748; }
                .dark .group\\:hover .text-gray-400 { color: #cbd5e0; }
                .dark .hover\\:bg-gray-200\\:hover { background-color: #4a5568; }
                .dark .focus\\:ring-blue-500\\:focus { --tw-ring-color: #63b3ed; }
                .dark table { color: #e2e8f0; }
                .dark th { background-color: #2d3748; color: #a0aec0; }
                .dark td { border-bottom-color: #4a5568; }
                .dark .pagination-link:hover { background-color: #4a5568; }
                .dark .pagination-link.active { background-color: #63b3ed; color: #fff; }
                .dark .bg-green-100 { background-color: #104e38; }
                .dark .text-green-800 { color: #68d391; }
                .dark .bg-red-100 { background-color: #63171b; }
                .dark .text-red-800 { color: #fc8181; }
            `}</style>
            <header className="flex items-center justify-between px-6 py-6 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700">
                        <svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {theme === 'light' ?
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> :
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            }
                        </svg>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Dataflow Dashboard</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="p-2 rounded-lg border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">JD</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 bg-gray-100 dark:bg-gray-900">
                <PipelineTable data={paginatedItems} handleSort={handleSort} sortKey={sortKey} sortDirection={sortDirection} />
                <div className="mt-8 flex justify-end items-center space-x-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                        className="pagination-link dark:text-gray-200 dark:hover:bg-gray-700" 
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <div className="flex space-x-1">
                        {getPageNumbers().map((page, index) => (
                            <button
                                key={index}
                                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                className={`pagination-link dark:text-gray-200 dark:hover:bg-gray-700 ${page === currentPage ? 'active' : ''}`}
                                disabled={typeof page !== 'number'}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))} 
                        className="pagination-link dark:text-gray-200 dark:hover:bg-gray-700" 
                        disabled={currentPage === pageCount}
                    >
                        Next
                    </button>
                </div>
                <DailySummaryTable data={dailySummaryData} />
            </main>
        </div>
    );
};

export default App;
