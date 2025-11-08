// 图片服务 - 生成渐变背景占位符
export class ImageService {
  private imageCache: Map<string, string> = new Map(); // 图片URL缓存
  
  constructor() {
    // 构造函数保持简洁，不再需要外部API配置
  }
  
  // 根据推荐信息获取图片
  async getRecommendationImage(
    recommendation: {
      title: string;
      location?: string;
      category: string;
      imageUrl?: string;
    },
    destination: string
  ): Promise<string> {
    const cacheKey = `${destination}-${recommendation.title}-${recommendation.category}`;
    
    console.log('🖼️ 获取图片:', { destination, title: recommendation.title, category: recommendation.category });
    
    // 检查缓存
    if (this.imageCache.has(cacheKey)) {
      console.log('✅ 使用缓存的图片');
      return this.imageCache.get(cacheKey)!;
    }
    
      // 统一使用渐变背景占位符（不再使用AI提供的图片URL）
    console.log('🎨 使用渐变背景占位符');
    const placeholderImage = this.generateGradientPlaceholder(recommendation);
    console.log('✅ 生成渐变背景图片:', {
      image: placeholderImage,
      length: placeholderImage.length,
      prefix: placeholderImage.substring(0, 50)
    });
    
    // 验证生成的URL是否有效
    if (!placeholderImage || !placeholderImage.startsWith('data:image/svg+xml,')) {
      console.error('❌ 生成的SVG URL无效:', placeholderImage);
      // 返回一个简单的兜底图片
      const fallbackSvg = `data:image/svg+xml,${encodeURIComponent('<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#667eea"/><text x="400" y="250" text-anchor="middle" font-size="36" fill="white" font-family="Arial">图片占位符</text></svg>')}`;
      this.imageCache.set(cacheKey, fallbackSvg);
      return fallbackSvg;
    }
    
    this.imageCache.set(cacheKey, placeholderImage);
    return placeholderImage;
  }
  

  // 生成渐变背景占位符（当AI未提供图片URL时使用）
  private generateGradientPlaceholder(recommendation: { category: string; title: string }): string {
    try {
      // 根据类别选择不同的渐变色
      const gradients: Record<string, string[]> = {
        attraction: ['#667eea', '#764ba2', '#f093fb'], // 紫色系
        restaurant: ['#f093fb', '#f5576c', '#ffa726'], // 粉橙色系
        hotel: ['#4facfe', '#00f2fe', '#43e97b'], // 蓝绿色系
        activity: ['#fa709a', '#fee140', '#30cfd0'], // 彩虹色系
        tip: ['#a8edea', '#fed6e3', '#fbc2eb'] // 柔和色系
      };
      
      const colors = gradients[recommendation.category] || gradients.attraction;
      
      // 使用SVG生成带渐变和文字的占位图
      const width = 800;
      const height = 500;
      const categoryText = {
        attraction: '景点',
        restaurant: '餐厅',
        hotel: '酒店',
        activity: '活动',
        tip: '贴士'
      }[recommendation.category] || '推荐';
      
      // 安全地处理标题文本 - 移除特殊字符，只保留中文、英文和数字
      const safeTitle = (recommendation.title || '暂无标题').replace(/[<>&"']/g, '').substring(0, 20);
      const safeCategoryText = categoryText;
      
      // 生成更简洁的SVG，避免复杂的字符
      const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1"/><stop offset="50%" style="stop-color:${colors[1]};stop-opacity:1"/><stop offset="100%" style="stop-color:${colors[2]};stop-opacity:1"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#grad)"/><text x="50%" y="45%" text-anchor="middle" font-size="48" fill="white" opacity="0.9" font-family="Arial,sans-serif" font-weight="bold">${safeCategoryText}</text><text x="50%" y="60%" text-anchor="middle" font-size="24" fill="white" opacity="0.8" font-family="Arial,sans-serif">${safeTitle}</text></svg>`;
      
      // 将SVG转换为Data URL
      const encodedSvg = encodeURIComponent(svg);
      const dataUrl = `data:image/svg+xml,${encodedSvg}`;
      
      console.log('🎨 SVG生成详情:', {
        category: recommendation.category,
        title: recommendation.title,
        svgLength: svg.length,
        dataUrlLength: dataUrl.length
      });
      
      return dataUrl;
    } catch (error) {
      console.error('❌ SVG生成失败:', error);
      // 返回一个简单的纯色背景作为兜底
      return `data:image/svg+xml,${encodeURIComponent('<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="500" fill="#667eea"/><text x="50%" y="50%" text-anchor="middle" font-size="36" fill="white" font-family="Arial,sans-serif">图片占位符</text></svg>')}`;
    }
  }
  
  
  
  
  
  
  
  
  
  // 同步方法：根据类别获取默认图片（用于初始渲染）
  getCategoryImage(category: string, destination: string): string {
    // 使用渐变背景占位符
    const url = this.generateGradientPlaceholder({ 
      category, 
      title: `${destination} ${category}` 
    });
    console.log('🎨 [getCategoryImage] 生成兜底图片（渐变背景）');
    return url;
  }
  
  // 生成图片占位符（当图片加载失败时使用）
  getPlaceholderImage(width: number = 800, height: number = 500): string {
    // 使用渐变背景的占位符
    return `https://via.placeholder.com/${width}x${height}/e0e7ff/6366f1?text=${encodeURIComponent('旅行图片')}`;
  }
}

export const imageService = new ImageService();

