#include "pch.h"
#include "CryptoDLL.h"
#include <iostream>
#include <vector>
#include <cstring>

// 定义OEP联合体，支持32位和64位OEP
union OEP_UNION {
    DWORD oep32;
    DWORD64 oep64;
};

// 全局变量声明
DWORD dwTargetRVA = 0;      // 目标段(.text)的RVA
DWORD dwTargetSize = 0;     // 目标段(.text)的大小
DWORD dwSectionSize = 0;
OEP_UNION originalOEP;      // 原始入口点(OEP)，根据架构使用不同字段

// 检查节名称是否是需要加密的节（只加密.text节）
bool IsTargetSection(const char* sectionName) {
    return strcmp(sectionName, ".text") == 0 || strcmp(sectionName, "CODE") == 0;
}

// 32位PE文件加密函数
CRYPTODLL_API void EncryptSections32(BYTE* data, const std::vector<IMAGE_SECTION_HEADER>& sections, DWORD oep) {
    // 保存原始OEP
    originalOEP.oep32 = oep;

    // 获取DOS头
    PIMAGE_DOS_HEADER dosHeader = reinterpret_cast<PIMAGE_DOS_HEADER>(data);

    // 获取NT头
    PIMAGE_NT_HEADERS32 ntHeaders = reinterpret_cast<PIMAGE_NT_HEADERS32>(
        data + dosHeader->e_lfanew);

    // 计算节头表偏移
    DWORD sectionTableOffset = dosHeader->e_lfanew +
        sizeof(IMAGE_NT_HEADERS32) -
        sizeof(IMAGE_OPTIONAL_HEADER32) +
        ntHeaders->FileHeader.SizeOfOptionalHeader;

    BYTE* sectionTablePtr = data + sectionTableOffset;

    for (int i = 0; i < sections.size(); i++) {
        const auto& section = sections[i];

        // 累加所有节的大小
        std::cout << "section.Size: 0x" << (section.SizeOfRawData ? ((section.SizeOfRawData + 0xFFF) & ~0xFFF) : 0x1000) << std::endl;
        dwSectionSize += section.SizeOfRawData ? ((section.SizeOfRawData + 0xFFF) & ~0xFFF) : 0x1000;

        // 只加密目标节
        if (section.SizeOfRawData == 0 || !IsTargetSection((const char*)section.Name)) {
            continue;
        }

        // 获取当前节头在文件中的位置
        IMAGE_SECTION_HEADER* currentSectionHeader =
            reinterpret_cast<IMAGE_SECTION_HEADER*>(sectionTablePtr + (i * sizeof(IMAGE_SECTION_HEADER)));

        // 修改节属性为可写
        currentSectionHeader->Characteristics |= IMAGE_SCN_MEM_WRITE;

        // 保存目标段的RVA和大小
        dwTargetRVA = section.VirtualAddress;
        dwTargetSize = section.SizeOfRawData;

        DWORD start = section.PointerToRawData;
        DWORD size = section.SizeOfRawData;

        for (DWORD j = 0; j < size; j++) {
            data[start + j] ^= 0xCC;
        }
    }
}

// 64位PE文件加密函数
CRYPTODLL_API void EncryptSections64(BYTE* data, const std::vector<IMAGE_SECTION_HEADER>& sections, DWORD64 oep) {
    // 保存原始OEP
    originalOEP.oep64 = oep;

    // 获取DOS头
    PIMAGE_DOS_HEADER dosHeader = reinterpret_cast<PIMAGE_DOS_HEADER>(data);

    // 获取NT头
    PIMAGE_NT_HEADERS64 ntHeaders = reinterpret_cast<PIMAGE_NT_HEADERS64>(
        data + dosHeader->e_lfanew);

    // 计算节头表偏移
    DWORD sectionTableOffset = dosHeader->e_lfanew +
        sizeof(IMAGE_NT_HEADERS64) -
        sizeof(IMAGE_OPTIONAL_HEADER64) +
        ntHeaders->FileHeader.SizeOfOptionalHeader;

    BYTE* sectionTablePtr = data + sectionTableOffset;

    for (int i = 0; i < sections.size(); i++) {
        const auto& section = sections[i];

        // 累加所有节的大小
        std::cout << "section.Size: 0x" << (section.SizeOfRawData ? ((section.SizeOfRawData + 0xFFF) & ~0xFFF) : 0x1000) << std::endl;
        dwSectionSize += section.SizeOfRawData ? ((section.SizeOfRawData + 0xFFF) & ~0xFFF) : 0x1000;

        // 只加密目标节
        if (section.SizeOfRawData == 0 || !IsTargetSection((const char*)section.Name)) {
            continue;
        }

        // 获取当前节头在文件中的位置
        IMAGE_SECTION_HEADER* currentSectionHeader =
            reinterpret_cast<IMAGE_SECTION_HEADER*>(sectionTablePtr + (i * sizeof(IMAGE_SECTION_HEADER)));

        // 修改节属性为可写
        currentSectionHeader->Characteristics |= IMAGE_SCN_MEM_WRITE;

        // 保存目标段的RVA和大小
        dwTargetRVA = section.VirtualAddress;
        dwTargetSize = section.SizeOfRawData;

        DWORD start = section.PointerToRawData;
        DWORD size = section.SizeOfRawData;

        for (DWORD j = 0; j < size; j++) {
            data[start + j] ^= 0xCC;
        }
    }
}

// 统一的加密函数，根据is64Bit参数选择32位或64位版本
CRYPTODLL_API void EncryptSections(BYTE* data, const std::vector<IMAGE_SECTION_HEADER>& sections, DWORD oep, bool is64Bit) {
    if (is64Bit) {
        EncryptSections64(data, sections, oep);
    }
    else {
        EncryptSections32(data, sections, oep);
    }
}

// 生成64位解密存根（包含获取ImageBase、解密.text和处理重定位的代码）
std::vector<BYTE> Generate64BitDecryptStub() {
    std::vector<BYTE> stub;

    // 64位解密存根 - 包含获取ImageBase、解密.text和处理重定位的代码
    BYTE code[] = {
        // 保存寄存器
        0x50,                                           // push rax
        0x51,                                           // push rcx
        0x52,                                           // push rdx
        0x53,                                           // push rbx
        0x54,                                           // push rsp
        0x55,                                           // push rbp
        0x56,                                           // push rsi
        0x57,                                           // push rdi
        0x41, 0x50,                                     // push r8
        0x41, 0x51,                                     // push r9
        0x41, 0x52,                                     // push r10
        0x41, 0x53,                                     // push r11
        0x41, 0x54,                                     // push r12
        0x41, 0x55,                                     // push r13
        0x41, 0x56,                                     // push r14
        0x41, 0x57,                                     // push r15

        // 获取当前模块基址 (通过PEB)
        0x65, 0x48, 0x8B, 0x04, 0x25, 0x60, 0x00, 0x00, 0x00, // mov rax, gs:[0x60] (PEB)
        0x48, 0x8B, 0x40, 0x10,                         // mov rax, [rax+0x10] (ImageBaseAddress)
        0x48, 0x89, 0xC3,                               // mov rbx, rax (保存基址)

        // 设置解密参数
        0x48, 0xC7, 0xC1, 0x00, 0x00, 0x00, 0x00,       // mov rcx, offset_to_size
        0x48, 0x85, 0xC9,                               // test rcx, rcx

        // 计算解密起始地址
        0x48, 0xC7, 0xC2, 0x00, 0x00, 0x00, 0x00,       // mov rdx, offset_to_rva
        0x48, 0x01, 0xDA,                               // add rdx, rbx (rdx = ImageBase + RVA)

        // 解密循环 decrypt_loop
        0x80, 0x32, 0xCC,                               // xor byte [rdx], 0xCC
        0x48, 0xFF, 0xC2,                               // inc rdx
        0x48, 0xFF, 0xC9,                               // dec rcx
        0x0F, 0x85, 0xF1, 0xFF, 0xFF, 0xFF,             // jne decrypt_loop

        // 解密完成，现在处理重定位表
        // 获取PE头部
        0x48, 0x89, 0xD8,                               // mov rax, rbx (rax = ImageBase)
        0x48, 0x8B, 0x40, 0x3C,                         // mov rax, [rax+0x3C] (rax = PE header offset)
        0x48, 0x25, 0xFF, 0xFF, 0x00, 0x00,             // xor rax, 0xffff
        0x48, 0x01, 0xD8,                               // add rax, rbx (rax = PE header address)

        // 获取可选头部
        0x48, 0x8D, 0x48, 0x18,                         // lea rcx, [rax+0x18] (rcx = optional header address)
        0x48, 0x8B, 0x89, 0x98, 0x00, 0x00, 0x00,       // mov rcx, [rcx+0x98] (rcx = DataDirectory[5].VirtualAddress (重定位表RVA))
        0x48, 0x81, 0xE1, 0xFF, 0xFF, 0x00, 0x00,       // and rcx, 0xffff
        0x48, 0x85, 0xC9,                               // test rcx, rcx
        0x0F, 0x84, 0xAA, 0x00, 0x00, 0x00,             // je relocation_done

        // 计算重定位表地址
        0x48, 0x01, 0xD9,                               // add rcx, rbx (rcx = 重定位表地址)

        // 遍历重定位块
        0x48, 0x89, 0xCD,                               // mov rbp, rcx (rbp指向当前重定位块)

        // relocation_blocks:
        // 获取.text节的结束地址 (RVA + SizeOfRawData)
        0x48, 0x31, 0xD2,                               // xor rdx, rdx
        0x48, 0x81, 0xC2, 0x00, 0x00, 0x00, 0x00,       // add rdx, offset_to_size (dwTargetSize).text节结束地址
        0x48, 0x31, 0xF6,                               // xor rsi, rsi
        0x8B, 0x75, 0x00,                               // mov rsi, [rbp] (rsi = VirtualAddress)

        // 检查重定位块是否在.text节范围内
        0x48, 0x85, 0xF6,                               // test rsi, rsi
        0x0F, 0x84, 0x8B, 0x00, 0x00, 0x00,             // je relocation_done
        0x48, 0x81, 0xFE, 0x00, 0x00, 0x00, 0x00,       // cmp rsi, offset_to_rva (与.text节起始RVA比较)
        0x0F, 0x82, 0x6F, 0x00, 0x00, 0x00,             // jb next_block (如果小于，跳过这个块)
        0x48, 0x39, 0xD6,                               // cmp rsi, rdx (与.text节结束地址比较)
        0x0F, 0x87, 0x75, 0x00, 0x00, 0x00,             // ja relocation_done (如果大于等于，结束重定位)

        0x48, 0x31, 0xC9,                               // xor rcx, rcx
        0x48, 0x8B, 0x4D, 0x08,                         // mov rcx, [rbp+8] (rcx = SizeOfBlock)
        0x48, 0x85, 0xC9,                               // test rcx, rcx
        0x0F, 0x84, 0x65, 0x00, 0x00, 0x00,             // je relocation_done

        // 计算重定位项数量
        0x48, 0x83, 0xE9, 0x08,                         // sub rcx, 8 (减去头部大小)
        0x48, 0xD1, 0xE9,                               // shr rcx, 1 (除以2，得到项数)
        0x48, 0x85, 0xC9,                               // test rcx, rcx
        0x0F, 0x84, 0x46, 0x00, 0x00, 0x00,             // je next_block

        // 设置重定位项指针
        0x48, 0x8D, 0x75, 0x08,                         // lea rsi, [rbp+8] (rsi指向重定位项数组)

        // relocation_items:
        0x48, 0x31, 0xD2,                               // xor rdx, rdx
        0x66, 0x8B, 0x16,                               // mov dx, [rsi] (读取重定位项)
        0x48, 0x83, 0xC6, 0x02,                         // add rsi, 2 (移动到下一个项)

        // 检查类型是否为10 (IMAGE_REL_BASED_DIR64)
        0x48, 0x89, 0xD7,                               // mov rdi, rdx (保存副本到rdi)
        0x48, 0xC1, 0xEF, 0x0C,                         // shr rdi, 12 (得到类型)
        0x48, 0x83, 0xFF, 0x0A,                         // cmp rdi, 10 (IMAGE_REL_BASED_DIR64)
        0x0F, 0x85, 0x1E, 0x00, 0x00, 0x00,             // jne skip_item (跳过此项)

        // 计算需要重定位的地址
        0x48, 0x81, 0xE2, 0xFF, 0x0F, 0x00, 0x00,       // and rdx, 0x0FFF (得到偏移)
        0x48, 0x03, 0x55, 0x00,                         // add rdx, [rbp] (rdx = VirtualAddress + Offset)
        0x48, 0x01, 0xDA,                               // add rdx, rbx (rdx = ImageBase + RVA + Offset)

        // 读取当前值并调整
        0x48, 0x31, 0xFF,                               // xor rdi, rdi  
        0x48, 0x8B, 0x3A,                               // mov rdi, [rdx] (rdi = A)
        0x48, 0x8D, 0xBF, 0x00, 0x00, 0x00, 0xC0,       // lea rdi, [rdi - 0x140000000] (rdi = A - Delta)
        0x48, 0x89, 0x3A,                               // mov [rdx], rdi (写回调整后的值)

        // skip_item:
        0x48, 0xFF, 0xC9,                               // dec rcx
        0x0F, 0x85, 0xBE, 0xFF, 0xFF, 0xFF,             // jne relocation_items

        // next_block:
        0x48, 0x31, 0xC9,                               // xor rcx, rcx
        0x48, 0x8B, 0x4D, 0x08,                         // mov rcx, [rbp+8] (rcx = SizeOfBlock)
        0x48, 0x01, 0xCD,                               // add rbp, rcx (移动到下一个块)
        0xE9, 0x5C, 0xFF, 0xFF, 0xFF,                   // jmp relocation_blocks

        // relocation_done:
        // 恢复寄存器并跳转到原始OEP
        0x41, 0x5F,                                     // pop r15
        0x41, 0x5E,                                     // pop r14
        0x41, 0x5D,                                     // pop r13
        0x41, 0x5C,                                     // pop r12
        0x41, 0x5B,                                     // pop r11
        0x41, 0x5A,                                     // pop r10
        0x41, 0x59,                                     // pop r9
        0x41, 0x58,                                     // pop r8
        0x5F,                                           // pop rdi
        0x5E,                                           // pop rsi
        0x5D,                                           // pop rbp
        0x5C,                                           // pop rsp
        0x5B,                                           // pop rbx
        0x5A,                                           // pop rdx
        0x59,                                           // pop rcx
        0x58,                                           // pop rax

        // 获取当前模块基址 (通过PEB)
        0x65, 0x48, 0x8B, 0x04, 0x25, 0x60, 0x00, 0x00, 0x00, // mov rax, gs:[0x60] (PEB)
        0x48, 0x8B, 0x40, 0x10,                         // mov rax, [rax+0x10] (ImageBaseAddress)
        0x48, 0x89, 0xC3,                               // mov rbx, rax (保存基址)
        0x48, 0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,       // mov rax, offset_to_oep
        0x48, 0x01, 0xD8,                               // add rax, rbx (rax = ImageBase + OEP)
        0xFF, 0xE0                                      // jmp rax
    };

    stub.assign(code, code + sizeof(code));

    // 在存根末尾添加数据
    DWORD sizeOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD64));
    *reinterpret_cast<DWORD64*>(stub.data() + sizeOffset) = dwTargetSize;

    DWORD rvaOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD64));
    *reinterpret_cast<DWORD64*>(stub.data() + rvaOffset) = dwTargetRVA;

    DWORD oepOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD64));
    *reinterpret_cast<DWORD64*>(stub.data() + oepOffset) = originalOEP.oep64;

    // 更新存根中的偏移
    // 更新大小偏移 mov rcx, offset_to_size
    *reinterpret_cast<DWORD*>(stub.data() + 43) = dwTargetSize;

    // 更新RVA偏移 mov rdx, offset_to_rva
    *reinterpret_cast<DWORD*>(stub.data() + 53) = dwTargetRVA;

    // 更新.text节结束地址 add rdx, offset_to_size
    *reinterpret_cast<DWORD*>(stub.data() + 130) = dwTargetSize;

    // 更新.text节起始RVA比较 cmp rsi, offset_to_rva
    *reinterpret_cast<DWORD*>(stub.data() + 152) = dwTargetRVA;

    // 更新OEP偏移 mov rax, offset_to_oep
    *reinterpret_cast<DWORD64*>(stub.data() + 330) = originalOEP.oep64;

    // 输出所有关键变量
    std::cout << std::hex << std::uppercase; // 设置为十六进制大写格式

    std::cout << "dwTargetSize: 0x" << dwTargetSize << std::endl;
    std::cout << "dwTargetRVA: 0x" << dwTargetRVA << std::endl;
    std::cout << "dwOriginalOEP: 0x" << originalOEP.oep64 << std::endl;
    std::cout << "dwSectionSize: 0x" << dwSectionSize << std::endl;
    std::cout << "sizeOffset: 0x" << sizeOffset << std::endl;
    std::cout << "rvaOffset: 0x" << rvaOffset << std::endl;
    std::cout << "oepOffset: 0x" << oepOffset << std::endl;

    return stub;
}

std::vector<BYTE> Generate32BitDecryptStub() {
    std::vector<BYTE> stub;

    // 32位解密存根 - 包含获取ImageBase、解密.text和处理重定位的代码
    BYTE code[] = {
        // 保存寄存器
        0x60,                               // pushad
        0x9C,                               // pushfd

        // 获取当前模块基址 (通过PEB)
        0x64, 0xA1, 0x30, 0x00, 0x00, 0x00, // mov eax, fs:[0x30] (PEB)
        0x8B, 0x40, 0x08,                   // mov eax, [eax+0x08] (ImageBaseAddress)
        0x89, 0xC3,                         // mov ebx, eax (保存基址到ebx)

        // 设置解密参数
        0x05, 0x00, 0x00, 0x00, 0x00,       // add eax,             ###########################################################################
        0x8B, 0x08,                         // mov ecx, [eax]     offset_to_size
        0x85, 0xC9,                         // test ecx, ecx

        // 计算解密起始地址
        0x83, 0xC0, 0x4,                    // add eax, 0x4
        0x8B, 0x10,                         // mov edx, [eax]      offset_to_rva
        0x01, 0xDA,                         // add edx, ebx (edx = ImageBase + RVA)

        // 解密循环 decrypt_loop
        0x80, 0x32, 0xCC,                   // xor byte [edx], 0xCC
        0x42,                               // inc edx
        0x49,                               // dec ecx
        0x75, 0xF9,                         // jne decrypt_loop

        // 解密完成，现在处理重定位表
        // 获取PE头部
        0x89, 0xD8,                         // mov eax, ebx (eax = ImageBase)
        0x8B, 0x40, 0x3C,                   // mov eax, [eax+0x3C] (eax = PE header offset)
        0x01, 0xD8,                         // add eax, ebx (eax = PE header address)

        // 获取可选头部
        0x8D, 0x48, 0x18,                   // lea ecx, [eax+0x18] (ecx = optional header address)
        0x8B, 0x89, 0x88, 0x00, 0x00, 0x00, // mov ecx, [ecx+0x88] (ecx = DataDirectory[5].VirtualAddress (重定位表RVA))
        0x85, 0xC9,                         // test ecx, ecx
        0x0F, 0x84, 0x90, 0x00, 0x00, 0x00, // je relocation_done (跳转到重定位完成处) ****************************************************************

        // 计算重定位表地址
        0x01, 0xD9,                         // add ecx, ebx (ecx =重定位表地址)

        // 准备调整参数: Delta和XOR常量
        0xB8, 0xCC, 0xCC, 0xCC, 0xCC,       // mov eax, 0xCCCCCCCC (XOR常量)





        // 遍历重定位块
        0x89, 0xCD,                         // mov ebp, ecx (ebp指向当前重定位块)

        // relocation_blocks:
        // 获取.text节的结束地址 (RVA + SizeOfRawData)
        0x31, 0xD2,                         // xor edx, edx
        0x81, 0xC2, 0x00, 0x00, 0x00, 0x00, // add edx, offset_to_size (dwTargetSize).text节结束地址   #########################################
        
        0x8B, 0x75, 0x00,                   // mov esi, [ebp] (esi = VirtualAddress)

        // 检查重定位块是否在.text节范围内
        0x66, 0x85, 0xF6,                   // test esi, esi  
        0x0F, 0x84, 0x73, 0x00, 0x00, 0x00, // je relocation_done
        0x81, 0xFE, 0x00, 0x00, 0x00, 0x00, // cmp esi, offset_to_rva (与.text节起始RVA比较)             #######################################
        0x0F, 0x82, 0x5D, 0x00, 0x00, 0x00, // jb next_block (如果小于，跳过这个块)  **********************************************************
        0x39, 0xD6,                         // cmp esi, edx (与.text节结束地址比较)
        0x77, 0x63,                         // ja relocation_done (如果大于等于，结束重定位) *****************************************************

        0x8B, 0x4D, 0x04,                   // mov ecx, [ebp+4] (ecx = SizeOfBlock)
        0x85, 0xC9,                         // test ecx, ecx
        0x0F, 0x84, 0x58, 0x00, 0x00, 0x00, // je relocation_done (跳转到重定位完成处)  ********************************************************

        // 计算重定位项数量
        0x83, 0xE9, 0x08,                   // sub ecx, 8 (减去头部大小)
        0xD1, 0xE9,                         // shr ecx, 1 (除以2，得到项数)
        0x85, 0xC9,                         // test ecx, ecx
        0x0F, 0x84, 0x41, 0x00, 0x00, 0x00, // je next_block (跳转到下一个块) ******************************************************************

        // 设置重定位项指针
        0x8D, 0x75, 0x08,                   // lea esi, [ebp+8] (esi指向重定位项数组)

        // relocation_items:
        0x31, 0xD2,                         // xor edx, edx
        0x66, 0x8B, 0x16,                   // mov dx, [esi] (读取重定位项)
        0x83, 0xC6, 0x02,                   // add esi, 2 (移动到下一个项)

        // 检查类型是否为3 (IMAGE_REL_BASED_HIGHLOW)
        0x89, 0xD7,                         // mov edi, edx (保存副本到edi)
        0xC1, 0xEF, 0x0C,                   // shr edi, 12 (得到类型)
        0x83, 0xFF, 0x03,                   // cmp edi, 3
        0x0F, 0x85, 0x21, 0x00, 0x00, 0x00, // jne skip_item (跳过此项) *******************************************************************

        // 计算需要重定位的地址
        0x81, 0xE2, 0xFF, 0x0F, 0x00, 0x00, // and edx, 0x0FFF (得到偏移)
        0x03, 0x55, 0x00,                   // add edx, [ebp] (edx = VirtualAddress + Offset)
        0x01, 0xDA,                         // add edx, ebx (edx = ImageBase + RVA + Offset)

        0x55,                               // push ebp
        // 读取当前值并调整
        0x89, 0xDD,                         // mov ebp, ebx (ebp = NewImageBase)
        0x81, 0xED, 0x00, 0x00, 0x40, 0x00, // sub ebp, 0x400000 (ebp = Delta)
        0x8B, 0x3A,                         // mov edi, [edx] (edi = A)
        0x31, 0xC7,                         // xor edi, eax (edi = A XOR X)
        0x29, 0xEF,                         // sub edi, ebp (edi = (A XOR X) - Delta)
        0x31, 0xC7,                         // xor edi, eax (edi = V_old)
        0x01, 0xEF,                         // add edi, ebp (edi = V_old + Delta = B)
        0x89, 0x3A,                         // mov [edx], edi (写回调整后的值)

        0x5d,                               // pop ebp

        // skip_item:
        0x49,                               // dec ecx
        0x0F, 0x85, 0xC2, 0xFF, 0xFF, 0xFF, // jne relocation_items (跳回重定位项循环) ********************************************************

        // next_block:
        0x8B, 0x4D, 0x04,                   // mov ecx, [ebp+4] (ecx = SizeOfBlock)
        0x01, 0xCD,                         // add ebp, ecx (移动到下一个块)
        0xE9, 0x79, 0xFF, 0xFF, 0xFF,       // jmp relocation_blocks (跳回重定位块循环)  ********************************************************

        // relocation_done:

        // 恢复寄存器并跳转到原始OEP
        0x9D,                               // popfd
        0x61,                               // popad
        // 获取当前模块基址 (通过PEB)
        0x64, 0xA1, 0x30, 0x00, 0x00, 0x00, // mov eax, fs:[0x30] (PEB)
        0x8B, 0x40, 0x08,                   // mov eax, [eax+0x08] (ImageBaseAddress)
        0x89, 0xC3,                         // mov ebx, eax (保存基址到ebx)
        0xB8, 0x00, 0x00, 0x00, 0x00,       // mov eax, offset_to_oep (dwOriginalOEP) ########################################################
        0x01, 0xD8,                         // add eax, ebx (eax = ImageBase + OEP)
        0xFF, 0xE0                          // jmp eax
    };

    stub.assign(code, code + sizeof(code));

    // 在存根末尾添加数据
    DWORD sizeOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD));
    *reinterpret_cast<DWORD*>(stub.data() + sizeOffset) = dwTargetSize;

    DWORD rvaOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD));
    *reinterpret_cast<DWORD*>(stub.data() + rvaOffset) = dwTargetRVA;

    DWORD oepOffset = stub.size();
    stub.resize(stub.size() + sizeof(DWORD));
    *reinterpret_cast<DWORD*>(stub.data() + oepOffset) = originalOEP.oep32;



    // 更新存根中的偏移

    *reinterpret_cast<DWORD*>(stub.data() + 14) = dwSectionSize + 0x1000 + sizeOffset;

    *reinterpret_cast<DWORD*>(stub.data() + 0x49) = (dwTargetSize + 0xFFF) & ~0xFFF;

    *reinterpret_cast<DWORD*>(stub.data() + 0x52 + 9) = dwTargetRVA;

    *reinterpret_cast<DWORD*>(stub.data() + 0xD1 + 9) = originalOEP.oep32;

    // 输出所有关键变量
    std::cout << std::hex << std::uppercase; // 设置为十六进制大写格式

    std::cout << "dwTargetSize: 0x" << dwTargetSize << std::endl;
    std::cout << "dwTargetRVA: 0x" << dwTargetRVA << std::endl;
    std::cout << "dwOriginalOEP: 0x" << originalOEP.oep32 << std::endl;
    std::cout << "dwSectionSize: 0x" << dwSectionSize << std::endl;
    std::cout << "sizeOffset: 0x" << sizeOffset << std::endl;
    std::cout << "rvaOffset: 0x" << rvaOffset << std::endl;
    std::cout << "oepOffset: 0x" << oepOffset << std::endl;



    return stub;
}

// 获取解密存根函数
CRYPTODLL_API void* GetDecryptStub(bool is64Bit, DWORD* stubSize) {
    std::vector<BYTE> stub;

    if (is64Bit) {
        stub = Generate64BitDecryptStub();
    }
    else {
        stub = Generate32BitDecryptStub();
    }

    // 分配内存并复制存根代码
    BYTE* result = new BYTE[stub.size()];
    memcpy(result, stub.data(), stub.size());
    *stubSize = stub.size();

    return result;
}