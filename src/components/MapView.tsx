import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, X, Info } from 'lucide-react';
import { mapService } from '../services/mapService';
import type { Activity, Recommendation } from '../types';

interface MapViewProps {
  activities?: Activity[];
  recommendations?: Recommendation[];
  destination: string;
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
}

export default function MapView({ activities, recommendations, destination, onLocationSelect }: MapViewProps) {
  // destination 参数用于 useEffect 依赖，确保目的地变化时重新初始化地图
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);
  const mapIdRef = useRef(`map-container-${Date.now()}`);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true; // 标记组件是否仍然挂载

    const initMap = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
        }
        
        // 设置容器ID
        if (!mapContainerRef.current!.id) {
          mapContainerRef.current!.id = mapIdRef.current;
        }

        // 使用默认中心点（北京）
        const center = { lat: 39.9042, lng: 116.4074 };

        const map = await mapService.initMap(
          mapContainerRef.current!.id,
          center,
          13
        );
        
        if (!isMounted) return; // 再次检查组件是否仍然挂载
        
        setMapInstance(map);

        // 添加目的地标记（高亮显示）
        // 地图初始化完成，不添加目的地标记

        // 批量添加活动标记（优化性能，使用串行请求避免并发限制）
        if (activities && activities.length > 0) {
          const markers: Array<{
            coords: { lat: number; lng: number };
            title: string;
            name: string;
            location: string;
          } | null> = [];

          // 串行处理，避免并发量超限
          for (const activity of activities) {
            if (activity.coordinates) {
              markers.push({
                coords: activity.coordinates,
                title: `${activity.time} - ${activity.name}\n${activity.location}`,
                name: activity.name,
                location: activity.location,
              });
            } else if (activity.location) {
              const coords = await mapService.geocode(activity.location);
              if (coords) {
                markers.push({
                  coords,
                  title: `${activity.time} - ${activity.name}\n${activity.location}`,
                  name: activity.name,
                  location: activity.location,
                });
              } else {
                markers.push(null);
              }
            } else {
              markers.push(null);
            }
          }
          markers.forEach((marker) => {
            if (marker) {
              const markerInstance = mapService.addMarker(
                map,
                marker.coords,
                marker.title,
              );
              // 如果提供了onLocationSelect回调，添加点击事件
              if (onLocationSelect) {
                markerInstance.addEventListener('click', () => {
                  onLocationSelect({
                    lat: marker.coords.lat,
                    lng: marker.coords.lng,
                    name: marker.name,
                  });
                });
              }
            }
          });
        }

        // 批量添加推荐地点标记（串行处理，避免并发限制）
        if (recommendations && recommendations.length > 0) {
          const markers: Array<{
            coords: { lat: number; lng: number };
            title: string;
            name: string;
            location: string;
          } | null> = [];

          // 串行处理，避免并发量超限
          for (const rec of recommendations) {
            if (!rec.location) continue;

            if (rec.coordinates) {
              markers.push({
                coords: rec.coordinates,
                title: `${rec.title}\n${rec.description}`,
                name: rec.title,
                location: rec.location,
              });
            } else {
              const coords = await mapService.geocode(rec.location);
              if (coords) {
                markers.push({
                  coords,
                  title: `${rec.title}\n${rec.description}`,
                  name: rec.title,
                  location: rec.location,
                });
              } else {
                markers.push(null);
              }
            }
          }
          markers.forEach((marker) => {
            if (marker) {
              const markerInstance = mapService.addMarker(
                map,
                marker.coords,
                marker.title,
              );
              // 如果提供了onLocationSelect回调，添加点击事件
              if (onLocationSelect) {
                markerInstance.addEventListener('click', () => {
                  onLocationSelect({
                    lat: marker.coords.lat,
                    lng: marker.coords.lng,
                    name: marker.name || marker.location || '',
                  });
                });
              }
            }
          });
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('地图初始化错误:', err);
        if (isMounted) {
          setError('地图加载失败，请检查百度地图API配置');
          setIsLoading(false);
        }
      }
    };

    initMap();

    // 清理函数：组件卸载时清理
    return () => {
      isMounted = false; // 标记组件已卸载
      // 清理地图实例
      if (mapInstance) {
        try {
          mapInstance.clearOverlays();
        } catch (e) {
          console.error('清理地图实例错误:', e);
        }
      }
    };
  }, [activities, recommendations, destination]);

  // 判断是否为国外地址
  const isInternationalLocation = (location: string): boolean => {
    // 简单的国外地址判断逻辑
    const internationalKeywords = [
      // 日本
      '东京', '大阪', '京都', '横滨', '名古屋', '神户', '福冈', '札幌', '仙台', '广岛',
      '日本', 'Tokyo', 'Osaka', 'Kyoto', 'Japan',
      // 韩国
      '首尔', '釜山', '仁川', '大邱', '大田', '光州', '蔚山', '韩国', 'Seoul', 'Korea',
      // 东南亚
      '曼谷', '新加坡', '吉隆坡', '雅加达', '马尼拉', '胡志明市', '河内',
      'Bangkok', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam',
      // 欧美
      '纽约', '洛杉矶', '芝加哥', '休斯顿', '费城', '凤凰城', '圣安东尼奥', '圣地亚哥',
      '伦敦', '巴黎', '柏林', '罗马', '马德里', '阿姆斯特丹', '维也纳', '布拉格',
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Philadelphia', 'Phoenix',
      'London', 'Paris', 'Berlin', 'Rome', 'Madrid', 'Amsterdam', 'Vienna', 'Prague',
      'USA', 'America', 'UK', 'Britain', 'France', 'Germany', 'Italy', 'Spain'
    ];
    
    return internationalKeywords.some(keyword => 
      location.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const handleNavigate = async (location: string) => {
    if (!mapInstance) return;

    try {
      // 如果是国外地址，显示提示但不进行地理编码
      if (isInternationalLocation(location)) {
        console.log('🌍 检测到国外地址，使用默认位置:', location);
        
        // 显示一个友好的提示
        const BMap = (window as any).BMap;
        if (BMap) {
          // 在默认位置（北京）添加一个信息窗口
          const defaultPoint = new BMap.Point(116.4074, 39.9042);
          const infoWindow = new BMap.InfoWindow(
            `<div style="padding: 10px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold;">🌍 国外目的地</h4>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${location}</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">地图显示默认位置，实际目的地在国外</p>
            </div>`,
            {
              width: 280,
              height: 120
            }
          );
          
          mapInstance.openInfoWindow(infoWindow, defaultPoint);
          mapInstance.centerAndZoom(defaultPoint, 13);
        }
        return;
      }

      // 对于国内地址，正常进行地理编码
      const coords = await mapService.geocode(location);
      if (coords) {
        const BMap = (window as any).BMap;
        if (!BMap) {
          console.error('百度地图未加载');
          return;
        }
        const point = new BMap.Point(coords.lng, coords.lat);
        mapInstance.centerAndZoom(point, 15);
        mapInstance.panTo(point);
        
        // 如果提供了回调，通知位置选择
        if (onLocationSelect) {
          onLocationSelect({
            lat: coords.lat,
            lng: coords.lng,
            name: location,
          });
        }
      } else {
        console.warn('无法获取位置坐标:', location);
        // 如果地理编码失败，也显示在默认位置
        const BMap = (window as any).BMap;
        if (BMap) {
          const defaultPoint = new BMap.Point(116.4074, 39.9042);
          const infoWindow = new BMap.InfoWindow(
            `<div style="padding: 10px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #dc2626; font-weight: bold;">⚠️ 位置未找到</h4>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${location}</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">无法定位到具体位置</p>
            </div>`,
            {
              width: 260,
              height: 100
            }
          );
          
          mapInstance.openInfoWindow(infoWindow, defaultPoint);
          mapInstance.centerAndZoom(defaultPoint, 13);
        }
      }
    } catch (error) {
      console.error('导航错误:', error);
    }
  };

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          请检查 .env 文件中的 VITE_BAIDU_MAP_API_KEY 配置
        </p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* 导航提示框 */}
      {showTip && (
        <div className="p-4 pb-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-semibold text-blue-900">导航提示</h4>
                  <span className="text-lg">📍</span>
                </div>
                <p className="text-sm text-blue-700">
                  点击下方推荐地点导航。国内地址会跳转到对应位置，国外地址会显示在默认位置并提供说明
                </p>
              </div>
              <button
                onClick={() => setShowTip(false)}
                className="flex-shrink-0 p-1 hover:bg-blue-100 rounded-full transition-colors"
                aria-label="关闭提示"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">加载地图中...</p>
            </div>
          </div>
        )}
        <div
          id="map-container"
          ref={mapContainerRef}
          className="w-full h-[500px]"
        />
      </div>
      
      {/* 地点列表 */}
      {(activities || recommendations) && (
        <div className="p-4 border-t border-gray-200 max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span>地点导航</span>
          </h4>
          <div className="space-y-2">
            {activities?.map((activity, idx) => (
              <button
                key={idx}
                onClick={() => handleNavigate(activity.location)}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900">{activity.name}</div>
                  <div className="text-xs text-gray-500">{activity.location}</div>
                </div>
                <Navigation className="w-4 h-4 text-primary-600" />
              </button>
            ))}
            {recommendations?.map((rec, idx) => (
              rec.location && (
                <button
                  key={`rec-${idx}`}
                  onClick={() => handleNavigate(rec.location!)}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-900">{rec.title}</div>
                    <div className="text-xs text-gray-500">{rec.location}</div>
                  </div>
                  <Navigation className="w-4 h-4 text-primary-600" />
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

