// list_so.js - 枚举并打印目标应用加载的所有模块（so库）
console.log("\n[*] 开始枚举当前进程加载的所有模块...\n");

// 使用 Process.enumerateModules() 获取所有已加载模块的列表
var modules = Process.enumerateModules();

// 打印表头，使输出更清晰
console.log("序号\t模块名称\t\t\t基地址\t\t\t路径");
console.log("------------------------------------------------------------");

// 遍历并打印每个模块的信息
for (var i = 0; i < modules.length; i++) {
    var module = modules[i];
    // 格式化输出：序号、名称、基地址和完整路径
    console.log(
        "[" + (i + 1).toString().padStart(3, ' ') + "]\t" +
        (module.name + "\t").substring(0, 20) + "\t" + // 简单截断模块名，保持对齐
        module.base.toString().padStart(16, '0') + "\t" +
        module.path
    );
}

console.log("\n[*] 枚举完成，共发现 " + modules.length + " 个模块。");


frida -U -l ./config.js -l ./native-connect-hook.js    -l ./native-tls-hook.js   -l ./android/android-proxy-override.js   -l ./android/android-system-certificate-injection.js  -l ./android/android-certificate-unpinning.js  -l ./android/android-certificate-unpinning-fallback.js  -l ./android/android-disable-root-detection.js  -f com.zwo.seestar