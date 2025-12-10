console.log("[*] 启动全局 SecureX509TrustManager 监控脚本");
console.log("[*] 目标：Hook所有构造函数强制加载系统CA + 监控所有验证方法");

Java.perform(function() {
    var targetClass = "com.huawei.secure.android.common.ssl.SecureX509TrustManager";
    
    try {
        var SecureX509TM = Java.use(targetClass);
        var X509Certificate = Java.use("java.security.cert.X509Certificate");
        var ArrayList = Java.use("java.util.ArrayList");
        var System = Java.use("java.lang.System");
        
        // ==================== 辅助函数 ====================
        
        // 获取当前时间戳
        function getTimestamp() {
            return new Date().toLocaleTimeString() + "." + System.currentTimeMillis() % 1000;
        }
        
        // 提取证书详细信息
        function extractCertInfo(cert, index) {
            if (!cert) return {index: index, summary: "NULL证书"};
            
            var info = {index: index};
            try { info.subject = cert.getSubjectDN().getName().replace(/CN=|OU=|O=|L=|ST=|C=/g, "").trim(); } catch(e) { info.subject = "N/A"; }
            try { info.issuer = cert.getIssuerDN().getName().replace(/CN=|OU=|O=|L=|ST=|C=/g, "").trim(); } catch(e) { info.issuer = "N/A"; }
            try { info.serial = cert.getSerialNumber().toString(16).toUpperCase(); } catch(e) { info.serial = "N/A"; }
            try { info.sigAlg = cert.getSigAlgName(); } catch(e) { info.sigAlg = "N/A"; }
            try { 
                var notBefore = cert.getNotBefore();
                var notAfter = cert.getNotAfter();
                info.validity = notBefore.toLocaleDateString() + " → " + notAfter.toLocaleDateString();
                info.daysLeft = Math.floor((notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            } catch(e) { info.validity = "N/A"; info.daysLeft = 0; }
            
            // SAN信息
            try {
                var sans = cert.getSubjectAlternativeNames();
                if (sans) {
                    info.sanCount = sans.size();
                    info.sanTypes = [];
                    var iter = sans.iterator();
                    while (iter.hasNext()) {
                        var entry = iter.next();
                        var type = entry.get(0);
                        var value = entry.get(1);
                        if (!info.sanTypes.includes(type)) info.sanTypes.push(type);
                    }
                }
            } catch(e) {}
            
            info.summary = "#" + index + ": CN=" + info.subject.split(",")[0] + " (签发者:" + info.issuer.split(",")[0] + ")";
            return info;
        }
        
        // 打印证书链
        function printCertChain(chain, title) {
            console.log("\n" + "📜".repeat(25));
            console.log("📜 " + title + " - 证书链分析");
            console.log("📜".repeat(25));
            
            if (!chain || chain.length === 0) {
                console.log("   空证书链");
                return;
            }
            
            for (var i = 0; i < chain.length; i++) {
                var certInfo = extractCertInfo(chain[i], i);
                var prefix = i === 0 ? "🌐 叶子证书" : i === chain.length - 1 ? "🔒 根证书" : "🔗 中间证书";
                
                console.log("\n" + prefix + " " + certInfo.summary);
                console.log("    ├─ 完整主题: " + certInfo.subject);
                console.log("    ├─ 完整签发者: " + certInfo.issuer);
                console.log("    ├─ 序列号: 0x" + certInfo.serial);
                console.log("    ├─ 签名算法: " + certInfo.sigAlg);
                console.log("    ├─ 有效期: " + certInfo.validity);
                console.log("    └─ 剩余天数: " + (certInfo.daysLeft > 0 ? certInfo.daysLeft + "天" : "已过期"));
                
                if (certInfo.sanCount) {
                    console.log("    ├─ SAN数量: " + certInfo.sanCount + " (类型: " + certInfo.sanTypes.join(",") + ")");
                }
                
                // 对叶子证书额外检查
                if (i === 0) {
                    try {
                        var basicConstraints = chain[i].getBasicConstraints();
                        if (basicConstraints === -1) {
                            console.log("    └─ 基本约束: 非CA证书 ✓");
                        } else {
                            console.log("    ⚠️ 基本约束: 路径长度=" + basicConstraints);
                        }
                    } catch(e) {}
                }
            }
            console.log("📜".repeat(25) + "\n");
        }
        
        // 确保加载系统CA的函数
        function ensureSystemCALoaded(instance) {
            try {
                // 获取内部TrustManager列表
                var list = instance.f1956a.value;
                var hasSystemCA = false;
                
                if (list && list.size() > 0) {
                    // 检查是否已包含系统CA
                    for (var i = 0; i < list.size(); i++) {
                        var tm = list.get(i);
                        var className = tm.$className;
                        if (className && (className.includes("System") || 
                                          className.includes("Conscrypt") || 
                                          className.includes("AndroidCAStore"))) {
                            hasSystemCA = true;
                            break;
                        }
                    }
                    
                    if (!hasSystemCA) {
                        console.log("   ⚙️  检测到缺少系统CA，正在尝试加载...");
                        try {
                            // 尝试调用a()方法加载系统CA（私有方法）
                            Java.use(targetClass).a.overload().call(instance);
                            console.log("   ✅  系统CA加载完成");
                        } catch(e) {
                            console.log("   ⚠️  系统CA加载失败: " + e.message);
                        }
                    } else {
                        console.log("   ✅  已包含系统CA");
                    }
                    
                    // 打印最终列表
                    var finalList = instance.f1956a.value;
                    console.log("   📊  最终TrustManager列表 (" + finalList.size() + "个):");
                    for (var j = 0; j < finalList.size(); j++) {
                        try {
                            var tm = finalList.get(j);
                            var name = tm.$className || "Unknown";
                            console.log("      [" + j + "] " + name.substring(name.lastIndexOf(".") + 1));
                        } catch(e) {}
                    }
                } else {
                    console.log("   ⚠️  TrustManager列表为空，尝试初始化系统CA");
                    try {
                        Java.use(targetClass).a.overload().call(instance);
                    } catch(e) {}
                }
            } catch(e) {
                console.log("   确保系统CA时出错: " + e.message);
            }
        }
        
        // ==================== HOOK所有构造函数 ====================
        
        console.log("\n[1/3] 安装构造函数Hook...");
        
        // 1. (Context) 构造函数
        try {
            SecureX509TM.$init.overload('android.content.Context').implementation = function(context) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(Context)");
                console.log("   时间: " + getTimestamp());
                console.log("   上下文: " + context);
                
                // 调用原构造函数
                var result = this.$init(context);
                
                // 确保加载系统CA
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(Context)");
        } catch(e) {}
        
        // 2. (Context, boolean) 构造函数
        try {
            SecureX509TM.$init.overload('android.content.Context', 'boolean').implementation = function(context, loadSystemCA) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(Context, boolean)");
                console.log("   时间: " + getTimestamp());
                console.log("   上下文: " + context);
                console.log("   原始loadSystemCA参数: " + loadSystemCA);
                
                // 强制设置为true加载系统CA
                console.log("   🔧 强制修改参数为: true (确保加载系统CA)");
                var result = this.$init(context, true);
                
                // 确保系统CA已加载
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(Context, boolean)");
        } catch(e) {}
        
        // 3. (String) 构造函数
        try {
            SecureX509TM.$init.overload('java.lang.String').implementation = function(path) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(String)");
                console.log("   时间: " + getTimestamp());
                console.log("   证书路径: " + path);
                
                var result = this.$init(path);
                
                // 确保加载系统CA
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(String)");
        } catch(e) {}
        
        // 4. (String, boolean) 构造函数
        try {
            SecureX509TM.$init.overload('java.lang.String', 'boolean').implementation = function(path, loadSystemCA) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(String, boolean)");
                console.log("   时间: " + getTimestamp());
                console.log("   证书路径: " + path);
                console.log("   原始loadSystemCA参数: " + loadSystemCA);
                
                // 强制设置为true加载系统CA
                console.log("   🔧 强制修改参数为: true");
                var result = this.$init(path, true);
                
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(String, boolean)");
        } catch(e) {}
        
        // 5. (InputStream, String) 构造函数
        try {
            SecureX509TM.$init.overload('java.io.InputStream', 'java.lang.String').implementation = function(inputStream, password) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(InputStream, String)");
                console.log("   时间: " + getTimestamp());
                console.log("   输入流: " + inputStream);
                console.log("   密码: " + (password ? "已设置" : "空"));
                
                var result = this.$init(inputStream, password);
                
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(InputStream, String)");
        } catch(e) {}
        
        // 6. (InputStream, String, boolean) 构造函数
        try {
            SecureX509TM.$init.overload('java.io.InputStream', 'java.lang.String', 'boolean').implementation = function(inputStream, password, loadSystemCA) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(InputStream, String, boolean)");
                console.log("   时间: " + getTimestamp());
                console.log("   输入流: " + inputStream);
                console.log("   密码: " + (password ? "已设置" : "空"));
                console.log("   原始loadSystemCA参数: " + loadSystemCA);
                
                console.log("   🔧 强制修改参数为: true");
                var result = this.$init(inputStream, password, true);
                
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(InputStream, String, boolean)");
        } catch(e) {}
        
        // 7. (String, boolean) 抛出异常版本 - 如果有的话
        try {
            SecureX509TM.$init.overload('java.lang.String', 'boolean').implementation = function(str, loadSystemCA) {
                console.log("\n" + "=".repeat(60));
                console.log("🚀 构造函数调用: SecureX509TrustManager(String, boolean) - 带异常处理");
                console.log("   时间: " + getTimestamp());
                console.log("   字符串: " + str);
                console.log("   原始loadSystemCA参数: " + loadSystemCA);
                
                // 强制设置为true
                console.log("   🔧 强制修改参数为: true");
                var result;
                try {
                    result = this.$init(str, true);
                } catch(th) {
                    console.log("   ⚠️  构造函数抛出异常: " + th);
                    throw th;
                }
                
                ensureSystemCALoaded(this);
                
                console.log("=".repeat(60));
                return result;
            };
            console.log("   ✓ Hooked: SecureX509TrustManager(String, boolean) - 异常版本");
        } catch(e) {}
        
        // ==================== HOOK验证方法 ====================
        
        console.log("\n[2/3] 安装验证方法Hook...");
        
        // checkServerTrusted方法
        SecureX509TM.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function(chain, authType) {
            console.log("\n" + "🛡️".repeat(25));
            console.log("🛡️ checkServerTrusted 被调用");
            console.log("   时间: " + getTimestamp());
            console.log("   认证类型: " + authType);
            
            // 打印证书链信息
            printCertChain(chain, "服务器证书验证");
            
            // 检查内部TrustManager状态
            var innerManagers = this.f1956a.value;
            var totalManagers = innerManagers ? innerManagers.size() : 0;
            console.log("🔍 验证配置: " + totalManagers + " 个TrustManager可用");
            
            // 执行验证并记录结果
            var success = false;
            var lastError = null;
            
            for (var i = 0; i < totalManagers; i++) {
                try {
                    var manager = innerManagers.get(i);
                    var managerName = manager.$className ? 
                        manager.$className.substring(manager.$className.lastIndexOf(".") + 1) : "Unknown-" + i;
                    
                    console.log("   [" + (i+1) + "/" + totalManagers + "] 尝试: " + managerName);
                    manager.checkServerTrusted(chain, authType);
                    
                    console.log("   ✅ 验证通过 (通过 " + managerName + ")");
                    success = true;
                    break;
                } catch(e) {
                    lastError = e;
                    var errMsg = e.getMessage() || e.toString();
                    console.log("   ❌ 失败: " + errMsg.substring(0, Math.min(80, errMsg.length)));
                }
            }
            
            console.log("\n📊 最终验证结果: " + (success ? "✅ 通过" : "❌ 失败"));
            
            if (success) {
                // 调用原始方法
                return this.checkServerTrusted.callOriginal(chain, authType);
            } else {
                console.log("   🔓 脚本选择: 绕过验证，直接放行");
                // 绕过验证 - 直接返回
                return;
            }
            
            console.log("🛡️".repeat(25) + "\n");
        };
        console.log("   ✓ Hooked: checkServerTrusted");
        
        // checkClientTrusted方法
        SecureX509TM.checkClientTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function(chain, authType) {
            console.log("\n" + "👤".repeat(25));
            console.log("👤 checkClientTrusted 被调用 (客户端验证)");
            console.log("   时间: " + getTimestamp());
            console.log("   认证类型: " + authType);
            
            printCertChain(chain, "客户端证书验证");
            
            // 直接调用原始方法
            console.log("   执行原始验证逻辑...");
            var result = this.checkClientTrusted.callOriginal(chain, authType);
            console.log("   客户端验证完成");
            console.log("👤".repeat(25) + "\n");
            
            return result;
        };
        console.log("   ✓ Hooked: checkClientTrusted");
        
        // ==================== HOOK其他关键方法 ====================
        
        console.log("\n[3/3] 安装辅助方法Hook...");
        
        // getAcceptedIssuers方法
        SecureX509TM.getAcceptedIssuers.implementation = function() {
            var result = this.getAcceptedIssuers();
            console.log("\n📋 getAcceptedIssuers 被调用");
            console.log("   返回 " + result.length + " 个根证书");
            
            if (result.length > 0) {
                console.log("   前5个根证书摘要:");
                for (var i = 0; i < Math.min(5, result.length); i++) {
                    try {
                        var cert = result[i];
                        var subject = cert.getSubjectDN().getName().replace(/CN=/g, "").split(",")[0];
                        var issuer = cert.getIssuerDN().getName().replace(/CN=/g, "").split(",")[0];
                        console.log("     [" + i + "] " + subject + " (由 " + issuer + " 签发)");
                    } catch(e) {}
                }
            }
            
            return result;
        };
        console.log("   ✓ Hooked: getAcceptedIssuers");
        
        // setChain方法
        SecureX509TM.setChain.implementation = function(chain) {
            console.log("\n🔗 setChain 被调用");
            console.log("   设置证书链，长度: " + (chain ? chain.length : 0));
            return this.setChain.callOriginal(chain);
        };
        console.log("   ✓ Hooked: setChain");
        
        console.log("\n" + "🎯".repeat(30));
        console.log("🎯 全局Hook安装完成!");
        console.log("🎯 监控:");
        console.log("   • 7个构造函数 - 强制加载系统CA");
        console.log("   • checkServerTrusted - 详细证书分析");
        console.log("   • checkClientTrusted - 客户端证书监控");
        console.log("   • 其他关键方法");
        console.log("🎯 等待HTTPS/TLS连接触发...");
        console.log("🎯".repeat(30) + "\n");
        
    } catch (mainError) {
        console.log("[!] 主Hook安装失败: " + mainError.message);
        console.log("[!] 堆栈: " + mainError.stack);
        
        // 尝试查找正确的类名
        console.log("\n[*] 尝试搜索可能的类名...");
        var classes = Java.enumerateLoadedClassesSync();
        var candidates = [];
        
        for (var i = 0; i < classes.length; i++) {
            var name = classes[i];
            if ((name.toLowerCase().includes("secure") && name.toLowerCase().includes("ssl")) ||
                (name.toLowerCase().includes("x509") && name.toLowerCase().includes("trust"))) {
                candidates.push(name);
            }
        }
        
        if (candidates.length > 0) {
            console.log("[*] 找到候选类:");
            candidates.forEach(function(c) {
                console.log("    - " + c);
            });
            console.log("[*] 请修改脚本中的 targetClass 变量为正确的类名");
        }
    }
});

// 保持脚本活跃
setImmediate(function() {
    console.log("[*] 脚本已注入并保持活跃");
    console.log("[*] 按 Ctrl+C 退出监控\n");
});