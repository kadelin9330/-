
#include"pefield.h"

// 更新函数指针定义以匹配新的DLL函数签名
typedef void (*EncryptSectionsFunc)(BYTE*, const std::vector<IMAGE_SECTION_HEADER>&, DWORD, bool);
typedef void* (*GetDecryptStubFunc)(bool, DWORD*);

int main(int argc, char* argv[]) {
    PEFile peFile;
    std::string inputFile;

    if (argc > 1) {
        inputFile = argv[1]; // 第一个命令行参数作为文件名
    }
    else {
        std::cout << "请输入文件名: ";
        std::cin >> inputFile;
    }


    std::string outputFile = "target_packed.exe";

    // 读取PE文件
    if (!ReadPEFile(inputFile, peFile)) {
        std::cerr << "读取PE文件失败" << std::endl;
        return 1;
    }

    std::cout << "成功读取PE文件，架构: " << (peFile.is64Bit ? "64位" : "32位") << std::endl;

    // 获取原始OEP
    DWORD originalOEP = peFile.is64Bit ?
        peFile.ntHeaders64->OptionalHeader.AddressOfEntryPoint :
        peFile.ntHeaders32->OptionalHeader.AddressOfEntryPoint;

    std::cout << "原始OEP: 0x" << std::hex << originalOEP << std::endl;

    // 处理ASLR和重定位
    //ProcessRelocations(peFile);

    // 加载CryptoDLL
    HMODULE hCryptoDLL = LoadLibrary(L"CryptoDLL.dll");
    if (!hCryptoDLL) {
        std::cerr << "无法加载CryptoDLL.dll" << std::endl;
        return 1;
    }

    // 获取加密函数
    EncryptSectionsFunc pEncryptSections = (EncryptSectionsFunc)GetProcAddress(hCryptoDLL, "EncryptSections");
    if (!pEncryptSections) {
        std::cerr << "无法获取EncryptSections函数" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }

    // 获取解密存根函数
    GetDecryptStubFunc pGetDecryptStub = (GetDecryptStubFunc)GetProcAddress(hCryptoDLL, "GetDecryptStub");
    if (!pGetDecryptStub) {
        std::cerr << "无法获取GetDecryptStub函数" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }

    // 准备节信息向量
    std::vector<IMAGE_SECTION_HEADER> sectionHeaders;
    for (auto section : peFile.sections) {
        sectionHeaders.push_back(*section);
    }

    // 使用DLL中的函数加密节数据
    pEncryptSections(peFile.data.data(), sectionHeaders, originalOEP, peFile.is64Bit);
    std::cout << "节数据已加密" << std::endl;

    // 获取解密存根
    DWORD stubSize = 0;
    void* decryptStubPtr = pGetDecryptStub(peFile.is64Bit, &stubSize);

    if (!decryptStubPtr) {
        std::cerr << "获取解密存根失败" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }

    // 将解密存根复制到vector中
    std::vector<BYTE> decryptStub(stubSize);
    memcpy(decryptStub.data(), decryptStubPtr, stubSize);
    delete[] static_cast<BYTE*>(decryptStubPtr); // 释放DLL分配的内存

    // 添加.shell节
    if (!AddShellSection(peFile, decryptStub.size())) {
        std::cerr << "添加.shell节失败" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }
    std::cout << "已添加.shell节" << std::endl;

    // 将解密存根写入新节
    PIMAGE_SECTION_HEADER shellSection = peFile.sections.back();
    DWORD stubOffset = shellSection->PointerToRawData;
    if (stubOffset + decryptStub.size() > peFile.data.size()) {
        std::cerr << "存根代码超出文件范围" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }

    memcpy(peFile.data.data() + stubOffset, decryptStub.data(), decryptStub.size());
    std::cout << "解密存根已写入.shell节" << std::endl;

    // 更新OEP指向新节
    DWORD newOEP = shellSection->VirtualAddress;
    if (peFile.is64Bit) {
        peFile.ntHeaders64->OptionalHeader.AddressOfEntryPoint = newOEP;
    }
    else {
        peFile.ntHeaders32->OptionalHeader.AddressOfEntryPoint = newOEP;
    }
    std::cout << "OEP已更新: 0x" << std::hex << newOEP << std::endl;

    // 保存加壳后的文件
    if (!SavePEFile(outputFile, peFile)) {
        std::cerr << "保存文件失败" << std::endl;
        FreeLibrary(hCryptoDLL);
        return 1;
    }

    // 释放DLL
    FreeLibrary(hCryptoDLL);

    std::cout << "加壳完成，输出文件: " << outputFile << std::endl;

    return 0;
}