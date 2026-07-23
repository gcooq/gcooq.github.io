// ============================================
// 成都时空数据可视化 - 数据生成模块
// 数据类型：POI / 地铁站 / 出租车轨迹 / 签到 / 天气 / 时空流动
// ============================================

// ---- 全局配置 ----
var CONFIG = {
  city: "成都",
  cityCenter: [30.5728, 104.0668],
  startHour: 6,
  endHour: 23,
  numTaxis: 150,
  numCheckins: 600,
  defaultZoom: 12,
};

// ---- 数据采样元信息 ----
var SAMPLING_INFO = {
  samplingDate: "2024-07-15（周一）",       // 采样日期
  timeRange: "06:00 — 23:00",                // 采样时间范围
  totalDuration: "17小时",                    // 采样总时长
  gpsInterval: "约10秒/次",                   // GPS采样间隔
  checkinInterval: "分钟级聚合",               // 签到数据粒度
  weatherInterval: "每1-2小时",               // 天气数据间隔
  flowInterval: "小时级时段",                  // 流动数据粒度
  dataSource: "公开数据集模式生成",             // 数据来源说明
  referenceDatasets: "T-Drive, Geolife, Brightkite",  // 参考数据集
  generatedAt: "2026-07-23",                  // 数据生成日期
};

var TOTAL_MINUTES = (CONFIG.endHour - CONFIG.startHour) * 60; // 1020分钟

// ============================================
// 一、POI 数据（成都真实坐标）
// ============================================
var POI_DATA = [
  // 景点地标
  { name: "天府广场", lat: 30.6571, lng: 104.0653, category: "landmark", desc: "成都城市中心地标" },
  { name: "武侯祠", lat: 30.6421, lng: 104.0484, category: "landmark", desc: "三国圣地，全国重点文保" },
  { name: "锦里古街", lat: 30.6418, lng: 104.0477, category: "landmark", desc: "成都版清明上河图" },
  { name: "宽窄巷子", lat: 30.6711, lng: 104.0558, category: "landmark", desc: "清代老街，成都名片" },
  { name: "大熊猫繁育基地", lat: 30.7327, lng: 104.1370, category: "landmark", desc: "世界级大熊猫保护基地" },
  { name: "杜甫草堂", lat: 30.6585, lng: 104.0227, category: "landmark", desc: "诗圣杜甫故居" },
  { name: "青羊宫", lat: 30.6677, lng: 104.0346, category: "landmark", desc: "川西第一道观" },
  { name: "文殊院", lat: 30.6776, lng: 104.0642, category: "landmark", desc: "长江流域四大禅林之一" },
  { name: "望江楼公园", lat: 30.6430, lng: 104.0903, category: "landmark", desc: "薛涛纪念地，竹文化公园" },
  { name: "人民公园", lat: 30.6593, lng: 104.0576, category: "landmark", desc: "成都最早的公园，鹤鸣茶社" },
  { name: "东郊记忆", lat: 30.6720, lng: 104.1160, category: "landmark", desc: "工业遗产改造文创园" },
  { name: "四川博物院", lat: 30.6545, lng: 104.0185, category: "landmark", desc: "西南最大综合性博物馆" },

  // 购物商圈
  { name: "春熙路", lat: 30.6538, lng: 104.0817, category: "shopping", desc: "成都最繁华商业街" },
  { name: "远洋太古里", lat: 30.6516, lng: 104.0846, category: "shopping", desc: "开放式低密度街区购物中心" },
  { name: "IFS国际金融中心", lat: 30.6545, lng: 104.0820, category: "shopping", desc: "高端购物中心，爬墙熊猫" },
  { name: "万达广场(锦华)", lat: 30.6200, lng: 104.0800, category: "shopping", desc: "大型商业综合体" },
  { name: "万象城", lat: 30.6630, lng: 104.1200, category: "shopping", desc: "城东旗舰商业体" },
  { name: "来福士广场", lat: 30.6400, lng: 104.0550, category: "shopping", desc: "Steven Holl设计建筑" },
  { name: "银泰中心in99", lat: 30.5850, lng: 104.0650, category: "shopping", desc: "城南高端商业体" },
  { name: "大悦城", lat: 30.6150, lng: 104.0350, category: "shopping", desc: "主题公园式购物中心" },

  // 美食
  { name: "建设路小吃街", lat: 30.6700, lng: 104.1080, category: "food", desc: "成都网红美食街" },
  { name: "玉林路美食区", lat: 30.6230, lng: 104.0730, category: "food", desc: "赵雷《成都》原型地" },
  { name: "魁星楼街", lat: 30.6650, lng: 104.0680, category: "food", desc: "网红美食聚集地" },
  { name: "香香巷", lat: 30.6580, lng: 104.0950, category: "food", desc: "隐秘美食巷" },
  { name: "祥和里", lat: 30.6680, lng: 104.1050, category: "food", desc: "老成都味道美食街" },

  // 商务办公
  { name: "天府软件园", lat: 30.5453, lng: 104.0647, category: "business", desc: "中国最大专业软件园之一" },
  { name: "世纪城新会展", lat: 30.5472, lng: 104.0776, category: "business", desc: "西部最大会展中心" },
  { name: "金融城", lat: 30.5800, lng: 104.0700, category: "business", desc: "成都金融总部商务区" },
  { name: "高新区孵化园", lat: 30.5750, lng: 104.0683, category: "business", desc: "科技企业孵化基地" },
  { name: "天府国际金融中心", lat: 30.5850, lng: 104.0750, category: "business", desc: "双塔地标写字楼" },

  // 交通枢纽
  { name: "成都东站", lat: 30.6304, lng: 104.1379, category: "transport", desc: "西南最大铁路客运站" },
  { name: "成都南站", lat: 30.6100, lng: 104.0720, category: "transport", desc: "城际高铁站" },
  { name: "成都西站", lat: 30.6830, lng: 103.9880, category: "transport", desc: "川藏铁路始发站" },
  { name: "双流国际机场T2", lat: 30.5785, lng: 103.9471, category: "transport", desc: "中国第四大航空枢纽" },
  { name: "天府国际机场", lat: 30.3121, lng: 104.4415, category: "transport", desc: "国家级国际航空枢纽" },
  { name: "成都站(火车北站)", lat: 30.6925, lng: 104.0667, category: "transport", desc: "特等站，宝成线枢纽" },

  // 休闲娱乐
  { name: "九眼桥酒吧街", lat: 30.6485, lng: 104.0850, category: "leisure", desc: "成都夜生活名片" },
  { name: "兰桂坊成都", lat: 30.6530, lng: 104.0900, category: "leisure", desc: "时尚娱乐综合体" },
  { name: "339电视塔", lat: 30.6770, lng: 104.1000, category: "leisure", desc: "四川广播电视塔" },
  { name: "锦江夜景带", lat: 30.6500, lng: 104.0870, category: "leisure", desc: "夜游锦江观光带" },
  { name: "天府绿道", lat: 30.5600, lng: 104.0500, category: "leisure", desc: "世界级城市绿道系统" },

  // 居住社区
  { name: "华阳片区", lat: 30.5080, lng: 104.0700, category: "residential", desc: "城南大型居住区" },
  { name: "犀浦片区", lat: 30.7498, lng: 103.9787, category: "residential", desc: "城西大学城居住区" },
  { name: "大源社区", lat: 30.5400, lng: 104.0600, category: "residential", desc: "高新南区居住组团" },
  { name: "中和片区", lat: 30.5300, lng: 104.0800, category: "residential", desc: "锦江以南居住区" },
  { name: "光华大道片区", lat: 30.6700, lng: 104.0100, category: "residential", desc: "城西新城居住带" },
];

// ---- POI 类别配置 ----
var POI_CATEGORIES = {
  landmark:    { name: "景点地标", icon: "\u{1F3DB}", color: "#E91E63" },
  shopping:    { name: "购物商圈", icon: "\u{1F6CD}", color: "#9C27B0" },
  food:        { name: "美食街区", icon: "\u{1F35C}", color: "#FF5722" },
  business:    { name: "商务办公", icon: "\u{1F3E2}", color: "#2196F3" },
  transport:   { name: "交通枢纽", icon: "\u{1F689}", color: "#FF9800" },
  leisure:     { name: "休闲娱乐", icon: "\u{1F3A1}", color: "#4CAF50" },
  residential: { name: "居住社区", icon: "\u{1F3E0}", color: "#795548" },
};

// ============================================
// 二、地铁站点数据（成都真实线路）
// ============================================
var METRO_LINES = {
  1:  { name: "1号线", color: "#004EA2" },
  2:  { name: "2号线", color: "#E97D1F" },
  3:  { name: "3号线", color: "#9B5D8C" },
  4:  { name: "4号线", color: "#008C95" },
  5:  { name: "5号线", color: "#8FCCE9" },
  6:  { name: "6号线", color: "#A78B5A" },
  7:  { name: "7号线", color: "#D2228A" },
  10: { name: "10号线", color: "#722F89" },
  18: { name: "18号线", color: "#8E3D13" },
};

var METRO_STATIONS = [
  // 1号线
  { name: "火车北站", lat: 30.6925, lng: 104.0667, lines: [1, 7] },
  { name: "人民北路", lat: 30.6800, lng: 104.0660, lines: [1, 6] },
  { name: "文殊院", lat: 30.6776, lng: 104.0642, lines: [1] },
  { name: "骡马市", lat: 30.6665, lng: 104.0653, lines: [1, 4] },
  { name: "天府广场", lat: 30.6571, lng: 104.0653, lines: [1, 2] },
  { name: "锦江宾馆", lat: 30.6500, lng: 104.0620, lines: [1] },
  { name: "华西坝", lat: 30.6400, lng: 104.0600, lines: [1] },
  { name: "省体育馆", lat: 30.6300, lng: 104.0650, lines: [1, 3] },
  { name: "倪家桥", lat: 30.6200, lng: 104.0670, lines: [1] },
  { name: "火车南站", lat: 30.6100, lng: 104.0720, lines: [1, 7, 18] },
  { name: "高新", lat: 30.5950, lng: 104.0680, lines: [1] },
  { name: "金融城", lat: 30.5800, lng: 104.0700, lines: [1] },
  { name: "孵化园", lat: 30.5750, lng: 104.0683, lines: [1, 9, 18] },
  { name: "世纪城", lat: 30.5472, lng: 104.0776, lines: [1, 18] },
  { name: "华阳", lat: 30.5080, lng: 104.0700, lines: [1] },
  { name: "海昌路", lat: 30.5162, lng: 104.0772, lines: [1, 18] },

  // 2号线
  { name: "犀浦", lat: 30.7498, lng: 103.9787, lines: [2, 6] },
  { name: "茶店子客运站", lat: 30.6900, lng: 104.0350, lines: [2] },
  { name: "一品天下", lat: 30.6750, lng: 104.0450, lines: [2, 7] },
  { name: "中医大省医院", lat: 30.6600, lng: 104.0550, lines: [2, 4, 5] },
  { name: "人民公园", lat: 30.6593, lng: 104.0576, lines: [2] },
  { name: "春熙路", lat: 30.6538, lng: 104.0817, lines: [2, 3] },
  { name: "东门大桥", lat: 30.6550, lng: 104.0900, lines: [2] },
  { name: "牛王庙", lat: 30.6560, lng: 104.0950, lines: [2, 6] },
  { name: "成都东客站", lat: 30.6304, lng: 104.1379, lines: [2, 7] },

  // 3号线
  { name: "熊猫大道", lat: 30.7150, lng: 104.1300, lines: [3] },
  { name: "动物园", lat: 30.7100, lng: 104.1200, lines: [3] },
  { name: "前锋路", lat: 30.6800, lng: 104.0850, lines: [3, 6] },
  { name: "市二医院", lat: 30.6678, lng: 104.0826, lines: [3, 4] },
  { name: "新南门", lat: 30.6480, lng: 104.0830, lines: [3] },
  { name: "高升桥", lat: 30.6200, lng: 104.0500, lines: [3, 5] },
  { name: "太平园", lat: 30.6100, lng: 104.0350, lines: [3, 7, 10] },

  // 4号线
  { name: "中坝", lat: 30.6719, lng: 104.0270, lines: [4] },
  { name: "文化宫", lat: 30.6683, lng: 104.0500, lines: [4, 7] },
  { name: "宽窄巷子", lat: 30.6711, lng: 104.0558, lines: [4] },
  { name: "太升南路", lat: 30.6680, lng: 104.0700, lines: [4] },
  { name: "万年场", lat: 30.6600, lng: 104.1150, lines: [4] },

  // 5号线
  { name: "大丰", lat: 30.7250, lng: 104.0500, lines: [5] },
  { name: "北站西二路", lat: 30.6850, lng: 104.0600, lines: [5, 7] },
  { name: "青羊宫", lat: 30.6677, lng: 104.0346, lines: [5] },
  { name: "大源", lat: 30.5400, lng: 104.0600, lines: [5] },

  // 6号线
  { name: "梓潼宫", lat: 30.7400, lng: 104.0000, lines: [6] },
  { name: "三官堂", lat: 30.6400, lng: 104.0800, lines: [6] },
  { name: "琉璃场", lat: 30.6200, lng: 104.0900, lines: [6] },

  // 7号线（环线）
  { name: "驷马桥", lat: 30.6950, lng: 104.1000, lines: [7] },
  { name: "成都东客站(7)", lat: 30.6310, lng: 104.1380, lines: [7] },
  { name: "三瓦窑", lat: 30.6000, lng: 104.0800, lines: [7] },
  { name: "神仙树", lat: 30.6000, lng: 104.0500, lines: [5, 7] },

  // 10号线
  { name: "双流机场1航站楼", lat: 30.5720, lng: 103.9420, lines: [10] },
  { name: "双流机场2航站楼", lat: 30.5792, lng: 103.9552, lines: [10] },
  { name: "双流西站", lat: 30.5600, lng: 103.9200, lines: [3, 10] },

  // 18号线
  { name: "西博城", lat: 30.4923, lng: 104.0781, lines: [1, 6, 18] },
  { name: "天府新站", lat: 30.4550, lng: 104.0900, lines: [1, 18] },
  { name: "天府机场1号航站楼", lat: 30.3121, lng: 104.4415, lines: [18] },
];

// ============================================
// 三、天气时间线（成都夏季典型天气）
// ============================================
var WEATHER_TIMELINE = [
  { minute: 0,   temp: 22, condition: "雾",   humidity: 88, wind: 1.2, icon: "\u{1F32B}", rain: 0 },
  { minute: 60,  temp: 23, condition: "多云", humidity: 78, wind: 1.5, icon: "\u{26C5}", rain: 0 },
  { minute: 150, temp: 26, condition: "多云", humidity: 70, wind: 2.0, icon: "\u{26C5}", rain: 0 },
  { minute: 240, temp: 29, condition: "晴",   humidity: 58, wind: 2.5, icon: "\u{2600}", rain: 0 },
  { minute: 360, temp: 32, condition: "晴",   humidity: 52, wind: 2.8, icon: "\u{2600}", rain: 0 },
  { minute: 450, temp: 33, condition: "多云", humidity: 60, wind: 3.0, icon: "\u{26C5}", rain: 0 },
  { minute: 540, temp: 31, condition: "雷阵雨",humidity: 75, wind: 4.5, icon: "\u{26C8}", rain: 0.6 },
  { minute: 630, temp: 28, condition: "阵雨", humidity: 82, wind: 3.5, icon: "\u{1F327}", rain: 0.8 },
  { minute: 720, temp: 26, condition: "小雨", humidity: 85, wind: 2.5, icon: "\u{1F327}", rain: 0.5 },
  { minute: 840, temp: 24, condition: "阴",   humidity: 78, wind: 2.0, icon: "\u{2601}", rain: 0 },
  { minute: 960, temp: 23, condition: "阴",   humidity: 80, wind: 1.5, icon: "\u{2601}", rain: 0 },
];

function getWeather(minute) {
  var w = WEATHER_TIMELINE[0];
  for (var i = 0; i < WEATHER_TIMELINE.length; i++) {
    if (WEATHER_TIMELINE[i].minute <= minute) {
      w = WEATHER_TIMELINE[i];
    } else break;
  }
  // 线性插值温度
  var nextW = null;
  for (var j = 0; j < WEATHER_TIMELINE.length; j++) {
    if (WEATHER_TIMELINE[j].minute > minute) { nextW = WEATHER_TIMELINE[j]; break; }
  }
  var temp = w.temp;
  if (nextW) {
    var ratio = (minute - w.minute) / (nextW.minute - w.minute);
    temp = w.temp + (nextW.temp - w.temp) * ratio;
  }
  return { temp: Math.round(temp * 10) / 10, condition: w.condition, humidity: w.humidity, wind: w.wind, icon: w.icon, rain: w.rain };
}

// ============================================
// 四、出租车轨迹生成
// ============================================
var TAXI_STATUS = {
  occupied: { name: "载客", color: "#F44336", glow: "rgba(244,67,54,0.4)" },
  cruising: { name: "空驶", color: "#2196F3", glow: "rgba(33,150,243,0.3)" },
};

function generatePath(start, end, numPoints) {
  var points = [];
  var numWaypoints = 2 + Math.floor(Math.random() * 3);
  var waypoints = [{ lat: start.lat, lng: start.lng }];
  for (var i = 1; i <= numWaypoints; i++) {
    var t = i / (numWaypoints + 1);
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.012,
      lng: start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.012,
    });
  }
  waypoints.push({ lat: end.lat, lng: end.lng });
  var segLen = numPoints / (waypoints.length - 1);
  for (var j = 0; j < numPoints; j++) {
    var segIdx = Math.min(Math.floor(j / segLen), waypoints.length - 2);
    var segT = (j - segIdx * segLen) / segLen;
    var sT = segT * segT * (3 - 2 * segT);
    var wp1 = waypoints[segIdx], wp2 = waypoints[segIdx + 1];
    points.push({
      lat: wp1.lat + (wp2.lat - wp1.lat) * sT,
      lng: wp1.lng + (wp2.lng - wp1.lng) * sT,
    });
  }
  return points;
}

function generateTaxiTrips(taxiId) {
  var trips = [];
  var currentTick = Math.floor(Math.random() * 90);
  while (currentTick < TOTAL_MINUTES) {
    var startIdx = Math.floor(Math.random() * POI_DATA.length);
    var endIdx = Math.floor(Math.random() * POI_DATA.length);
    while (endIdx === startIdx) endIdx = Math.floor(Math.random() * POI_DATA.length);
    var startPOI = POI_DATA[startIdx], endPOI = POI_DATA[endIdx];
    var duration = 12 + Math.floor(Math.random() * 28);
    var endTime = Math.min(currentTick + duration, TOTAL_MINUTES);
    var actualDuration = endTime - currentTick;
    if (actualDuration < 3) break;
    var route = generatePath(startPOI, endPOI, actualDuration);
    var w = getWeather(currentTick);
    // 下雨天载客率更高
    var occupiedThreshold = w.rain > 0.3 ? 0.25 : 0.38;
    var isOccupied = Math.random() > occupiedThreshold;
    trips.push({
      startTime: currentTick, endTime: endTime, route: route,
      status: isOccupied ? "occupied" : "cruising",
      startPOI: startPOI.name, endPOI: endPOI.name,
    });
    currentTick = endTime + 4 + Math.floor(Math.random() * 10);
  }
  return trips;
}

function generateTaxis() {
  var taxis = [];
  for (var i = 0; i < CONFIG.numTaxis; i++) {
    taxis.push({ id: "CD-T" + String(i + 1).padStart(4, "0"), trips: generateTaxiTrips(i) });
  }
  return taxis;
}

function getTaxiPosition(taxi, currentMinute) {
  for (var i = 0; i < taxi.trips.length; i++) {
    var trip = taxi.trips[i];
    if (currentMinute >= trip.startTime && currentMinute < trip.endTime) {
      var tripDuration = trip.endTime - trip.startTime;
      var tripProgress = (currentMinute - trip.startTime) / tripDuration;
      var routeFloat = tripProgress * (trip.route.length - 1);
      var idx = Math.floor(routeFloat);
      var frac = routeFloat - idx;
      if (idx >= trip.route.length - 1) {
        var last = trip.route[trip.route.length - 1];
        return { lat: last.lat, lng: last.lng, status: trip.status, trip: trip, taxiId: taxi.id };
      }
      var p1 = trip.route[idx], p2 = trip.route[idx + 1];
      return {
        lat: p1.lat + (p2.lat - p1.lat) * frac,
        lng: p1.lng + (p2.lng - p1.lng) * frac,
        status: trip.status, trip: trip, taxiId: taxi.id,
      };
    }
  }
  return null;
}

// ============================================
// 五、签到数据生成（社交签到）
// ============================================
function getPOICheckinWeight(poi, hour) {
  var w = 0;
  switch (poi.category) {
    case "food":
      if (hour >= 11 && hour <= 14) w = 0.9;
      else if (hour >= 17 && hour <= 21) w = 0.95;
      else if (hour >= 9 && hour < 11) w = 0.3;
      else w = 0.15;
      break;
    case "shopping":
      if (hour >= 13 && hour <= 22) w = 0.7 + 0.2 * Math.sin((hour - 13) / 9 * Math.PI);
      else w = 0.1;
      break;
    case "landmark":
      if (hour >= 9 && hour <= 17) w = 0.6 + 0.2 * Math.sin((hour - 9) / 8 * Math.PI);
      else w = 0.05;
      break;
    case "leisure":
      if (hour >= 19 && hour <= 23) w = 0.8;
      else if (hour >= 14 && hour < 19) w = 0.4;
      else w = 0.1;
      break;
    case "business":
      if (hour >= 8 && hour <= 18) w = 0.4;
      else w = 0.05;
      break;
    case "transport":
      if (hour >= 7 && hour <= 9.5) w = 0.7;
      else if (hour >= 17 && hour <= 19.5) w = 0.75;
      else w = 0.3;
      break;
    case "residential":
      if (hour >= 6 && hour <= 8) w = 0.4;
      else if (hour >= 18 && hour <= 23) w = 0.5;
      else w = 0.1;
      break;
  }
  // 下雨天室内POI签到增加
  var weather = getWeather((hour - CONFIG.startHour) * 60);
  if (weather.rain > 0.3) {
    if (poi.category === "food" || poi.category === "shopping") w *= 1.2;
    if (poi.category === "landmark" || poi.category === "leisure") w *= 0.6;
  }
  return w;
}

function generateCheckins() {
  var checkins = [];
  for (var i = 0; i < CONFIG.numCheckins; i++) {
    // 按权重选择POI
    var hour = CONFIG.startHour + Math.random() * (CONFIG.endHour - CONFIG.startHour);
    var candidates = [];
    var totalWeight = 0;
    for (var j = 0; j < POI_DATA.length; j++) {
      var w = getPOICheckinWeight(POI_DATA[j], hour);
      candidates.push({ poi: POI_DATA[j], weight: w });
      totalWeight += w;
    }
    var r = Math.random() * totalWeight;
    var acc = 0;
    var selected = candidates[0].poi;
    for (var k = 0; k < candidates.length; k++) {
      acc += candidates[k].weight;
      if (r <= acc) { selected = candidates[k].poi; break; }
    }
    // 签到位置在POI附近随机偏移
    var offsetLat = (Math.random() - 0.5) * 0.003;
    var offsetLng = (Math.random() - 0.5) * 0.003;
    checkins.push({
      lat: selected.lat + offsetLat,
      lng: selected.lng + offsetLng,
      minute: Math.floor((hour - CONFIG.startHour) * 60),
      poiName: selected.name,
      category: selected.category,
      user: "U" + Math.floor(Math.random() * 9000 + 1000),
    });
  }
  checkins.sort(function (a, b) { return a.minute - b.minute; });
  return checkins;
}

// ============================================
// 六、时空流动路线（城市主要流向）
// ============================================
var FLOW_ROUTES = [
  // 早高峰：居住 → 商务
  { from: "华阳片区", to: "天府软件园", startH: 7, endH: 10, color: "#2196F3" },
  { from: "犀浦片区", to: "天府广场", startH: 7, endH: 10, color: "#2196F3" },
  { from: "大源社区", to: "金融城", startH: 7, endH: 10, color: "#2196F3" },
  { from: "光华大道片区", to: "骡马市", startH: 7, endH: 10, color: "#2196F3" },
  // 全天：交通枢纽 → 市区
  { from: "成都东站", to: "春熙路", startH: 7, endH: 21, color: "#FF9800" },
  { from: "双流国际机场T2", to: "天府广场", startH: 7, endH: 21, color: "#FF9800" },
  // 晚高峰：商务 → 休闲
  { from: "天府软件园", to: "九眼桥酒吧街", startH: 17, endH: 20, color: "#4CAF50" },
  { from: "金融城", to: "玉林路美食区", startH: 17, endH: 20, color: "#4CAF50" },
  { from: "高新区孵化园", to: "远洋太古里", startH: 17, endH: 20, color: "#4CAF50" },
  // 晚间：美食区流动
  { from: "春熙路", to: "建设路小吃街", startH: 18, endH: 22, color: "#FF5722" },
  { from: "宽窄巷子", to: "魁星楼街", startH: 18, endH: 22, color: "#FF5722" },
];

function getFlowRoutes(currentMinute) {
  var hour = CONFIG.startHour + currentMinute / 60;
  var active = [];
  for (var i = 0; i < FLOW_ROUTES.length; i++) {
    var r = FLOW_ROUTES[i];
    if (hour >= r.startH && hour <= r.endH) {
      var fromPoi = null, toPoi = null;
      for (var j = 0; j < POI_DATA.length; j++) {
        if (POI_DATA[j].name === r.from) fromPoi = POI_DATA[j];
        if (POI_DATA[j].name === r.to) toPoi = POI_DATA[j];
      }
      if (fromPoi && toPoi) {
        active.push({ from: fromPoi, to: toPoi, color: r.color, name: r.from + " \u2192 " + r.to });
      }
    }
  }
  return active;
}

// ============================================
// 七、热力图数据
// ============================================
function getHeatmapData(taxis, checkins, currentMinute) {
  var points = [];
  // 出租车热力
  for (var i = 0; i < taxis.length; i++) {
    var pos = getTaxiPosition(taxis[i], currentMinute);
    if (pos) {
      points.push([pos.lat, pos.lng, pos.status === "occupied" ? 0.9 : 0.45]);
    }
  }
  // 签到热力
  for (var j = 0; j < checkins.length; j++) {
    if (Math.abs(checkins[j].minute - currentMinute) < 15) {
      var w = 0.6 * (1 - Math.abs(checkins[j].minute - currentMinute) / 15);
      points.push([checkins[j].lat, checkins[j].lng, w]);
    }
  }
  // 地铁站热力（基于时段）
  var hour = CONFIG.startHour + currentMinute / 60;
  for (var k = 0; k < METRO_STATIONS.length; k++) {
    var intensity = 0.2;
    if ((hour >= 7 && hour <= 9.5) || (hour >= 17 && hour <= 19.5)) intensity = 0.7;
    else if (hour >= 10 && hour <= 16) intensity = 0.35;
    else if (hour >= 20 && hour <= 23) intensity = 0.45;
    if (METRO_STATIONS[k].lines.length > 1) intensity *= 1.3;
    points.push([METRO_STATIONS[k].lat, METRO_STATIONS[k].lng, intensity]);
  }
  return points;
}

// ============================================
// 八、时段分布
// ============================================
function getTimeDistribution(taxis) {
  var numHours = CONFIG.endHour - CONFIG.startHour;
  var dist = new Array(numHours).fill(0);
  for (var i = 0; i < taxis.length; i++) {
    for (var j = 0; j < taxis[i].trips.length; j++) {
      var trip = taxis[i].trips[j];
      var sH = Math.floor(trip.startTime / 60);
      var eH = Math.floor(trip.endTime / 60);
      for (var h = Math.max(0, sH); h <= Math.min(numHours - 1, eH); h++) dist[h]++;
    }
  }
  return dist;
}

// ============================================
// 九、初始化全部数据
// ============================================
var TAXIS = generateTaxis();
var CHECKINS = generateCheckins();
var TIME_DIST = getTimeDistribution(TAXIS);

// 数据集说明
var DATA_SOURCES = [
  { icon: "\u{1F695}", name: "出租车轨迹", source: "基于成都出租车GPS模式生成，含天气影响", detail: CONFIG.numTaxis + "辆车，载客/空驶状态" },
  { icon: "\u{1F4CD}", name: "POI兴趣点", source: "成都真实地理坐标", detail: POI_DATA.length + "个兴趣点，7大类别" },
  { icon: "\u{1F687}", name: "地铁站点", source: "成都地铁真实线路数据", detail: METRO_STATIONS.length + "个站点，9条线路" },
  { icon: "\u{1F4E2}", name: "签到数据", source: "基于时段-POI权重模型生成", detail: CONFIG.numCheckins + "条签到记录" },
  { icon: "\u{1F326}", name: "天气数据", source: "成都夏季典型天气模拟", detail: WEATHER_TIMELINE.length + "个时段，含降雨影响" },
  { icon: "\u{1F310}", name: "时空流动", source: "城市主要流向路线", detail: FLOW_ROUTES.length + "条流线" },
  { icon: "\u{1F5FA}", name: "底图服务", source: "高德地图 (AutoNavi)", detail: "标准道路地图瓦片" },
];
