package com.uniconnect.industrial.service;

import com.uniconnect.industrial.entity.IndustrialRoom;
import com.uniconnect.industrial.entity.IndustrialRoomMember;
import com.uniconnect.industrial.entity.IndustrialRoomMessage;
import com.uniconnect.industrial.repository.IndustrialRoomMemberRepository;
import com.uniconnect.industrial.repository.IndustrialRoomMessageRepository;
import com.uniconnect.industrial.repository.IndustrialRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class IndustrialPortalService {

    private final IndustrialRoomRepository roomRepository;
    private final IndustrialRoomMemberRepository memberRepository;
    private final IndustrialRoomMessageRepository messageRepository;

    public IndustrialPortalService(
            IndustrialRoomRepository roomRepository,
            IndustrialRoomMemberRepository memberRepository,
            IndustrialRoomMessageRepository messageRepository
    ) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
    }

    public String normalizeIndustryKey(String industryName) {
        if (industryName == null || industryName.isBlank()) {
            return "general-industry";
        }
        return industryName.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "-");
    }

    @Transactional
    public IndustrialRoom getOrCreateRoom(String industryName) {
        String cleanName = (industryName == null || industryName.isBlank())
                ? "General Industry"
                : industryName.trim();
        String key = normalizeIndustryKey(cleanName);

        return roomRepository.findByIndustryKey(key).orElseGet(() -> {
            IndustrialRoom room = new IndustrialRoom();
            room.setIndustryKey(key);
            room.setIndustryName(cleanName);
            return roomRepository.save(room);
        });
    }

    @Transactional
    public Map<String, Object> registerWorkingStudentToIndustryChat(
            UUID userId,
            String industryName,
            String companyName,
            String jobTitle
    ) {
        IndustrialRoom room = getOrCreateRoom(industryName);

        if (userId != null && memberRepository.findByRoomIdAndUserId(room.getId(), userId).isEmpty()) {
            IndustrialRoomMember member = new IndustrialRoomMember();
            member.setRoomId(room.getId());
            member.setUserId(userId);
            member.setMemberRole("WORKING_STUDENT");
            memberRepository.save(member);

            IndustrialRoomMessage welcome = new IndustrialRoomMessage();
            welcome.setRoomId(room.getId());
            welcome.setSenderId(userId);
            String details = (jobTitle != null && !jobTitle.isBlank() ? jobTitle.trim() : "Working Student")
                    + (companyName != null && !companyName.isBlank() ? " at " + companyName.trim() : "");
            welcome.setMessageText("Joined the " + room.getIndustryName() + " industry chat (" + details + ").");
            messageRepository.save(welcome);
        }

        List<IndustrialRoomMember> members = memberRepository.findByRoomId(room.getId());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomId", room.getId());
        result.put("industryKey", room.getIndustryKey());
        result.put("industryName", room.getIndustryName());
        result.put("memberCount", members.size());
        return result;
    }

    public List<IndustrialRoom> listAllRooms() {
        return roomRepository.findAllByOrderByIndustryNameAsc();
    }

    public List<IndustrialRoomMessage> getRoomMessages(UUID roomId) {
        return messageRepository.findByRoomIdOrderBySentAtAsc(roomId);
    }

    @Transactional
    public IndustrialRoomMessage postMessage(UUID roomId, UUID senderId, String messageText) {
        IndustrialRoomMessage msg = new IndustrialRoomMessage();
        msg.setRoomId(roomId);
        msg.setSenderId(senderId);
        msg.setMessageText(messageText.trim());
        return messageRepository.save(msg);
    }
}