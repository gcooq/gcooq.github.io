// ============================================
// 时空数据可视化 - 主应用逻辑
// ============================================

(function () {
  "use strict";

  // ---- 全局状态 ----
  const state = {
    currentMinute: 0,
    isPlaying: false,
    speed: 1,
    lastFrameTime: 0,
    accumTime: 0,
    activeTaxis: new Map(),  // taxiId -> marker
    taxiTrail: new Map(),    // taxiId -> [{lat,lng}]
    layers: {
      taxis: true,
      pois: true,
      heatmap: true,
      trails: false,
    },
    stats: {
      activeCount: 0,
      occupiedCount: 0,
      cruisingCount: 0,
      totalTrips: 0,
    },
  };

  const TRAIL_MAX = 12;

  // ---- 初始化地图 ----
  const map = L.map("map", {
    center: CONFIG.cityCenter,
    zoom: CONFIG.defaultZoom,
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false,
  });

  // 高德地图标准底图
  L.tileLayer(
    "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      attribution: "\u00A9\u9AD8\u5FB7\u5730\u56FE",
    }
  ).addTo(map);

  // 叠加层：高德路网标注（更清晰）
  L.tileLayer(
    "https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
    {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      opacity: 0,
    }
  ).addTo(map);

  // ---- 填充采样信息 ----
  if (typeof SAMPLING_INFO !== "undefined") {
    const siDate = document.getElementById("si-date");
    const siRange = document.getElementById("si-range");
    if (siDate) siDate.textContent = SAMPLING_INFO.samplingDate;
    if (siRange) siRange.textContent = SAMPLING_INFO.timeRange;
  }

  // ---- 图层组 ----
  const taxiLayer = L.layerGroup().addTo(map);
  const poiLayer = L.layerGroup().addTo(map);
  const trailLayer = L.layerGroup().addTo(map);

  // 热力图图层
  let heatLayer = null;
  function updateHeatLayer(data) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }
    if (state.layers.heatmap && data.length > 0) {
      heatLayer = L.heatLayer(data, {
        radius: 28,
        blur: 18,
        maxZoom: 15,
        minOpacity: 0.25,
        gradient: {
          0.0: "#0000ff",
          0.3: "#00bfff",
          0.5: "#00ff00",
          0.7: "#ffff00",
          0.85: "#ff8c00",
          1.0: "#ff0000",
        },
      }).addTo(map);
    }
  }

  // ---- 创建 POI 标记 ----
  function createPOIMarkers() {
    poiLayer.clearLayers();
    POI_DATA.forEach(function (poi) {
      const cat = POI_CATEGORIES[poi.category];
      const icon = L.divIcon({
        className: "poi-marker",
        html:
          '<div class="poi-pin" style="--poi-color:' + cat.color + '">' +
          '<div class="poi-icon">' + cat.icon + "</div>" +
          '<div class="poi-label">' + poi.name + "</div>" +
          "</div>",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([poi.lat, poi.lng], { icon: icon }).addTo(poiLayer);
      marker.bindPopup(
        '<div class="poi-popup">' +
        '<div class="popup-title">' + cat.icon + " " + poi.name + "</div>" +
        '<div class="popup-cat" style="color:' + cat.color + '">' + cat.name + "</div>" +
        '<div class="popup-desc">' + poi.desc + "</div>" +
        '<div class="popup-bar"><div class="popup-bar-fill" id="poi-intensity-bar"></div></div>' +
        '<div class="popup-meta">坐标: ' + poi.lat.toFixed(4) + ", " + poi.lng.toFixed(4) + "</div>" +
        "</div>"
      );
      marker.on("popupopen", function () {
        const intensity = getPOIIntensity(poi, state.currentMinute);
        const bar = document.getElementById("poi-intensity-bar");
        if (bar) bar.style.width = Math.round(intensity * 100) + "%";
      });
    });
  }

  // ---- 创建出租车图标 ----
  function createTaxiIcon(status) {
    const color = TAXI_STATUS[status].color;
    return L.divIcon({
      className: "taxi-marker",
      html:
        '<div class="taxi-dot ' + status + '" style="background:' + color + ";--glow:" + TAXI_STATUS[status].glow + '">' +
        '<div class="taxi-arrow"></div>' +
        "</div>",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  // ---- 更新出租车位置 ----
  function updateTaxis() {
    const currentActive = new Set();
    let occupied = 0;
    let cruising = 0;

    // 更新或创建标记
    for (const taxi of TAXIS) {
      const pos = getTaxiPosition(taxi, state.currentMinute);
      if (pos) {
        currentActive.add(taxi.id);
        if (pos.status === "occupied") occupied++;
        else cruising++;

        if (state.layers.taxis) {
          if (state.activeTaxis.has(taxi.id)) {
            // 更新位置和图标
            const marker = state.activeTaxis.get(taxi.id);
            marker.setLatLng([pos.lat, pos.lng]);
            const currentIcon = marker.options.icon;
            // 仅在状态变化时更换图标
            if (marker._currentStatus !== pos.status) {
              marker.setIcon(createTaxiIcon(pos.status));
              marker._currentStatus = pos.status;
            }
          } else {
            const marker = L.marker([pos.lat, pos.lng], {
              icon: createTaxiIcon(pos.status),
              zIndexOffset: 1000,
            }).addTo(taxiLayer);
            marker._currentStatus = pos.status;
            marker.bindPopup(
              '<div class="taxi-popup">' +
              '<div class="popup-title">' + taxi.id + "</div>" +
              '<div class="popup-status ' + pos.status + '">' +
              '<span class="status-dot" style="background:' + TAXI_STATUS[pos.status].color + '"></span>' +
              TAXI_STATUS[pos.status].name +
              "</div>" +
              '<div class="popup-route">' + pos.trip.startPOI + " \u2192 " + pos.trip.endPOI + "</div>" +
              "</div>"
            );
            state.activeTaxis.set(taxi.id, marker);
          }
        }

        // 更新轨迹尾迹
        if (!state.taxiTrail.has(taxi.id)) {
          state.taxiTrail.set(taxi.id, []);
        }
        const trail = state.taxiTrail.get(taxi.id);
        trail.push([pos.lat, pos.lng]);
        if (trail.length > TRAIL_MAX) trail.shift();
      }
    }

    // 移除不再活跃的出租车
    for (const [taxiId, marker] of state.activeTaxis) {
      if (!currentActive.has(taxiId)) {
        taxiLayer.removeLayer(marker);
        state.activeTaxis.delete(taxiId);
        state.taxiTrail.delete(taxiId);
      }
    }

    // 控制图层可见性
    if (!state.layers.taxis) {
      for (const marker of state.activeTaxis.values()) {
        if (taxiLayer.hasLayer(marker)) taxiLayer.removeLayer(marker);
      }
    }

    // 更新统计
    state.stats.activeCount = currentActive.size;
    state.stats.occupiedCount = occupied;
    state.stats.cruisingCount = cruising;
    updateStatsDisplay();
  }

  // ---- 更新轨迹尾迹 ----
  function updateTrails() {
    trailLayer.clearLayers();
    if (!state.layers.trails) return;

    for (const [taxiId, trail] of state.taxiTrail) {
      if (trail.length < 2) continue;
      const taxi = TAXIS.find(function (t) { return t.id === taxiId; });
      if (!taxi) continue;
      const pos = getTaxiPosition(taxi, state.currentMinute);
      const color = pos && pos.status === "occupied" ? "#F44336" : "#2196F3";

      // 绘制分段尾迹，透明度渐变
      for (let i = 1; i < trail.length; i++) {
        const opacity = (i / trail.length) * 0.6;
        L.polyline([trail[i - 1], trail[i]], {
          color: color,
          weight: 2.5,
          opacity: opacity,
          interactive: false,
        }).addTo(trailLayer);
      }
    }
  }

  // ---- 更新统计面板 ----
  function updateStatsDisplay() {
    document.getElementById("stat-active").textContent = state.stats.activeCount;
    document.getElementById("stat-occupied").textContent = state.stats.occupiedCount;
    document.getElementById("stat-cruising").textContent = state.stats.cruisingCount;
    document.getElementById("stat-pois").textContent = POI_DATA.length;

    // 估算平均速度
    let totalSpeed = 0;
    let count = 0;
    for (const taxi of TAXIS) {
      const pos = getTaxiPosition(taxi, state.currentMinute);
      if (pos && pos.trip) {
        const trip = pos.trip;
        const duration = trip.endTime - trip.startTime;
        if (duration > 0 && trip.route.length > 1) {
          // 粗略估算距离（经纬度转km）
          let dist = 0;
          for (let i = 1; i < trip.route.length; i++) {
            const dlat = trip.route[i].lat - trip.route[i - 1].lat;
            const dlng = trip.route[i].lng - trip.route[i - 1].lng;
            dist += Math.sqrt(dlat * dlat + dlng * dlng) * 111;
          }
          totalSpeed += (dist / duration) * 60;
          count++;
        }
      }
    }
    document.getElementById("stat-speed").textContent = count > 0 ? (totalSpeed / count).toFixed(1) : "0.0";
  }

  // ---- 时间显示 ----
  function formatTime(minute) {
    const totalMin = CONFIG.startHour * 60 + minute;
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function updateTimeDisplay() {
    document.getElementById("current-time").textContent = formatTime(state.currentMinute);
    const progress = (state.currentMinute / TOTAL_MINUTES) * 100;
    document.getElementById("time-slider").value = progress;
  }

  // ---- 时间分布图表 ----
  const chartCanvas = document.getElementById("time-chart");
  const chartCtx = chartCanvas.getContext("2d");
  let chartMaxVal = Math.max.apply(null, TIME_DIST);

  function drawTimeChart() {
    const w = chartCanvas.width;
    const h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);

    const barW = w / TIME_DIST.length;
    const currentHour = Math.floor(state.currentMinute / 60);

    // 背景网格线
    chartCtx.strokeStyle = "rgba(255,255,255,0.08)";
    chartCtx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      chartCtx.beginPath();
      chartCtx.moveTo(0, y);
      chartCtx.lineTo(w, y);
      chartCtx.stroke();
    }

    // 柱状图
    for (let i = 0; i < TIME_DIST.length; i++) {
      const barH = (TIME_DIST[i] / chartMaxVal) * (h - 8);
      const x = i * barW + 2;
      const y = h - barH;

      const isActive = i === currentHour;
      const grad = chartCtx.createLinearGradient(0, y, 0, h);
      if (isActive) {
        grad.addColorStop(0, "#FF5252");
        grad.addColorStop(1, "rgba(255,82,82,0.2)");
      } else {
        grad.addColorStop(0, "#4FC3F7");
        grad.addColorStop(1, "rgba(79,195,247,0.15)");
      }
      chartCtx.fillStyle = grad;
      chartCtx.fillRect(x, y, barW - 4, barH);

      // 当前时段高亮线
      if (isActive) {
        chartCtx.strokeStyle = "#FF5252";
        chartCtx.lineWidth = 2;
        chartCtx.beginPath();
        chartCtx.moveTo(x + barW / 2 - 2, 0);
        chartCtx.lineTo(x + barW / 2 - 2, h);
        chartCtx.stroke();
      }
    }

    // X轴标签
    chartCtx.fillStyle = "rgba(255,255,255,0.5)";
    chartCtx.font = "9px sans-serif";
    chartCtx.textAlign = "center";
    for (let i = 0; i < TIME_DIST.length; i += 2) {
      const x = i * barW + barW / 2;
      chartCtx.fillText((CONFIG.startHour + i) + "h", x, h - 1);
    }
  }

  // ---- 动画循环 ----
  function animate(timestamp) {
    if (!state.isPlaying) {
      state.lastFrameTime = timestamp;
      requestAnimationFrame(animate);
      return;
    }

    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const deltaMs = timestamp - state.lastFrameTime;
    state.lastFrameTime = timestamp;
    state.accumTime += deltaMs;

    // 每 tick 推进的时间（毫秒 -> 模拟分钟）
    // 1x 速度: 1000ms = 2模拟分钟（约8分钟播放完整16小时）
    const minutesPerMs = 0.002 * state.speed;
    state.currentMinute += deltaMs * minutesPerMs;

    if (state.currentMinute >= TOTAL_MINUTES) {
      state.currentMinute = TOTAL_MINUTES - 1;
      state.isPlaying = false;
      document.getElementById("play-btn").innerHTML = "&#9654;";
    }

    updateTimeDisplay();
    updateTaxis();
    updateTrails();

    // 热力图降频更新（每 ~500ms）
    if (state.accumTime > 500) {
      state.accumTime = 0;
      updateHeatLayer(getHeatmapData(TAXIS, state.currentMinute));
      drawTimeChart();
    }

    requestAnimationFrame(animate);
  }

  // ---- 事件绑定 ----

  // 播放/暂停
  document.getElementById("play-btn").addEventListener("click", function () {
    state.isPlaying = !state.isPlaying;
    this.innerHTML = state.isPlaying ? "&#10073;&#10073;" : "&#9654;";
    state.lastFrameTime = 0;
    if (state.isPlaying && state.currentMinute >= TOTAL_MINUTES - 1) {
      state.currentMinute = 0;
    }
  });

  // 时间滑块
  document.getElementById("time-slider").addEventListener("input", function () {
    state.currentMinute = (this.value / 100) * TOTAL_MINUTES;
    updateTimeDisplay();
    updateTaxis();
    updateTrails();
    updateHeatLayer(getHeatmapData(TAXIS, state.currentMinute));
    drawTimeChart();
  });

  // 速度选择
  document.getElementById("speed-select").addEventListener("change", function () {
    state.speed = parseFloat(this.value);
  });

  // 图层切换
  document.getElementById("layer-taxis").addEventListener("change", function () {
    state.layers.taxis = this.checked;
    if (this.checked) {
      updateTaxis();
    } else {
      taxiLayer.clearLayers();
      state.activeTaxis.clear();
    }
  });

  document.getElementById("layer-pois").addEventListener("change", function () {
    state.layers.pois = this.checked;
    if (this.checked) {
      map.addLayer(poiLayer);
    } else {
      map.removeLayer(poiLayer);
    }
  });

  document.getElementById("layer-heatmap").addEventListener("change", function () {
    state.layers.heatmap = this.checked;
    if (this.checked) {
      updateHeatLayer(getHeatmapData(TAXIS, state.currentMinute));
    } else if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }
  });

  document.getElementById("layer-trails").addEventListener("change", function () {
    state.layers.trails = this.checked;
    if (!this.checked) trailLayer.clearLayers();
  });

  // ---- 初始化 ----
  createPOIMarkers();
  updateTaxis();
  updateHeatLayer(getHeatmapData(TAXIS, state.currentMinute));
  drawTimeChart();
  updateTimeDisplay();

  // 启动动画循环
  requestAnimationFrame(animate);

  // 自动开始播放
  setTimeout(function () {
    state.isPlaying = true;
    document.getElementById("play-btn").innerHTML = "&#10073;&#10073;";
  }, 800);

  console.log("[时空数据可视化] 初始化完成");
  console.log("  出租车数量:", CONFIG.numTaxis);
  console.log("  POI数量:", POI_DATA.length);
  console.log("  模拟时段:", CONFIG.startHour + ":00 - " + CONFIG.endHour + ":00");
})();
