<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  
  export let data;
  
  let quizTrendsChart: HTMLDivElement;
  let scoreDistributionChart: HTMLDivElement;
  let popularTopicsChart: HTMLDivElement;
  let dailyAttemptsChart: HTMLDivElement;
  
  onMount(() => {
    initializeCharts();
  });
  
  function initializeCharts() {
    // Quiz Creation Trends (Line Chart)
    if (quizTrendsChart) {
      const chart = echarts.init(quizTrendsChart);
      const option = {
        title: {
          text: 'Quiz Creation Trends',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: data.charts.quizTrends.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'Quizzes Created'
        },
        series: [{
          data: data.charts.quizTrends.map(item => item.count),
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#007bff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(0, 123, 255, 0.3)'
              }, {
                offset: 1, color: 'rgba(0, 123, 255, 0.1)'
              }]
            }
          }
        }]
      };
      chart.setOption(option);
      
      // Responsive
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Score Distribution (Pie Chart)
    if (scoreDistributionChart) {
      const chart = echarts.init(scoreDistributionChart);
      const option = {
        title: {
          text: 'Score Distribution',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          name: 'Score Range',
          type: 'pie',
          radius: '50%',
          data: data.charts.scoreDistribution.map(item => ({
            value: item.count,
            name: item.scoreRange
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            color: function(params: any) {
              const colors = ['#28a745', '#20c997', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1'];
              return colors[params.dataIndex % colors.length];
            }
          }
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Popular Topics (Bar Chart)
    if (popularTopicsChart) {
      const chart = echarts.init(popularTopicsChart);
      const option = {
        title: {
          text: 'Most Popular Quiz Topics',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'value',
          name: 'Number of Attempts'
        },
        yAxis: {
          type: 'category',
          data: data.charts.popularTopics.map(item => item.topic).reverse(),
          axisLabel: {
            width: 100,
            overflow: 'truncate'
          }
        },
        series: [{
          data: data.charts.popularTopics.map(item => item.attemptCount).reverse(),
          type: 'bar',
          itemStyle: {
            color: '#17a2b8'
          },
          barMaxWidth: 30
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
    
    // Daily Attempts with Average Score (Dual Axis Chart)
    if (dailyAttemptsChart) {
      const chart = echarts.init(dailyAttemptsChart);
      const option = {
        title: {
          text: 'Daily Quiz Activity',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['Attempts', 'Avg Score %'],
          bottom: 0
        },
        xAxis: {
          type: 'category',
          data: data.charts.dailyAttempts.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [{
          type: 'value',
          name: 'Number of Attempts',
          position: 'left'
        }, {
          type: 'value',
          name: 'Average Score (%)',
          position: 'right',
          min: 0,
          max: 100
        }],
        series: [{
          name: 'Attempts',
          type: 'bar',
          data: data.charts.dailyAttempts.map(item => item.count),
          itemStyle: {
            color: '#6f42c1'
          }
        }, {
          name: 'Avg Score %',
          type: 'line',
          yAxisIndex: 1,
          data: data.charts.dailyAttempts.map(item => Math.round(item.avgScore || 0)),
          smooth: true,
          itemStyle: {
            color: '#e83e8c'
          }
        }]
      };
      chart.setOption(option);
      
      window.addEventListener('resize', () => chart.resize());
    }
  }
</script>

<div class="container">
  <div class="reports-header">
    <h1>Quiz Analytics Dashboard</h1>
    <p class="subtitle">Insights and statistics from your quiz platform</p>
    {#if data.stats.totalAttempts === 0 && data.stats.totalQuizzes > 0}
      <div class="no-attempts-notice">
        <p>📊 You have {data.stats.totalQuizzes} quizzes created, but no attempts yet.</p>
        <p>Take some quizzes to see detailed analytics!</p>
        <a href="/" class="take-quiz-btn">Go Take a Quiz</a>
      </div>
    {/if}
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{data.stats.totalQuizzes}</div>
      <div class="stat-label">Total Quizzes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{data.stats.totalAttempts}</div>
      <div class="stat-label">Total Attempts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{data.stats.averageScore}%</div>
      <div class="stat-label">Average Score</div>
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="charts-grid">
    <div class="chart-container">
      <div class="chart" bind:this={quizTrendsChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={scoreDistributionChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={popularTopicsChart}></div>
    </div>
    
    <div class="chart-container">
      <div class="chart" bind:this={dailyAttemptsChart}></div>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .reports-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .reports-header h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #007bff;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #666;
    font-size: 1rem;
    font-weight: 500;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 2rem;
  }

  .chart-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .chart {
    width: 100%;
    height: 400px;
  }

  @media (max-width: 1024px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      min-width: 0;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }

    .reports-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-value {
      font-size: 2rem;
    }

    .chart {
      height: 300px;
    }
  }

  .no-attempts-notice {
    background: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    text-align: center;
  }

  .no-attempts-notice p {
    margin: 0.5rem 0;
    color: #1565c0;
  }

  .take-quiz-btn {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    margin-top: 1rem;
    transition: background 0.2s;
  }

  .take-quiz-btn:hover {
    background: #0056b3;
  }
</style>