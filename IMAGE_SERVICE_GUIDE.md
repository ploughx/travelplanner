# 图片服务使用指南

## 📸 图片显示策略

### 策略1：渐变背景占位符（备选方案）✅
- 如果AI没有提供图片URL，系统会自动生成美观的渐变背景占位符
- 占位符会根据推荐类别使用不同的颜色主题：
  - 🏛️ 景点：紫色系
  - 🍽️ 餐厅：粉橙色系
  - 🏨 酒店：蓝绿色系
  - 🎯 活动：彩虹色系
  - 💡 贴士：柔和色系
- 占位符上会显示类别图标和推荐名称

## 🎨 渐变背景示例

当AI未提供图片URL时，您会看到类似这样的美观占位符：

```
┌─────────────────────────────────────┐
│                                     │
│     [紫色到粉色的渐变背景]           │
│                                     │
│          🏛️ 景点                    │
│         故宫博物院                   │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 如何确保图片正常显示
### 方法：使用渐变背景占位符✅

如果AI没有提供图片URL，系统会自动使用渐变背景占位符，无需任何配置。

## 🔧 技术实现

### 图片服务（imageService.ts）

```typescript
// 策略1: 如果推荐中已包含图片URL，直接使用
if (recommendation.imageUrl) {
  return recommendation.imageUrl;
}

// 策略2: 使用渐变背景占位符
return this.generateGradientPlaceholder(recommendation);
```

### 渐变背景生成

使用SVG生成带渐变和文字的占位图：

```typescript
private generateGradientPlaceholder(recommendation: { category: string; title: string }): string {
  // 根据类别选择不同的渐变色
  const gradients: Record<string, string[]> = {
    attraction: ['#667eea', '#764ba2', '#f093fb'], // 紫色系
    restaurant: ['#f093fb', '#f5576c', '#ffa726'], // 粉橙色系
    hotel: ['#4facfe', '#00f2fe', '#43e97b'], // 蓝绿色系
    activity: ['#fa709a', '#fee140', '#30cfd0'], // 彩虹色系
    tip: ['#a8edea', '#fed6e3', '#fbc2eb'] // 柔和色系
  };
  
  // 生成SVG并转换为Data URL
  // ...
}
```

## 📊 调试日志

在浏览器控制台中，您可以看到详细的图片加载日志：

```
🖼️ 获取图片: {destination: "北京", title: "故宫博物院", category: "attraction"}
✅ 使用AI提供的图片URL: https://images.unsplash.com/...
✅ [TravelPlanView] 图片服务返回URL: https://images.unsplash.com/...
✅ [TravelPlanView] 图片加载成功: https://images.unsplash.com/...
```

或者：

```
🖼️ 获取图片: {destination: "北京", title: "故宫博物院", category: "attraction"}
⚠️ AI未提供图片URL，使用渐变背景占位符
✅ 生成占位符图片: data:image/svg+xml,...
```

## ⚠️ 已移除的功能

以下外部图片API已被移除，不再使用：
- ❌ Unsplash API
- ❌ Pexels API
- ❌ Picsum Photos
- ❌ 百度地图POI图片

**现在完全依赖AI提供图片URL，或使用渐变背景占位符。**

## 🎯 最佳实践

1. **确保AI返回imageUrl**：在AI prompt中明确要求AI为每个推荐提供真实的图片URL
2. **接受渐变背景**：如果AI偶尔未提供图片，渐变背景占位符也很美观
3. **监控控制台日志**：如果图片显示有问题，查看控制台日志可以快速定位原因

## 📝 示例

### 完整的推荐对象（带图片URL）

```json
{
  "recommendations": [
    {
      "category": "attraction",
      "title": "故宫博物院",
      "description": "明清两朝皇宫，世界文化遗产",
      "location": "北京市东城区景山前街4号",
      "rating": 4.8,
      "imageUrl": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800"
    },
    {
      "category": "restaurant",
      "title": "全聚德烤鸭店",
      "description": "百年老字号，正宗北京烤鸭",
      "location": "全聚德前门店",
      "rating": 4.5,
      "imageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800"
    }
  ]
}
```

---

**总结**：现在的图片服务非常简单、可靠，完全依赖AI提供图片URL，如果AI未提供，则使用美观的渐变背景占位符。无需配置任何外部API！✅

