const { createAdaptedDrafts, platformAdapters } = window.CreatorFlowAdapters;

const sample = {
  title: "如何把一篇内容高效发布到多个平台",
  body: `很多创作者会先写一篇完整稿件，再分别复制到公众号、知乎、B站、小红书等平台。但每个平台的标题长度、表达语气、标签体系、正文结构都不一样，直接复制会导致阅读体验下降。

更好的方式是保留同一个核心观点，再针对平台进行格式化适配。公众号需要完整结构，知乎需要论证逻辑，B站需要视频简介和时间轴，小红书需要短句和标签。

这个工具希望把重复劳动自动化：用户只需要输入一份主稿，系统就能生成不同平台的标题、摘要、正文、标签和发布前检查，并支持模拟一键发布。`,
  audience: "个人创作者和新媒体运营",
};

const storageKey = "creator-flow-state-v1";
const elements = {
  title: document.querySelector("#sourceTitle"),
  body: document.querySelector("#sourceBody"),
  audience: document.querySelector("#audienceInput"),
  tone: document.querySelector("#toneSelect"),
  tags: document.querySelector("#tagToggle"),
  cta: document.querySelector("#ctaToggle"),
  platformGrid: document.querySelector("#platformGrid"),
  previewMeta: document.querySelector("#previewMeta"),
  generationBanner: document.querySelector("#generationBanner"),
  previewTitle: document.querySelector("#previewTitle"),
  previewSummary: document.querySelector("#previewSummary"),
  previewBody: document.querySelector("#previewBody"),
  previewTags: document.querySelector("#previewTags"),
  checkList: document.querySelector("#checkList"),
  metricGrid: document.querySelector("#metricGrid"),
  publishLog: document.querySelector("#publishLog"),
  publishBtn: document.querySelector("#publishBtn"),
  generateBtn: document.querySelector("#generateBtn"),
  copyDraftBtn: document.querySelector("#copyDraftBtn"),
  generationState: document.querySelector("#generationState"),
  toast: document.querySelector("#toast"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  resetDemoBtn: document.querySelector("#resetDemoBtn"),
};

let state = loadState();
let toastTimer = null;

function loadState() {
  const fallback = {
    source: sample,
    selectedPlatform: "wechat",
    enabledPlatforms: ["wechat", "zhihu", "bilibili", "xiaohongshu"],
    options: {
      tone: "balanced",
      includeTags: true,
      includeCta: true,
      audience: sample.audience,
    },
    publishLog: [],
    generationCount: 0,
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey)) };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function syncForm() {
  elements.title.value = state.source.title;
  elements.body.value = state.source.body;
  elements.audience.value = state.options.audience;
  elements.tone.value = state.options.tone;
  elements.tags.checked = state.options.includeTags;
  elements.cta.checked = state.options.includeCta;
}

function getDrafts() {
  return createAdaptedDrafts(state.source, state.options);
}

function render() {
  const drafts = getDrafts();
  const activeDraft = drafts[state.selectedPlatform] || drafts.wechat;
  renderPlatforms(drafts);
  renderPreview(activeDraft);
  renderChecks(activeDraft);
  renderMetrics(activeDraft);
  renderPublishLog();
  saveState();
}

function renderPlatforms(drafts) {
  elements.platformGrid.innerHTML = "";
  Object.values(platformAdapters).forEach((platform) => {
    const draft = drafts[platform.id];
    const button = document.createElement("button");
    button.className = `platform-card${state.selectedPlatform === platform.id ? " is-active" : ""}`;
    button.type = "button";
    button.style.setProperty("--accent", platform.accent);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", state.selectedPlatform === platform.id ? "true" : "false");
    button.innerHTML = `
      <span class="platform-name">${platform.name}</span>
      <span class="platform-profile">${platform.profile}</span>
      <span class="platform-stats">${draft.metrics.字数} 字 · ${draft.tags.length} 标签</span>
    `;
    button.addEventListener("click", () => {
      state.selectedPlatform = platform.id;
      render();
      showToast(`已切换到${platform.name}发布稿`);
    });
    elements.platformGrid.appendChild(button);
  });
}

function renderPreview(draft) {
  elements.generationBanner.textContent = state.generationCount
    ? `已生成第 ${state.generationCount} 次：当前为${draft.platformName}版本`
    : "等待生成平台稿";
  elements.generationBanner.classList.toggle("is-ready", state.generationCount > 0);
  elements.previewMeta.innerHTML = `<span style="background:${draft.accent}"></span>${draft.platformName} 发布稿`;
  elements.previewTitle.textContent = draft.title;
  elements.previewSummary.textContent = draft.summary;
  elements.previewBody.innerHTML = "";
  draft.body.forEach((line) => {
    const block = document.createElement(line.length <= 8 ? "h4" : "p");
    block.textContent = line;
    elements.previewBody.appendChild(block);
  });
  elements.previewTags.innerHTML = "";
  draft.tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = `#${tag}`;
    elements.previewTags.appendChild(chip);
  });
}

function renderChecks(draft) {
  elements.checkList.innerHTML = "";
  draft.checks.forEach((check) => {
    const item = document.createElement("li");
    item.className = check.ok ? "pass" : "warn";
    item.innerHTML = `<span>${check.ok ? "通过" : "注意"}</span>${check.text}`;
    elements.checkList.appendChild(item);
  });
}

function renderMetrics(draft) {
  elements.metricGrid.innerHTML = "";
  Object.entries(draft.metrics).forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "metric";
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    elements.metricGrid.appendChild(item);
  });
}

function renderPublishLog() {
  if (!state.publishLog.length) {
    elements.publishLog.innerHTML = `<p class="empty-state">暂无发布记录</p>`;
    return;
  }
  elements.publishLog.innerHTML = "";
  state.publishLog.slice(0, 8).forEach((record) => {
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <span class="log-platform">${record.platform}</span>
      <span>${record.title}</span>
      <strong>${record.status}</strong>
    `;
    elements.publishLog.appendChild(item);
  });
}

function updateFromForm() {
  state.source.title = elements.title.value;
  state.source.body = elements.body.value;
  state.options.audience = elements.audience.value || "目标读者";
  state.options.tone = elements.tone.value;
  state.options.includeTags = elements.tags.checked;
  state.options.includeCta = elements.cta.checked;
  elements.generationState.textContent = "正在实时适配";
  render();
  window.clearTimeout(elements.generationState.dataset.timer);
  elements.generationState.dataset.timer = window.setTimeout(() => {
    elements.generationState.textContent = "已根据当前内容生成";
  }, 500);
}

function publishAll() {
  const drafts = getDrafts();
  const now = new Date();
  const records = state.enabledPlatforms.map((id) => ({
    id: `${id}-${now.getTime()}`,
    platform: platformAdapters[id].name,
    title: drafts[id].title,
    status: "已模拟发布",
    createdAt: now.toISOString(),
  }));
  state.publishLog = [...records, ...state.publishLog];
  render();
  showToast("已完成 4 个平台的模拟发布");
}

function loadSample() {
  state.source = { title: sample.title, body: sample.body, audience: sample.audience };
  state.options.audience = sample.audience;
  syncForm();
  render();
  showToast("样例内容已载入");
}

function resetDemo() {
  localStorage.removeItem(storageKey);
  state = loadState();
  syncForm();
  render();
  showToast("演示数据已重置");
}

function generateDrafts() {
  state.generationCount = (state.generationCount || 0) + 1;
  elements.generationState.textContent = "正在生成平台稿";
  elements.generationBanner.textContent = "正在生成 4 个平台版本...";
  elements.generationBanner.classList.add("is-working");
  elements.generateBtn.disabled = true;
  elements.generateBtn.textContent = "生成中";
  window.setTimeout(() => {
    render();
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = "重新生成平台稿";
    elements.generationState.textContent = "已生成 4 个平台版本";
    elements.generationBanner.classList.remove("is-working");
    elements.generationBanner.classList.add("is-pop");
    window.setTimeout(() => elements.generationBanner.classList.remove("is-pop"), 450);
    showToast("公众号、知乎、B站、小红书稿件已生成");
  }, 320);
}

async function copyCurrentDraft() {
  const draft = getDrafts()[state.selectedPlatform];
  const text = [
    draft.title,
    "",
    draft.summary,
    "",
    ...draft.body,
    "",
    draft.tags.map((tag) => `#${tag}`).join(" "),
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast(`已复制${draft.platformName}发布稿`);
  } catch {
    showToast("当前浏览器不支持自动复制，可手动选中预览内容");
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

["input", "change"].forEach((eventName) => {
  [elements.title, elements.body, elements.audience, elements.tone, elements.tags, elements.cta].forEach((element) => {
    element.addEventListener(eventName, updateFromForm);
  });
});

elements.publishBtn.addEventListener("click", publishAll);
elements.generateBtn.addEventListener("click", generateDrafts);
elements.copyDraftBtn.addEventListener("click", copyCurrentDraft);
elements.loadSampleBtn.addEventListener("click", loadSample);
elements.resetDemoBtn.addEventListener("click", resetDemo);

syncForm();
render();
