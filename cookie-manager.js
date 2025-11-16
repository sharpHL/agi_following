const fs = require('fs').promises;
const path = require('path');

/**
 * Cookie 管理器
 * 负责保存、加载和管理知乎登录 Cookie
 */
class CookieManager {
  constructor(cookieFile = '.zhihu-cookies.json') {
    this.cookieFile = cookieFile;
    this.cookies = [];
  }

  /**
   * 从文件加载 Cookie
   */
  async loadCookies() {
    try {
      const cookiePath = path.resolve(this.cookieFile);
      const data = await fs.readFile(cookiePath, 'utf-8');
      this.cookies = JSON.parse(data);
      console.log(`✓ 成功加载 ${this.cookies.length} 个 Cookie`);
      return this.cookies;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('未找到 Cookie 文件，将以未登录状态运行');
        console.log('如需登录，请运行: node login-zhihu.js');
        return [];
      }
      console.error('加载 Cookie 失败:', error.message);
      return [];
    }
  }

  /**
   * 保存 Cookie 到文件
   */
  async saveCookies(cookies) {
    try {
      const cookiePath = path.resolve(this.cookieFile);
      await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2), 'utf-8');
      this.cookies = cookies;
      console.log(`✓ Cookie 已保存到: ${cookiePath}`);
      console.log(`✓ 共保存 ${cookies.length} 个 Cookie`);
      return true;
    } catch (error) {
      console.error('保存 Cookie 失败:', error.message);
      return false;
    }
  }

  /**
   * 从浏览器 context 获取 Cookie
   */
  async getCookiesFromContext(context) {
    try {
      const cookies = await context.cookies();
      return cookies;
    } catch (error) {
      console.error('获取 Cookie 失败:', error.message);
      return [];
    }
  }

  /**
   * 将 Cookie 应用到浏览器 context
   */
  async applyCookiesToContext(context, cookies = null) {
    try {
      const cookiesToApply = cookies || this.cookies;
      if (cookiesToApply.length === 0) {
        console.log('无可用 Cookie');
        return false;
      }

      await context.addCookies(cookiesToApply);
      console.log(`✓ 已应用 ${cookiesToApply.length} 个 Cookie`);
      return true;
    } catch (error) {
      console.error('应用 Cookie 失败:', error.message);
      return false;
    }
  }

  /**
   * 检查 Cookie 是否有效（通过检查关键 Cookie）
   */
  isValid() {
    if (this.cookies.length === 0) {
      return false;
    }

    // 检查知乎的关键 Cookie
    const hasZSESSID = this.cookies.some(c => c.name === 'z_c0');
    const hasSessionId = this.cookies.some(c => c.name === '_zap');

    return hasZSESSID || hasSessionId;
  }

  /**
   * 获取 Cookie 信息
   */
  getInfo() {
    return {
      count: this.cookies.length,
      isValid: this.isValid(),
      keyNames: this.cookies.map(c => c.name),
      file: this.cookieFile
    };
  }

  /**
   * 清除 Cookie
   */
  async clearCookies() {
    try {
      const cookiePath = path.resolve(this.cookieFile);
      await fs.unlink(cookiePath);
      this.cookies = [];
      console.log('✓ Cookie 已清除');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Cookie 文件不存在');
        return true;
      }
      console.error('清除 Cookie 失败:', error.message);
      return false;
    }
  }

  /**
   * 从 JSON 字符串导入 Cookie
   */
  async importFromJson(jsonString) {
    try {
      const cookies = JSON.parse(jsonString);
      if (!Array.isArray(cookies)) {
        throw new Error('Cookie 格式错误：应该是数组');
      }
      await this.saveCookies(cookies);
      return true;
    } catch (error) {
      console.error('导入 Cookie 失败:', error.message);
      return false;
    }
  }

  /**
   * 从 Netscape 格式的 Cookie 文件导入
   * （可以从浏览器插件导出的格式）
   */
  async importFromNetscape(cookieText) {
    try {
      const cookies = [];
      const lines = cookieText.split('\n');

      for (const line of lines) {
        // 跳过注释和空行
        if (line.startsWith('#') || line.trim() === '') {
          continue;
        }

        const parts = line.split('\t');
        if (parts.length >= 7) {
          cookies.push({
            name: parts[5],
            value: parts[6],
            domain: parts[0],
            path: parts[2],
            expires: parseInt(parts[4]) || -1,
            httpOnly: false,
            secure: parts[3] === 'TRUE',
            sameSite: 'Lax'
          });
        }
      }

      if (cookies.length > 0) {
        await this.saveCookies(cookies);
        return true;
      } else {
        throw new Error('未能解析出有效的 Cookie');
      }
    } catch (error) {
      console.error('导入 Netscape Cookie 失败:', error.message);
      return false;
    }
  }
}

module.exports = CookieManager;
