
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, Thermometer, BatteryFull, Activity, MemoryStick } from "lucide-react";
import AISystemStatus from "@/components/AISystemStatus";
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";

const SystemInfo = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: "0%",
    cpuTemp: "0°C",
    memoryUsage: "0 / 0GB",
    diskUsage: "0%",
    batteryLevel: "N/A",
    uptime: "0h 0m",
    gpuUsage: "0%"
  });
  
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        // On a real Jetson device, we would fetch actual metrics
        if (isJetsonPlatform()) {
          // CPU usage
          const cpuCommand = "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1\"%\"}'";
          const cpuUsage = await executeCommand(cpuCommand);
          
          // CPU temperature
          const tempCommand = "cat /sys/class/thermal/thermal_zone0/temp | awk '{printf \"%.1f°C\", $1/1000}'";
          const cpuTemp = await executeCommand(tempCommand);
          
          // Memory usage
          const memCommand = "free -h | grep 'Mem:' | awk '{print $3 \" / \" $2}'";
          const memoryUsage = await executeCommand(memCommand);
          
          // Disk usage
          const diskCommand = "df -h / | awk 'NR==2 {print $5}'";
          const diskUsage = await executeCommand(diskCommand);
          
          // GPU usage
          const gpuCommand = "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | awk '{print $1\"%\"}'";
          const gpuUsage = await executeCommand(gpuCommand);
          
          // System uptime
          const uptimeCommand = "uptime -p | sed 's/up //'";
          const uptime = await executeCommand(uptimeCommand);
          
          setSystemMetrics({
            cpuUsage: cpuUsage.trim(),
            cpuTemp: cpuTemp.trim(),
            memoryUsage: memoryUsage.trim(),
            diskUsage: diskUsage.trim(),
            batteryLevel: "N/A", // Jetson doesn't typically have a battery
            uptime: uptime.trim(),
            gpuUsage: gpuUsage.trim()
          });
        } else {
          // Simulate metrics for non-Jetson platforms
          setSystemMetrics({
            cpuUsage: Math.floor(Math.random() * 60) + 10 + "%",
            cpuTemp: (Math.random() * 20 + 40).toFixed(1) + "°C",
            memoryUsage: Math.floor(Math.random() * 4 + 2) + " / 8GB",
            diskUsage: Math.floor(Math.random() * 30 + 40) + "%",
            batteryLevel: Math.floor(Math.random() * 30 + 70) + "%",
            uptime: Math.floor(Math.random() * 12) + "h " + Math.floor(Math.random() * 60) + "m",
            gpuUsage: Math.floor(Math.random() * 50) + "%"
          });
        }
      } catch (error) {
        console.error("Error fetching system info:", error);
      }
    };
    
    // Fetch initially
    fetchSystemInfo();
    
    // Update every 5 seconds
    const intervalId = setInterval(fetchSystemInfo, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Activity className="mr-2 h-4 w-4 text-primary" />
            System Resources
          </CardTitle>
          <CardDescription>
            Jetson Orin Nano hardware metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center text-sm">
                  <Cpu className="mr-2 h-4 w-4 text-primary-foreground/70" />
                  CPU Usage
                </div>
                <Badge variant="outline" className="h-5">
                  {systemMetrics.cpuUsage}
                </Badge>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: systemMetrics.cpuUsage }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center text-sm">
                  <Thermometer className="mr-2 h-4 w-4 text-primary-foreground/70" />
                  CPU Temperature
                </div>
                <Badge variant="outline" className="h-5">
                  {systemMetrics.cpuTemp}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center text-sm">
                  <MemoryStick className="mr-2 h-4 w-4 text-primary-foreground/70" />
                  Memory
                </div>
                <Badge variant="outline" className="h-5">
                  {systemMetrics.memoryUsage}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center text-sm">
                  <HardDrive className="mr-2 h-4 w-4 text-primary-foreground/70" />
                  Disk
                </div>
                <Badge variant="outline" className="h-5">
                  {systemMetrics.diskUsage}
                </Badge>
              </div>
            </div>
            
            {isJetsonPlatform() && (
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center text-sm">
                    <svg className="mr-2 h-4 w-4 text-primary-foreground/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    GPU Usage
                  </div>
                  <Badge variant="outline" className="h-5">
                    {systemMetrics.gpuUsage}
                  </Badge>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: systemMetrics.gpuUsage }}
                  ></div>
                </div>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <BatteryFull className="mr-2 h-4 w-4 text-primary-foreground/70" />
                Power
              </div>
              <span>{systemMetrics.batteryLevel}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Uptime</span>
              <span>{systemMetrics.uptime}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AISystemStatus className="h-full" />
    </div>
  );
};

export default SystemInfo;
