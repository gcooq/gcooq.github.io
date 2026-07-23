// ============================================
// 成都时空数据可视化 - 主应用逻辑
// ============================================

(function () {
  "use strict";

  // ---- 全局状态 ----
  var state = {
    currentMinute: 0,
    isPlaying: false,
    speed: 1,
    lastFrameTime: 0,
    heatAccum: 0,
    flowAccum: 0,
    checkinIndex: 0,
    activeTaxis: {},
    taxiTrail: {},
    activeCheckins: [],
    activeFlows: [],
    layers: {
      taxis: true,
      pois: true,
      metro: true,
      heatmap: true,
      checkins: true,
      flows: true,
      trails: false,
    },
    stats: { activeTaxis: 0, occupied: 0, cruising: 0, checkins: 0, flows: 0 },
  };

  var TRAIL_MAX = 10;
  var CHECKIN_DISPLAY_MS = 3000; // 签到标记显示时长

  // ---- 初始化地图 ----
  var map = L.map("map", {
    center: CONFIG.cityCenter,
    zoom: CONFIG.defaultZoom,
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false,
  });

  // 高德地图标准底图
  L.tileLayer(
    "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    { subdomains: ["1", "2", "3", "4"], maxZoom: 18 }
  ).addTo(map);

  // ---- 填充采样信息 ----
  if (typeof SAMPLING_INFO !== "undefined") {
    var siDate = document.getElementById("si-date");
    var siRange = document.getElementById("si-range");
    if (siDate) siDate.textContent = SAMPLING_INFO.samplingDate;
    if (siRange) siRange.textContent = SAMPLING_INFO.timeRange;
  }

  // ---- 图层组 ----
  var taxiLayer = L.layerGroup().addTo(map);
  var poiLayer = L.layerGroup().addTo(map);
  var metroLayer = L.layerGroup().addTo(map);
  var checkinLayer = L.layerGroup().addTo(map);
  var flowLayer = L.layerGroup().addTo(map);
  var trailLayer = L.layerGroup().addTo(map);
  var heatLayer = null;

  // ---- 天气更新 ----
  function updateWeather() {
    var w = getWeather(state.currentMinute);
    document.getElementById("weather-icon").textContent = w.icon;
    document.getElementById("weather-temp").textContent = w.temp + "\u00B0C";
    document.getElementById("weather-cond").textContent = w.condition;
    document.getElementById("weather-humidity").textContent = w.humidity + "%";
    document.getElementById("weather-wind").textContent = w.wind + "m/s";

    // 天气影响：雨天降低地图亮度
    if (w.rain > 0.3) {
      document.getElementById("map").style.filter = "brightness(0.85) saturate(0.9)";
      document.getElementById("rain-overlay").style.opacity = Math.min(w.rain * 0.3, 0.25);
    } else {
      document.getElementById("map").style.filter = "";
      document.getElementById("rain-overlay").style.opacity = "0";
    }
  }

  // ---- POI 标记 ----
  function createPOIMarkers() {
    poiLayer.clearLayers();
    POI_DATA.forEach(function (poi) {
      var cat = POI_CATEGORIES[poi.category];
      var icon = L.divIcon({
        className: "poi-marker",
        html:
          '<div class="poi-pin" style="--poi-color:' + cat.color + '">' +
          '<div class="poi-icon">' + cat.icon + "</div>" +
          '<div class="poi-label">' + poi.name + "</div></div>",
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      var marker = L.marker([poi.lat, poi.lng], { icon: icon }).addTo(poiLayer);
      marker.bindPopup(
        '<div class="popup">' +
        '<div class="popup-title">' + cat.icon + " " + poi.name + "</div>" +
        '<div class="popup-cat" style="color:' + cat.color + '">' + cat.name + "</div>" +
        '<div class="popup-desc">' + poi.desc + "</div>" +
        '<div class="popup-bar"><div class="popup-bar-fill" id="poi-bar"></div></div>' +
        '<div class="popup-meta">' + poi.lat.toFixed(4) + ", " + poi.lng.toFixed(4) + "</div></div>"
      );
      marker.on("popupopen", function () {
        var hour = CONFIG.startHour + state.currentMinute / 60;
        var bar = document.getElementById("poi-bar");
        if (bar) bar.style.width = Math.round(getPOICheckinWeight(poi, hour) * 100) + "%";
      });
    });
  }

  // ---- 地铁站标记 ----
  function createMetroMarkers() {
    metroLayer.clearLayers();
    METRO_STATIONS.forEach(function (st) {
      var isInterchange = st.lines.length > 1;
      var primaryColor = METRO_LINES[st.lines[0]].color;
      var size = isInterchange ? 20 : 14;

      // 线路色环
      var rings = "";
      st.lines.forEach(function (ln, i) {
        var c = METRO_LINES[ln].color;
        var offset = i * 3;
        rings += '<div class="metro-ring" style="border-color:' + c + ";width:" + (size + offset * 2) + "px;height:" + (size + offset * 2) + "px></div>";
      });

      var icon = L.divIcon({
        className: "metro-marker",
        html:
          '<div class="metro-station ' + (isInterchange ? "interchange" : "") + '">' + rings +
          '<div class="metro-dot" style="background:' + primaryColor + ";width:" + size + "px;height:" + size + 'px"></div>' +
          '<div class="metro-label">' + st.name + "</div></div>",
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      var marker = L.marker([st.lat, st.lng], { icon: icon, zIndexOffset: 500 }).addTo(metroLayer);

      var lineNames = st.lines.map(function (l) { return METRO_LINES[l].name; }).join(" / ");
      marker.bindPopup(
        '<div class="popup">' +
        '<div class="popup-title">\u{1F687} ' + st.name + "</div>" +
        '<div class="popup-cat" style="color:' + primaryColor + '">' + lineNames + "</div>" +
        '<div class="popup-desc">' + (isInterchange ? "换乘站" : "停靠站") + " \u00B7 " + st.lines.length + "条线路</div>" +
        '<div class="popup-meta">' + st.lat.toFixed(4) + ", " + st.lng.toFixed(4) + "</div></div>"
      );
    });
  }

  // ---- 出租车标记 ----
  function createTaxiIcon(status) {
    var c = TAXI_STATUS[status].color;
    return L.divIcon({
      className: "taxi-marker",
      html: '<div class="taxi-dot ' + status + '" style="background:' + c + ";--glow:" + TAXI_STATUS[status].glow + '"></div>',
      iconSize: [13, 13], iconAnchor: [6.5, 6.5],
    });
  }

  function updateTaxis() {
    var active = {};
    var occupied = 0, cruising = 0;
    for (var i = 0; i < TAXIS.length; i++) {
      var taxi = TAXIS[i];
      var pos = getTaxiPosition(taxi, state.currentMinute);
      if (pos) {
        active[taxi.id] = true;
        if (pos.status === "occupied") occupied++; else cruising++;
        if (state.layers.taxis) {
          if (state.activeTaxis[taxi.id]) {
            var m = state.activeTaxis[taxi.id];
            m.setLatLng([pos.lat, pos.lng]);
            if (m._status !== pos.status) { m.setIcon(createTaxiIcon(pos.status)); m._status = pos.status; }
          } else {
            m = L.marker([pos.lat, pos.lng], { icon: createTaxiIcon(pos.status), zIndexOffset: 1000 }).addTo(taxiLayer);
            m._status = pos.status;
            m.bindPopup(
              '<div class="popup"><div class="popup-title">' + taxi.id + "</div>" +
              '<div class="popup-status ' + pos.status + '"><span class="status-dot" style="background:' + TAXI_STATUS[pos.status].color + '"></span>' + TAXI_STATUS[pos.status].name + "</div>" +
              '<div class="popup-route">' + pos.trip.startPOI + " \u2192 " + pos.trip.endPOI + "</div></div>"
            );
            state.activeTaxis[taxi.id] = m;
          }
        }
        // 轨迹尾迹
        if (!state.taxiTrail[taxi.id]) state.taxiTrail[taxi.id] = [];
        state.taxiTrail[taxi.id].push([pos.lat, pos.lng]);
        if (state.taxiTrail[taxi.id].length > TRAIL_MAX) state.taxiTrail[taxi.id].shift();
      }
    }
    // 清理失活出租车
    for (var id in state.activeTaxis) {
      if (!active[id]) { taxiLayer.removeLayer(state.activeTaxis[id]); delete state.activeTaxis[id]; delete state.taxiTrail[id]; }
    }
    state.stats.activeTaxis = Object.keys(active).length;
    state.stats.occupied = occupied;
    state.stats.cruising = cruising;
  }

  // ---- 轨迹尾迹 ----
  function updateTrails() {
    trailLayer.clearLayers();
    if (!state.layers.trails) return;
    for (var id in state.taxiTrail) {
      var trail = state.taxiTrail[id];
      if (trail.length < 2) continue;
      var taxi = TAXIS.find(function (t) { return t.id === id; });
      if (!taxi) continue;
      var pos = getTaxiPosition(taxi, state.currentMinute);
      var color = pos && pos.status === "occupied" ? "#F44336" : "#2196F3";
      for (var i = 1; i < trail.length; i++) {
        L.polyline([trail[i - 1], trail[i]], {
          color: color, weight: 2.5, opacity: (i / trail.length) * 0.5, interactive: false,
        }).addTo(trailLayer);
      }
    }
  }

  // ---- 签到脉冲动画 ----
  function updateCheckins() {
    // 添加新签到
    while (state.checkinIndex < CHECKINS.length && CHECKINS[state.checkinIndex].minute <= state.currentMinute) {
      var c = CHECKINS[state.checkinIndex];
      state.activeCheckins.push({
        lat: c.lat, lng: c.lng, poiName: c.poiName, category: c.category,
        user: c.user, bornAt: state.currentMinute, element: null,
      });
      state.checkinIndex++;
    }

    // 渲染活跃签到（最近 CHECKIN_DISPLAY_MS 内的）
    checkinLayer.clearLayers();
    var now = Date.now();
    var toKeep = [];
    for (var i = 0; i < state.activeCheckins.length; i++) {
      var ck = state.activeCheckins[i];
      var ageMin = state.currentMinute - ck.bornAt;
      // 签到在模拟时间上最多存在3分钟
      if (ageMin < 3 && state.layers.checkins) {
        var cat = POI_CATEGORIES[ck.category];
        var opacity = 1 - ageMin / 3;
        var scale = 1 + ageMin * 0.5;
        var icon = L.divIcon({
          className: "checkin-marker",
          html: '<div class="checkin-pulse" style="--ck-color:' + cat.color + ";opacity:" + opacity + ";transform:scale(" + scale + ')">' +
            '<div class="checkin-ring"></div><div class="checkin-ring2"></div>' +
            '<div class="checkin-icon">' + cat.icon + "</div></div>",
          iconSize: [30, 30], iconAnchor: [15, 15],
        });
        L.marker([ck.lat, ck.lng], { icon: icon, interactive: false, zIndexOffset: 800 }).addTo(checkinLayer);
        toKeep.push(ck);
      }
    }
    state.activeCheckins = toKeep;
    state.stats.checkins = state.checkinIndex;
  }

  // ---- 时空流动线 ----
  function updateFlows() {
    flowLayer.clearLayers();
    if (!state.layers.flows) return;
    var routes = getFlowRoutes(state.currentMinute);
    state.activeFlows = routes;
    state.stats.flows = routes.length;

    routes.forEach(function (r) {
      // 生成路径
      var path = generatePath(r.from, r.to, 30);
      var latlngs = path.map(function (p) { return [p.lat, p.lng]; });

      // 流动虚线
      L.polyline(latlngs, {
        color: r.color, weight: 3, opacity: 0.4,
        dashArray: "10 15", interactive: false,
      }).addTo(flowLayer);

      // 流动光点（沿线移动）
      var numDots = 3;
      var phase = (state.currentMinute % 10) / 10;
      for (var d = 0; d < numDots; d++) {
        var t = (phase + d / numDots) % 1;
        var idx = Math.floor(t * (latlngs.length - 1));
        var frac = t * (latlngs.length - 1) - idx;
        if (idx < latlngs.length - 1) {
          var ll = [
            latlngs[idx][0] + (latlngs[idx + 1][0] - latlngs[idx][0]) * frac,
            latlngs[idx][1] + (latlngs[idx + 1][1] - latlngs[idx][1]) * frac,
          ];
          L.circleMarker(ll, {
            radius: 5, color: r.color, fillColor: r.color,
            fillOpacity: 0.9, weight: 2, interactive: false,
          }).addTo(flowLayer);
        }
      }
    });
  }

  // ---- 热力图 ----
  function updateHeatmap() {
    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    if (!state.layers.heatmap) return;
    var data = getHeatmapData(TAXIS, CHECKINS, state.currentMinute);
    if (data.length > 0) {
      heatLayer = L.heatLayer(data, {
        radius: 30, blur: 20, maxZoom: 15, minOpacity: 0.2,
        gradient: { 0.0: "#0000ff", 0.3: "#00bfff", 0.5: "#00ff00", 0.7: "#ffff00", 0.85: "#ff8c00", 1.0: "#ff0000" },
      }).addTo(map);
    }
  }

  // ---- 统计面板 ----
  function updateStats() {
    document.getElementById("stat-active").textContent = state.stats.activeTaxis;
    document.getElementById("stat-occupied").textContent = state.stats.occupied;
    document.getElementById("stat-cruising").textContent = state.stats.cruising;
    document.getElementById("stat-checkins").textContent = state.stats.checkins;
    document.getElementById("stat-flows").textContent = state.stats.flows;
    document.getElementById("stat-pois").textContent = POI_DATA.length;
    document.getElementById("stat-metro").textContent = METRO_STATIONS.length;

    // 均速
    var totalSpeed = 0, count = 0;
    for (var i = 0; i < TAXIS.length; i++) {
      var pos = getTaxiPosition(TAXIS[i], state.currentMinute);
      if (pos && pos.trip) {
        var dur = pos.trip.endTime - pos.trip.startTime;
        if (dur > 0 && pos.trip.route.length > 1) {
          var dist = 0;
          for (var j = 1; j < pos.trip.route.length; j++) {
            var dl = pos.trip.route[j].lat - pos.trip.route[j - 1].lat;
            var dn = pos.trip.route[j].lng - pos.trip.route[j - 1].lng;
            dist += Math.sqrt(dl * dl + dn * dn) * 111;
          }
          totalSpeed += (dist / dur) * 60; count++;
        }
      }
    }
    document.getElementById("stat-speed").textContent = count > 0 ? (totalSpeed / count).toFixed(1) : "0.0";
  }

  // ---- 时间显示 ----
  function formatTime(minute) {
    var total = CONFIG.startHour * 60 + minute;
    var h = Math.floor(total / 60), m = Math.floor(total % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  function updateTimeDisplay() {
    document.getElementById("current-time").textContent = formatTime(state.currentMinute);
    document.getElementById("time-slider").value = (state.currentMinute / TOTAL_MINUTES) * 100;
  }

  // ---- 时段分布图 ----
  var chartCanvas = document.getElementById("time-chart");
  var chartCtx = chartCanvas.getContext("2d");
  var chartMax = Math.max.apply(null, TIME_DIST);

  function drawChart() {
    var w = chartCanvas.width, h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);
    var barW = w / TIME_DIST.length;
    var curH = Math.floor(state.currentMinute / 60);

    chartCtx.strokeStyle = "rgba(255,255,255,0.06)";
    chartCtx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = (h / 4) * g;
      chartCtx.beginPath(); chartCtx.moveTo(0, y); chartCtx.lineTo(w, y); chartCtx.stroke();
    }

    for (var i = 0; i < TIME_DIST.length; i++) {
      var barH = (TIME_DIST[i] / chartMax) * (h - 10);
      var x = i * barW + 2, by = h - barH;
      var active = i === curH;
      var grad = chartCtx.createLinearGradient(0, by, 0, h);
      if (active) { grad.addColorStop(0, "#FF5252"); grad.addColorStop(1, "rgba(255,82,82,0.15)"); }
      else { grad.addColorStop(0, "#4FC3F7"); grad.addColorStop(1, "rgba(79,195,247,0.1)"); }
      chartCtx.fillStyle = grad;
      chartCtx.fillRect(x, by, barW - 4, barH);
      if (active) {
        chartCtx.strokeStyle = "#FF5252"; chartCtx.lineWidth = 1.5;
        chartCtx.beginPath(); chartCtx.moveTo(x + barW / 2 - 2, 0); chartCtx.lineTo(x + barW / 2 - 2, h); chartCtx.stroke();
      }
    }
    chartCtx.fillStyle = "rgba(255,255,255,0.4)"; chartCtx.font = "9px sans-serif"; chartCtx.textAlign = "center";
    for (var k = 0; k < TIME_DIST.length; k += 3) {
      chartCtx.fillText((CONFIG.startHour + k) + "h", k * barW + barW / 2, h - 1);
    }
  }

  // ---- 动画循环 ----
  function animate(ts) {
    if (!state.isPlaying) { state.lastFrameTime = ts; requestAnimationFrame(animate); return; }
    if (!state.lastFrameTime) state.lastFrameTime = ts;
    var delta = ts - state.lastFrameTime;
    state.lastFrameTime = ts;

    // 1x: 1000ms = 2模拟分钟
    state.currentMinute += delta * 0.002 * state.speed;
    if (state.currentMinute >= TOTAL_MINUTES) {
      state.currentMinute = TOTAL_MINUTES - 1;
      state.isPlaying = false;
      document.getElementById("play-btn").innerHTML = "&#9654;";
    }

    updateTimeDisplay();
    updateTaxis();
    updateTrails();
    updateCheckins();

    // 低频更新
    state.heatAccum += delta;
    state.flowAccum += delta;
    if (state.heatAccum > 600) { state.heatAccum = 0; updateHeatmap(); updateWeather(); updateStats(); drawChart(); }
    if (state.flowAccum > 300) { state.flowAccum = 0; updateFlows(); }

    requestAnimationFrame(animate);
  }

  // ---- 事件绑定 ----
  document.getElementById("play-btn").addEventListener("click", function () {
    state.isPlaying = !state.isPlaying;
    this.innerHTML = state.isPlaying ? "&#10073;&#10073;" : "&#9654;";
    state.lastFrameTime = 0;
    if (state.isPlaying && state.currentMinute >= TOTAL_MINUTES - 1) state.currentMinute = 0;
  });

  document.getElementById("time-slider").addEventListener("input", function () {
    state.currentMinute = (this.value / 100) * TOTAL_MINUTES;
    state.checkinIndex = 0;
    state.activeCheckins = [];
    for (var i = 0; i < CHECKINS.length; i++) {
      if (CHECKINS[i].minute <= state.currentMinute) state.checkinIndex++;
    }
    updateTimeDisplay(); updateTaxis(); updateTrails(); updateCheckins();
    updateHeatmap(); updateFlows(); updateWeather(); updateStats(); drawChart();
  });

  document.getElementById("speed-select").addEventListener("change", function () { state.speed = parseFloat(this.value); });

  // 图层开关
  function bindLayer(id, layer, onAdd, onRemove) {
    document.getElementById(id).addEventListener("change", function () {
      state.layers[id.replace("layer-", "")] = this.checked;
      if (this.checked) { if (onAdd) onAdd(); else map.addLayer(layer); }
      else { if (onRemove) onRemove(); else map.removeLayer(layer); }
    });
  }

  document.getElementById("layer-taxis").addEventListener("change", function () {
    state.layers.taxis = this.checked;
    if (!this.checked) { taxiLayer.clearLayers(); state.activeTaxis = {}; }
    else updateTaxis();
  });
  document.getElementById("layer-pois").addEventListener("change", function () {
    state.layers.pois = this.checked;
    if (this.checked) map.addLayer(poiLayer); else map.removeLayer(poiLayer);
  });
  document.getElementById("layer-metro").addEventListener("change", function () {
    state.layers.metro = this.checked;
    if (this.checked) map.addLayer(metroLayer); else map.removeLayer(metroLayer);
  });
  document.getElementById("layer-heatmap").addEventListener("change", function () {
    state.layers.heatmap = this.checked;
    if (this.checked) updateHeatmap(); else if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
  });
  document.getElementById("layer-checkins").addEventListener("change", function () {
    state.layers.checkins = this.checked;
    if (!this.checked) checkinLayer.clearLayers();
  });
  document.getElementById("layer-flows").addEventListener("change", function () {
    state.layers.flows = this.checked;
    if (!this.checked) flowLayer.clearLayers(); else updateFlows();
  });
  document.getElementById("layer-trails").addEventListener("change", function () {
    state.layers.trails = this.checked;
    if (!this.checked) trailLayer.clearLayers();
  });

  // ---- 初始化 ----
  createPOIMarkers();
  createMetroMarkers();
  updateTaxis();
  updateCheckins();
  updateFlows();
  updateHeatmap();
  updateWeather();
  updateStats();
  drawChart();
  updateTimeDisplay();
  requestAnimationFrame(animate);

  // 自动播放
  setTimeout(function () {
    state.isPlaying = true;
    document.getElementById("play-btn").innerHTML = "&#10073;&#10073;";
  }, 1000);

  console.log("[成都时空数据可视化] 初始化完成");
  console.log("  出租车:", CONFIG.numTaxis, "| POI:", POI_DATA.length, "| 地铁站:", METRO_STATIONS.length);
  console.log("  签到:", CONFIG.numCheckins, "| 流动路线:", FLOW_ROUTES.length, "| 天气时段:", WEATHER_TIMELINE.length);
})();
