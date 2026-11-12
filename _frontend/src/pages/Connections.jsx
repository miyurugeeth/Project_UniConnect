import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
  getCurrentUser,
  getAllUsers
} from "../services/userService";

import {
  sendConnectionRequest,
  getConnectionStatus,
  getReceivedRequests,
  getSentRequests,
  getMyConnections,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  removeConnection
} from "../services/connectionService";


function Connections() {

  // ----------------------------------------
  // CURRENT USER
  // ----------------------------------------

  const [currentUser, setCurrentUser] = useState(null);

  // ----------------------------------------
  // ALL USERS
  // ----------------------------------------

  const [users, setUsers] = useState([]);

  const [searchText, setSearchText] = useState("");

  // ----------------------------------------
  // CONNECTION STATUS
  // ----------------------------------------

  const [connectionStatuses, setConnectionStatuses] =
    useState({});

  // ----------------------------------------
  // CONNECTION DATA
  // ----------------------------------------

  const [receivedRequests, setReceivedRequests] =
    useState([]);

  const [sentRequests, setSentRequests] =
    useState([]);

  const [myConnections, setMyConnections] =
    useState([]);

  // ----------------------------------------
  // UI STATES
  // ----------------------------------------

  const [loading, setLoading] = useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("find");


  // ----------------------------------------
  // LOAD CURRENT USER
  // ----------------------------------------

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


  // ----------------------------------------
  // LOAD ALL USERS
  // ----------------------------------------

  const loadUsers = async (user) => {

    try {

      setLoadingUsers(true);

      const allUsers =
        await getAllUsers();

      console.log(
        "All Users:",
        allUsers
      );

      const otherUsers =
        allUsers.filter(
          (item) =>
            item.id !== user.id
        );

      setUsers(otherUsers);

      const statusResults =
        await Promise.all(

          otherUsers.map(
            async (item) => {

              try {

                const status =
                  await getConnectionStatus(
                    item.id
                  );

                return {
                  userId: item.id,
                  status: status
                };

              } catch (error) {

                console.error(
                  `Failed to get connection status for user ${item.id}:`,
                  error
                );

                return {
                  userId: item.id,
                  status: "NOT_CONNECTED"
                };

              }

            }
          )

        );


      const statusMap = {};


      statusResults.forEach(
        (item) => {

          statusMap[item.userId] =
            item.status;

        }
      );


      setConnectionStatuses(
        statusMap
      );

    } catch (error) {

      console.error(
        "Failed to load users:",
        error
      );

    } finally {

      setLoadingUsers(false);

    }

  };


  // ----------------------------------------
  // LOAD CONNECTION DATA
  // ----------------------------------------

  const loadConnections = async () => {

    try {

      setLoading(true);

      const received =
        await getReceivedRequests();

      const sent =
        await getSentRequests();

      const connections =
        await getMyConnections();


      console.log(
        "Received:",
        received
      );

      console.log(
        "Sent:",
        sent
      );

      console.log(
        "My Connections:",
        connections
      );


      setReceivedRequests(
        received
      );

      setSentRequests(
        sent
      );

      setMyConnections(
        connections
      );

    } catch (error) {

      console.error(
        "Failed to load connections:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  // ----------------------------------------
  // INITIAL LOAD
  // ----------------------------------------

  useEffect(() => {

    const loadData = async () => {

      const user =
        await loadCurrentUser();


      if (user) {

        await loadUsers(user);

      }


      await loadConnections();

    };


    loadData();

  }, []);


  // ----------------------------------------
  // SEND CONNECTION REQUEST
  // ----------------------------------------

  const handleConnect = async (
    receiverId
  ) => {

    try {

      await sendConnectionRequest(
        receiverId
      );


      setConnectionStatuses(
        (previous) => ({

          ...previous,

          [receiverId]: "PENDING"

        })
      );


      await loadConnections();


      alert(
        "Connection request sent successfully!"
      );

    } catch (error) {

      console.error(
        "Failed to send connection request:",
        error
      );


      console.error(
        "Backend response:",
        error.response?.data
      );


      alert(
        error.response?.data?.message ||
        "Failed to send connection request."
      );

    }

  };


  // ----------------------------------------
  // ACCEPT REQUEST
  // ----------------------------------------

  const handleAccept = async (
    connectionId
  ) => {

    try {

      await acceptConnectionRequest(
        connectionId
      );


      await loadConnections();


      if (currentUser) {

        await loadUsers(
          currentUser
        );

      }

    } catch (error) {

      console.error(
        "Failed to accept request:",
        error
      );

    }

  };


  // ----------------------------------------
  // REJECT REQUEST
  // ----------------------------------------

  const handleReject = async (
    connectionId
  ) => {

    try {

      await rejectConnectionRequest(
        connectionId
      );


      await loadConnections();

    } catch (error) {

      console.error(
        "Failed to reject request:",
        error
      );

    }

  };


  // ----------------------------------------
  // CANCEL REQUEST
  // ----------------------------------------

  const handleCancel = async (
    connectionId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this request?"
      );


    if (!confirmed) {

      return;

    }


    try {

      await cancelConnectionRequest(
        connectionId
      );


      await loadConnections();


      if (currentUser) {

        await loadUsers(
          currentUser
        );

      }

    } catch (error) {

      console.error(
        "Failed to cancel request:",
        error
      );

    }

  };


  // ----------------------------------------
  // REMOVE CONNECTION
  // ----------------------------------------

  const handleRemove = async (
    connectionId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to remove this connection?"
      );


    if (!confirmed) {

      return;

    }


    try {

      await removeConnection(
        connectionId
      );


      await loadConnections();


      if (currentUser) {

        await loadUsers(
          currentUser
        );

      }

    } catch (error) {

      console.error(
        "Failed to remove connection:",
        error
      );

    }

  };


  // ----------------------------------------
  // SEARCH USERS
  // ----------------------------------------

  const filteredUsers =
    users.filter(
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

          ||

          user.email
            ?.toLowerCase()
            .includes(search)

          ||

          user.university
            ?.toLowerCase()
            .includes(search)

          ||

          user.faculty
            ?.toLowerCase()
            .includes(search)

        );

      }
    );


  // ----------------------------------------
  // CONNECTION BUTTON
  // ----------------------------------------

  const getConnectionButton = (
    user
  ) => {

    const status =
      connectionStatuses[user.id];


    if (status === "PENDING") {

      return (

        <button
          className="connection-btn pending"
          disabled
        >
          <span>⏳</span>
          Request Pending
        </button>

      );

    }


    if (status === "ACCEPTED") {

      return (

        <button
          className="connection-btn connected"
          disabled
        >
          <span>✓</span>
          Connected
        </button>

      );

    }


    if (status === "REJECTED") {

      return (

        <button
          className="connection-btn rejected"
          disabled
        >
          <span>×</span>
          Request Rejected
        </button>

      );

    }


    return (

      <button
        className="connection-btn connect"
        onClick={() =>
          handleConnect(
            user.id
          )
        }
      >
        <span>＋</span>
        Connect
      </button>

    );

  };


  // ----------------------------------------
  // GET INITIALS
  // ----------------------------------------

  const getInitials = (name) => {

    if (!name) return "?";

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


  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (

    <div className="connections-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .connections-page {

          --navy: #17365D;
          --navy-dark: #102A46;
          --navy-light: #315D8C;

          --gold: #C99A3A;
          --gold-light: #F5E8C5;

          min-height: 100vh;

          background: var(--background);

          font-family:
            Inter,
            Arial,
            sans-serif;

          color: var(--text);

          transition:
            background-color 0.25s ease,
            color 0.25s ease;

        }


        /* =========================================
           MAIN
        ========================================= */

        .connections-layout {

          display: flex;

          min-height:
            calc(100vh - 70px);

        }


        .connections-main {

          flex: 1;

          min-width: 0;

          padding:
            38px 45px 70px;

        }


        .connections-container {

          max-width: 1080px;

          margin:
            0 auto;

        }


        /* =========================================
           HERO
        ========================================= */

        .connections-hero {

          position: relative;

          overflow: hidden;

          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 25px;

          padding:
            32px 35px;

          margin-bottom: 24px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              var(--navy-dark),
              var(--navy)
            );

          box-shadow:
            0 18px 40px
            rgba(23,54,93,0.17);

        }


        .connections-hero::before {

          content: "";

          position: absolute;

          width: 260px;

          height: 260px;

          right: -90px;

          top: -120px;

          border-radius: 50%;

          background:
            rgba(201,154,58,0.18);

        }


        .connections-hero::after {

          content: "";

          position: absolute;

          width: 150px;

          height: 150px;

          right: 180px;

          bottom: -120px;

          border-radius: 50%;

          background:
            rgba(255,255,255,0.05);

        }


        .hero-content {

          position: relative;

          z-index: 2;

        }


        .hero-label {

          display: block;

          margin-bottom: 7px;

          color: #E9CD86;

          font-size: 11px;

          font-weight: 800;

          letter-spacing:
            0.15em;

          text-transform:
            uppercase;

        }


        .hero-title {

          margin: 0;

          color: white;

          font-family:
            "Plus Jakarta Sans",
            Inter,
            sans-serif;

          font-size: 29px;

          font-weight: 800;

          letter-spacing:
            -0.035em;

        }


        .hero-description {

          margin:
            9px 0 0;

          max-width: 570px;

          color:
            rgba(255,255,255,0.72);

          font-size: 13px;

          line-height: 1.6;

        }


        .hero-icon {

          position: relative;

          z-index: 2;

          display: flex;

          align-items: center;

          justify-content: center;

          width: 76px;

          height: 76px;

          flex-shrink: 0;

          border-radius: 22px;

          background:
            rgba(255,255,255,0.1);

          border:
            1px solid
            rgba(255,255,255,0.15);

          color:
            #F3D88F;

          font-size: 33px;

          backdrop-filter:
            blur(10px);

        }


        /* =========================================
           STATS
        ========================================= */

        .connection-stats {

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 15px;

          margin-bottom: 25px;

        }


        .stat-card {

          display: flex;

          align-items: center;

          gap: 13px;

          padding:
            17px 19px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 17px;

          box-shadow: var(--shadow-sm);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        .stat-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 42px;

          height: 42px;

          border-radius: 13px;

          background: var(--primary-light);

          color: var(--primary-dark);

          font-size: 19px;

        }


        .stat-number {

          display: block;

          margin-bottom: 2px;

          color: var(--text);

          font-size: 19px;

          font-weight: 800;

        }


        .stat-label {

          color: var(--text-secondary);

          font-size: 11px;

          font-weight: 600;

        }


        /* =========================================
           TABS
        ========================================= */

        .tabs-card {

          display: flex;

          gap: 5px;

          padding: 6px;

          margin-bottom: 20px;

          overflow-x: auto;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 15px;

          box-shadow: var(--shadow-sm);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        .tab-button {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          min-height: 42px;

          padding:
            0 17px;

          border: none;

          border-radius: 10px;

          background: transparent;

          color: var(--text-secondary);

          font-family:
            Inter,
            Arial,
            sans-serif;

          font-size: 11px;

          font-weight: 750;

          white-space:
            nowrap;

          cursor: pointer;

          transition:
            all 0.2s ease;

        }


        .tab-button:hover {

          background: var(--surface-alt);

          color: var(--text);

        }


        .tab-button.active {

          background:
            var(--navy);

          color:
            white;

          box-shadow:
            0 5px 13px
            rgba(23,54,93,0.2);

        }


        .tab-count {

          display: inline-flex;

          align-items: center;

          justify-content: center;

          min-width: 19px;

          height: 19px;

          padding:
            0 5px;

          border-radius: 999px;

          background:
            rgba(201,154,58,0.18);

          color:
            #88651E;

          font-size: 9px;

        }


        .tab-button.active .tab-count {

          background:
            rgba(255,255,255,0.16);

          color:
            #F5D98E;

        }


        /* =========================================
           SECTION
        ========================================= */

        .section-card {

          padding:
            25px;

          background: var(--surface);

          border:
            1px solid var(--border);

          border-radius: 20px;

          box-shadow: var(--shadow-sm);

          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

        }


        .section-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 20px;

        }


        .section-title-wrap {

          display: flex;

          align-items: center;

          gap: 12px;

        }


        .section-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 39px;

          height: 39px;

          border-radius: 12px;

          background:
            var(--gold-light);

          color:
            #88651E;

          font-size: 17px;

        }


        .section-title {

          margin: 0;

          color:
            var(--navy-dark);

          font-size: 17px;

          font-weight: 800;

        }


        .section-subtitle {

          margin:
            3px 0 0;

          color:
            var(--muted);

          font-size: 10px;

        }


        /* =========================================
           SEARCH
        ========================================= */

        .search-box {

          position: relative;

          margin-bottom: 20px;

        }


        .search-icon {

          position: absolute;

          left: 15px;

          top: 50%;

          transform:
            translateY(-50%);

          color:
            #98A1AF;

          font-size: 15px;

        }


        .search-input {

          width: 100%;

          height: 46px;

          padding:
            0 16px 0 43px;

          border:
            1px solid var(--border);

          border-radius: 13px;

          outline: none;

          background:
            #F9FAFB;

          color:
            var(--text);

          font-family:
            Inter,
            Arial,
            sans-serif;

          font-size: 12px;

          transition:
            all 0.2s ease;

        }


        .search-input:focus {

          background:
            white;

          border-color:
            var(--gold);

          box-shadow:
            0 0 0 4px
            rgba(201,154,58,0.09);

        }


        /* =========================================
           USER GRID
        ========================================= */

        .users-grid {

          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 14px;

        }


        .user-card {

          position: relative;

          display: flex;

          flex-direction: column;

          padding:
            19px;

          border:
            1px solid var(--border);

          border-radius: 17px;

          background:
            white;

          transition:
            all 0.22s ease;

        }


        .user-card:hover {

          transform:
            translateY(-3px);

          border-color:
            #D9DDE4;

          box-shadow:
            0 12px 28px
            rgba(20,35,55,0.08);

        }


        .user-top {

          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 16px;

        }


        .user-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 48px;

          height: 48px;

          flex-shrink: 0;

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              #E6ECF3,
              #D8E2ED
            );

          color:
            var(--navy);

          font-size: 13px;

          font-weight: 800;

        }


        .user-name {

          margin: 0 0 4px;

          color:
            var(--navy-dark);

          font-size: 14px;

          font-weight: 800;

        }


        .user-email {

          margin: 0;

          color:
            var(--muted);

          font-size: 10px;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

        }


        .user-info {

          display: grid;

          gap: 8px;

          padding:
            13px;

          margin-bottom: 16px;

          border-radius: 12px;

          background:
            #F7F8FA;

        }


        .info-row {

          display: flex;

          align-items: center;

          gap: 8px;

          color:
            #667182;

          font-size: 10px;

        }


        .info-label {

          color:
            #9AA2AE;

          min-width: 68px;

        }


        .connection-btn {

          width: 100%;

          height: 38px;

          border: none;

          border-radius: 10px;

          font-family:
            Inter,
            Arial,
            sans-serif;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;

          transition:
            all 0.2s ease;

        }


        .connection-btn span {

          margin-right: 5px;

        }


        .connection-btn.connect {

          background:
            var(--navy);

          color:
            white;

        }


        .connection-btn.connect:hover {

          background:
            var(--navy-dark);

          transform:
            translateY(-1px);

          box-shadow:
            0 7px 16px
            rgba(23,54,93,0.2);

        }


        .connection-btn.pending {

          background:
            #FFF7E5;

          color:
            #9A731F;

          cursor:
            default;

        }


        .connection-btn.connected {

          background:
            #E9F6EF;

          color:
            #32835B;

          cursor:
            default;

        }


        .connection-btn.rejected {

          background:
            #FCEDED;

          color:
            #C45656;

          cursor:
            default;

        }


        /* =========================================
           REQUEST CARDS
        ========================================= */

        .request-list {

          display: grid;

          gap: 12px;

        }


        .request-card {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 18px;

          padding:
            17px;

          border:
            1px solid var(--border);

          border-radius: 15px;

          background:
            white;

          transition:
            all 0.2s ease;

        }


        .request-card:hover {

          box-shadow:
            0 7px 20px
            rgba(20,35,55,0.06);

        }


        .request-person {

          display: flex;

          align-items: center;

          gap: 12px;

          min-width: 0;

        }


        .request-avatar {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 45px;

          height: 45px;

          flex-shrink: 0;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #E6ECF3,
              #D8E2ED
            );

          color:
            var(--navy);

          font-size: 12px;

          font-weight: 800;

        }


        .request-name {

          margin: 0 0 4px;

          color:
            var(--navy-dark);

          font-size: 13px;

          font-weight: 800;

        }


        .request-text {

          margin: 0;

          color:
            var(--muted);

          font-size: 10px;

        }


        .request-actions {

          display: flex;

          gap: 7px;

          flex-shrink: 0;

        }


        .request-btn {

          height: 34px;

          padding:
            0 13px;

          border: none;

          border-radius: 9px;

          font-size: 10px;

          font-weight: 800;

          cursor: pointer;

          transition:
            all 0.2s ease;

        }


        .accept-btn {

          background:
            var(--navy);

          color:
            white;

        }


        .accept-btn:hover {

          background:
            var(--navy-dark);

        }


        .reject-btn {

          background:
            #F2F3F5;

          color:
            #6F7886;

        }


        .reject-btn:hover {

          background:
            #FCECEC;

          color:
            #C34E4E;

        }


        .cancel-btn {

          background:
            #FFF6E2;

          color:
            #98711F;

        }


        .remove-btn {

          background:
            #FCECEC;

          color:
            #C34E4E;

        }


        .message-btn {

          display: inline-flex;

          align-items: center;

          justify-content: center;

          height: 34px;

          padding:
            0 13px;

          border-radius: 9px;

          background:
            var(--navy);

          color:
            white;

          text-decoration: none;

          font-size: 10px;

          font-weight: 800;

          transition:
            all 0.2s ease;

        }


        .message-btn:hover {

          background:
            var(--navy-dark);

          transform:
            translateY(-1px);

        }


        /* =========================================
           EMPTY
        ========================================= */

        .empty-state {

          padding:
            55px 20px;

          text-align: center;

          border:
            1px dashed #D9DEE5;

          border-radius: 16px;

          background:
            #FAFBFC;

        }


        .empty-icon {

          display: flex;

          align-items: center;

          justify-content: center;

          width: 56px;

          height: 56px;

          margin:
            0 auto 13px;

          border-radius: 17px;

          background:
            var(--gold-light);

          font-size: 24px;

        }


        .empty-title {

          margin:
            0 0 5px;

          color:
            var(--navy-dark);

          font-size: 14px;

          font-weight: 800;

        }


        .empty-text {

          margin: 0;

          color:
            var(--muted);

          font-size: 11px;

        }


        /* =========================================
           LOADING
        ========================================= */

        .loading-state {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;

          min-height: 150px;

          color:
            var(--muted);

          font-size: 12px;

        }


        .loader {

          width: 18px;

          height: 18px;

          border:
            2px solid #E4E7EB;

          border-top-color:
            var(--gold);

          border-radius: 50%;

          animation:
            spin 0.8s linear infinite;

        }


        @keyframes spin {

          to {
            transform: rotate(360deg);
          }

        }


        /* =========================================
           RESPONSIVE
        ========================================= */

        @media (max-width: 1000px) {

          .connections-main {

            padding:
              28px 25px 60px;

          }

          .users-grid {

            grid-template-columns:
              1fr;

          }

        }


        @media (max-width: 720px) {

          .connections-layout {

            display: block;

          }

          .connections-main {

            padding:
              20px 14px 50px;

          }

          .connections-hero {

            padding:
              25px;

          }

          .hero-title {

            font-size: 23px;

          }

          .hero-icon {

            display: none;

          }

          .connection-stats {

            grid-template-columns:
              1fr;

          }

          .tabs-card {

            border-radius: 12px;

          }

          .section-card {

            padding:
              17px;

            border-radius:
              17px;

          }

          .request-card {

            align-items:
              flex-start;

            flex-direction:
              column;

          }

          .request-actions {

            width: 100%;

          }

          .request-btn,
          .message-btn {

            flex: 1;

          }

        }


        @media (max-width: 450px) {

          .connections-hero {

            border-radius:
              18px;

          }

          .hero-title {

            font-size:
              20px;

          }

          .hero-description {

            font-size:
              11px;

          }

          .tab-button {

            padding:
              0 12px;

          }

          .section-header {

            align-items:
              flex-start;

          }

        }

      `}</style>


      <Navbar />


      <div className="connections-layout">

        <Sidebar />


        <main className="connections-main">

          <div className="connections-container">


            {/* =====================================
                HERO
            ===================================== */}

            <section className="connections-hero">

              <div className="hero-content">

                <span className="hero-label">
                  UniConnect Community
                </span>

                <h1 className="hero-title">
                  Build Your Network 🤝
                </h1>

                <p className="hero-description">
                  Discover students, connect with your university community,
                  and build meaningful academic connections.
                </p>

              </div>


              <div className="hero-icon">
                🤝
              </div>

            </section>


            {/* =====================================
                STATS
            ===================================== */}

            <div className="connection-stats">

              <div className="stat-card">

                <div className="stat-icon">
                  👥
                </div>

                <div>

                  <span className="stat-number">
                    {myConnections.length}
                  </span>

                  <span className="stat-label">
                    My Connections
                  </span>

                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon">
                  📥
                </div>

                <div>

                  <span className="stat-number">
                    {receivedRequests.length}
                  </span>

                  <span className="stat-label">
                    Received Requests
                  </span>

                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon">
                  👤
                </div>

                <div>

                  <span className="stat-number">
                    {users.length}
                  </span>

                  <span className="stat-label">
                    Students
                  </span>

                </div>

              </div>

            </div>


            {/* =====================================
                TABS
            ===================================== */}

            <div className="tabs-card">

              <button
                className={
                  "tab-button " +
                  (
                    activeTab === "find"
                      ? "active"
                      : ""
                  )
                }
                onClick={() =>
                  setActiveTab("find")
                }
              >

                🔍 Find People

              </button>


              <button
                className={
                  "tab-button " +
                  (
                    activeTab === "received"
                      ? "active"
                      : ""
                  )
                }
                onClick={() =>
                  setActiveTab("received")
                }
              >

                📥 Received

                <span className="tab-count">
                  {receivedRequests.length}
                </span>

              </button>


              <button
                className={
                  "tab-button " +
                  (
                    activeTab === "sent"
                      ? "active"
                      : ""
                  )
                }
                onClick={() =>
                  setActiveTab("sent")
                }
              >

                📤 Sent

                <span className="tab-count">
                  {sentRequests.length}
                </span>

              </button>


              <button
                className={
                  "tab-button " +
                  (
                    activeTab === "connections"
                      ? "active"
                      : ""
                  )
                }
                onClick={() =>
                  setActiveTab("connections")
                }
              >

                🤝 Connections

                <span className="tab-count">
                  {myConnections.length}
                </span>

              </button>

            </div>


            {/* =====================================
                FIND PEOPLE
            ===================================== */}

            {activeTab === "find" && (

              <section className="section-card">

                <div className="section-header">

                  <div className="section-title-wrap">

                    <div className="section-icon">
                      🔍
                    </div>

                    <div>

                      <h2 className="section-title">
                        Find People
                      </h2>

                      <p className="section-subtitle">
                        Discover students and grow your network
                      </p>

                    </div>

                  </div>

                </div>


                <div className="search-box">

                  <span className="search-icon">
                    🔍
                  </span>

                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search by name, email, university or faculty..."
                    value={searchText}
                    onChange={(e) =>
                      setSearchText(
                        e.target.value
                      )
                    }
                  />

                </div>


                {loadingUsers ? (

                  <div className="loading-state">

                    <span className="loader" />

                    Loading students...

                  </div>

                ) : filteredUsers.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      🔎
                    </div>

                    <h3 className="empty-title">
                      No students found
                    </h3>

                    <p className="empty-text">
                      Try searching with a different name or keyword.
                    </p>

                  </div>

                ) : (

                  <div className="users-grid">

                    {filteredUsers.map(
                      (user) => (

                        <article
                          className="user-card"
                          key={user.id}
                        >

                          <div className="user-top">

                            <div className="user-avatar">

                              {getInitials(
                                user.name
                              )}

                            </div>

                            <div>

                              <h3 className="user-name">
                                {user.name}
                              </h3>

                              <p className="user-email">
                                {user.email}
                              </p>

                            </div>

                          </div>


                          <div className="user-info">

                            <div className="info-row">

                              <span>
                                🎓
                              </span>

                              <span className="info-label">
                                University
                              </span>

                              <span>
                                {user.university || "Not specified"}
                              </span>

                            </div>


                            <div className="info-row">

                              <span>
                                📚
                              </span>

                              <span className="info-label">
                                Faculty
                              </span>

                              <span>
                                {user.faculty || "Not specified"}
                              </span>

                            </div>


                            <div className="info-row">

                              <span>
                                🗓️
                              </span>

                              <span className="info-label">
                                Batch
                              </span>

                              <span>
                                {user.batch || "Not specified"}
                              </span>

                            </div>

                          </div>


                          {getConnectionButton(
                            user
                          )}

                        </article>

                      )
                    )}

                  </div>

                )}

              </section>

            )}


            {/* =====================================
                RECEIVED / SENT / CONNECTIONS
            ===================================== */}

            {activeTab !== "find" && loading ? (

              <section className="section-card">

                <div className="loading-state">

                  <span className="loader" />

                  Loading connections...

                </div>

              </section>

            ) : (

              <>


                {/* =================================
                    RECEIVED
                ================================= */}

                {activeTab === "received" && (

                  <section className="section-card">

                    <div className="section-header">

                      <div className="section-title-wrap">

                        <div className="section-icon">
                          📥
                        </div>

                        <div>

                          <h2 className="section-title">
                            Received Requests
                          </h2>

                          <p className="section-subtitle">
                            People who want to connect with you
                          </p>

                        </div>

                      </div>

                    </div>


                    {receivedRequests.length === 0 ? (

                      <div className="empty-state">

                        <div className="empty-icon">
                          📭
                        </div>

                        <h3 className="empty-title">
                          No pending requests
                        </h3>

                        <p className="empty-text">
                          You don't have any new connection requests.
                        </p>

                      </div>

                    ) : (

                      <div className="request-list">

                        {receivedRequests.map(
                          (connection) => (

                            <article
                              className="request-card"
                              key={connection.id}
                            >

                              <div className="request-person">

                                <div className="request-avatar">

                                  {getInitials(
                                    connection.senderName
                                  )}

                                </div>

                                <div>

                                  <h3 className="request-name">
                                    {connection.senderName}
                                  </h3>

                                  <p className="request-text">
                                    wants to connect with you.
                                  </p>

                                </div>

                              </div>


                              <div className="request-actions">

                                <button
                                  className="request-btn accept-btn"
                                  onClick={() =>
                                    handleAccept(
                                      connection.id
                                    )
                                  }
                                >
                                  ✓ Accept
                                </button>


                                <button
                                  className="request-btn reject-btn"
                                  onClick={() =>
                                    handleReject(
                                      connection.id
                                    )
                                  }
                                >
                                  × Reject
                                </button>

                              </div>

                            </article>

                          )
                        )}

                      </div>

                    )}

                  </section>

                )}


                {/* =================================
                    SENT
                ================================= */}

                {activeTab === "sent" && (

                  <section className="section-card">

                    <div className="section-header">

                      <div className="section-title-wrap">

                        <div className="section-icon">
                          📤
                        </div>

                        <div>

                          <h2 className="section-title">
                            Sent Requests
                          </h2>

                          <p className="section-subtitle">
                            Connection requests you have sent
                          </p>

                        </div>

                      </div>

                    </div>


                    {sentRequests.length === 0 ? (

                      <div className="empty-state">

                        <div className="empty-icon">
                          📤
                        </div>

                        <h3 className="empty-title">
                          No sent requests
                        </h3>

                        <p className="empty-text">
                          You haven't sent any pending connection requests.
                        </p>

                      </div>

                    ) : (

                      <div className="request-list">

                        {sentRequests.map(
                          (connection) => (

                            <article
                              className="request-card"
                              key={connection.id}
                            >

                              <div className="request-person">

                                <div className="request-avatar">

                                  {getInitials(
                                    connection.receiverName
                                  )}

                                </div>

                                <div>

                                  <h3 className="request-name">
                                    {connection.receiverName}
                                  </h3>

                                  <p className="request-text">

                                    Status:{" "}
                                    {connection.status}

                                  </p>

                                </div>

                              </div>


                              <div className="request-actions">

                                <button
                                  className="request-btn cancel-btn"
                                  onClick={() =>
                                    handleCancel(
                                      connection.id
                                    )
                                  }
                                >
                                  × Cancel Request
                                </button>

                              </div>

                            </article>

                          )
                        )}

                      </div>

                    )}

                  </section>

                )}


                {/* =================================
                    MY CONNECTIONS
                ================================= */}

                {activeTab === "connections" && (

                  <section className="section-card">

                    <div className="section-header">

                      <div className="section-title-wrap">

                        <div className="section-icon">
                          🤝
                        </div>

                        <div>

                          <h2 className="section-title">
                            My Connections
                          </h2>

                          <p className="section-subtitle">
                            Students you are connected with
                          </p>

                        </div>

                      </div>

                    </div>


                    {myConnections.length === 0 ? (

                      <div className="empty-state">

                        <div className="empty-icon">
                          🤝
                        </div>

                        <h3 className="empty-title">
                          No connections yet
                        </h3>

                        <p className="empty-text">
                          Find students and start building your network.
                        </p>

                      </div>

                    ) : (

                      <div className="request-list">

                        {myConnections.map(
                          (connection) => {

                            const isSender =
                              currentUser &&
                              connection.senderId ===
                              currentUser.id;


                            const otherUserId =
                              isSender
                                ? connection.receiverId
                                : connection.senderId;


                            const otherUser =
                              isSender
                                ? connection.receiverName
                                : connection.senderName;


                            return (

                              <article
                                className="request-card"
                                key={connection.id}
                              >

                                <div className="request-person">

                                  <div className="request-avatar">

                                    {getInitials(
                                      otherUser
                                    )}

                                  </div>

                                  <div>

                                    <h3 className="request-name">
                                      {otherUser}
                                    </h3>

                                    <p className="request-text">

                                      ✓{" "}
                                      {connection.status}

                                    </p>

                                  </div>

                                </div>


                                <div className="request-actions">

                                  <Link
                                    className="message-btn"
                                    to={`/messages?userId=${otherUserId}`}
                                  >
                                    💬 Message
                                  </Link>


                                  <button
                                    className="request-btn remove-btn"
                                    onClick={() =>
                                      handleRemove(
                                        connection.id
                                      )
                                    }
                                  >
                                    🗑 Remove
                                  </button>

                                </div>

                              </article>

                            );

                          }
                        )}

                      </div>

                    )}

                  </section>

                )}

              </>

            )}

          </div>

        </main>

      </div>

    </div>

  );

}


export default Connections;