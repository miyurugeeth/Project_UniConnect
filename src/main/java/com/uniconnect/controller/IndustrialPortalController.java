package com.uniconnect.industrial.controller;

import com.uniconnect.industrial.dto.IndustrialChatMessageRequest;
import com.uniconnect.industrial.dto.WorkingStudentJoinRequest;
import com.uniconnect.industrial.entity.IndustrialRoom;
import com.uniconnect.industrial.entity.IndustrialRoomMessage;
import com.uniconnect.industrial.service.IndustrialPortalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/industrial")
public class IndustrialPortalController {

    private final IndustrialPortalService portalService;

    public IndustrialPortalController(IndustrialPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<IndustrialRoom>> getRooms() {
        return ResponseEntity.ok(portalService.listAllRooms());
    }

    @PostMapping("/working-students/join")
    public ResponseEntity> joinWorkingStudent(@RequestBody WorkingStudentJoinRequest request) {
        Map<String, Object> joined = portalService.registerWorkingStudentToIndustryChat(
                request.userId(),
                request.industryName(),
                request.companyName(),
                request.jobTitle()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(joined);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<IndustrialRoomMessage>> getMessages(@PathVariable UUID roomId) {
        return ResponseEntity.ok(portalService.getRoomMessages(roomId));
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<IndustrialRoomMessage> sendMessage(
            @PathVariable UUID roomId,
            @RequestBody IndustrialChatMessageRequest request
    ) {
        if (request.messageText() == null || request.messageText().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        IndustrialRoomMessage saved = portalService.postMessage(roomId, request.senderId(), request.messageText());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}