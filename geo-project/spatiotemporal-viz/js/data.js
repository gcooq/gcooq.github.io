// ============================================
// 时空数据可视化 - 数据生成模块
// 基于公开数据集模式生成（T-Drive, Geolife等）
// ============================================

// ---- 全局配置 ----
const CONFIG = {
  startHour: 6,           // 模拟开始时间（小时）
  endHour: 22,            // 模拟结束时间（小时）
  numTaxis: 130,          // 出租车数量
  cityCenter: [39.92, 116.40], // 北京市中心
  defaultZoom: 12,
};

// ---- 数据采样元信息 ----
const SAMPLING_INFO = {
  samplingDate: "2024-07-15（周一）",       // 采样日期
  timeRange: "06:00 — 22:00",                // 采样时间范围
  totalDuration: "16小时",                    // 采样总时长
  gpsInterval: "约10秒/次",                   // GPS采样间隔
  poiInterval: "全天静态",                    // POI数据粒度
  heatmapInterval: "分钟级动态更新",           // 热力图更新频率
  dataSource: "公开数据集模式生成",             // 数据来源说明
  referenceDatasets: "T-Drive (Microsoft Research), Geolife",  // 参考数据集
  generatedAt: "2026-07-23",                  // 数据生成日期
};

const TOTAL_MINUTES = (CONFIG.endHour - CONFIG.startHour) * 60; // 960分钟

// ---- POI 数据（北京真实坐标） ----
const POI_DATA = [
  // 景点
  { name: "天安门广场", lat: 39.9054, lng: 116.3976, category: "landmark", desc: "世界最大城市广场" },
  { name: "故宫博物院", lat: 39.9163, lng: 116.3972, category: "landmark", desc: "明清皇宫，世界文化遗产" },
  { name: "颐和园", lat: 39.9990, lng: 116.2755, category: "landmark", desc: "皇家园林，世界文化遗产" },
  { name: "天坛公园", lat: 39.8822, lng: 116.4066, category: "landmark", desc: "明清祭天建筑群" },
  { name: "北海公园", lat: 39.9255, lng: 116.3892, category: "landmark", desc: "皇家园林，白塔著名" },
  { name: "雍和宫", lat: 39.9470, lng: 116.4120, category: "landmark", desc: "藏传佛教寺院" },
  { name: "鸟巢", lat: 39.9928, lng: 116.3965, category: "landmark", desc: "国家体育场" },
  { name: "798艺术区", lat: 39.9847, lng: 116.4952, category: "landmark", desc: "当代艺术聚集地" },

  // 购物
  { name: "三里屯太古里", lat: 39.9337, lng: 116.4474, category: "shopping", desc: "时尚购物与夜生活中心" },
  { name: "王府井大街", lat: 39.9145, lng: 116.4104, category: "shopping", desc: "北京著名商业街" },
  { name: "西单大悦城", lat: 39.9065, lng: 116.3736, category: "shopping", desc: "年轻人购物天堂" },
  { name: "前门大街", lat: 39.8993, lng: 116.3959, category: "shopping", desc: "历史商业街区" },
  { name: "潘家园旧货市场", lat: 39.8750, lng: 116.4610, category: "shopping", desc: "全国最大旧货市场" },
  { name: "南锣鼓巷", lat: 39.9370, lng: 116.4030, category: "shopping", desc: "胡同文化体验区" },
  { name: "蓝色港湾", lat: 39.9550, lng: 116.4760, category: "shopping", desc: "朝阳公园畔购物中心" },
  { name: "SKP商场", lat: 39.9120, lng: 116.4630, category: "shopping", desc: "高端奢侈品商场" },

  // 商务
  { name: "国贸CBD", lat: 39.9080, lng: 116.4610, category: "business", desc: "北京中央商务区" },
  { name: "中关村", lat: 39.9836, lng: 116.3164, category: "business", desc: "中国硅谷，科技中心" },
  { name: "金融街", lat: 39.9180, lng: 116.3660, category: "business", desc: "国家级金融管理中心" },
  { name: "望京SOHO", lat: 39.9970, lng: 116.4700, category: "business", desc: "互联网企业聚集区" },
  { name: "五道口", lat: 39.9910, lng: 116.3380, category: "business", desc: "学院路商业中心" },
  { name: "上地信息路", lat: 40.0300, lng: 116.3100, category: "business", desc: "中关村软件园" },
  { name: "丽泽商务区", lat: 39.8560, lng: 116.3320, category: "business", desc: "新兴金融商务区" },

  // 交通
  { name: "北京南站", lat: 39.8650, lng: 116.3786, category: "transport", desc: "京沪高铁始发站" },
  { name: "北京西站", lat: 39.8950, lng: 116.3226, category: "transport", desc: "特等站，京广线始发" },
  { name: "北京站", lat: 39.9027, lng: 116.4270, category: "transport", desc: "老北京火车站" },
  { name: "北京北站", lat: 39.9450, lng: 116.3530, category: "transport", desc: "京张高铁始发站" },
  { name: "首都机场T3", lat: 40.0520, lng: 116.6100, category: "transport", desc: "国际机场航站楼" },
  { name: "东直门枢纽", lat: 39.9410, lng: 116.4340, category: "transport", desc: "交通换乘枢纽" },

  // 休闲
  { name: "后海酒吧街", lat: 39.9415, lng: 116.3830, category: "leisure", desc: "什刹海夜景酒吧区" },
  { name: "奥体中心", lat: 39.9900, lng: 116.3970, category: "leisure", desc: "奥林匹克公园" },
  { name: "朝阳公园", lat: 39.9430, lng: 116.4750, category: "leisure", desc: "城市大型公园" },
  { name: "世贸天阶", lat: 39.9130, lng: 116.4490, category: "leisure", desc: "天幕商业休闲区" },
  { name: "工体北路", lat: 39.9300, lng: 116.4450, category: "leisure", desc: "夜生活与娱乐区" },

  // 居住
  { name: "回龙观", lat: 40.0730, lng: 116.3420, category: "residential", desc: "大型居住社区" },
  { name: "天通苑", lat: 40.0750, lng: 116.4170, category: "residential", desc: "亚洲最大社区之一" },
  { name: "望京西园", lat: 40.0050, lng: 116.4600, category: "residential", desc: "大型居住区" },
  { name: "方庄小区", lat: 39.8650, lng: 116.4280, category: "residential", desc: "成熟居住社区" },
  { name: "亚运村", lat: 40.0080, lng: 116.3980, category: "residential", desc: "奥运相关居住区" },
];

// ---- POI 类别配置 ----
const POI_CATEGORIES = {
  landmark:    { name: "景点地标", icon: "\u{1F3DB}", color: "#E91E63" },
  shopping:    { name: "购物商圈", icon: "\u{1F6CD}", color: "#9C27B0" },
  business:    { name: "商务办公", icon: "\u{1F3E2}", color: "#2196F3" },
  transport:   { name: "交通枢纽", icon: "\u{1F689}", color: "#FF9800" },
  leisure:     { name: "休闲娱乐", icon: "\u{1F3A1}", color: "#4CAF50" },
  residential: { name: "居住社区", icon: "\u{1F3E0}", color: "#795548" },
};

// ---- 出租车状态配置 ----
const TAXI_STATUS = {
  occupied: { name: "载客", color: "#F44336", glow: "rgba(244,67,54,0.4)" },
  cruising: { name: "空驶", color: "#2196F3", glow: "rgba(33,150,243,0.3)" },
};

// ---- 路径生成（模拟道路轨迹） ----
function generatePath(start, end, numPoints) {
  const points = [];
  // 生成2-4个中间路径点，模拟真实道路弯折
  const numWaypoints = 2 + Math.floor(Math.random() * 3);
  const waypoints = [{ lat: start.lat, lng: start.lng }];

  for (let i = 1; i <= numWaypoints; i++) {
    const t = i / (numWaypoints + 1);
    // 基础插值 + 随机偏移模拟道路
    const offsetLat = (Math.random() - 0.5) * 0.012;
    const offsetLng = (Math.random() - 0.5) * 0.012;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * t + offsetLat,
      lng: start.lng + (end.lng - start.lng) * t + offsetLng,
    });
  }
  waypoints.push({ lat: end.lat, lng: end.lng });

  // 在路径点之间平滑插值
  const segLen = numPoints / (waypoints.length - 1);
  for (let i = 0; i < numPoints; i++) {
    const segIdx = Math.min(Math.floor(i / segLen), waypoints.length - 2);
    const segT = (i - segIdx * segLen) / segLen;
    // smoothstep 缓动
    const sT = segT * segT * (3 - 2 * segT);
    const wp1 = waypoints[segIdx];
    const wp2 = waypoints[segIdx + 1];
    points.push({
      lat: wp1.lat + (wp2.lat - wp1.lat) * sT,
      lng: wp1.lng + (wp2.lng - wp1.lng) * sT,
    });
  }
  return points;
}

// ---- 生成单辆出租车行程 ----
function generateTaxiTrips(taxiId) {
  const trips = [];
  // 错峰出发：在0-90分钟内随机开始
  let currentTick = Math.floor(Math.random() * 90);

  while (currentTick < TOTAL_MINUTES) {
    // 选择起终点 POI
    const startIdx = Math.floor(Math.random() * POI_DATA.length);
    let endIdx = Math.floor(Math.random() * POI_DATA.length);
    while (endIdx === startIdx) endIdx = Math.floor(Math.random() * POI_DATA.length);

    const startPOI = POI_DATA[startIdx];
    const endPOI = POI_DATA[endIdx];

    // 行程时长 12-40 分钟
    const duration = 12 + Math.floor(Math.random() * 28);
    const endTime = Math.min(currentTick + duration, TOTAL_MINUTES);
    const actualDuration = endTime - currentTick;
    if (actualDuration < 3) break;

    const route = generatePath(startPOI, endPOI, actualDuration);
    const isOccupied = Math.random() > 0.38;

    trips.push({
      startTime: currentTick,
      endTime: endTime,
      route: route,
      status: isOccupied ? "occupied" : "cruising",
      startPOI: startPOI.name,
      endPOI: endPOI.name,
    });

    // 行程间隔 4-14 分钟
    currentTick = endTime + 4 + Math.floor(Math.random() * 10);
  }

  return trips;
}

// ---- 生成全部出租车 ----
function generateTaxis() {
  const taxis = [];
  for (let i = 0; i < CONFIG.numTaxis; i++) {
    taxis.push({
      id: "BJ-T" + String(i + 1).padStart(4, "0"),
      trips: generateTaxiTrips(i),
    });
  }
  return taxis;
}

// ---- 获取出租车在某一时刻的位置 ----
function getTaxiPosition(taxi, currentMinute) {
  for (let i = 0; i < taxi.trips.length; i++) {
    const trip = taxi.trips[i];
    if (currentMinute >= trip.startTime && currentMinute < trip.endTime) {
      const tripDuration = trip.endTime - trip.startTime;
      const tripProgress = (currentMinute - trip.startTime) / tripDuration;
      const routeFloat = tripProgress * (trip.route.length - 1);
      const idx = Math.floor(routeFloat);
      const frac = routeFloat - idx;

      if (idx >= trip.route.length - 1) {
        const last = trip.route[trip.route.length - 1];
        return { lat: last.lat, lng: last.lng, status: trip.status, trip: trip, taxiId: taxi.id };
      }

      const p1 = trip.route[idx];
      const p2 = trip.route[idx + 1];
      return {
        lat: p1.lat + (p2.lat - p1.lat) * frac,
        lng: p1.lng + (p2.lng - p1.lng) * frac,
        status: trip.status,
        trip: trip,
        taxiId: taxi.id,
      };
    }
  }
  return null;
}

// ---- 获取某小时活跃出租车数量 ----
function getTimeDistribution(taxis) {
  const numHours = CONFIG.endHour - CONFIG.startHour;
  const dist = new Array(numHours).fill(0);
  for (const taxi of taxis) {
    for (const trip of taxi.trips) {
      const startH = Math.floor(trip.startTime / 60);
      const endH = Math.floor(trip.endTime / 60);
      for (let h = Math.max(0, startH); h <= Math.min(numHours - 1, endH); h++) {
        dist[h]++;
      }
    }
  }
  return dist;
}

// ---- POI 时段强度模型 ----
function getPOIIntensity(poi, minute) {
  const hour = CONFIG.startHour + minute / 60;
  let intensity = 0;

  switch (poi.category) {
    case "business":
      if (hour >= 8 && hour <= 19) {
        intensity = 0.45;
        if (hour >= 8.5 && hour <= 9.5) intensity = 0.9;
        if (hour >= 12 && hour <= 13) intensity = 0.6;
        if (hour >= 17.5 && hour <= 18.5) intensity = 0.95;
      }
      break;
    case "shopping":
      if (hour >= 10 && hour <= 21) {
        intensity = 0.35 + 0.25 * Math.sin(((hour - 10) / 11) * Math.PI);
        if (hour >= 14 && hour <= 16) intensity = 0.65;
        if (hour >= 19 && hour <= 21) intensity = 0.8;
      }
      break;
    case "leisure":
      if (hour >= 18 && hour <= 22) {
        intensity = 0.55 + 0.35 * ((hour - 18) / 4);
      } else if (hour >= 10 && hour < 18) {
        intensity = 0.3;
      }
      break;
    case "transport":
      if (hour >= 7 && hour <= 9.5) intensity = 0.85;
      else if (hour >= 17 && hour <= 19.5) intensity = 0.9;
      else if (hour >= 10 && hour <= 16) intensity = 0.4;
      else if (hour >= 20 && hour <= 22) intensity = 0.5;
      else if (hour >= 6 && hour < 7) intensity = 0.3;
      break;
    case "landmark":
      if (hour >= 9 && hour <= 17) {
        intensity = 0.45 + 0.2 * Math.sin(((hour - 9) / 8) * Math.PI);
      } else if (hour >= 17 && hour <= 19) {
        intensity = 0.3;
      }
      break;
    case "residential":
      if (hour >= 6 && hour <= 8) intensity = 0.6;
      else if (hour >= 18 && hour <= 22) intensity = 0.75;
      else if (hour >= 8 && hour < 18) intensity = 0.2;
      else intensity = 0.35;
      break;
  }
  return intensity;
}

// ---- 生成热力图数据 ----
function getHeatmapData(taxis, currentMinute) {
  const points = [];
  // 出租车位置热力点
  for (const taxi of taxis) {
    const pos = getTaxiPosition(taxi, currentMinute);
    if (pos) {
      const w = pos.status === "occupied" ? 0.9 : 0.45;
      points.push([pos.lat, pos.lng, w]);
    }
  }
  // POI 时段热力点
  for (const poi of POI_DATA) {
    const intensity = getPOIIntensity(poi, currentMinute);
    if (intensity > 0.15) {
      points.push([poi.lat, poi.lng, intensity * 0.8]);
    }
  }
  return points;
}

// ---- 初始化全部数据 ----
const TAXIS = generateTaxis();
const TIME_DIST = getTimeDistribution(TAXIS);

// 数据集说明（用于UI展示）
const DATA_SOURCES = [
  { name: "出租车轨迹数据", source: "基于 T-Drive (Microsoft Research) 数据集模式生成", detail: "模拟北京出租车GPS轨迹，含载客/空驶状态" },
  { name: "POI 兴趣点数据", source: "北京真实地理坐标", detail: "38个主要兴趣点，6大类别" },
  { name: "时空热力图", source: "基于时段活动模型生成", detail: "反映不同区域在不同时段的活跃度变化" },
  { name: "底图服务", source: "高德地图 (AutoNavi)", detail: "标准道路地图瓦片" },
];
