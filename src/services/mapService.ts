// 百度地图服务
export class MapService {
  private apiKey: string;
  // 地理编码缓存，避免重复请求
  private geocodeCache: Map<string, { lat: number; lng: number } | null> = new Map();
  // 请求队列，控制并发数量
  private requestQueue: Array<() => void> = [];
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 2; // 最大并发请求数
  private readonly requestDelay = 500; // 请求间隔（毫秒）

  constructor() {
    this.apiKey = import.meta.env.VITE_BAIDU_MAP_API_KEY || '';
    console.log('🗺️ MapService初始化:', { 
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0 
    });
  }

  // 初始化百度地图
  initMap(containerId: string, center: { lat: number; lng: number }, zoom: number = 13): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('百度地图API Key未配置'));
        return;
      }

      // 如果API Key发生变化，清除旧的脚本和全局变量
      const currentApiKey = this.apiKey;
      const existingScript = document.querySelector(`script[src*="api.map.baidu.com"]`);
      if (existingScript) {
        // 检查是否是同一个API Key
        const scriptSrc = (existingScript as HTMLScriptElement).src;
        const oldApiKey = scriptSrc.match(/ak=([^&]+)/)?.[1];
        if (oldApiKey && oldApiKey !== currentApiKey) {
          // API Key已更改，移除旧脚本
          existingScript.remove();
          // 清除全局BMap对象
          delete (window as any).BMap;
          delete (window as any).initBaiduMap;
        }
      }

      // 动态加载百度地图脚本
      if ((window as any).BMap) {
        this.createMap(containerId, center, zoom, resolve, reject);
      } else {
        // 创建唯一的回调函数名，避免冲突
        const callbackName = `initBaiduMap_${Date.now()}`;
        
        const script = document.createElement('script');
        script.src = `https://api.map.baidu.com/api?v=3.0&ak=${this.apiKey}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        (window as any)[callbackName] = () => {
          this.createMap(containerId, center, zoom, resolve, reject);
          // 清理回调函数
          delete (window as any)[callbackName];
        };

        script.onerror = () => {
          delete (window as any)[callbackName];
          reject(new Error('加载百度地图失败，请检查API Key是否正确'));
        };

        // 设置超时
          const timeout = setTimeout(() => {
            if (!(window as any).BMap) {
              script.remove();
              delete (window as any)[callbackName];
              console.error('百度地图API加载超时');
              reject(new Error('百度地图API加载超时，请检查网络连接和API Key'));
            }
          }, 20000); // 增加到20秒超时

        script.onload = () => {
          clearTimeout(timeout);
        };

        document.head.appendChild(script);
      }
    });
  }

  private createMap(
    containerId: string,
    center: { lat: number; lng: number },
    zoom: number,
    resolve: (map: any) => void,
    reject: (error: Error) => void
  ) {
    try {
      const BMap = (window as any).BMap;
      const map = new BMap.Map(containerId);
      const point = new BMap.Point(center.lng, center.lat);
      
      map.centerAndZoom(point, zoom);
      map.enableScrollWheelZoom(true);
      
      resolve(map);
    } catch (error) {
      reject(error as Error);
    }
  }

  // 国际目的地关键词列表
  private readonly internationalKeywords = [
    '日本', '韩国', '泰国', '新加坡', '马来西亚', '印度尼西亚', '菲律宾', '越南', '柬埔寨', '缅甸', '老挝',
    '美国', '加拿大', '墨西哥', '巴西', '阿根廷', '智利', '秘鲁', '哥伦比亚',
    '英国', '法国', '德国', '意大利', '西班牙', '葡萄牙', '荷兰', '比利时', '瑞士', '奥地利', '希腊', '土耳其', '俄罗斯',
    '澳大利亚', '新西兰', '斐济',
    '埃及', '南非', '肯尼亚', '摩洛哥',
    '印度', '斯里兰卡', '尼泊尔', '不丹', '马尔代夫',
    '迪拜', '阿联酋', '卡塔尔', '沙特阿拉伯', '以色列', '约旦',
    '冰岛', '挪威', '瑞典', '丹麦', '芬兰',
    '捷克', '波兰', '匈牙利', '克罗地亚', '塞尔维亚',
    '东京', '大阪', '京都', '首尔', '曼谷', '新加坡', '吉隆坡', '雅加达',
    '纽约', '洛杉矶', '旧金山', '芝加哥', '波士顿', '华盛顿', '多伦多', '温哥华',
    '伦敦', '巴黎', '柏林', '罗马', '马德里', '巴塞罗那', '阿姆斯特丹', '维也纳', '苏黎世', '雅典',
    '悉尼', '墨尔本', '奥克兰',
    '开罗', '开普敦', '内罗毕',
    '新德里', '孟买', '科伦坡', '加德满都',
    '迪拜', '多哈', '利雅得', '特拉维夫',
    '雷克雅未克', '奥斯陆', '斯德哥尔摩', '哥本哈根', '赫尔辛基',
    '布拉格', '华沙', '布达佩斯', '萨格勒布',
  ];

  // 判断是否是国际目的地
  private isInternationalDestination(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    return this.internationalKeywords.some(keyword => 
      lowerAddress.includes(keyword.toLowerCase())
    );
  }

  // 处理请求队列
  private processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }

    const nextRequest = this.requestQueue.shift();
    if (nextRequest) {
      this.activeRequests++;
      nextRequest();
    }
  }

  // 完成请求后从队列中取出下一个
  private completeRequest() {
    this.activeRequests--;
    setTimeout(() => {
      this.processQueue();
    }, this.requestDelay);
  }

  // 地理编码：地址转坐标（使用百度地图JavaScript API，支持全球搜索，带缓存和限流）
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) {
      console.warn('百度地图API Key未配置，无法进行地理编码');
      return null;
    }

    // 验证地址参数
    if (!address || typeof address !== 'string') {
      console.warn('地理编码失败：地址参数无效', { address });
      return null;
    }

    // 检查缓存
    const cacheKey = address.toLowerCase().trim();
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      // 将请求加入队列
      this.requestQueue.push(() => {
        // 再次检查缓存（可能在队列等待期间已被其他请求缓存）
        if (this.geocodeCache.has(cacheKey)) {
          this.completeRequest();
          resolve(this.geocodeCache.get(cacheKey)!);
          return;
        }

        // 等待百度地图API加载完成
        if ((window as any).BMap) {
          this.doGeocodeWithCache(address, cacheKey, resolve);
        } else {
          // 如果百度地图API还没加载，等待加载完成
          let checkCount = 0;
          const maxChecks = 100; // 最多检查100次（10秒）
          
          const checkBMap = setInterval(() => {
            checkCount++;
            if ((window as any).BMap) {
              clearInterval(checkBMap);
              this.doGeocodeWithCache(address, cacheKey, resolve);
            } else if (checkCount >= maxChecks) {
              clearInterval(checkBMap);
              console.error('百度地图API加载超时');
              this.geocodeCache.set(cacheKey, null);
              this.completeRequest();
              resolve(null);
            }
          }, 100);
        }
      });

      // 处理队列
      this.processQueue();
    });
  }

  private doGeocodeWithCache(
    address: string,
    cacheKey: string,
    resolve: (result: { lat: number; lng: number } | null) => void
  ) {
    this.doGeocode(address, (result) => {
      // 缓存结果（包括null，避免重复请求失败）
      this.geocodeCache.set(cacheKey, result);
      this.completeRequest();
      resolve(result);
    });
  }

  private doGeocode(address: string, resolve: (result: { lat: number; lng: number } | null) => void) {
    try {
      const BMap = (window as any).BMap;
      const isInternational = this.isInternationalDestination(address);
      
      console.log('🔍 [MapService] 开始地理编码:', { 
        address, 
        isInternational,
        hasBMap: !!BMap 
      });
      
      // 如果是国际目的地，使用LocalSearch进行更精确的搜索
      if (isInternational) {
        console.log('🌍 [MapService] 使用国际搜索模式');
        this.searchInternational(address, resolve);
      } else {
        // 国内地址使用Geocoder，设置为空字符串表示全球搜索
        console.log('🇨🇳 [MapService] 使用国内搜索模式');
        const geocoder = new BMap.Geocoder();
        
        geocoder.getPoint(
          address,
          (point: any) => {
            console.log('📍 [MapService] Geocoder返回结果:', { point, address });
            if (point) {
              // 验证结果是否在国内（中国大致范围：纬度18-54，经度73-135）
              // 如果搜索的是国际目的地但返回了国内坐标，可能是误匹配
              const isInChina = point.lat >= 18 && point.lat <= 54 && point.lng >= 73 && point.lng <= 135;
              
              console.log('✅ [MapService] 地理编码成功:', { 
                lat: point.lat, 
                lng: point.lng, 
                isInChina,
                address 
              });
              
              if (isInChina && this.isInternationalDestination(address)) {
                // 国际目的地但返回了国内坐标，可能是误匹配，尝试使用LocalSearch
                console.warn(`⚠️ [MapService] 检测到可能的误匹配，尝试使用精确搜索: ${address}`);
                this.searchInternational(address, resolve);
              } else {
                resolve({
                  lat: point.lat,
                  lng: point.lng,
                });
              }
            } else {
              console.warn('⚠️ [MapService] Geocoder未找到结果，尝试LocalSearch');
              // 如果Geocoder找不到，尝试使用LocalSearch
              this.searchInternational(address, resolve);
            }
          },
          '' // 空字符串表示全球搜索
        );
      }
    } catch (error) {
      console.error('地理编码错误:', error);
      resolve(null);
    }
  }

  // 使用LocalSearch进行国际目的地搜索（更精确）
  private searchInternational(address: string, resolve: (result: { lat: number; lng: number } | null) => void) {
    try {
      const BMap = (window as any).BMap;
      
      console.log('🌍 [MapService] 开始LocalSearch搜索:', { address });
      
      // 创建一个临时的地图实例用于LocalSearch（不显示）
      const tempMap = new BMap.Map(document.createElement('div'));
      const localSearch = new BMap.LocalSearch(tempMap, {
        onSearchComplete: (results: any) => {
          const status = localSearch.getStatus();
          console.log('🔍 [MapService] LocalSearch返回结果:', { 
            status: status,
            hasResults: !!results,
            numPois: results ? results.getNumPois() : 0,
            address,
            statusType: typeof status,
            BMapExists: !!(window as any).BMap
          });
          
          // 百度地图状态码：0表示成功
          // 添加更多的状态码检查
          if (status === 0 && results && results.getNumPois && results.getNumPois() > 0) {
            // 优先选择不在中国境内的结果
            const internationalResults: Array<{ lat: number; lng: number }> = [];
            const domesticResults: Array<{ lat: number; lng: number }> = [];
            
            for (let i = 0; i < results.getNumPois(); i++) {
              const poi = results.getPoi(i);
              const point = poi.point;
              
              // 检查是否在中国境内（中国大致范围：纬度18-54，经度73-135）
              const isInChina = point.lat >= 18 && point.lat <= 54 && point.lng >= 73 && point.lng <= 135;
              
              const coord = {
                lat: point.lat,
                lng: point.lng,
              };
              
              if (isInChina) {
                domesticResults.push(coord);
              } else {
                internationalResults.push(coord);
              }
            }
            
            // 如果是国际目的地，优先返回国际结果
            if (this.isInternationalDestination(address)) {
              if (internationalResults.length > 0) {
                resolve(internationalResults[0]);
              } else if (domesticResults.length > 0) {
                console.warn(`国际目的地"${address}"未找到国际结果，返回国内结果`);
                resolve(domesticResults[0]);
              } else {
                console.warn(`无法找到地址"${address}"的坐标`);
                resolve(null);
              }
            } else {
              // 国内地址，优先返回国内结果
              if (domesticResults.length > 0) {
                resolve(domesticResults[0]);
              } else if (internationalResults.length > 0) {
                resolve(internationalResults[0]);
              } else {
                console.warn(`无法找到地址"${address}"的坐标`);
                resolve(null);
              }
            }
          } else {
            console.warn(`搜索地址"${address}"失败，状态码: ${status}`);
            // 尝试使用百度地图的Geocoder作为备用方案
            this.fallbackGeocode(address).then(resolve).catch(() => resolve(null));
          }
        }
      });
      
      // 设置搜索范围为空，表示全球搜索
      localSearch.search(address);
    } catch (error) {
      console.error('国际搜索错误:', error);
      resolve(null);
    }
  }

  // 备用地理编码方法
  private async fallbackGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      try {
        console.log('🔄 [MapService] 尝试备用地理编码方法:', { address });
        
        const BMap = (window as any).BMap;
        if (!BMap) {
          console.warn('BMap未加载，无法使用备用地理编码');
          resolve(null);
          return;
        }

        const geocoder = new BMap.Geocoder();
        geocoder.getPoint(address, (point: any) => {
          if (point) {
            console.log('✅ [MapService] 备用地理编码成功:', { 
              address, 
              lat: point.lat, 
              lng: point.lng 
            });
            resolve({ lat: point.lat, lng: point.lng });
          } else {
            console.warn('❌ [MapService] 备用地理编码也失败了:', { address });
            resolve(null);
          }
        });
      } catch (error) {
        console.error('备用地理编码错误:', error);
        resolve(null);
      }
    });
  }

  // 逆地理编码：坐标转地址（使用百度地图JavaScript API）
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('百度地图API Key未配置，无法进行逆地理编码');
      return null;
    }

    return new Promise((resolve) => {
      if ((window as any).BMap) {
        this.doReverseGeocode(lat, lng, resolve);
      } else {
        const checkBMap = setInterval(() => {
          if ((window as any).BMap) {
            clearInterval(checkBMap);
            this.doReverseGeocode(lat, lng, resolve);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkBMap);
          resolve(null);
        }, 10000);
      }
    });
  }

  private doReverseGeocode(lat: number, lng: number, resolve: (result: string | null) => void) {
    try {
      const BMap = (window as any).BMap;
      const geocoder = new BMap.Geocoder();
      const point = new BMap.Point(lng, lat);
      
      geocoder.getLocation(point, (result: any) => {
        if (result) {
          resolve(result.address);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.error('逆地理编码错误:', error);
      resolve(null);
    }
  }

  // 添加标记点
  addMarker(map: any, point: { lat: number; lng: number }, title: string): any {
    const BMap = (window as any).BMap;
    const bdPoint = new BMap.Point(point.lng, point.lat);
    const marker = new BMap.Marker(bdPoint);
    
    if (title) {
      const infoWindow = new BMap.InfoWindow(title, {
        width: 200,
        height: 100,
      });
      marker.addEventListener('click', () => {
        map.openInfoWindow(infoWindow, bdPoint);
      });
    }

    map.addOverlay(marker);
    return marker;
  }

  // 添加路线规划
  addRoute(
    map: any,
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    waypoints?: Array<{ lat: number; lng: number }>
  ): void {
    const BMap = (window as any).BMap;
    const driving = new BMap.DrivingRoute(map, {
      renderOptions: {
        map: map,
        autoViewport: true,
      },
    });

    const startPoint = new BMap.Point(start.lng, start.lat);
    const endPoint = new BMap.Point(end.lng, end.lat);

    if (waypoints && waypoints.length > 0) {
      const points = waypoints.map(wp => new BMap.Point(wp.lng, wp.lat));
      driving.search(startPoint, endPoint, { waypoints: points });
    } else {
      driving.search(startPoint, endPoint);
    }
  }

  // 获取当前位置
  getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  // 计算两点间距离（公里）
  getDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const BMap = (window as any).BMap;
    if (!BMap) return 0;

    const p1 = new BMap.Point(point1.lng, point1.lat);
    const p2 = new BMap.Point(point2.lng, point2.lat);
    return (BMap.Map as any).getDistance(p1, p2) / 1000; // 转换为公里
  }
}

export const mapService = new MapService();

