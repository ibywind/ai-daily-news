/**
 * AI Daily News - 前端交互
 * MetaBlog 风格交互效果
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initCategoryFilter();
  initSearchHighlight();
  initSmoothScroll();
  initDailySummary();
}

// 分类筛选功能
function initCategoryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const categorySections = document.querySelectorAll('.category-section');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      
      // 更新按钮状态
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 筛选内容
      categorySections.forEach(section => {
        if (category === 'all' || section.dataset.category === category) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      });
      
      // 更新导航链接状态
      updateNavActiveState(category);
    });
  });
}

// 更新导航激活状态
function updateNavActiveState(category) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (category === 'all' && link.getAttribute('href') === '#') {
      link.classList.add('active');
    } else if (link.getAttribute('href') === `#${category}`) {
      link.classList.add('active');
    }
  });
}

// 滚动动画
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };
  
  // 卡片进入动画
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.remove('card-hidden');
          entry.target.classList.add('card-visible');
        }, index * 80);
        cardObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // 分类区域进入动画
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // 观察所有卡片
  document.querySelectorAll('.news-card').forEach(card => {
    card.classList.add('card-hidden');
    cardObserver.observe(card);
  });
  
  // 观察所有分类区域
  document.querySelectorAll('.category-section').forEach(section => {
    sectionObserver.observe(section);
  });
}

// 搜索高亮
function initSearchHighlight() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.news-card');
    
    cards.forEach(card => {
      const title = card.querySelector('.news-title').textContent.toLowerCase();
      const summary = card.querySelector('.news-summary').textContent.toLowerCase();
      
      if (query === '' || title.includes(query) || summary.includes(query)) {
        card.style.display = 'block';
        card.style.opacity = '1';
      } else {
        card.style.opacity = '0.3';
      }
    });
  });
  
  // 清除搜索时恢复所有卡片
  searchInput.addEventListener('blur', () => {
    if (searchInput.value === '') {
      document.querySelectorAll('.news-card').forEach(card => {
        card.style.opacity = '1';
      });
    }
  });
}

// 平滑滚动
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // 如果目标被隐藏（筛选状态），先显示全部
        if (targetElement.style.display === 'none') {
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
              btn.classList.add('active');
            }
          });
          
          document.querySelectorAll('.category-section').forEach(section => {
            section.style.display = 'block';
          });
        }
        
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// 工具函数：格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// 工具函数：复制到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
  }
}

// 显示提示
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(139, 92, 246, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 100px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// 内容预览功能
function initContentPreview() {
  const newsCards = document.querySelectorAll('.news-card-link');
  
  newsCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const content = card.dataset.content;
      if (!content) return;
      
      const existingTooltip = document.querySelector('.content-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      
      const tooltip = document.createElement('div');
      tooltip.className = 'content-tooltip';
      tooltip.innerHTML = `
        <div class="tooltip-content">${formatContent(content)}</div>
        <div class="tooltip-arrow"></div>
      `;
      
      document.body.appendChild(tooltip);
      
      const rect = card.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let top = rect.top - tooltipRect.height - 10;
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      
      if (top < 10) {
        top = rect.bottom + 10;
      }
      
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    });
    
    card.addEventListener('mouseleave', () => {
      const tooltip = document.querySelector('.content-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

// 格式化内容，优化排版
function formatContent(content) {
  if (!content) return '';
  
  // 移除多余的空白行
  let formatted = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .trim();
  
  // 限制最大长度
  if (formatted.length > 3000) {
    formatted = formatted.substring(0, 3000) + '...';
  }
  
  return formatted;
}

// 日报汇总功能
function initDailySummary() {
}

// 显示日报汇总
async function showDailySummary() {
  try {
    const response = await fetch('data/daily-summary.json');
    if (!response.ok) {
      throw new Error('无法加载汇总数据');
    }
    
    const summary = await response.json();
    displaySummary(summary);
  } catch (error) {
    console.error('加载汇总失败:', error);
    showToast('汇总数据加载失败，请先生成汇总');
  }
}

// 显示汇总模态框
function displaySummary(summary) {
  const modal = document.createElement('div');
  modal.className = 'summary-modal';
  modal.innerHTML = `
    <div class="summary-overlay" onclick="this.closest('.summary-modal').remove()"></div>
    <div class="summary-content">
      <div class="summary-header">
        <div>
          <h2 class="summary-title">📋 日报汇总</h2>
          <div class="summary-date">${summary.date}</div>
        </div>
        <button class="summary-close" onclick="this.closest('.summary-modal').remove()">✕</button>
      </div>
      <div class="summary-body">
        ${generateSummaryHTML(summary)}
      </div>
      <div class="summary-footer">
        <button class="summary-copy-btn" onclick="copySummary()">📋 复制汇总</button>
        <button class="summary-close-btn" onclick="this.closest('.summary-modal').remove()">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// 生成汇总 HTML
function generateSummaryHTML(summary) {
  let html = '';
  
  html += `
    <div class="summary-overall">
      <div class="summary-overall-title">📌 整体摘要</div>
      <div class="summary-overall-text">${summary.overallSummary}</div>
    </div>
  `;
  
  summary.categories.forEach(cat => {
    html += `
      <div class="summary-category">
        <div class="summary-category-header">
          <span class="summary-category-icon">${cat.icon}</span>
          <span class="summary-category-name">${cat.name}</span>
        </div>
        <div class="summary-category-summary">${cat.categorySummary}</div>
        <div class="summary-key-points">
          ${cat.keyPoints.map(point => `<div class="summary-key-point">• ${point}</div>`).join('')}
        </div>
        <div class="summary-news-list">
    `;
    
    cat.news.forEach(news => {
      html += `
        <div class="summary-news-item">
          <div class="summary-news-title">${news.title}</div>
          <div class="summary-news-summary">${news.summary}</div>
          ${news.keyInsights && news.keyInsights.length > 0 ? `
            <div class="summary-news-insights">
              ${news.keyInsights.map(insight => `<div class="summary-news-insight">💡 ${insight}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  return html;
}

// 复制汇总内容
function copySummary() {
  const modal = document.querySelector('.summary-modal');
  if (!modal) return;
  
  const summaryText = generateSummaryText();
  
  navigator.clipboard.writeText(summaryText).then(() => {
    showToast('汇总已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
    showToast('复制失败');
  });
}

// 生成汇总文本
function generateSummaryText() {
  const summary = window.currentSummary;
  if (!summary) return '';
  
  let text = '📋 AI 日报汇总\n';
  text += '====================\n\n';
  text += `日期：${summary.date}\n\n`;
  
  text += '【整体摘要】\n';
  text += `${summary.overallSummary}\n\n`;
  
  summary.categories.forEach(cat => {
    text += `【${cat.name}】\n`;
    text += '----------------\n';
    text += `分类摘要：${cat.categorySummary}\n\n`;
    text += '关键点：\n';
    cat.keyPoints.forEach((point, index) => {
      text += `  ${index + 1}. ${point}\n`;
    });
    text += '\n';
    
    text += '新闻列表：\n';
    cat.news.forEach((news, index) => {
      text += `  ${index + 1}. ${news.title}\n`;
      text += `     ${news.summary}\n`;
      if (news.keyInsights && news.keyInsights.length > 0) {
        text += `     关键洞察：${news.keyInsights.join('；')}\n`;
      }
      text += '\n';
    });
    text += '\n';
  });
  
  return text;
}

// 保存当前汇总数据用于复制
function displaySummary(summary) {
  window.currentSummary = summary;
  
  const modal = document.createElement('div');
  modal.className = 'summary-modal';
  modal.innerHTML = `
    <div class="summary-overlay" onclick="this.closest('.summary-modal').remove()"></div>
    <div class="summary-content">
      <div class="summary-header">
        <div>
          <h2 class="summary-title">📋 日报汇总</h2>
          <div class="summary-date">${summary.date}</div>
        </div>
        <button class="summary-close" onclick="this.closest('.summary-modal').remove()">✕</button>
      </div>
      <div class="summary-body">
        ${generateSummaryHTML(summary)}
      </div>
      <div class="summary-footer">
        <button class="summary-copy-btn" onclick="copySummary()">📋 复制汇总</button>
        <button class="summary-close-btn" onclick="this.closest('.summary-modal').remove()">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// 导出 API
window.AIDailyNews = {
  formatDate,
  copyToClipboard,
  showToast
};
