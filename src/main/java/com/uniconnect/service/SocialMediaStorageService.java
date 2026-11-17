package com.uniconnect.service;

import com.uniconnect.entity.PostMediaType;
import java.io.IOException;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface SocialMediaStorageService {

    StoredMedia store(MultipartFile upload);

    Resource load(String storageKey);

    void delete(String storageKey) throws IOException;

    record StoredMedia(
            String storageKey,
            PostMediaType mediaType,
            String contentType,
            long fileSizeBytes) {
    }
}
