import { useEffect, useRef, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getCurrentUser
} from "../services/userService";

import {
  sendMessage,
  getConversation,
  markMessageAsRead,
  deleteMessage,
  getUnreadMessageCount
} from "../services/messageService";

import {
  getMyConnections
} from "../services/connectionService";

function Messages() {

  const [currentUser, setCurrentUser] = useState(null);

  const [connections, setConnections] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [searchText, setSearchText] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingConnections, setLoadingConnections] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const messagesListRef = useRef(null);


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  const loadCurrentUser = async () => {

    try {

      const user =
        await getCurrentUser();

      console.log(
        "Current User:",
        user
      );

      setCurrentUser(user);

      return user;

    } catch (error) {

      console.error(
        "Failed to load current user:",
        error
      );

      return null;
    }
  };


  // =========================================================
  // LOAD MY CONNECTIONS
  // =========================================================

  const loadConnections = async () => {

    try {

      setLoadingConnections(true);

      const data =
        await getMyConnections();

      console.log(
        "My Connections:",
        data
      );

      setConnections(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Failed to load connections:",
        error
      );

      setConnections([]);

    } finally {

      setLoadingConnections(false);
    }
  };


  // =========================================================
  // LOAD UNREAD MESSAGE COUNT
  // =========================================================

  const loadUnreadCount = async () => {

    try {

      const count =
        await getUnreadMessageCount();

      console.log(
        "Unread Message Count:",
        count
      );

      setUnreadCount(
        Number(count) || 0
      );

    } catch (error) {

      console.error(
        "Failed to load unread message count:",
        error
      );

      setUnreadCount(0);
    }
  };


  // =========================================================
  // GET OTHER USER
  // =========================================================

  const getOtherUserFromConnection = (
    connection
  ) => {

    if (!currentUser) {
      return null;
    }


    if (
      Number(connection.senderId) ===
      Number(currentUser.id)
    ) {

      return {

        id: connection.receiverId,

        name:
          connection.receiverName

      };
    }


    if (
      Number(connection.receiverId) ===
      Number(currentUser.id)
    ) {

      return {

        id: connection.senderId,

        name:
          connection.senderName

      };
    }


    return null;
  };


  // =========================================================
  // CONNECTED USERS
  // =========================================================

  const connectedUsers =
    connections
      .filter(
        (connection) =>
          connection.status === "ACCEPTED"
      )
      .map(
        (connection) =>
          getOtherUserFromConnection(
            connection
          )
      )
      .filter(
        (user) =>
          user !== null
      );


  // =========================================================
  // REMOVE DUPLICATES
  // =========================================================

  const uniqueConnectedUsers =
    connectedUsers.filter(
      (user, index, self) =>

        index ===
        self.findIndex(
          (item) =>
            Number(item.id) ===
            Number(user.id)
        )
    );


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredUsers =
    uniqueConnectedUsers.filter(
      (user) => {

        const search =
          searchText
            .toLowerCase()
            .trim();


        if (!search) {
          return true;
        }


        return (
          user.name
            ?.toLowerCase()
            .includes(search)
        );
      }
    );


  // =========================================================
  // LOAD CONVERSATION
  // =========================================================

  const loadConversation = async (
    userId
  ) => {

    if (!userId) {
      return;
    }


    try {

      setLoadingMessages(true);


      const data =
        await getConversation(
          userId
        );


      console.log(
        "Conversation:",
        data
      );


      const conversation =
        Array.isArray(data)
          ? data
          : [];


      const unreadMessages =
        conversation.filter(
          (message) =>

            Number(message.receiverId) ===
              Number(currentUser?.id)

            &&

            message.read === false
        );


      for (
        const message of unreadMessages
      ) {

        try {

          await markMessageAsRead(
            message.id
          );

        } catch (error) {

          console.error(
            `Failed to mark message ${message.id} as read:`,
            error
          );
        }
      }


      const updatedMessages =
        conversation.map(
          (message) => {

            if (
              Number(message.receiverId) ===
              Number(currentUser?.id)
            ) {

              return {
                ...message,
                read: true
              };
            }

            return message;
          }
        );


      setMessages(
        updatedMessages
      );


      await loadUnreadCount();

    } catch (error) {

      console.error(
        "Failed to load conversation:",
        error
      );

      setMessages([]);

    } finally {

      setLoadingMessages(false);
    }
  };


  // =========================================================
  // SELECT USER
  // =========================================================

  const handleSelectUser = async (
    user
  ) => {

    setSelectedUser(user);

    setMessageText("");

    await loadConversation(
      user.id
    );
  };


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage = async () => {

    if (!selectedUser) {
      return;
    }


    const content =
      messageText.trim();


    if (!content) {
      return;
    }


    try {

      setSending(true);


      const newMessage =
        await sendMessage(
          selectedUser.id,
          content
        );


      console.log(
        "New Message:",
        newMessage
      );


      setMessages(
        (previous) => [

          ...previous,

          newMessage

        ]
      );


      setMessageText("");

    } catch (error) {

      console.error(
        "Failed to send message:",
        error
      );


      console.error(
        "Backend response:",
        error.response?.data
      );


      alert(
        error.response?.data?.message ||
        "Failed to send message."
      );

    } finally {

      setSending(false);
    }
  };


  // =========================================================
  // ENTER TO SEND
  // =========================================================

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSendMessage();
    }
  };


  // =========================================================
  // DELETE MESSAGE
  // =========================================================

  const handleDeleteMessage = async (
    messageId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this message?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await deleteMessage(
        messageId
      );


      setMessages(
        (previous) =>
          previous.filter(
            (message) =>
              message.id !== messageId
          )
      );

    } catch (error) {

      console.error(
        "Failed to delete message:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Failed to delete message."
      );
    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    const loadData = async () => {

      const user =
        await loadCurrentUser();


      if (user) {

        await loadConnections();

      }


      await loadUnreadCount();

    };


    loadData();

  }, []);


  // =========================================================
  // AUTO REFRESH
  // =========================================================

  useEffect(() => {

    const interval =
      setInterval(
        async () => {

          await loadUnreadCount();


          if (selectedUser) {

            try {

              const data =
                await getConversation(
                  selectedUser.id
                );


              const conversation =
                Array.isArray(data)
                  ? data
                  : [];


              for (
                const message of conversation
              ) {

                if (
                  Number(message.receiverId) ===
                    Number(currentUser?.id)

                  &&

                  message.read === false
                ) {

                  try {

                    await markMessageAsRead(
                      message.id
                    );

                  } catch (error) {

                    console.error(
                      "Failed to mark message as read:",
                      error
                    );
                  }
                }
              }


              setMessages(
                conversation.map(
                  (message) => {

                    if (
                      Number(message.receiverId) ===
                      Number(currentUser?.id)
                    ) {

                      return {
                        ...message,
                        read: true
                      };
                    }

                    return message;
                  }
                )
              );


              await loadUnreadCount();

            } catch (error) {

              console.error(
                "Failed to auto refresh conversation:",
                error
              );
            }
          }

        },
        5000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    selectedUser,
    currentUser
  ]);


  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (
    dateTime
  ) => {

    if (!dateTime) {
      return "";
    }


    return new Date(
      dateTime
    ).toLocaleString();
  };


  // =========================================================
  // AUTO SCROLL TO NEWEST MESSAGE
  // =========================================================

  useEffect(() => {

    const container =
      messagesListRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });

  }, [
    messages,
    selectedUser,
    loadingMessages
  ]);


  // =========================================================
  // GET INITIALS
  // =========================================================

  const getInitials = (
    name
  ) => {

    if (!name) {
      return "?";
    }


    const parts =
      name.trim().split(" ");


    const first =
      parts[0]?.[0] || "";


    const last =
      parts.length > 1
        ? parts[parts.length - 1][0]
        : "";


    return (
      first + last
    ).toUpperCase();
  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="uc-message-app">

      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');


        * {
          box-sizing: border-box;
        }


        .uc-message-app {

          --navy: #17365D;
          --navy-dark: #0E2742;
          --navy-light: #315F8F;

          --gold: #C99A3A;
          --gold-light: #F4E7C3;
          --gold-soft: #FFF8E8;

          --cream: #F6F4EF;
          --cream-dark: #ECE8DE;

          --text: #17202A;
          --text-soft: #6C7786;
          --text-light: #9AA3AF;

          --border: #E5E8EC;

          min-height: 100vh;

          background: var(--background);

          color: var(--text);

          font-family:
            'Inter',
            sans-serif;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;
        }

        html[data-theme="dark"] .uc-message-app {
          --navy: #1a3a5c;
          --navy-dark: #0f2437;
          --navy-light: #3d6fa8;

          --text: #f3f4f6;
          --text-soft: #c7d2fe;
          --text-light: #9ca3af;

          --border: #2f3a4e;
        }


        .uc-message-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);
        }


        .uc-message-main {

          flex: 1;

          min-width: 0;

          padding:
            32px 40px 55px;
        }


        .uc-message-container {

          max-width: 1220px;

          margin: 0 auto;
        }


        /* =========================================
           HEADER
        ========================================= */

        .uc-message-heading {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 24px;
        }


        .uc-heading-left {

          display: flex;

          align-items: center;

          gap: 13px;
        }


        .uc-heading-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 46px;

          height: 46px;

          border-radius: 15px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color: white;

          font-size: 20px;

          box-shadow:
            0 9px 20px
            rgba(23,54,93,0.16);
        }


        .uc-message-title {

          margin: 0;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 28px;

          font-weight: 800;

          letter-spacing:
            -0.035em;

          color:
            var(--navy-dark);
        }


        .uc-message-subtitle {

          margin:
            4px 0 0;

          color:
            var(--text-soft);

          font-size: 11px;

          font-weight: 500;
        }


        .uc-unread {

          display: inline-flex;

          align-items: center;

          gap: 6px;

          min-width: 32px;

          height: 32px;

          padding:
            0 11px;

          border-radius: 999px;

          background:
            var(--gold);

          color:
            #182C43;

          font-size: 10px;

          font-weight: 800;

          box-shadow:
            0 6px 18px
            rgba(201,154,58,0.28);
        }


        .uc-unread-dot {

          width: 6px;

          height: 6px;

          border-radius: 50%;

          background: #17365D;
        }


        /* =========================================
           CHAT WRAPPER
        ========================================= */

        .uc-chat-wrapper {

          display: grid;

          grid-template-columns:
            315px minmax(0, 1fr);

          height: 670px;

          overflow: hidden;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 24px;

          box-shadow:
            0 22px 60px
            rgba(18, 36, 55, 0.1);

          backdrop-filter:
            blur(15px);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;
        }


        /* =========================================
           CONVERSATION SIDEBAR
        ========================================= */

        .uc-conversation-sidebar {

          display: flex;

          flex-direction: column;

          min-width: 0;

          background: var(--surface);

          border-right:
            1px solid var(--border);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;
        }


        .uc-conversation-header {

          padding:
            23px 19px 16px;
        }


        .uc-conversation-title-row {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 15px;
        }


        .uc-conversation-title {

          margin: 0;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 15px;

          font-weight: 800;

          color:
            var(--navy-dark);
        }


        .uc-connection-count {

          display: inline-flex;

          align-items: center;

          height: 23px;

          padding: 0 8px;

          border-radius: 8px;

          background: var(--surface-alt);

          color: var(--text-light);

          font-size: 9px;

          font-weight: 700;

          transition:
            background-color 0.25s ease,
            color 0.25s ease;
        }


        /* SEARCH */

        .uc-search-wrapper {

          position: relative;
        }


        .uc-search-icon {

          position: absolute;

          left: 13px;

          top: 50%;

          transform: translateY(-50%);

          color: var(--text-light);

          font-size: 12px;

          pointer-events: none;

          transition:
            color 0.25s ease;
        }


        .uc-search {

          width: 100%;

          height: 40px;

          padding:
            0 12px 0 34px;

          border:
            1px solid var(--border);

          border-radius: 12px;

          outline: none;

          background: var(--surface-alt);

          color: var(--text);

          font-family:
            'Inter',
            sans-serif;

          font-size: 10px;

          transition:
            all 0.2s ease;
        }


        .uc-search::placeholder {

          color:
            var(--text-light);
        }


        .uc-search:focus {

          background: var(--surface);

          border-color:
            var(--primary);

          box-shadow:
            0 0 0 3px
            rgba(108, 77, 246, 0.1);
        }


        /* USER LIST */

        .uc-users-list {

          flex: 1;

          overflow-y: auto;

          padding:
            4px 9px 12px;
        }


        .uc-user-item {

          position: relative;

          display: flex;

          align-items: center;

          gap: 11px;

          width: 100%;

          padding:
            11px 10px;

          margin-bottom: 3px;

          border: none;

          border-radius: 13px;

          background:
            transparent;

          text-align: left;

          cursor: pointer;

          transition:
            all 0.18s ease;
        }


        .uc-user-item:hover {

          background: var(--surface-hover);

          transform:
            translateX(2px);
        }


        .uc-user-item.selected {

          background: var(--primary-light);

          box-shadow:
            inset 3px 0 0
            var(--primary);
        }


        .uc-user-avatar {

          position: relative;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

          width: 42px;

          height: 42px;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color:
            #F5E7BF;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 11px;

          font-weight: 800;

          box-shadow:
            0 5px 12px
            rgba(23,54,93,0.12);
        }


        .uc-avatar-status {

          position: absolute;

          right: -1px;

          bottom: -1px;

          width: 10px;

          height: 10px;

          border: 2px solid white;

          border-radius: 50%;

          background:
            #42B883;
        }


        .uc-user-info {

          min-width: 0;

          flex: 1;
        }


        .uc-user-name {

          display: block;

          overflow: hidden;

          color:
            var(--navy-dark);

          font-size: 11px;

          font-weight: 800;

          white-space: nowrap;

          text-overflow: ellipsis;
        }


        .uc-user-status {

          display: flex;

          align-items: center;

          gap: 4px;

          margin-top: 4px;

          color:
            #929BA8;

          font-size: 8px;

          font-weight: 500;
        }


        .uc-status-dot {

          width: 5px;

          height: 5px;

          border-radius: 50%;

          background:
            #42B883;
        }


        /* EMPTY SIDEBAR */

        .uc-sidebar-empty {

          padding:
            45px 18px;

          text-align: center;

          color:
            var(--text-soft);

          font-size: 10px;

          line-height: 1.6;
        }


        .uc-empty-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 50px;

          height: 50px;

          margin:
            0 auto 13px;

          border-radius: 16px;

          background:
            var(--gold-light);

          font-size: 20px;

          box-shadow:
            0 8px 18px
            rgba(201,154,58,0.13);
        }


        /* =========================================
           CHAT AREA
        ========================================= */

       .uc-chat-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--surface);
  overflow: hidden;
  transition:
    background-color 0.25s ease;
}


        /* =========================================
           CHAT HEADER
        ========================================= */

        .uc-chat-header {

          display: flex;

          align-items: center;

          gap: 12px;

          min-height: 76px;

          padding:
            15px 23px;

          border-bottom:
            1px solid var(--border);

          background: var(--surface);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;
        }


        .uc-chat-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 44px;

          height: 44px;

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              var(--navy),
              var(--navy-light)
            );

          color:
            #F5E7BF;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 12px;

          font-weight: 800;

          box-shadow:
            0 7px 15px
            rgba(23,54,93,0.15);
        }


        .uc-chat-name {

          margin: 0;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 14px;

          font-weight: 800;

          color:
            var(--navy-dark);
        }


        .uc-chat-online {

          display: flex;

          align-items: center;

          gap: 5px;

          margin-top: 4px;

          color:
            #89929E;

          font-size: 8px;

          font-weight: 500;
        }


        .uc-green-dot {

          width: 6px;

          height: 6px;

          border-radius: 50%;

          background:
            #42B883;

          box-shadow:
            0 0 0 3px
            rgba(66,184,131,0.10);
        }


        /* =========================================
           NO CHAT
        ========================================= */

        .uc-no-chat {

          display: flex;

          align-items: center;

          justify-content: center;

          flex: 1;

          padding: 30px;

          text-align: center;

          background: var(--surface);

          transition:
            background-color 0.25s ease;
        }


        .uc-no-chat-inner {

          max-width: 340px;
        }


        .uc-no-chat-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 82px;

          height: 82px;

          margin: 0 auto 20px;

          border: 1px solid var(--border);

          border-radius: 25px;

          background: var(--surface-strong);

          font-size: 31px;

          box-shadow:
            0 14px 35px
            rgba(23, 54, 93, 0.09);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease;
        }


        .uc-no-chat h2 {

          margin:
            0 0 7px;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size: 19px;

          font-weight: 800;

          color:
            var(--navy-dark);
        }


        .uc-no-chat p {

          margin: 0;

          color:
            var(--text-soft);

          font-size: 10px;

          line-height: 1.75;
        }


        /* =========================================
           MESSAGES
        ========================================= */

       .uc-messages-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 25px 25px 15px;
  background: var(--surface);
  scroll-behavior: smooth;
  transition:
    background-color 0.25s ease;
}


        .uc-message-empty {

          display: flex;

          align-items: center;

          justify-content: center;

          height: 100%;

          text-align: center;

          color:
            var(--text-soft);

          font-size: 10px;

          line-height: 1.7;
        }


        .uc-message-row {

          display: flex;

          margin-bottom: 14px;

          animation:
            ucMessageIn 0.18s ease;
        }


        @keyframes ucMessageIn {

          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        .uc-message-row.mine {

          justify-content: flex-end;
        }


        .uc-message-bubble {

          position: relative;

          max-width: 66%;

          padding:
            11px 14px;

          border:
            1px solid var(--border);

          border-radius:
            16px 16px 16px 5px;

          background: var(--surface-alt);

          color: var(--text-secondary);

          box-shadow:
            0 4px 13px
            rgba(23, 36, 54, 0.035);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease;
        }


        .uc-message-row.mine
        .uc-message-bubble {

          border:
            1px solid
            rgba(108, 77, 246, 0.3);

          border-radius:
            16px 16px 5px 16px;

          background: var(--primary);

          color: white;

          box-shadow:
            0 7px 18px
            rgba(108, 77, 246, 0.2);
        }


        .uc-message-sender {

          margin-bottom: 4px;

          color: var(--primary);

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.01em;
        }


        .uc-message-row.mine
        .uc-message-sender {

          color: rgba(255, 255, 255, 0.8);
        }


        .uc-message-content {

          margin: 0;

          font-size: 11px;

          line-height: 1.6;

          white-space: pre-wrap;

          word-break: break-word;
        }


        .uc-message-meta {

          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 8px;

          margin-top: 6px;
        }


        .uc-message-time {

          color: var(--text-light);

          font-size: 7px;

          transition:
            color 0.25s ease;
        }


        .uc-message-row.mine
        .uc-message-time {

          color: rgba(255, 255, 255, 0.7);
        }


        .uc-delete-message {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 19px;

          height: 19px;

          padding: 0;

          border: none;

          border-radius: 6px;

          background: transparent;

          color: var(--text-light);

          font-size: 9px;

          cursor: pointer;

          opacity: 0;

          transition:
            all 0.18s ease;
        }


        .uc-message-bubble:hover
        .uc-delete-message {

          opacity: 1;
        }


        .uc-delete-message:hover {

          background: rgba(220, 38, 38, 0.1);

          color: var(--danger);
        }


        /* =========================================
           COMPOSER
        ========================================= */

        .uc-composer {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  flex-shrink: 0;
  position: relative;

  padding: 14px 18px;

  border-top: 1px solid var(--border);

  background: var(--surface);

  z-index: 5;

  transition:
    background-color 0.25s ease,
    border-color 0.25s ease;
}

        .uc-message-input {

          flex: 1;

          min-width: 0;

          min-height: 44px;

          max-height: 120px;

          padding:
            12px 14px;

          resize: none;

          border:
            1px solid var(--border);

          border-radius: 13px;

          outline: none;

          background: var(--surface-alt);

          color: var(--text);

          font-family:
            'Inter',
            sans-serif;

          font-size: 10px;

          line-height: 1.5;

          transition:
            all 0.2s ease;
        }


        .uc-message-input::placeholder {

          color: var(--text-light);
        }


        .uc-message-input:focus {

          background: var(--surface);

          border-color: var(--primary);

          box-shadow:
            0 0 0 3px
            rgba(108, 77, 246, 0.1);
        }


        .uc-send-button {

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

          width: 44px;

          height: 44px;

          border: none;

          border-radius: 13px;

          background: var(--primary);

          color: white;

          font-size: 15px;

          cursor: pointer;

          box-shadow:
            0 7px 18px
            rgba(108, 77, 246, 0.2);

          transition:
            all 0.2s ease;
        }


        .uc-send-button:hover:not(:disabled) {

          transform:
            translateY(-2px);

          box-shadow:
            0 10px 23px
            rgba(108, 77, 246, 0.3);
        }


        .uc-send-button:active:not(:disabled) {

          transform:
            translateY(0);
        }


        .uc-send-button:disabled {

          opacity: 0.42;

          cursor: not-allowed;

          box-shadow: none;
        }


        /* =========================================
           SCROLLBAR
        ========================================= */

        .uc-users-list::-webkit-scrollbar,
        .uc-messages-list::-webkit-scrollbar {

          width: 5px;
        }


        .uc-users-list::-webkit-scrollbar-track,
        .uc-messages-list::-webkit-scrollbar-track {

          background: transparent;
        }


        .uc-users-list::-webkit-scrollbar-thumb,
        .uc-messages-list::-webkit-scrollbar-thumb {

          background: var(--border);

          border-radius: 20px;

          transition:
            background 0.25s ease;
        }


        .uc-users-list::-webkit-scrollbar-thumb:hover,
        .uc-messages-list::-webkit-scrollbar-thumb:hover {

          background: var(--text-light);
        }


        /* =========================================
           RESPONSIVE
        ========================================= */

        @media (max-width: 1100px) {

          .uc-message-main {

            padding:
              28px 25px 45px;
          }


          .uc-chat-wrapper {

            grid-template-columns:
              280px minmax(0, 1fr);
          }
        }


        @media (max-width: 900px) {

          .uc-message-main {

            padding:
              24px 20px 40px;
          }


          .uc-chat-wrapper {

            grid-template-columns:
              250px minmax(0, 1fr);

            height:
              630px;
          }


          .uc-message-bubble {

            max-width: 75%;
          }
        }


        @media (max-width: 700px) {

          .uc-message-layout {

            display: block;
          }


          .uc-message-main {

            padding:
              18px 12px 35px;
          }


          .uc-heading-icon {

            width: 40px;

            height: 40px;

            border-radius: 13px;

            font-size: 17px;
          }


          .uc-message-title {

            font-size: 23px;
          }


          .uc-message-subtitle {

            font-size: 9px;
          }


          .uc-chat-wrapper {

            display: flex;

            flex-direction: column;

            height: 730px;

            border-radius: 19px;
          }


          .uc-conversation-sidebar {

            flex:
              0 0 238px;

            border-right: none;

            border-bottom:
              1px solid var(--border);
          }


          .uc-users-list {

            display: flex;

            gap: 7px;

            overflow-x: auto;

            overflow-y: hidden;

            padding:
              5px 10px 12px;
          }


          .uc-user-item {

            flex:
              0 0 150px;

            margin-bottom: 0;
          }


          .uc-message-bubble {

            max-width: 82%;
          }
        }


        @media (max-width: 450px) {

          .uc-message-main {

            padding:
              12px 8px 25px;
          }


          .uc-message-heading {

            margin-bottom: 14px;
          }


          .uc-heading-icon {

            display: none;
          }


          .uc-message-title {

            font-size: 21px;
          }


          .uc-chat-wrapper {

            height:
              690px;

            border-radius:
              16px;
          }


          .uc-conversation-sidebar {

            flex:
              0 0 225px;
          }


          .uc-chat-header {

            padding:
              14px 15px;
          }


          .uc-messages-list {

            padding:
              18px 12px 10px;
          }


          .uc-message-bubble {

            max-width: 89%;

            padding:
              10px 12px;
          }


          .uc-message-content {

            font-size: 10px;
          }


          .uc-composer {

            padding:
              10px;
          }


          .uc-message-input {

            font-size: 10px;
          }
        }

      `}</style>


      <Navbar />


      <div className="uc-message-layout">

        <Sidebar />


        <main className="uc-message-main">

          <div className="uc-message-container">


            {/* PAGE HEADER */}

            <div className="uc-message-heading">

              <div className="uc-heading-left">

                <div className="uc-heading-icon">
                  💬
                </div>

                <div>

                  <h1 className="uc-message-title">
                    Messages
                  </h1>

                  <p className="uc-message-subtitle">
                    Stay connected with your university community
                  </p>

                </div>

              </div>


              {unreadCount > 0 && (

                <span className="uc-unread">

                  <span className="uc-unread-dot" />

                  {unreadCount}

                  {" "}

                  unread

                </span>

              )}

            </div>


            {/* CHAT */}

            <div className="uc-chat-wrapper">


              {/* CONVERSATION SIDEBAR */}

              <section className="uc-conversation-sidebar">

                <div className="uc-conversation-header">

                  <div className="uc-conversation-title-row">

                    <h2 className="uc-conversation-title">
                      Conversations
                    </h2>

                    <span className="uc-connection-count">
                      {uniqueConnectedUsers.length} connections
                    </span>

                  </div>


                  <div className="uc-search-wrapper">

                    <span className="uc-search-icon">
                      🔍
                    </span>

                    <input
                      className="uc-search"
                      type="text"
                      placeholder="Search connections..."
                      value={searchText}
                      onChange={(event) =>
                        setSearchText(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                <div className="uc-users-list">

                  {loadingConnections ? (

                    <div className="uc-sidebar-empty">

                      <div className="uc-empty-icon">
                        ⏳
                      </div>

                      Loading connections...

                    </div>

                  ) : filteredUsers.length === 0 ? (

                    <div className="uc-sidebar-empty">

                      <div className="uc-empty-icon">
                        👥
                      </div>

                      No connections found.

                    </div>

                  ) : (

                    filteredUsers.map(
                      (user) => {

                        const isSelected =
                          selectedUser &&
                          Number(selectedUser.id) ===
                          Number(user.id);


                        return (

                          <button
                            className={
                              "uc-user-item" +
                              (
                                isSelected
                                  ? " selected"
                                  : ""
                              )
                            }
                            key={user.id}
                            onClick={() =>
                              handleSelectUser(
                                user
                              )
                            }
                          >

                            <div className="uc-user-avatar">

                              {getInitials(
                                user.name
                              )}

                              <span className="uc-avatar-status" />

                            </div>


                            <div className="uc-user-info">

                              <span className="uc-user-name">
                                {user.name}
                              </span>

                              <span className="uc-user-status">

                                <span className="uc-status-dot" />

                                Connected

                              </span>

                            </div>

                          </button>

                        );

                      }
                    )

                  )}

                </div>

              </section>


              {/* CHAT AREA */}

              <section className="uc-chat-area">


                {!selectedUser ? (

                  <div className="uc-no-chat">

                    <div className="uc-no-chat-inner">

                      <div className="uc-no-chat-icon">
                        💬
                      </div>

                      <h2>
                        Start a conversation
                      </h2>

                      <p>
                        Select one of your connections
                        from the left to start messaging.
                      </p>

                    </div>

                  </div>

                ) : (

                  <>


                    {/* CHAT HEADER */}

                    <div className="uc-chat-header">

                      <div className="uc-chat-avatar">

                        {getInitials(
                          selectedUser.name
                        )}

                      </div>


                      <div>

                        <h2 className="uc-chat-name">

                          {selectedUser.name}

                        </h2>


                        <div className="uc-chat-online">

                          <span className="uc-green-dot" />

                          Connected

                        </div>

                      </div>

                    </div>


                    {/* MESSAGES */}

<div className="uc-messages-list" ref={messagesListRef}>

                      {loadingMessages ? (

                        <div className="uc-message-empty">

                          <div>

                            <div
                              style={{
                                fontSize: "27px",
                                marginBottom: "8px"
                              }}
                            >
                              ⏳
                            </div>

                            Loading messages...

                          </div>

                        </div>

                      ) : messages.length === 0 ? (

                        <div className="uc-message-empty">

                          <div>

                            <div
                              style={{
                                fontSize: "30px",
                                marginBottom: "8px"
                              }}
                            >
                              👋
                            </div>

                            No messages yet.

                            <br />

                            Start the conversation!

                          </div>

                        </div>

                      ) : (

                        messages.map(
                          (message) => {

                            const isMine =
                              currentUser &&
                              Number(
                                message.senderId
                              ) ===
                              Number(
                                currentUser.id
                              );


                            return (

                              <div
                                key={message.id}
                                className={
                                  "uc-message-row" +
                                  (
                                    isMine
                                      ? " mine"
                                      : ""
                                  )
                                }
                              >

                                <div className="uc-message-bubble">

                                  <div className="uc-message-sender">

                                    {isMine
                                      ? "You"
                                      : message.senderName}

                                  </div>


                                  <p className="uc-message-content">

                                    {message.content}

                                  </p>


                                  <div className="uc-message-meta">

                                    <span className="uc-message-time">

                                      {formatTime(
                                        message.createdAt
                                      )}

                                    </span>


                                    {isMine && (

                                      <button
                                        className="uc-delete-message"
                                        onClick={() =>
                                          handleDeleteMessage(
                                            message.id
                                          )
                                        }
                                        title="Delete message"
                                      >

                                        🗑

                                      </button>

                                    )}

                                  </div>

                                </div>

                              </div>

                            );

                          }
                        )

                      )}

                    </div>


                    {/* MESSAGE COMPOSER */}

                    <div className="uc-composer">

                      <textarea
                        className="uc-message-input"
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(
                            event.target.value
                          )
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        placeholder={
                          `Message ${selectedUser.name}...`
                        }
                        rows="1"
                      />


                      <button
                        className="uc-send-button"
                        onClick={
                          handleSendMessage
                        }
                        disabled={
                          sending ||
                          !messageText.trim()
                        }
                        title="Send message"
                      >

                        {sending
                          ? "..."
                          : "➤"}

                      </button>

                    </div>

                  </>

                )}

              </section>

            </div>

          </div>

        </main>

      </div>

    </div>

  );
}

export default Messages;