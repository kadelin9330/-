#include"pefield.h"



// 读取PE文件
bool ReadPEFile(const std::string& filePath, PEFile& peFile) {
    std::ifstream file(filePath, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "无法打开文件: " << filePath << std::endl;
        return false;
    }

    std::streamsize size = file.tellg();
    file.seekg(0, std::ios::beg);

    peFile.data.resize(size);
    if (!file.read(reinterpret_cast<char*>(peFile.data.data()), size)) {
        std::cerr << "读取文件失败" << std::endl;
        return false;
    }

    peFile.dosHeader = reinterpret_cast<PIMAGE_DOS_HEADER>(peFile.data.data());
    if (peFile.dosHeader->e_magic != IMAGE_DOS_SIGNATURE) {
        std::cerr << "无效的DOS头" << std::endl;
        return false;
    }

    // 获取NT头
    char* ntHeaderPtr = reinterpret_cast<char*>(peFile.data.data()) + peFile.dosHeader->e_lfanew;
    PIMAGE_NT_HEADERS32 ntHeaders32 = reinterpret_cast<PIMAGE_NT_HEADERS32>(ntHeaderPtr);

    if (ntHeaders32->Signature != IMAGE_NT_SIGNATURE) {
        std::cerr << "无效的NT头" << std::endl;
        return false;
    }

    // 判断是32位还是64位
    peFile.is64Bit = ntHeaders32->OptionalHeader.Magic == IMAGE_NT_OPTIONAL_HDR64_MAGIC;

    if (peFile.is64Bit) {
        peFile.ntHeaders64 = reinterpret_cast<PIMAGE_NT_HEADERS64>(ntHeaderPtr);
        peFile.ntHeaders32 = nullptr;
    }
    else {
        peFile.ntHeaders32 = ntHeaders32;
        peFile.ntHeaders64 = nullptr;
    }

    // 获取所有节表
    PIMAGE_SECTION_HEADER sectionHeader = IMAGE_FIRST_SECTION(
        peFile.is64Bit ?
        reinterpret_cast<PIMAGE_NT_HEADERS>(peFile.ntHeaders64) :
        reinterpret_cast<PIMAGE_NT_HEADERS>(peFile.ntHeaders32)
    );

    for (WORD i = 0; i < (peFile.is64Bit ? peFile.ntHeaders64->FileHeader.NumberOfSections :
        peFile.ntHeaders32->FileHeader.NumberOfSections); i++) {
        peFile.sections.push_back(sectionHeader);
        sectionHeader++;
    }

    return true;
}


// 添加新的节（.shell）
bool AddShellSection(PEFile& peFile, DWORD shellCodeSize) {
    // 计算新节需要的大小（对齐后）
    DWORD sectionAlignment = peFile.is64Bit ?
        peFile.ntHeaders64->OptionalHeader.SectionAlignment :
        peFile.ntHeaders32->OptionalHeader.SectionAlignment;

    DWORD fileAlignment = peFile.is64Bit ?
        peFile.ntHeaders64->OptionalHeader.FileAlignment :
        peFile.ntHeaders32->OptionalHeader.FileAlignment;

    DWORD alignedSize = ((shellCodeSize + sectionAlignment - 1) / sectionAlignment) * sectionAlignment;
    DWORD alignedFileSize = ((shellCodeSize + fileAlignment - 1) / fileAlignment) * fileAlignment;

    // 获取当前节数
    WORD currentNumberOfSections = peFile.is64Bit ?
        peFile.ntHeaders64->FileHeader.NumberOfSections :
        peFile.ntHeaders32->FileHeader.NumberOfSections;

    // 计算NT头和节头表的位置
    DWORD ntHeadersOffset = peFile.dosHeader->e_lfanew;

    // 计算NumberOfSections字段在文件中的偏移
    DWORD numberOfSectionsOffset;
    if (peFile.is64Bit) {
        numberOfSectionsOffset = ntHeadersOffset +
            offsetof(IMAGE_NT_HEADERS64, FileHeader.NumberOfSections);
    }
    else {
        numberOfSectionsOffset = ntHeadersOffset +
            offsetof(IMAGE_NT_HEADERS32, FileHeader.NumberOfSections);
    }

    // 计算SizeOfImage字段在文件中的偏移
    DWORD sizeOfImageOffset;
    if (peFile.is64Bit) {
        sizeOfImageOffset = ntHeadersOffset +
            offsetof(IMAGE_NT_HEADERS64, OptionalHeader.SizeOfImage);
    }
    else {
        sizeOfImageOffset = ntHeadersOffset +
            offsetof(IMAGE_NT_HEADERS32, OptionalHeader.SizeOfImage);
    }

    // 计算节头表的准确位置
    DWORD sectionTableOffset;
    if (peFile.is64Bit) {
        sectionTableOffset = ntHeadersOffset +
            sizeof(IMAGE_NT_HEADERS64) -
            sizeof(IMAGE_OPTIONAL_HEADER64) +
            peFile.ntHeaders64->FileHeader.SizeOfOptionalHeader;
    }
    else {
        sectionTableOffset = ntHeadersOffset +
            sizeof(IMAGE_NT_HEADERS32) -
            sizeof(IMAGE_OPTIONAL_HEADER32) +
            peFile.ntHeaders32->FileHeader.SizeOfOptionalHeader;
    }

    // 检查节头表后是否有足够空间添加新节头
    DWORD sectionTableSize = currentNumberOfSections * sizeof(IMAGE_SECTION_HEADER);
    DWORD nextAvailableOffset = sectionTableOffset + sectionTableSize;

    // 找到第一个节的原始数据偏移
    DWORD firstSectionRaw = peFile.sections[0]->PointerToRawData;

    // 如果节头表后没有足够空间，需要扩展节头表区域
    if (nextAvailableOffset + sizeof(IMAGE_SECTION_HEADER) > firstSectionRaw) {
        // 计算需要移动的数据大小
        DWORD dataToMoveSize = peFile.data.size() - firstSectionRaw;

        // 扩展文件数据
        DWORD oldSize = peFile.data.size();
        peFile.data.resize(oldSize + sizeof(IMAGE_SECTION_HEADER));

        // 移动节数据，为节头表腾出空间
        memmove(peFile.data.data() + firstSectionRaw + sizeof(IMAGE_SECTION_HEADER),
            peFile.data.data() + firstSectionRaw,
            dataToMoveSize);

        // 更新所有节的PointerToRawData
        for (auto section : peFile.sections) {
            // 找到节头在文件中的位置
            DWORD sectionHeaderOffset = sectionTableOffset +
                (section - peFile.sections[0]) * sizeof(IMAGE_SECTION_HEADER);

            // 更新PointerToRawData字段
            DWORD pointerToRawDataOffset = sectionHeaderOffset +
                offsetof(IMAGE_SECTION_HEADER, PointerToRawData);
            DWORD newPointerToRawData = *reinterpret_cast<DWORD*>(
                peFile.data.data() + pointerToRawDataOffset) + sizeof(IMAGE_SECTION_HEADER);

            *reinterpret_cast<DWORD*>(peFile.data.data() + pointerToRawDataOffset) = newPointerToRawData;
        }

        // 更新第一个节的原始数据偏移
        firstSectionRaw += sizeof(IMAGE_SECTION_HEADER);
    }

    // 创建新的节头
    IMAGE_SECTION_HEADER newSection = { 0 };
    memcpy(newSection.Name, ".shell", 7);
    newSection.Misc.VirtualSize = shellCodeSize;

    // 计算新节的虚拟地址
    PIMAGE_SECTION_HEADER lastSection = peFile.sections.back();
    DWORD lastSectionVirtualAddress;
    DWORD lastSectionMiscVirtualSize;

    // 从文件数据中读取最后一个节的VirtualAddress和Misc.VirtualSize
    DWORD lastSectionHeaderOffset = sectionTableOffset +
        (peFile.sections.size() - 1) * sizeof(IMAGE_SECTION_HEADER);

    lastSectionVirtualAddress = *reinterpret_cast<DWORD*>(
        peFile.data.data() + lastSectionHeaderOffset + offsetof(IMAGE_SECTION_HEADER, VirtualAddress));

    lastSectionMiscVirtualSize = *reinterpret_cast<DWORD*>(
        peFile.data.data() + lastSectionHeaderOffset + offsetof(IMAGE_SECTION_HEADER, Misc.VirtualSize));

    newSection.VirtualAddress = lastSectionVirtualAddress +
        ((lastSectionMiscVirtualSize + sectionAlignment - 1) / sectionAlignment) * sectionAlignment;

    // 计算新节的原始数据偏移
    DWORD lastSectionPointerToRawData = *reinterpret_cast<DWORD*>(
        peFile.data.data() + lastSectionHeaderOffset + offsetof(IMAGE_SECTION_HEADER, PointerToRawData));

    DWORD lastSectionSizeOfRawData = *reinterpret_cast<DWORD*>(
        peFile.data.data() + lastSectionHeaderOffset + offsetof(IMAGE_SECTION_HEADER, SizeOfRawData));

    newSection.PointerToRawData = lastSectionPointerToRawData +
        ((lastSectionSizeOfRawData + fileAlignment - 1) / fileAlignment) * fileAlignment;

    newSection.SizeOfRawData = alignedFileSize;
    newSection.Characteristics = IMAGE_SCN_MEM_READ | IMAGE_SCN_MEM_WRITE | IMAGE_SCN_MEM_EXECUTE |
        IMAGE_SCN_CNT_CODE;

    // 扩展文件数据以容纳新节的数据
    DWORD oldSize = peFile.data.size();
    peFile.data.resize(oldSize + alignedFileSize);

    // 直接更新文件数据中的NumberOfSections字段
    *reinterpret_cast<WORD*>(peFile.data.data() + numberOfSectionsOffset) = currentNumberOfSections + 1;

    // 直接更新文件数据中的SizeOfImage字段
    *reinterpret_cast<DWORD*>(peFile.data.data() + sizeOfImageOffset) = newSection.VirtualAddress + alignedSize;

    // 添加新节头到节头表
    BYTE* sectionTableStart = peFile.data.data() + sectionTableOffset;
    memcpy(sectionTableStart + sectionTableSize, &newSection, sizeof(IMAGE_SECTION_HEADER));

    // 更新内存中的节列表
    // 注意：由于我们修改了文件数据，需要重新解析节头表
    // 这里简化处理，只添加新节的指针
    PIMAGE_SECTION_HEADER newSectionPtr = reinterpret_cast<PIMAGE_SECTION_HEADER>(sectionTableStart + sectionTableSize);
    peFile.sections.push_back(newSectionPtr);

    // 重新解析NT头，确保内存中的数据结构与文件数据一致
    if (peFile.is64Bit) {
        peFile.ntHeaders64 = reinterpret_cast<PIMAGE_NT_HEADERS64>(peFile.data.data() + ntHeadersOffset);
    }
    else {
        peFile.ntHeaders32 = reinterpret_cast<PIMAGE_NT_HEADERS32>(peFile.data.data() + ntHeadersOffset);
    }

    return true;
}

// 处理ASLR和重定位
void ProcessRelocations(PEFile& peFile) {
    // 检查是否启用ASLR
    bool hasRelocations = false;
    DWORD relocationTableRVA = 0;
    DWORD relocationTableSize = 0;

    if (peFile.is64Bit) {
        relocationTableRVA = peFile.ntHeaders64->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].VirtualAddress;
        relocationTableSize = peFile.ntHeaders64->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].Size;
    }
    else {
        relocationTableRVA = peFile.ntHeaders32->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].VirtualAddress;
        relocationTableSize = peFile.ntHeaders32->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].Size;
    }

    hasRelocations = relocationTableRVA != 0 && relocationTableSize != 0;

    if (hasRelocations) {
        // 找到重定位表
        PIMAGE_BASE_RELOCATION relocation = nullptr;
        for (auto section : peFile.sections) {
            if (relocationTableRVA >= section->VirtualAddress &&
                relocationTableRVA < section->VirtualAddress + section->Misc.VirtualSize) {
                DWORD offset = relocationTableRVA - section->VirtualAddress;
                relocation = reinterpret_cast<PIMAGE_BASE_RELOCATION>(peFile.data.data() + section->PointerToRawData + offset);
                break;
            }
        }

        if (relocation) {
            // 处理重定位表
            // 在实际应用中，需要更新重定位表以反映新的基址
            // 这里只是示例，不实现完整逻辑
            std::cout << "找到重定位表，需要处理ASLR" << std::endl;
        }
    }
    else {
        // 如果没有重定位表，可以关闭ASLR
        if (peFile.is64Bit) {
            peFile.ntHeaders64->OptionalHeader.DllCharacteristics &= ~IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE;
        }
        else {
            peFile.ntHeaders32->OptionalHeader.DllCharacteristics &= ~IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE;
        }
        std::cout << "ASLR已关闭" << std::endl;
    }
}

// 保存PE文件
bool SavePEFile(const std::string& filePath, PEFile& peFile) {
    std::ofstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "无法创建文件: " << filePath << std::endl;
        return false;
    }

    file.write(reinterpret_cast<char*>(peFile.data.data()), peFile.data.size());
    return true;
}
