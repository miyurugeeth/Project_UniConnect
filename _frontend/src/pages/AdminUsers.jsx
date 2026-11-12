import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function AdminUsers() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadStudents = async (query = "") => {
    try {
      const response = await api.get("/admin/students", { params: { search: query } });
      setStudents(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load students");
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadStudents();
    };

    load();
  }, []);

  const toggleStatus = async (student) => {
    const action = student.accountStatus === "SUSPENDED" ? "unsuspend" : "suspend";
    try {
      await api.put(`/admin/students/${student.id}/${action}`);
      loadStudents(search);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update account status");
    }
  };

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "24px" }}>
      <Link to="/admin">Back to dashboard</Link>
      <h1>Student Management</h1>
      <form onSubmit={(event) => { event.preventDefault(); loadStudents(search); }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#b42318" }}>{error}</p>}
      {students.map((student) => (
        <article key={student.id} style={{ borderBottom: "1px solid #ddd", padding: "14px 0" }}>
          <strong>{student.name}</strong> <span>{student.email}</span>
          <span style={{ marginLeft: "16px" }}>{student.accountStatus || "ACTIVE"}</span>
          <button onClick={() => toggleStatus(student)} style={{ marginLeft: "16px" }}>
            {student.accountStatus === "SUSPENDED" ? "Unsuspend" : "Suspend"}
          </button>
        </article>
      ))}
    </main>
  );
}

export default AdminUsers;
