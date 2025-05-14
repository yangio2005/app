/**
 * Charts and visualization functionality
 * Uses Chart.js for creating interactive and responsive charts
 */

class AttendanceCharts {
    constructor() {
        // Chart instances
        this.charts = {};
    }
    
    /**
     * Initialize charts on the dashboard
     */
    initDashboardCharts() {
        // Daily attendance chart
        this.createDailyAttendanceChart();
        
        // Activity attendance rate chart
        this.createActivityRateChart();
    }
    
    /**
     * Create the daily attendance chart
     */
    createDailyAttendanceChart() {
        const canvas = document.getElementById('daily-attendance-chart');
        if (!canvas) return;
        
        // Get attendance data from the data attributes
        const dates = JSON.parse(canvas.dataset.dates || '[]');
        const counts = JSON.parse(canvas.dataset.counts || '[]');
        
        // Check if we have data
        if (dates.length === 0) {
            canvas.style.display = 'none';
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'alert alert-info mt-3';
            noDataMsg.textContent = 'No attendance data available for the selected period.';
            canvas.parentNode.appendChild(noDataMsg);
            return;
        }
        
        // Create chart
        this.charts.dailyAttendance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Attendance Count',
                    data: counts,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Only show whole numbers
                        },
                        title: {
                            display: true,
                            text: 'Number of Students'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Daily Attendance (Last 7 Days)'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return 'Date: ' + tooltipItems[0].label;
                            },
                            label: function(context) {
                                return 'Students present: ' + context.raw;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create the activity attendance rate chart
     */
    createActivityRateChart() {
        const canvas = document.getElementById('activity-rate-chart');
        if (!canvas) return;
        
        // Get activity data
        const activities = JSON.parse(canvas.dataset.activities || '[]');
        const rates = JSON.parse(canvas.dataset.rates || '[]');
        const colors = this.generateColors(activities.length);
        
        // Check if we have data
        if (activities.length === 0) {
            canvas.style.display = 'none';
            return;
        }
        
        // Create chart
        this.charts.activityRate = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: activities,
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: rates,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Attendance Rate (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Activity'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Attendance Rates by Activity'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw.toFixed(1) + '% attendance rate';
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create a chart for attendance report
     */
    createAttendanceReportChart(canvasId, labels, data, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Check if we have data
        if (labels.length === 0) {
            canvas.style.display = 'none';
            return;
        }
        
        // Create chart
        const chartType = labels.length > 10 ? 'line' : 'bar';
        
        this.charts[canvasId] = new Chart(canvas.getContext('2d'), {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance Count',
                    data: data,
                    backgroundColor: chartType === 'bar' ? this.generateColors(labels.length) : 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
    }
    
    /**
     * Create a pie chart showing overall attendance distribution
     */
    createAttendancePieChart(canvasId, attendedCount, absentCount) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        this.charts[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [attendedCount, absentCount],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Attendance Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label;
                                const value = context.raw;
                                const total = attendedCount + absentCount;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Generate an array of colors for charts
     */
    generateColors(count) {
        const baseColors = [
            'rgba(75, 192, 192, 0.8)',   // Teal
            'rgba(54, 162, 235, 0.8)',   // Blue
            'rgba(153, 102, 255, 0.8)',  // Purple
            'rgba(255, 159, 64, 0.8)',   // Orange
            'rgba(255, 99, 132, 0.8)',   // Pink
            'rgba(255, 206, 86, 0.8)',   // Yellow
            'rgba(199, 199, 199, 0.8)'   // Gray
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        return colors;
    }
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const attendanceCharts = new AttendanceCharts();
    
    // Initialize dashboard charts if on dashboard page
    if (document.getElementById('daily-attendance-chart')) {
        attendanceCharts.initDashboardCharts();
    }
    
    // Initialize attendance view chart if on that page
    if (document.getElementById('attendance-pie-chart')) {
        const attended = parseInt(document.getElementById('attendance-pie-chart').dataset.attended || 0);
        const total = parseInt(document.getElementById('attendance-pie-chart').dataset.total || 0);
        const absent = total - attended;
        
        attendanceCharts.createAttendancePieChart('attendance-pie-chart', attended, absent);
    }
    
    // Initialize report charts if on reports page
    if (document.getElementById('attendance-report-chart')) {
        const labels = JSON.parse(document.getElementById('attendance-report-chart').dataset.labels || '[]');
        const data = JSON.parse(document.getElementById('attendance-report-chart').dataset.values || '[]');
        
        attendanceCharts.createAttendanceReportChart(
            'attendance-report-chart', 
            labels, 
            data, 
            'Attendance Distribution'
        );
    }
});
