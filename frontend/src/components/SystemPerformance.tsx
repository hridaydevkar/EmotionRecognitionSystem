import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Database, Wifi, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SystemPerformanceProps {
  className?: string;
}

const SystemPerformance: React.FC<SystemPerformanceProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState({
    detectionAccuracy: 87.5,
    processingSpeed: 45, // ms
    modelConfidence: 82.3,
    systemHealth: 'healthy' as 'healthy' | 'warning' | 'error',
    uptime: '2d 14h 32m',
    lastUpdate: new Date(),
    framerate: 30,
    memoryUsage: 62,
    cpuUsage: 34
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        detectionAccuracy: Math.max(75, Math.min(95, prev.detectionAccuracy + (Math.random() - 0.5) * 2)),
        processingSpeed: Math.max(20, Math.min(100, prev.processingSpeed + (Math.random() - 0.5) * 10)),
        modelConfidence: Math.max(70, Math.min(95, prev.modelConfidence + (Math.random() - 0.5) * 3)),
        framerate: Math.max(25, Math.min(35, prev.framerate + (Math.random() - 0.5) * 2)),
        memoryUsage: Math.max(40, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        cpuUsage: Math.max(20, Math.min(60, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        lastUpdate: new Date()
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Performance
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {getHealthIcon()}
          <span className={`text-sm font-medium ${
            metrics.systemHealth === 'healthy' 
              ? 'text-green-600 dark:text-green-400'
              : metrics.systemHealth === 'warning'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {metrics.systemHealth.charAt(0).toUpperCase() + metrics.systemHealth.slice(1)}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Detection Accuracy */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Detection Accuracy</span>
            <CheckCircle className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${getHealthColor(metrics.detectionAccuracy, { good: 85, warning: 75 })}`}>
            {metrics.detectionAccuracy.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.detectionAccuracy, { good: 85, warning: 75 })}`}
              style={{ width: `${metrics.detectionAccuracy}%` }}
            ></div>
          </div>
        </div>

        {/* Processing Speed */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Processing Speed</span>
            <Cpu className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${getHealthColor(100 - metrics.processingSpeed, { good: 70, warning: 50 })}`}>
            {metrics.processingSpeed.toFixed(0)}ms
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(100 - metrics.processingSpeed, { good: 70, warning: 50 })}`}
              style={{ width: `${100 - metrics.processingSpeed}%` }}
            ></div>
          </div>
        </div>

        {/* Model Confidence */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Model Confidence</span>
            <Database className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${getHealthColor(metrics.modelConfidence, { good: 80, warning: 70 })}`}>
            {metrics.modelConfidence.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.modelConfidence, { good: 80, warning: 70 })}`}
              style={{ width: `${metrics.modelConfidence}%` }}
            ></div>
          </div>
        </div>

        {/* Frame Rate */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Frame Rate</span>
            <Wifi className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-xl font-bold ${getHealthColor(metrics.framerate, { good: 28, warning: 20 })}`}>
            {metrics.framerate.toFixed(0)}fps
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.framerate, { good: 28, warning: 20 })}`}
              style={{ width: `${(metrics.framerate / 35) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* System Uptime */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">System Uptime</span>
          </div>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{metrics.uptime}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Since last restart
          </p>
        </div>

        {/* Memory Usage */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Memory Usage</span>
            <span className="text-xs text-purple-700 dark:text-purple-300">{metrics.memoryUsage}%</span>
          </div>
          <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
            <div 
              className="h-2 bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.memoryUsage}%` }}
            ></div>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
            {(metrics.memoryUsage * 8 / 100).toFixed(1)}GB of 8GB used
          </p>
        </div>

        {/* CPU Usage */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">CPU Usage</span>
            <span className="text-xs text-orange-700 dark:text-orange-300">{metrics.cpuUsage}%</span>
          </div>
          <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
            <div 
              className="h-2 bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cpuUsage}%` }}
            ></div>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
            Quad-core utilization
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Last updated: {metrics.lastUpdate.toLocaleTimeString()}</span>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span>Live monitoring active</span>
        </div>
      </div>
    </div>
  );
};

export default SystemPerformance;
