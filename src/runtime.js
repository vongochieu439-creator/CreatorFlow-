(function () {
  "use strict";

  var platforms = [
    {
      id: "wechat",
      name: "\u516c\u4f17\u53f7",
      accent: "#0f8a5f",
      profile: "\u957f\u6587\u7ed3\u6784\u3001\u65b9\u6cd5\u603b\u7ed3\u3001\u6536\u85cf\u4ef7\u503c",
      maxTitle: 32,
      minLength: 220,
      maxLength: 1800,
    },
    {
      id: "zhihu",
      name: "\u77e5\u4e4e",
      accent: "#1769e0",
      profile: "\u7ed3\u8bba\u5148\u884c\u3001\u539f\u56e0\u5206\u6790\u3001\u5b9e\u8df5\u5efa\u8bae",
      maxTitle: 42,
      minLength: 180,
      maxLength: 1600,
    },
    {
      id: "bilibili",
      name: "B\u7ad9",
      accent: "#fb7299",
      profile: "\u89c6\u9891\u7b80\u4ecb\u3001\u770b\u70b9\u65f6\u95f4\u8f74\u3001\u4e92\u52a8\u5f15\u5bfc",
      maxTitle: 36,
      minLength: 120,
      maxLength: 800,
    },
    {
      id: "xiaohongshu",
      name: "\u5c0f\u7ea2\u4e66",
      accent: "#ff4d6d",
      profile: "\u77ed\u53e5\u6e05\u5355\u3001\u751f\u6d3b\u5316\u8868\u8fbe\u3001\u6807\u7b7e\u5206\u53d1",
      maxTitle: 20,
      minLength: 80,
      maxLength: 600,
    },
  ];

  var selectedId = "wechat";
  var generationCount = 0;
  var analysisCount = 0;
  var platformStrategies = {};
  var editedDrafts = {};
  var publishRecords = [];
  var toastTimer = null;

  var strategyTemplates = {
    wechat: {
      headline: "\u65b9\u6cd5\u8bba + \u6536\u85cf\u4ef7\u503c",
      titlePatterns: ["\u7ed3\u679c\u627f\u8bfa + \u5b8c\u6574\u6307\u5357", "\u95ee\u9898\u80cc\u666f + \u89e3\u51b3\u65b9\u6848", "\u4eba\u7fa4 + \u5b9e\u7528\u6e05\u5355"],
      opening: "\u5148\u4ea4\u4ee3\u95ee\u9898\u80cc\u666f\uff0c\u518d\u8bf4\u8fd9\u7bc7\u6587\u80fd\u5e2e\u8bfb\u8005\u89e3\u51b3\u4ec0\u4e48\u3002",
      structure: ["\u80cc\u666f", "\u6838\u5fc3\u65b9\u6cd5", "\u64cd\u4f5c\u6b65\u9aa4", "\u603b\u7ed3"],
      tags: ["\u5185\u5bb9\u8fd0\u8425", "\u6548\u7387\u5de5\u5177", "\u7ecf\u9a8c\u603b\u7ed3"],
      risk: "\u907f\u514d\u6807\u9898\u8fc7\u5ea6\u5938\u5f20\uff0c\u8981\u4fdd\u7559\u4fe1\u606f\u5bc6\u5ea6\u548c\u53ef\u4fe1\u5ea6\u3002",
    },
    zhihu: {
      headline: "\u95ee\u9898\u610f\u8bc6 + \u7ed3\u8bba\u5148\u884c",
      titlePatterns: ["\u95ee\u9898 + \u5b9e\u9645\u600e\u4e48\u505a", "\u7ed3\u8bba + \u539f\u56e0\u5206\u6790", "\u8bef\u533a + \u6b63\u786e\u505a\u6cd5"],
      opening: "\u7b2c\u4e00\u6bb5\u76f4\u63a5\u7ed9\u5224\u65ad\uff0c\u7136\u540e\u8bf4\u660e\u7406\u7531\u3002",
      structure: ["\u7ed3\u8bba", "\u539f\u56e0", "\u6848\u4f8b", "\u5efa\u8bae"],
      tags: ["\u5185\u5bb9\u521b\u4f5c", "\u65b0\u5a92\u4f53", "\u6548\u7387"],
      risk: "\u907f\u514d\u53ea\u6709\u60c5\u7eea\u8868\u8fbe\uff0c\u9700\u8981\u7ed9\u51fa\u8bba\u636e\u548c\u8fb9\u754c\u3002",
    },
    bilibili: {
      headline: "\u770b\u70b9\u524d\u7f6e + \u8282\u594f\u660e\u786e",
      titlePatterns: ["\u7ed3\u679c + 3\u5206\u949f\u8bb2\u6e05", "\u65b0\u624b + \u907f\u5751", "\u4e00\u671f\u641e\u61c2 + \u5173\u952e\u95ee\u9898"],
      opening: "\u7b80\u4ecb\u5148\u8bf4\u89c6\u9891\u770b\u70b9\uff0c\u518d\u7ed9\u65f6\u95f4\u8f74\u3002",
      structure: ["\u89c6\u9891\u7b80\u4ecb", "\u65f6\u95f4\u8f74", "\u770b\u70b9", "\u4e92\u52a8"],
      tags: ["\u521b\u4f5c\u5de5\u5177", "\u8fd0\u8425\u7ecf\u9a8c", "\u89c6\u9891\u53d1\u5e03"],
      risk: "\u907f\u514d\u7b80\u4ecb\u592a\u957f\uff0c\u8981\u8ba9\u7528\u6237\u5feb\u901f\u770b\u5230\u89c6\u9891\u4ef7\u503c\u3002",
    },
    xiaohongshu: {
      headline: "\u75db\u70b9\u6807\u9898 + \u77ed\u53e5\u6e05\u5355",
      titlePatterns: ["\u4eba\u7fa4 + \u907f\u5751\u6e05\u5355", "\u75db\u70b9 + \u89e3\u51b3\u7ed3\u679c", "\u6570\u5b57 + \u53ef\u6536\u85cf"],
      opening: "\u5148\u8bf4\u7528\u6237\u75db\u70b9\uff0c\u518d\u7ed9\u4e00\u4e2a\u53ef\u7acb\u5373\u4f7f\u7528\u7684\u7ed3\u679c\u3002",
      structure: ["\u9002\u5408\u8c01", "\u6838\u5fc3\u6e05\u5355", "\u4f7f\u7528\u4f53\u9a8c", "\u8bc4\u8bba\u63d0\u95ee"],
      tags: ["\u535a\u4e3b\u5de5\u5177", "\u5185\u5bb9\u6a21\u677f", "\u65b0\u624b\u8fd0\u8425"],
      risk: "\u907f\u514d\u8fc7\u5ea6\u8425\u9500\u548c\u7167\u642c\u53c2\u8003\u7d20\u6750\uff0c\u4fdd\u7559\u539f\u521b\u89c2\u70b9\u3002",
    },
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function getInput() {
    return {
      title: text(byId("sourceTitle").value).trim() || "\u672a\u547d\u540d\u5185\u5bb9",
      body: text(byId("sourceBody").value).trim() || "\u8bf7\u5148\u8f93\u5165\u8981\u53d1\u5e03\u7684\u5185\u5bb9\u3002",
      audience: text(byId("audienceInput").value).trim() || "\u76ee\u6807\u8bfb\u8005",
      tone: text(byId("toneSelect").value),
      includeTags: byId("tagToggle").checked,
      includeCta: byId("ctaToggle").checked,
    };
  }

  function splitLines(body) {
    return body.split(/\n+/).map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function cut(value, limit) {
    return value.length > limit ? value.slice(0, limit - 1) + "..." : value;
  }

  function makeDraft(platform, input) {
    var strategy = platformStrategies[platform.id] || strategyTemplates[platform.id];
    var lines = splitLines(input.body);
    var body = [];
    var title = input.title;
    var summary = "";

    if (platform.id === "wechat") {
      title = cut(input.audience + "\u5fc5\u6536\u85cf\uff1a" + input.title, platform.maxTitle);
      summary = "\u9762\u5411" + input.audience + "\uff0c\u6839\u636e\u516c\u4f17\u53f7\u70ed\u95e8\u5185\u5bb9\u7684\u300c" + strategy.headline + "\u300d\u89c4\u5f8b\u91cd\u7ec4\u4e3a\u957f\u6587\u7ed3\u6784\u3002";
      body = ["\u5f00\u7bc7\u8bf4\u660e"].concat(lines.slice(0, 2), ["\u6838\u5fc3\u62c6\u89e3"], numberLines(lines));
    }

    if (platform.id === "zhihu") {
      title = cut(input.title + "\uff0c\u5b9e\u9645\u5e94\u8be5\u600e\u4e48\u505a\uff1f", platform.maxTitle);
      summary = "\u5148\u7ed9\u7ed3\u8bba\uff1a\u7ed3\u5408\u77e5\u4e4e\u300c" + strategy.headline + "\u300d\u7684\u5185\u5bb9\u7279\u5f81\uff0c\u5173\u952e\u662f\u628a\u89c2\u70b9\u3001\u7406\u7531\u548c\u5efa\u8bae\u8bb2\u6e05\u695a\u3002";
      body = ["\u6211\u7684\u5224\u65ad", summary, "\u4e3a\u4ec0\u4e48\u9700\u8981\u9002\u914d"].concat(lines.slice(0, 3), ["\u53ef\u6267\u884c\u5efa\u8bae"], numberLines(lines).slice(0, 4));
    }

    if (platform.id === "bilibili") {
      title = cut(input.title + " | 3\u5206\u949f\u8bb2\u6e05\u695a", platform.maxTitle);
      summary = "\u672c\u671f\u9762\u5411" + input.audience + "\uff0c\u6309 B\u7ad9\u300c" + strategy.headline + "\u300d\u7684\u89c4\u5f8b\u63d0\u70bc\u770b\u70b9\u548c\u65f6\u95f4\u8f74\u3002";
      body = ["\u89c6\u9891\u7b80\u4ecb", summary, "\u770b\u70b9\u65f6\u95f4\u8f74", "00:00 \u95ee\u9898\u80cc\u666f", "00:35 \u6838\u5fc3\u65b9\u6848", "01:40 \u5e73\u53f0\u5dee\u5f02", "02:30 \u53d1\u5e03\u524d\u68c0\u67e5"].concat(lines.slice(0, 2));
    }

    if (platform.id === "xiaohongshu") {
      title = cut(input.audience + input.title + "\u907f\u5751\u6e05\u5355", platform.maxTitle);
      summary = "\u7ed9" + input.audience + "\u7684\u4e00\u4efd\u53d1\u5e03\u524d\u68c0\u67e5\u6e05\u5355\uff0c\u6309\u5c0f\u7ea2\u4e66\u300c" + strategy.headline + "\u300d\u98ce\u683c\u751f\u6210\u3002";
      body = ["\u9002\u5408\u8c01", summary, "\u53d1\u5e03\u524d\u770b\u8fd9\u51e0\u9879"].concat(shortLines(lines));
    }

    if (input.includeCta) {
      body.push("\u5982\u679c\u8fd9\u4efd\u7a3f\u4ef6\u6709\u5e2e\u52a9\uff0c\u53ef\u4ee5\u5148\u6536\u85cf\uff0c\u53d1\u5e03\u524d\u518d\u5bf9\u7167\u68c0\u67e5\u3002");
    }

    var plainText = body.join("");
    var tags = input.includeTags ? makeTags(platform, input) : [];

    return {
      platform: platform,
      title: title,
      summary: summary,
      body: body,
      tags: tags,
      metrics: {
        length: plainText.length,
        titleLength: title.length,
        tagCount: tags.length,
        sectionCount: body.length,
      },
      checks: [
        { ok: title.length <= platform.maxTitle, text: "\u6807\u9898\u4e0d\u8d85\u8fc7 " + platform.maxTitle + " \u5b57" },
        { ok: plainText.length >= platform.minLength && plainText.length <= platform.maxLength, text: "\u6b63\u6587\u5efa\u8bae " + platform.minLength + "-" + platform.maxLength + " \u5b57" },
        { ok: tags.length > 0, text: "\u5df2\u751f\u6210\u5e73\u53f0\u5206\u53d1\u6807\u7b7e" },
        { ok: analysisCount > 0, text: "\u5df2\u7ed3\u5408 AI \u5e73\u53f0\u7206\u6b3e\u5206\u6790\u7b56\u7565" },
        { ok: Boolean(editedDrafts[platform.id]), text: editedDrafts[platform.id] ? "\u5df2\u4fdd\u5b58\u4eba\u5de5\u5fae\u8c03\u7a3f" : "AI \u751f\u6210\u7a3f\u9700\u8981\u4eba\u5de5\u786e\u8ba4\u540e\u518d\u53d1\u5e03" },
        { ok: true, text: "\u672a\u76f4\u63a5\u590d\u5236\u53c2\u8003\u7206\u6b3e\u8868\u8fbe\uff0c\u4ec5\u4f7f\u7528\u7ed3\u6784\u7b56\u7565" },
        { ok: true, text: "\u5df2\u6309" + platform.name + "\u98ce\u683c\u91cd\u7ec4" },
      ],
    };
  }

  function numberLines(lines) {
    var source = lines.length ? lines : ["\u5148\u660e\u786e\u76ee\u6807\u5e73\u53f0\uff0c\u518d\u8c03\u6574\u6807\u9898\u3001\u7ed3\u6784\u548c\u4e92\u52a8\u5f15\u5bfc\u3002"];
    return source.slice(0, 5).map(function (line, index) {
      return index + 1 + ". " + line;
    });
  }

  function shortLines(lines) {
    var source = lines.length ? lines : ["\u5148\u51c6\u5907\u4e3b\u7a3f\uff0c\u518d\u751f\u6210\u4e0d\u540c\u5e73\u53f0\u7684\u7248\u672c\u3002"];
    return source.slice(0, 5).map(function (line) {
      return "- " + cut(line, 48);
    });
  }

  function makeTags(platform, input) {
    var common = {
      wechat: ["\u5185\u5bb9\u8fd0\u8425", "\u6548\u7387\u5de5\u5177", "\u521b\u4f5c\u8005"],
      zhihu: ["\u5185\u5bb9\u521b\u4f5c", "\u65b0\u5a92\u4f53\u8fd0\u8425", "\u6548\u7387\u63d0\u5347"],
      bilibili: ["\u521b\u4f5c\u5de5\u5177", "\u8fd0\u8425\u7ecf\u9a8c", "\u89c6\u9891\u53d1\u5e03"],
      xiaohongshu: ["\u535a\u4e3b\u5de5\u5177", "\u5185\u5bb9\u6a21\u677f", "\u65b0\u624b\u8fd0\u8425"],
    };
    var keyword = cut(input.title.replace(/\s+/g, ""), 8);
    return common[platform.id].concat(keyword ? [keyword] : []).slice(0, 5);
  }

  function getSelectedPlatform() {
    for (var i = 0; i < platforms.length; i += 1) {
      if (platforms[i].id === selectedId) return platforms[i];
    }
    return platforms[0];
  }

  function render() {
    var input = getInput();
    var activePlatform = getSelectedPlatform();
    var activeDraft = makeDraft(activePlatform, input);
    renderPlatformCards(input);
    renderStrategyBoard(input);
    renderPreview(activeDraft);
    renderChecks(activeDraft);
    renderMetrics(activeDraft);
    renderManualEditor(activeDraft);
    renderPublishLog();
  }

  function analyzePlatformTrends() {
    analysisCount += 1;
    byId("analyzeBtn").disabled = true;
    byId("analyzeBtn").textContent = "AI\u5206\u6790\u4e2d";
    byId("generationState").textContent = "\u6b63\u5728\u5206\u6790\u5e73\u53f0\u7206\u6b3e\u89c4\u5f8b";

    window.setTimeout(function () {
      platforms.forEach(function (platform) {
        platformStrategies[platform.id] = buildStrategy(platform, getInput());
      });
      byId("analyzeBtn").disabled = false;
      byId("analyzeBtn").textContent = "\u91cd\u65b0AI\u5206\u6790";
      byId("generationState").textContent = "\u5df2\u5f62\u6210 4 \u4e2a\u5e73\u53f0\u5185\u5bb9\u7b56\u7565";
      render();
      showToast("AI \u5df2\u5206\u6790 4 \u4e2a\u5e73\u53f0\u7684\u7206\u6b3e\u5185\u5bb9\u89c4\u5f8b");
    }, 360);
  }

  function buildStrategy(platform, input) {
    var template = strategyTemplates[platform.id];
    return {
      headline: template.headline,
      titlePatterns: template.titlePatterns,
      opening: template.opening,
      structure: template.structure,
      tags: template.tags.concat(cut(input.title.replace(/\s+/g, ""), 8)).slice(0, 5),
      risk: template.risk,
    };
  }

  function renderStrategyBoard(input) {
    var board = byId("strategyBoard");
    board.innerHTML = "";
    platforms.forEach(function (platform) {
      var strategy = platformStrategies[platform.id] || strategyTemplates[platform.id];
      var card = document.createElement("article");
      card.className = "strategy-card" + (platform.id === selectedId ? " is-active" : "");
      card.style.setProperty("--accent", platform.accent);
      card.innerHTML =
        '<div class="strategy-card-head"><span>' + platform.name + '</span><strong>' + (analysisCount ? "AI\u5df2\u5206\u6790" : "\u9884\u7f6e\u7b56\u7565") + "</strong></div>" +
        '<p class="strategy-main">' + strategy.headline + "</p>" +
        '<dl>' +
        '<div><dt>\u6807\u9898\u89c4\u5f8b</dt><dd>' + strategy.titlePatterns[0] + "</dd></div>" +
        '<div><dt>\u5f00\u5934\u65b9\u5f0f</dt><dd>' + strategy.opening + "</dd></div>" +
        '<div><dt>\u5185\u5bb9\u7ed3\u6784</dt><dd>' + strategy.structure.join(" / ") + "</dd></div>" +
        '<div><dt>\u98ce\u9669\u63d0\u9192</dt><dd>' + strategy.risk + "</dd></div>" +
        "</dl>";
      card.addEventListener("click", function () {
        selectedId = platform.id;
        render();
      });
      board.appendChild(card);
    });
  }

  function renderPlatformCards(input) {
    var grid = byId("platformGrid");
    grid.innerHTML = "";
    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, input);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "platform-card" + (platform.id === selectedId ? " is-active" : "");
      button.style.setProperty("--accent", platform.accent);
      button.innerHTML =
        '<span class="platform-name">' + platform.name + '</span>' +
        '<span class="platform-profile">' + platform.profile + '</span>' +
        '<span class="platform-stats">' + draft.metrics.length + ' \u5b57 · ' + draft.tags.length + ' \u6807\u7b7e</span>';
      button.addEventListener("click", function () {
        selectedId = platform.id;
        render();
        showToast("\u5df2\u5207\u6362\u5230" + platform.name + "\u53d1\u5e03\u7a3f");
      });
      grid.appendChild(button);
    });
  }

  function renderPreview(draft) {
    var editedText = editedDrafts[draft.platform.id];
    var previewBody = editedText ? splitLines(editedText) : draft.body;
    byId("generationBanner").textContent = generationCount
      ? "\u5df2\u751f\u6210\u7b2c " + generationCount + " \u6b21\uff1a\u5f53\u524d\u4e3a" + draft.platform.name + "\u7248\u672c"
      : "\u7b49\u5f85\u751f\u6210\u5e73\u53f0\u7a3f";
    byId("generationBanner").classList.toggle("is-ready", generationCount > 0);
    byId("previewMeta").innerHTML = '<span style="background:' + draft.platform.accent + '"></span>' + draft.platform.name + " \u53d1\u5e03\u7a3f";
    byId("previewTitle").textContent = draft.title;
    byId("previewSummary").textContent = editedText ? "\u5f53\u524d\u9884\u89c8\u4f7f\u7528\u5df2\u4fdd\u5b58\u7684\u4eba\u5de5\u5fae\u8c03\u7a3f\u3002" : draft.summary;

    var body = byId("previewBody");
    body.innerHTML = "";
    previewBody.forEach(function (line) {
      var el = document.createElement(line.length <= 8 ? "h4" : "p");
      el.textContent = line;
      body.appendChild(el);
    });

    var tags = byId("previewTags");
    tags.innerHTML = "";
    draft.tags.forEach(function (tag) {
      var chip = document.createElement("span");
      chip.textContent = "#" + tag;
      tags.appendChild(chip);
    });
  }

  function renderManualEditor(draft) {
    var input = byId("manualDraftInput");
    if (document.activeElement === input) return;
    input.value = editedDrafts[draft.platform.id] || draftToText(draft);
  }

  function renderChecks(draft) {
    var list = byId("checkList");
    list.innerHTML = "";
    draft.checks.forEach(function (check) {
      var li = document.createElement("li");
      li.className = check.ok ? "pass" : "warn";
      li.innerHTML = "<span>" + (check.ok ? "\u901a\u8fc7" : "\u6ce8\u610f") + "</span>" + check.text;
      list.appendChild(li);
    });
  }

  function renderMetrics(draft) {
    var metrics = [
      ["\u5b57\u6570", draft.metrics.length],
      ["\u6807\u9898\u957f\u5ea6", draft.metrics.titleLength],
      ["\u6807\u7b7e\u6570", draft.metrics.tagCount],
      ["\u7ed3\u6784\u5757", draft.metrics.sectionCount],
    ];
    var grid = byId("metricGrid");
    grid.innerHTML = "";
    metrics.forEach(function (item) {
      var box = document.createElement("div");
      box.className = "metric";
      box.innerHTML = "<span>" + item[0] + "</span><strong>" + item[1] + "</strong>";
      grid.appendChild(box);
    });
  }

  function renderPublishLog() {
    var box = byId("publishLog");
    box.innerHTML = "";
    if (!publishRecords.length) {
      box.innerHTML = '<p class="empty-state">\u6682\u65e0\u53d1\u5e03\u8bb0\u5f55</p>';
      return;
    }
    publishRecords.slice(0, 8).forEach(function (record) {
      var item = document.createElement("div");
      item.className = "log-item";
      item.innerHTML = '<span class="log-platform">' + record.platform + "</span><span>" + record.title + '</span><strong>' + record.status + '</strong><em>' + record.publisher + '</em>';
      box.appendChild(item);
    });
  }

  function generate() {
    generationCount += 1;
    byId("generateBtn").textContent = "\u751f\u6210\u4e2d";
    byId("generateBtn").disabled = true;
    byId("generationState").textContent = "\u6b63\u5728\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c";
    byId("generationBanner").textContent = "\u6b63\u5728\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c...";
    byId("generationBanner").classList.add("is-working");

    window.setTimeout(function () {
      byId("generateBtn").disabled = false;
      byId("generateBtn").textContent = "\u91cd\u65b0\u751f\u6210\u5e73\u53f0\u7a3f";
      byId("generationState").textContent = "\u5df2\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c";
      byId("generationBanner").classList.remove("is-working");
      render();
      showToast(analysisCount ? "\u5df2\u57fa\u4e8e AI \u5e73\u53f0\u7b56\u7565\u751f\u6210\u7a3f\u4ef6" : "\u5df2\u751f\u6210\u516c\u4f17\u53f7\u3001\u77e5\u4e4e\u3001B\u7ad9\u3001\u5c0f\u7ea2\u4e66\u7a3f\u4ef6");
    }, 250);
  }

  function publishAll() {
    var input = getInput();
    var created = [];
    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, input);
      var record = {
        platform: platform.name,
        title: draft.title,
        status: "\u53d1\u5e03\u4e2d",
        publisher: "MockPublisher",
        body: getEffectiveDraftText(draft),
      };
      created.push(record);
      publishRecords.unshift(record);
    });
    renderPublishLog();
    showToast("\u6b63\u5728\u901a\u8fc7 MockPublisher \u6a21\u62df\u53d1\u5e03");
    window.setTimeout(function () {
      created.forEach(function (record) {
        record.status = "\u5df2\u6a21\u62df\u53d1\u5e03";
      });
      renderPublishLog();
      showToast("\u5df2\u5b8c\u6210 4 \u4e2a\u5e73\u53f0\u7684\u6a21\u62df\u53d1\u5e03");
    }, 650);
  }

  function copyCurrent() {
    var draft = makeDraft(getSelectedPlatform(), getInput());
    var value = getEffectiveDraftText(draft);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast("\u5df2\u590d\u5236\u5f53\u524d\u53d1\u5e03\u7a3f");
      });
    } else {
      showToast("\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u81ea\u52a8\u590d\u5236");
    }
  }

  function getEffectiveDraftText(draft) {
    return editedDrafts[draft.platform.id] || draftToText(draft);
  }

  function draftToText(draft) {
    return [draft.title, "", draft.summary, ""].concat(draft.body, ["", draft.tags.map(function (tag) {
      return "#" + tag;
    }).join(" ")]).join("\n");
  }

  function saveManualEdit() {
    var platform = getSelectedPlatform();
    var value = byId("manualDraftInput").value.trim();
    if (!value) {
      showToast("\u5fae\u8c03\u7a3f\u4e0d\u80fd\u4e3a\u7a7a");
      return;
    }
    editedDrafts[platform.id] = value;
    render();
    showToast("\u5df2\u4fdd\u5b58" + platform.name + "\u4eba\u5de5\u5fae\u8c03\u7a3f");
  }

  function restoreAiDraft() {
    var platform = getSelectedPlatform();
    delete editedDrafts[platform.id];
    render();
    showToast("\u5df2\u6062\u590d" + platform.name + " AI \u751f\u6210\u7a3f");
  }

  function loadSample() {
    byId("sourceTitle").value = "\u5982\u4f55\u628a\u4e00\u7bc7\u5185\u5bb9\u9ad8\u6548\u53d1\u5e03\u5230\u591a\u4e2a\u5e73\u53f0";
    byId("sourceBody").value = "\u5f88\u591a\u521b\u4f5c\u8005\u4f1a\u5148\u5199\u4e00\u7bc7\u5b8c\u6574\u7a3f\u4ef6\uff0c\u518d\u5206\u522b\u590d\u5236\u5230\u516c\u4f17\u53f7\u3001\u77e5\u4e4e\u3001B\u7ad9\u3001\u5c0f\u7ea2\u4e66\u7b49\u5e73\u53f0\u3002\n\n\u66f4\u597d\u7684\u65b9\u5f0f\u662f\u4fdd\u7559\u540c\u4e00\u4e2a\u6838\u5fc3\u89c2\u70b9\uff0c\u518d\u9488\u5bf9\u5e73\u53f0\u8fdb\u884c\u683c\u5f0f\u5316\u9002\u914d\u3002\n\n\u8fd9\u4e2a\u5de5\u5177\u5e0c\u671b\u628a\u91cd\u590d\u52b3\u52a8\u81ea\u52a8\u5316\uff0c\u8f93\u5165\u4e00\u4efd\u4e3b\u7a3f\u5c31\u80fd\u751f\u6210\u4e0d\u540c\u5e73\u53f0\u7248\u672c\u3002";
    byId("audienceInput").value = "\u4e2a\u4eba\u521b\u4f5c\u8005\u548c\u65b0\u5a92\u4f53\u8fd0\u8425";
    render();
    showToast("\u6837\u4f8b\u5185\u5bb9\u5df2\u8f7d\u5165");
  }

  function resetDemo() {
    byId("sourceTitle").value = "";
    byId("sourceBody").value = "";
    byId("audienceInput").value = "";
    generationCount = 0;
    publishRecords = [];
    render();
    showToast("\u6f14\u793a\u6570\u636e\u5df2\u91cd\u7f6e");
  }

  function showToast(message) {
    var toast = byId("toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function bind() {
    ["sourceTitle", "sourceBody", "audienceInput", "toneSelect", "tagToggle", "ctaToggle"].forEach(function (id) {
      byId(id).addEventListener("input", render);
      byId(id).addEventListener("change", render);
    });
    byId("generateBtn").addEventListener("click", generate);
    byId("analyzeBtn").addEventListener("click", analyzePlatformTrends);
    byId("publishBtn").addEventListener("click", publishAll);
    byId("copyDraftBtn").addEventListener("click", copyCurrent);
    byId("saveEditBtn").addEventListener("click", saveManualEdit);
    byId("restoreDraftBtn").addEventListener("click", restoreAiDraft);
    byId("loadSampleBtn").addEventListener("click", loadSample);
    byId("resetDemoBtn").addEventListener("click", resetDemo);
  }

  window.addEventListener("error", function (event) {
    var banner = byId("generationBanner");
    if (banner) {
      banner.textContent = "\u9875\u9762\u811a\u672c\u62a5\u9519\uff1a" + event.message;
      banner.classList.add("is-working");
    }
  });

  bind();
  render();
}());
